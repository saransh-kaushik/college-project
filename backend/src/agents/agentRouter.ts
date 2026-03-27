import { physicsAgent } from './physicsAgent';
import { biologyAgent } from './biologyAgent';
import { chemistryAgent } from './chemistryAgent';
import { BaseAgent } from './baseAgent';

type Subject = 'physics' | 'biology' | 'chemistry';

const agents: Record<Subject, BaseAgent> = {
  physics: physicsAgent,
  biology: biologyAgent,
  chemistry: chemistryAgent,
};

export function getAgent(subject: string): BaseAgent {
  const agent = agents[subject as Subject];
  if (!agent) {
    throw new Error(`No agent configured for subject: ${subject}`);
  }
  return agent;
}

export { physicsAgent, biologyAgent, chemistryAgent };
