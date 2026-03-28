import { VoiceLiveClient } from "@azure/ai-voicelive";
import { AzureKeyCredential } from "@azure/core-auth";
import { logger } from "../utils/logger";

export interface VoiceLiveSessionOptions {
  endpoint: string;
  apiKey: string;
  model: string;
  voice?: string;
  instructions: string;
  onTranscript?: (text: string) => void;
  onAudioDelta?: (audioBase64: string) => void;
  onAudioDone?: () => void;
  onError?: (msg: string) => void;
}

export class VoiceLiveService {
  private session: any = null;
  private client: VoiceLiveClient | null = null;
  private subscription: any = null;

  async startSession(options: VoiceLiveSessionOptions): Promise<void> {
    try {
      const credential = new AzureKeyCredential(options.apiKey);
      this.client = new VoiceLiveClient(options.endpoint, credential);
      this.session = this.client.createSession({ model: options.model });

      this.subscription = this.session.subscribe({
        onConversationItemInputAudioTranscriptionCompleted: (event: any) => {
          if (options.onTranscript) options.onTranscript(event.transcript ?? "");
        },
        onResponseAudioTranscriptDone: (event: any) => {
          if (options.onTranscript) options.onTranscript(event.transcript ?? "");
        },
        onResponseAudioDelta: (event: any) => {
          if (event.delta && options.onAudioDelta) {
            options.onAudioDelta(event.delta);
          }
        },
        onResponseAudioDone: () => {
          if (options.onAudioDone) options.onAudioDone();
        },
        onServerError: (event: any) => {
          const msg = event.error?.message ?? "Unknown server error";
          if (!msg.includes("Cancellation failed")) {
             logger.error(`[VoiceLive] Error: ${msg}`);
             if (options.onError) options.onError(msg);
          }
        }
      });

      await this.session.connect();
      logger.info("[VoiceLive] Session connected");

      await this.session.updateSession({
        model: options.model,
        modalities: ["text", "audio"],
        instructions: options.instructions,
        voice: {
          type: "azure-standard",
          name: options.voice ?? "en-US-Ava:DragonHDLatestNeural",
        },
        inputAudioFormat: "pcm16",
        outputAudioFormat: "pcm16",
        turnDetection: {
          type: "server_vad",
          threshold: 0.5,
          prefixPaddingInMs: 300,
          silenceDurationInMs: 500,
        },
        inputAudioTranscription: { model: "azure-speech" },
      });
      logger.info("[VoiceLive] Session configured");

    } catch (err) {
      logger.error("[VoiceLive] Failed to start", err);
      throw err;
    }
  }

  async sendAudio(pcmBuffer: Uint8Array): Promise<void> {
    if (this.session && this.session.isConnected) {
      try {
        await this.session.sendAudio(pcmBuffer);
      } catch (err) {
        logger.warn("[VoiceLive] Error sending audio", err);
      }
    }
  }

  async addSystemMessage(text: string): Promise<void> {
    if (!this.session) return;
    try {
      await this.session.addConversationItem({
        type: "message",
        role: "system",
        content: [{ type: "input_text", text }],
      });
      await this.session.sendEvent({ type: "response.create" });
    } catch (err) {
      logger.error("[VoiceLive] Failed to add message", err);
    }
  }

  async close(): Promise<void> {
    if (this.subscription) {
      await this.subscription.close();
      this.subscription = null;
    }
    if (this.session) {
      try { await this.session.disconnect(); } catch (e) {}
      try { await this.session.dispose(); } catch (e) {}
      this.session = null;
    }
    this.client = null;
    logger.info("[VoiceLive] Session closed");
  }
}
