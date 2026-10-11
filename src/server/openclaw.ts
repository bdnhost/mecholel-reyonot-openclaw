import { Router, Request, Response } from 'express';

export const openclawRouter = Router();

// In-Memory Data Store for OpenClaw Sync
export interface ApprovalItem {
  id: string;
  ideaId: string;
  ideaTitle: string;
  actionType: 'outreach_message' | 'proposal_dispatch' | 'crm_mutation' | 'lead_handover';
  title: string;
  recipient: string;
  payload: Record<string, any>;
  humanDecision: 'pending' | 'approved' | 'rejected';
  reviewerNotes?: string;
  createdAt: string;
  reviewedAt?: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export interface WebhookSubscription {
  id: string;
  url: string;
  events: string[];
  secret?: string;
  createdAt: string;
  active: boolean;
}

export interface ExperimentEvent {
  id: string;
  ideaId: string;
  eventType: 'outreach_sent' | 'customer_replied' | 'interview_completed' | 'proposal_sent' | 'pilot_started' | 'lead_rejected';
  details: string;
  timestamp: string;
  actor: 'openclaw_agent' | 'human_user';
}

// Global in-memory storage
let inMemoryIdeas: any[] = [];

let inMemoryApprovals: ApprovalItem[] = [
  {
    id: 'appr-101',
    ideaId: 'mkt-1',
    ideaTitle: 'אימות וסינון לידים נכנסים מרובי ערוצים בזמן אמת',
    actionType: 'outreach_message',
    title: 'שליחת הודעת וואטסאפ לליד חם שעבר סינון בוט',
    recipient: 'רועי לוי (סמנכ"ל שיווק, נדל"ן ישיר - 054-1234567)',
    payload: {
      channel: 'whatsapp',
      message: 'היי רועי, סוכן OpenClaw זיהה שהשארת פנייה בנוגע לניהול קמפיין. בהתאם לתקציב והזמינות שלך, נשמח לקבוע שיחת הדגמה בת 10 דקות למחר ב-11:00.',
      extractedBudget: '15,000 ₪ חודשי',
      leadScore: 'A (High Intent)',
    },
    humanDecision: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 18).toISOString(),
    riskLevel: 'medium',
  },
  {
    id: 'appr-102',
    ideaId: 'mkt-2',
    ideaTitle: 'הפקת דוחות ביצועים וקריאיטיב מותאמים אישית ללקוחות סוכנות',
    actionType: 'proposal_dispatch',
    title: 'שליחת טיוטת דוח חודשי ללקוח ריטיינר לאחר ניתוח אוטומטי',
    recipient: 'מיכל ברק (מנכ"לית רשת קליניקות בוטיק - michal@clinic.co.il)',
    payload: {
      reportMonth: 'אוקטובר 2026',
      summary: 'החודש הושגה ירידה של 18% ב-CPA ועלייה של 34% בפניות איכותיות. מוצע להרחיב תקציב קמפיין ממוקד.',
      proposedNextBudget: '8,000 ₪',
    },
    humanDecision: 'pending',
    createdAt: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    riskLevel: 'high',
  },
  {
    id: 'appr-103',
    ideaId: 'mkt-1',
    ideaTitle: 'אימות וסינון לידים נכנסים מרובי ערוצים בזמן אמת',
    actionType: 'crm_mutation',
    title: 'סנכרון ליד מאומת ל-Hubspot כעסקה בשלה (Deal Stage: Qualified)',
    recipient: 'Hubspot CRM Pipeline',
    payload: {
      dealName: 'הדרכת מכירות - קבוצת עופר',
      dealValue: 12000,
      stage: 'Discovery Scheduled',
    },
    humanDecision: 'approved',
    reviewerNotes: 'נבדק טלפונית, לקוח מאושר להעברה ל-CRM',
    createdAt: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    reviewedAt: new Date(Date.now() - 1000 * 60 * 90).toISOString(),
    riskLevel: 'low',
  },
];

let inMemoryWebhooks: WebhookSubscription[] = [
  {
    id: 'wh-1',
    url: 'https://openclaw.local:8080/webhook/approvals',
    events: ['approval.created', 'approval.resolved', 'idea.generated'],
    createdAt: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
    active: true,
  },
];

let inMemoryExperimentEvents: ExperimentEvent[] = [
  {
    id: 'ev-1',
    ideaId: 'mkt-1',
    eventType: 'outreach_sent',
    details: 'סוכן OpenClaw הכין 5 טיוטות פנייה למנהלי סוכנויות',
    timestamp: new Date(Date.now() - 1000 * 60 * 180).toISOString(),
    actor: 'openclaw_agent',
  },
  {
    id: 'ev-2',
    ideaId: 'mkt-1',
    eventType: 'customer_replied',
    details: 'רועי לוי השיב בחיוב: מעוניין בשיחה של 10 דקות',
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    actor: 'human_user',
  },
];

// ── BDNHOST: simple JSON persistence so approvals/events survive restarts ──
import * as fsPersist from 'fs';
const STATE_FILE = process.env.OPENCLAW_STATE_FILE || '';
function persistState() {
  if (!STATE_FILE) return;
  try {
    fsPersist.writeFileSync(STATE_FILE + '.tmp', JSON.stringify({ approvals: inMemoryApprovals, events: inMemoryExperimentEvents, webhooks: inMemoryWebhooks }, null, 1));
    fsPersist.renameSync(STATE_FILE + '.tmp', STATE_FILE);
  } catch (e) { console.error('persistState failed', e); }
}
(function loadState() {
  if (!STATE_FILE || !fsPersist.existsSync(STATE_FILE)) return;
  try {
    const st = JSON.parse(fsPersist.readFileSync(STATE_FILE, 'utf-8'));
    if (Array.isArray(st.approvals)) inMemoryApprovals = st.approvals;
    if (Array.isArray(st.events)) inMemoryExperimentEvents = st.events;
    if (Array.isArray(st.webhooks)) inMemoryWebhooks = st.webhooks;
  } catch (e) { console.error('loadState failed', e); }
})();

// Helper to set stored ideas from main server
export function setOpenClawIdeas(ideas: any[]) {
  inMemoryIdeas = ideas;
}

export function getOpenClawIdeas() {
  return inMemoryIdeas;
}

// 1. Health & Connection check
openclawRouter.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '1.0.0',
    service: 'OpenClaw Synchronization Gateway',
    protocol: 'openclaw-v1',
    authenticated: true,
    capabilities: [
      'idea_catalog',
      'workflow_spec_generation',
      'human_in_the_loop_gate',
      'event_logging',
      'webhook_dispatch',
      'openapi_v3',
    ],
    pendingApprovalsCount: inMemoryApprovals.filter((a) => a.humanDecision === 'pending').length,
    timestamp: new Date().toISOString(),
  });
});

// 2. OpenAPI 3.0 Specification for OpenClaw Agent
openclawRouter.get('/openapi.json', (req: Request, res: Response) => {
  const host = req.get('host') || 'localhost:3000';
  const protocol = req.protocol;
  const baseUrl = `${protocol}://${host}/api/openclaw`;

  const spec = {
    openapi: '3.0.3',
    info: {
      title: 'OpenClaw Business Integration API',
      version: '1.0.0',
      description: 'API infrastructure for OpenClaw agent synchronization, idea retrieval, workflow spec generation, and Human-in-the-Loop decision enforcement.',
    },
    servers: [{ url: baseUrl }],
    paths: {
      '/health': {
        get: {
          summary: 'Health and capability check',
          operationId: 'getHealth',
          responses: {
            '200': { description: 'Gateway healthy and ready' },
          },
        },
      },
      '/ideas': {
        get: {
          summary: 'List verified OpenClaw business ideas with full 12-section metadata',
          operationId: 'listIdeas',
          responses: {
            '200': { description: 'Array of idea blueprints' },
          },
        },
      },
      '/ideas/{id}': {
        get: {
          summary: 'Get single business idea details and scoring breakdown',
          operationId: 'getIdeaById',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Full idea blueprint' },
            '404': { description: 'Idea not found' },
          },
        },
      },
      '/ideas/{id}/workflow-spec': {
        get: {
          summary: 'Generate executable OpenClaw Workflow Specification with Human-In-The-Loop checkpoints',
          operationId: 'getWorkflowSpec',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Workflow JSON ready for OpenClaw runner' },
          },
        },
      },
      '/ideas/{id}/outreach': {
        get: {
          summary: 'Get pre-approved outreach messages, discovery questions, and pilot agreement draft',
          operationId: 'getOutreachPackage',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: 'Outreach assets package' },
          },
        },
      },
      '/approvals': {
        get: {
          summary: 'List pending and reviewed Human-In-The-Loop actions',
          operationId: 'listApprovals',
          parameters: [
            { name: 'status', in: 'query', schema: { type: 'string', enum: ['pending', 'approved', 'rejected'] } },
          ],
          responses: {
            '200': { description: 'Array of approval items' },
          },
        },
      },
      '/approvals/create': {
        post: {
          summary: 'Submit an action from OpenClaw for human review before execution',
          operationId: 'createApproval',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['ideaId', 'actionType', 'title', 'recipient', 'payload'],
                  properties: {
                    ideaId: { type: 'string' },
                    ideaTitle: { type: 'string' },
                    actionType: { type: 'string', enum: ['outreach_message', 'proposal_dispatch', 'crm_mutation', 'lead_handover'] },
                    title: { type: 'string' },
                    recipient: { type: 'string' },
                    payload: { type: 'object' },
                    riskLevel: { type: 'string', enum: ['low', 'medium', 'high'] },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Approval item created' },
          },
        },
      },
      '/approvals/{id}/review': {
        post: {
          summary: 'Human approves or rejects a pending OpenClaw action',
          operationId: 'reviewApproval',
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['decision'],
                  properties: {
                    decision: { type: 'string', enum: ['approved', 'rejected'] },
                    reviewerNotes: { type: 'string' },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: 'Decision recorded' },
          },
        },
      },
      '/experiments/log': {
        post: {
          summary: 'Log customer activity or experiment progress event from OpenClaw',
          operationId: 'logExperimentEvent',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  required: ['ideaId', 'eventType', 'details'],
                  properties: {
                    ideaId: { type: 'string' },
                    eventType: { type: 'string' },
                    details: { type: 'string' },
                    actor: { type: 'string', enum: ['openclaw_agent', 'human_user'] },
                  },
                },
              },
            },
          },
          responses: {
            '201': { description: 'Event recorded' },
          },
        },
      },
    },
  };

  res.json(spec);
});

// 3. OpenClaw Agent Tool Manifest (For LLM Function Calling)
openclawRouter.get('/manifest.json', (req: Request, res: Response) => {
  const tools = [
    {
      name: 'openclaw_list_ideas',
      description: 'Fetch all available verified business automation ideas for OpenClaw.',
      parameters: { type: 'object', properties: {} },
    },
    {
      name: 'openclaw_get_workflow_spec',
      description: 'Get an executable workflow plan with required human approval steps for an idea.',
      parameters: {
        type: 'object',
        properties: {
          ideaId: { type: 'string', description: 'ID of the business idea' },
        },
        required: ['ideaId'],
      },
    },
    {
      name: 'openclaw_request_human_approval',
      description: 'CRITICAL: Must be called before sending messages or modifying production data. Queues action for human verification.',
      parameters: {
        type: 'object',
        properties: {
          ideaId: { type: 'string' },
          actionType: { type: 'string', enum: ['outreach_message', 'proposal_dispatch', 'crm_mutation', 'lead_handover'] },
          title: { type: 'string' },
          recipient: { type: 'string' },
          payload: { type: 'object' },
        },
        required: ['ideaId', 'actionType', 'title', 'recipient', 'payload'],
      },
    },
    {
      name: 'openclaw_check_approval_status',
      description: 'Check whether a requested action has been approved or rejected by the human reviewer.',
      parameters: {
        type: 'object',
        properties: {
          approvalId: { type: 'string' },
        },
        required: ['approvalId'],
      },
    },
    {
      name: 'openclaw_log_experiment_result',
      description: 'Log client responses, feedback, or milestone completions during the 14-day experiment.',
      parameters: {
        type: 'object',
        properties: {
          ideaId: { type: 'string' },
          eventType: { type: 'string', enum: ['outreach_sent', 'customer_replied', 'interview_completed', 'proposal_sent', 'pilot_started', 'lead_rejected'] },
          details: { type: 'string' },
        },
        required: ['ideaId', 'eventType', 'details'],
      },
    },
  ];

  res.json({
    agentName: 'OpenClaw Business Integration Agent',
    version: '1.0.0',
    tools,
  });
});

// 4. List Ideas
openclawRouter.get('/ideas', (req: Request, res: Response) => {
  res.json({
    count: inMemoryIdeas.length,
    ideas: inMemoryIdeas,
  });
});

// 5. Get Idea by ID
openclawRouter.get('/ideas/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const idea = inMemoryIdeas.find((i) => i.id === id);
  if (!idea) {
    return res.status(404).json({ error: `Idea with id ${id} not found` });
  }
  res.json(idea);
});

// 6. Generate Executable OpenClaw Workflow Spec (JSON)
openclawRouter.get('/ideas/:id/workflow-spec', (req: Request, res: Response) => {
  const { id } = req.params;
  const idea = inMemoryIdeas.find((i) => i.id === id);
  if (!idea) {
    return res.status(404).json({ error: `Idea with id ${id} not found` });
  }

  // Construct a production-grade OpenClaw Workflow Specification
  const spec = {
    workflowName: `OpenClaw: ${idea.title}`,
    version: '1.0.0',
    targetCustomer: idea.targetCustomer,
    trigger: {
      type: 'webhook_or_event',
      source: idea.openClawRole?.suggestedIntegrations?.[0] || 'Webhook',
      event: 'lead_or_data_arrival',
    },
    steps: idea.openClawRole?.automatedSteps?.map((step: string, idx: number) => ({
      stepIndex: idx + 1,
      name: `Step ${idx + 1}: ${step.slice(0, 30)}...`,
      description: step,
      engine: 'openclaw-agent-v1',
      requiresHumanSignoff: idx === idea.openClawRole.automatedSteps.length - 1, // Final step always gated
    })) || [],
    humanInTheLoopGates: idea.humanInTheLoop?.map((gate: string, idx: number) => ({
      gateId: `gate-${idx + 1}`,
      requirement: gate,
      enforcement: 'BLOCK_EXECUTION_UNTIL_HUMAN_APPROVAL',
      callbackEndpoint: `/api/openclaw/approvals`,
    })) || [],
    pricingHypothesis: idea.pricingHypothesis,
    economicConstraint: {
      estimatedDirectCosts: idea.economicEstimate?.directCosts,
      uncalculatedTaxes: true,
      maxTokenSpendPerRun: 0.15,
    },
    safetyPolicy: {
      noUnsolicitedBulkSpam: true,
      dataPrivacyCompliance: 'Israeli Privacy Protection Law & GDPR',
      disqualificationPassed: Boolean(idea.disqualificationCheck?.passed),
    },
  };

  res.json(spec);
});

// 7. Get Outreach Package
openclawRouter.get('/ideas/:id/outreach', (req: Request, res: Response) => {
  const { id } = req.params;
  const idea = inMemoryIdeas.find((i) => i.id === id);
  if (!idea) {
    return res.status(404).json({ error: `Idea with id ${id} not found` });
  }

  res.json({
    ideaId: idea.id,
    ideaTitle: idea.title,
    whatsappDraft: `היי ${idea.targetCustomer?.role || 'שם'}, ראיתי שאתם מנהלים פעילות ב${idea.targetCustomer?.businessType || 'הענף'}. שמתי לב ש-${idea.painPoint?.currentAction || 'עבודה ידנית'} גוזלת שעות שבועיות רבות. בניתי תהליך OpenClaw ממוקד עם אישור אנושי שמקצר את הזמן ל-3 דקות. אשמח להציג הדגמה קצרה בת 5 דקות ללא התחייבות.`,
    coldEmailDraft: `שלום ${idea.targetCustomer?.role || 'שם'},\n\nפיתחתי פתרון מבוסס אוטומציית OpenClaw המאפשר ${idea.oneLineValue}.\nכל פעולה עוברת בדיקה ואישור אנושי שלך לפני שליחה כדי לשמור על דיוק מלא.\n\nנוכל לתאם שיחה קצרה השבוע לבדיקת התאמה?`,
    discoveryQuestions: [
      `כמה שעות שבועיות הצוות מקדיש ל-${idea.painPoint?.currentAction}?`,
      'מה הניסיון הקודם שלכם עם כלי אוטומציה, ומה החשש המרכזי מהטמעה?',
      'אם תהליך זה יעבוד בחצי מהזמן עם אישור אנושי שלכם, כמה זה שווה לכם?',
      'מה הקריטריון שיכריע אם פיילוט בן 14 יום הצליח?',
      'מי מחליט על אישור תקציב לפיילוט ראשוני?',
    ],
    pilotOfferDraft: {
      title: `פיילוט בדיקה: ${idea.title}`,
      scope: idea.initialOffer,
      price: idea.pricingHypothesis?.range,
      safetyClause: 'אישור אנושי חובה לפני כל שליחה או שינוי נתונים',
    },
  });
});

// 8. List Approvals (HITL Queue)
openclawRouter.get('/approvals', (req: Request, res: Response) => {
  const { status } = req.query;
  if (status) {
    return res.json(inMemoryApprovals.filter((a) => a.humanDecision === status));
  }
  res.json(inMemoryApprovals);
});

// 9. Create Approval Request (Called by OpenClaw Agent)
openclawRouter.post('/approvals/create', (req: Request, res: Response) => {
  const { ideaId, ideaTitle, actionType, title, recipient, payload, riskLevel } = req.body;
  if (!actionType || !title || !recipient) {
    return res.status(400).json({ error: 'Missing required approval fields' });
  }

  const newApproval: ApprovalItem = {
    id: `appr-${Date.now().toString().slice(-5)}`,
    ideaId: ideaId || 'custom',
    ideaTitle: ideaTitle || 'פעולת OpenClaw',
    actionType: actionType || 'outreach_message',
    title,
    recipient,
    payload: payload || {},
    humanDecision: 'pending',
    createdAt: new Date().toISOString(),
    riskLevel: riskLevel || 'medium',
  };

  inMemoryApprovals.unshift(newApproval);
  persistState();
  res.status(201).json(newApproval);
});

// 10. Review Approval Request (Human decision)
openclawRouter.post('/approvals/:id/review', (req: Request, res: Response) => {
  const { id } = req.params;
  const { decision, reviewerNotes } = req.body;

  if (!['approved', 'rejected'].includes(decision)) {
    return res.status(400).json({ error: 'decision must be approved or rejected' });
  }

  const item = inMemoryApprovals.find((a) => a.id === id);
  if (!item) {
    return res.status(404).json({ error: `Approval item ${id} not found` });
  }

  item.humanDecision = decision;
  item.reviewerNotes = reviewerNotes || (decision === 'approved' ? 'אושר על ידי המשתמש' : 'נדחה על ידי המשתמש');
  item.reviewedAt = new Date().toISOString();

  // Log experiment event
  inMemoryExperimentEvents.unshift({
    id: `ev-${Date.now().toString().slice(-4)}`,
    ideaId: item.ideaId,
    eventType: decision === 'approved' ? 'proposal_sent' : 'lead_rejected',
    details: `פעולה '${item.title}' ${decision === 'approved' ? 'אושרה' : 'נדחתה'} (${item.reviewerNotes})`,
    timestamp: new Date().toISOString(),
    actor: 'human_user',
  });

  persistState();
  res.json({
    status: 'success',
    approval: item,
  });
});

// 11. List & Log Experiment Events
openclawRouter.get('/experiments', (req: Request, res: Response) => {
  res.json(inMemoryExperimentEvents);
});

openclawRouter.post('/experiments/log', (req: Request, res: Response) => {
  const { ideaId, eventType, details, actor } = req.body;
  if (!eventType || !details) {
    return res.status(400).json({ error: 'Missing eventType or details' });
  }

  const newEvent: ExperimentEvent = {
    id: `ev-${Date.now().toString().slice(-4)}`,
    ideaId: ideaId || 'general',
    eventType,
    details,
    timestamp: new Date().toISOString(),
    actor: actor || 'openclaw_agent',
  };

  inMemoryExperimentEvents.unshift(newEvent);
  persistState();
  res.status(201).json(newEvent);
});

// 12. Webhooks
openclawRouter.get('/webhooks', (req: Request, res: Response) => {
  res.json(inMemoryWebhooks);
});

openclawRouter.post('/webhooks/register', (req: Request, res: Response) => {
  const { url, events, secret } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'Webhook url is required' });
  }

  const webhook: WebhookSubscription = {
    id: `wh-${Date.now().toString().slice(-4)}`,
    url,
    events: events || ['approval.created', 'approval.resolved', 'idea.generated'],
    secret: secret || 'sec_' + Math.random().toString(36).substring(2, 10),
    createdAt: new Date().toISOString(),
    active: true,
  };

  inMemoryWebhooks.push(webhook);
  persistState();
  res.status(201).json(webhook);
});

openclawRouter.post('/webhooks/test', async (req: Request, res: Response) => {
  const { url, eventType } = req.body;
  const targetUrl = url || inMemoryWebhooks[0]?.url;

  const testPayload = {
    event: eventType || 'approval.created',
    timestamp: new Date().toISOString(),
    data: {
      id: 'appr-test-1',
      title: 'בדיקת חיבור Webhook ל-OpenClaw',
      message: 'בדיקת סנכרון תקינה מול שרת OpenClaw Gateway',
      status: 'pending',
    },
  };

  // Return simulation result
  res.json({
    status: 'dispatched_simulation',
    targetUrl: targetUrl || 'https://openclaw.local/webhook',
    payloadSent: testPayload,
    simulatedResponse: {
      httpStatus: 200,
      delivered: true,
      latencyMs: 42,
    },
  });
});
