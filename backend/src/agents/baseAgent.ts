import pool from '../config/db';
import { chat, ChatMessage } from '../services/openai.service';
import { retrieveContext } from '../services/pinecone.service';
import { retrieveUserContext } from '../services/rag.service';
import { updateMastery } from '../services/analytics.service';
import { logger } from '../utils/logger';

export type MasteryLevel = 'beginner' | 'intermediate' | 'advanced';

export interface AgentConfig {
  subject: string;
  pineconeNamespace: string;
  systemPrompt: string;
  topics: string[];
}

export interface AgentResponse {
  text: string;
  masteryUpdate?: { topic: string; level: number };
  keyConcept?: { concept: string; definition: string; icon: string; color: string };
  assessmentQuestion?: string;
}

/**
 * BaseAgent encapsulates the shared logic for all subject-specific agents:
 * - Conversation history window
 * - Mastery-adaptive system prompt complexity
 * - Confusion detection → simplified re-explanation
 * - Periodic assessment triggering (every 6 exchanges)
 * - RAG retrieval from Pinecone namespace
 */
export class BaseAgent {
  protected config: AgentConfig;
  private history: ChatMessage[] = [];
  private exchangeCount = 0;
  private currentMastery = 0.0;

  constructor(config: AgentConfig) {
    this.config = config;
  }

  async processTranscript(opts: {
    userId: string;
    sessionId: string;
    text: string;
    emotion?: string;
    confidence?: number;
  }): Promise<AgentResponse> {
    const { userId, sessionId, text, emotion, confidence } = opts;

    // Detect confusion
    const isConfused =
      emotion === 'confused' || emotion === 'frustrated' || (confidence !== undefined && confidence < 0.5);

    // Fetch current mastery for primary topic
    const masteryRow = await pool.query(
      `SELECT AVG(level) as avg_level FROM mastery WHERE user_id = $1 AND subject = $2`,
      [userId, this.config.subject]
    );
    this.currentMastery = parseFloat(masteryRow.rows[0]?.avg_level || '0');

    // Retrieve RAG context — subject knowledge base
    const ragChunks = await retrieveContext(text, this.config.pineconeNamespace, 3);

    // Also retrieve context from user-uploaded documents
    const userChunks = await retrieveUserContext(text, userId, 3);

    const allChunks = [...ragChunks, ...userChunks];
    const ragContext = allChunks.length > 0
      ? `\n\n[KNOWLEDGE BASE CONTEXT]\n${allChunks.join('\n---\n')}`
      : '';

    // Build adaptive system prompt
    const complexityNote = this.getComplexityNote(isConfused);
    const systemPrompt = `${this.config.systemPrompt}\n\n${complexityNote}${ragContext}`;

    // Build messages
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...this.history.slice(-10), // Rolling window of last 10 turns
      { role: 'user', content: text },
    ];

    // Determine if we should ask an assessment question
    this.exchangeCount++;
    const shouldAssess = this.exchangeCount % 6 === 0;

    const promptSuffix = shouldAssess
      ? '\n\nAfter your explanation, ask ONE short comprehension-check question to assess the student.'
      : '';

    messages[messages.length - 1].content = text + promptSuffix;

    let aiText = '';
    try {
      aiText = await chat(messages, 600);
    } catch (err) {
      logger.error('OpenAI call failed:', err);
      aiText = "I'm having trouble connecting right now. Please try again in a moment.";
    }

    // Update history
    this.history.push({ role: 'user', content: text });
    this.history.push({ role: 'assistant', content: aiText });

    // Save transcript to DB
    await this.saveTranscript(sessionId, 'student', text, emotion, confidence);
    await this.saveTranscript(sessionId, 'agent', aiText);

    // Extract key concept from response
    const keyConcept = this.extractKeyConcept(aiText);

    // Build mastery update (slight increase per exchange)
    const topicGuess = this.guessTopic(text);
    const masteryDelta = isConfused ? 0.01 : 0.03;
    const newLevel = await updateMastery(userId, this.config.subject, topicGuess, this.currentMastery + masteryDelta);

    const response: AgentResponse = {
      text: aiText,
      masteryUpdate: { topic: topicGuess, level: newLevel },
    };

    if (keyConcept) response.keyConcept = keyConcept;
    if (shouldAssess) response.assessmentQuestion = this.extractAssessmentQuestion(aiText);

    return response;
  }

  private getComplexityNote(isConfused: boolean): string {
    const mastery = isConfused ? Math.max(0, this.currentMastery - 0.2) : this.currentMastery;

    if (mastery < 0.3) {
      return 'TEACHING MODE: Beginner. Use very simple language, everyday analogies, and short sentences. Avoid jargon.';
    } else if (mastery < 0.7) {
      return 'TEACHING MODE: Intermediate. Use standard textbook language with moderate depth. Define technical terms.';
    } else {
      return 'TEACHING MODE: Advanced. Use technical terminology, Socratic questioning, and explore nuanced perspectives.';
    }
  }

  private guessTopic(text: string): string {
    const lower = text.toLowerCase();
    for (const topic of this.config.topics) {
      if (lower.includes(topic.toLowerCase().split(' ')[0])) {
        return topic;
      }
    }
    return this.config.topics[0] || 'General';
  }

  private extractKeyConcept(text: string): AgentResponse['keyConcept'] | undefined {
    // Look for bolded or quoted terms a tutor might highlight
    const boldMatch = text.match(/\*\*([^*]{3,40})\*\*/);
    const quoteMatch = text.match(/"([A-Z][^"]{2,40})"/);
    const term = boldMatch?.[1] || quoteMatch?.[1];
    if (!term) return undefined;

    // Extract surrounding definition (first sentence after the term)
    const defIdx = text.indexOf(term) + term.length;
    const defText = text.slice(defIdx, defIdx + 200).replace(/[*"]/g, '').trim().split('.')[0] + '.';

    return {
      concept: term,
      definition: defText.slice(0, 120),
      icon: 'auto_awesome',
      color: 'primary',
    };
  }

  private extractAssessmentQuestion(text: string): string {
    const sentences = text.split(/[.!?]/);
    const question = sentences.reverse().find((s) => s.trim().endsWith('?') || s.includes('?'));
    return question?.trim() || 'Can you summarize what you just learned in one sentence?';
  }

  private async saveTranscript(
    sessionId: string,
    role: 'student' | 'agent',
    text: string,
    emotion?: string,
    confidence?: number
  ): Promise<void> {
    try {
      await pool.query(
        'INSERT INTO transcripts (session_id, role, text, emotion, confidence) VALUES ($1, $2, $3, $4, $5)',
        [sessionId, role, text, emotion || null, confidence || null]
      );
    } catch (err) {
      logger.error('Failed to save transcript:', err);
    }
  }
}
