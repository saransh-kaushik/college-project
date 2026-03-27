import { Response, NextFunction } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware';

// Static fallback resource data — in production this would be DB-driven
const RESOURCES_BY_TOPIC: Record<string, object[]> = {
  photosynthesis: [
    { type: 'pdf', title: 'Cell_Metabolism_Ch4.pdf', subtitle: 'Page 142 • Highlighted by AI', icon: 'picture_as_pdf', color: 'red' },
    { type: 'note', title: 'MIT OpenCourseWare Notes', subtitle: 'Curated Summary • 2.4k Views', icon: 'notes', color: 'blue' },
  ],
  atp: [
    { type: 'pdf', title: 'Biochemistry_Stryer_Ch18.pdf', subtitle: 'Page 578 • ATP Synthase section', icon: 'picture_as_pdf', color: 'red' },
  ],
};

const DEFAULT_RESOURCES = [
  { type: 'pdf', title: 'Study Guide.pdf', subtitle: 'AI curated reading', icon: 'picture_as_pdf', color: 'red' },
  { type: 'note', title: 'Lecture Notes', subtitle: 'Condensed summary', icon: 'notes', color: 'blue' },
];

const COMMUNITY_DISCUSSIONS = [
  {
    id: 'c1',
    text: '"Wait, so the F0 unit is the one that actually rotates? I thought it was F1..."',
    author: '@sarah_bio',
  },
];

const QUICK_FACTS: Record<string, string> = {
  photosynthesis: 'Plants convert about 1–2% of sunlight into chemical energy during photosynthesis.',
  atp: 'A single ATP synthase can produce about 100 molecules of ATP per second — over 6,000 rotations per minute!',
  default: 'The human body produces its own weight in ATP every single day.',
};

export async function getResources(_req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const topic = (_req.query.topic as string || '').toLowerCase();

    const documents = RESOURCES_BY_TOPIC[topic] || DEFAULT_RESOURCES;
    const quickFact = QUICK_FACTS[topic] || QUICK_FACTS.default;

    res.json({
      documents,
      notes: [],
      community_discussions: COMMUNITY_DISCUSSIONS,
      quick_facts: [{ text: quickFact }],
    });
  } catch (err) {
    next(err);
  }
}

export async function replyToCommunityNote(req: AuthRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { noteId } = req.params;
    const { text } = req.body;

    if (!text) {
      res.status(400).json({ error: 'text is required' });
      return;
    }

    // In a real implementation, this would persist replies to DB
    res.json({ success: true, reply_id: `reply_${Date.now()}` });
  } catch (err) {
    next(err);
  }
}
