import { Router } from 'express';
import { authenticate, requireRole, AuthRequest } from '../middleware/auth';
import axios from 'axios';

const router = Router();

// POST /api/ai/suggest-goals
router.post('/suggest-goals', authenticate, requireRole('EMPLOYEE'), async (req: AuthRequest, res) => {
  try {
    const { thrustArea, role, department } = req.body;
    if (!thrustArea) return res.status(400).json({ error: 'thrustArea is required' });

    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      // Return smart mock suggestions based on thrust area
      return res.json(getMockSuggestions(thrustArea, department));
    }

    const prompt = `You are an expert performance management consultant. Generate exactly 3 SMART goal suggestions for an employee with the following profile:
- Thrust Area: ${thrustArea}
- Role: ${role || 'Professional'}
- Department: ${department || 'General'}

Return a JSON array with exactly 3 objects, each having:
- title: string (concise goal title, max 60 chars)
- description: string (detailed description, max 200 chars)
- uom: one of "NUMERIC_HIGHER" | "NUMERIC_LOWER" | "TIMELINE" | "ZERO_BASED"
- target: number (suggested numeric target)
- unit: string (e.g., "%", "ms", "count", "score", "days")

Return ONLY the JSON array, no other text.`;

    const response = await axios.post(
      `${process.env.OPENROUTER_BASE_URL || 'https://openrouter.ai/api/v1'}/chat/completions`,
      {
        model: process.env.OPENROUTER_MODEL || 'openai/gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.7,
        max_tokens: 1000,
      },
      {
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'HTTP-Referer': 'https://atomquest.app',
          'X-Title': 'AtomQuest Goal Suggestion',
          'Content-Type': 'application/json',
        },
        timeout: 15000,
      }
    );

    const content = response.data.choices[0]?.message?.content || '[]';
    let suggestions;
    try {
      suggestions = JSON.parse(content.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim());
    } catch {
      suggestions = getMockSuggestions(thrustArea, department);
    }
    res.json(suggestions);
  } catch (err: any) {
    console.error('AI suggest failed:', err.message);
    // Fallback to mock if API fails
    const { thrustArea, department } = req.body;
    res.json(getMockSuggestions(thrustArea, department));
  }
});

function getMockSuggestions(thrustArea: string, department?: string) {
  const suggestions: Record<string, any[]> = {
    'Digital Transformation': [
      { title: 'Automate Manual Processes', description: 'Identify and automate at least 3 manual repetitive processes using RPA or scripts to save 10+ hours/week.', uom: 'NUMERIC_HIGHER', target: 3, unit: 'processes' },
      { title: 'Improve System Response Time', description: 'Optimize system performance to achieve sub-200ms average API response time across all endpoints.', uom: 'NUMERIC_LOWER', target: 200, unit: 'ms' },
      { title: 'Cloud Migration Completion', description: 'Complete migration of legacy services to cloud infrastructure by Q3.', uom: 'TIMELINE', target: 100, unit: '%' },
    ],
    'Quality & Excellence': [
      { title: 'Achieve 95% Test Coverage', description: 'Increase automated test coverage across all modules to 95% or above.', uom: 'NUMERIC_HIGHER', target: 95, unit: '%' },
      { title: 'Reduce Defect Escape Rate', description: 'Reduce bugs escaping to production by implementing rigorous QA processes.', uom: 'NUMERIC_LOWER', target: 5, unit: 'defects/sprint' },
      { title: 'Zero Critical Incidents', description: 'Maintain zero severity-1 incidents in production throughout the year.', uom: 'ZERO_BASED', target: 0, unit: 'incidents' },
    ],
    'Customer Success': [
      { title: 'Improve NPS Score', description: 'Increase Net Promoter Score from current baseline to 85+ through targeted CX improvements.', uom: 'NUMERIC_HIGHER', target: 85, unit: 'score' },
      { title: 'Reduce Customer Churn', description: 'Reduce monthly customer churn rate to below 2% through proactive engagement.', uom: 'NUMERIC_LOWER', target: 2, unit: '%' },
      { title: 'Achieve 98% SLA Compliance', description: 'Meet or exceed all SLA commitments with a 98% compliance rate.', uom: 'NUMERIC_HIGHER', target: 98, unit: '%' },
    ],
    'Innovation': [
      { title: 'Launch Innovation Projects', description: 'Ideate, prototype, and present at least 2 innovative solutions to business problems.', uom: 'NUMERIC_HIGHER', target: 2, unit: 'projects' },
      { title: 'Reduce Time-to-Innovation', description: 'Cut the time from idea submission to prototype from 8 weeks to 4 weeks.', uom: 'NUMERIC_LOWER', target: 4, unit: 'weeks' },
      { title: 'AI/ML Integration', description: 'Integrate at least one AI/ML capability into existing product or workflow by Q4.', uom: 'TIMELINE', target: 100, unit: '%' },
    ],
    'Learning & Development': [
      { title: 'Obtain Professional Certification', description: 'Complete and pass at least one industry-recognized certification relevant to your role.', uom: 'TIMELINE', target: 100, unit: '%' },
      { title: 'Complete 40 Training Hours', description: 'Complete a minimum of 40 hours of professional development training across the year.', uom: 'NUMERIC_HIGHER', target: 40, unit: 'hours' },
      { title: 'Mentor Team Members', description: 'Actively mentor at least 2 junior team members through regular 1:1 sessions.', uom: 'NUMERIC_HIGHER', target: 2, unit: 'mentees' },
    ],
    'Revenue': [
      { title: 'Achieve Revenue Target', description: 'Meet or exceed the assigned revenue target for the fiscal year.', uom: 'NUMERIC_HIGHER', target: 100, unit: '%' },
      { title: 'Acquire New Accounts', description: 'Bring in at least 10 new enterprise accounts through outbound and inbound strategies.', uom: 'NUMERIC_HIGHER', target: 10, unit: 'accounts' },
      { title: 'Improve Deal Closure Rate', description: 'Improve sales deal closure rate from current baseline to 35%.', uom: 'NUMERIC_HIGHER', target: 35, unit: '%' },
    ],
  };

  const key = Object.keys(suggestions).find((k) => thrustArea?.toLowerCase().includes(k.toLowerCase())) || 'Digital Transformation';
  return suggestions[key] || suggestions['Digital Transformation'];
}

export default router;
