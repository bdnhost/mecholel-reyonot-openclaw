import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { Type } from '@google/genai';
import { openclawRouter, setOpenClawIdeas } from './src/server/openclaw.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.set('trust proxy', 'loopback'); // BDNHOST: behind nginx → correct https URLs in openapi.json
const port = process.env.PORT || 3000;

app.use(express.json());

// Enable CORS for external OpenClaw agents, scripts, and webhooks
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, x-openclaw-key');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// BDNHOST: human-in-the-loop gate — only a human authenticated by nginx (basic auth → X-Remote-User)
// may approve/reject. Direct calls (e.g. from the agent on localhost) are refused.
app.use('/api/openclaw/approvals/:id/review', (req, res, next) => {
  if (!req.get('x-remote-user')) {
    return res.status(403).json({ error: 'Approval decisions require an authenticated human (via the web UI).' });
  }
  next();
});

// Mount OpenClaw sync & API routes
app.use('/api/openclaw', openclawRouter);

// BDNHOST: LLM provider = DeepSeek (OpenAI-compatible) instead of Gemini.
const deepseekKey = process.env.DEEPSEEK_API_KEY;
const deepseekModel = process.env.DEEPSEEK_MODEL || 'deepseek-flash';
const aiClient = deepseekKey ? { provider: 'deepseek' } : null;
const apiKey = deepseekKey; // keeps /api/health "hasGeminiKey" semantics (= LLM available)

async function llmJSON(system: string, prompt: string, temperature = 0.7): Promise<any> {
  const r = await fetch('https://api.deepseek.com/chat/completions', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${deepseekKey}` },
    body: JSON.stringify({
      model: deepseekModel,
      temperature,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: system + '\nהחזר אך ורק אובייקט JSON תקין, ללא טקסט נוסף.' },
        { role: 'user', content: prompt },
      ],
    }),
    signal: AbortSignal.timeout(120000),
  });
  if (!r.ok) throw new Error(`DeepSeek HTTP ${r.status}: ${(await r.text()).slice(0, 200)}`);
  const data: any = await r.json();
  const raw: string = data.choices?.[0]?.message?.content || '{}';
  try {
    return JSON.parse(raw);
  } catch {
    // Repair common LLM JSON issues: invalid backslash escapes (e.g. Hebrew gershayim) and code fences.
    const cleaned = raw
      .replace(/^```(?:json)?\s*/i, '').replace(/```\s*$/, '')
      .replace(/\\(?!["\\/bfnrtu])/g, '');
    return JSON.parse(cleaned);
  }
}

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    hasGeminiKey: Boolean(apiKey),
    timestamp: new Date().toISOString(),
  });
});

// Prompt generator for Gemini structured response
function buildPrompt(userInput: any) {
  return `
אתה מומחה לאסטרטגיה עסקית, אוטומציות B2B ופיתוח שירותי AI מבוססי OpenClaw (סוכן AI לאוטומציית משימות מורכבות).
המשתמש ממלא שאלון כדי לקבל עד 3 רעיונות עסקיים ממוקדים לשימוש ב-OpenClaw למכירת שירות או ייעול תהליך קיים.

עקרונות מנחים קריטיים (לפי ה-PRD):
1. OpenClaw אינו מקור אוטומטי להכנסה פסיבית. המיקוד הוא במכירת שירות (Productized Service) או אוטומציה לבעיה קיימת שבה יש קונה מזוהה, כאב קיים ותוצאה מדידה.
2. תרגום כל רעיון לניסוי ביקוש קטן שאפשר לבצע בתוך ${userInput.validationDays || 14} ימים בלי לפתח מוצר מלא מראש.
3. הפרדה ברורה ושקופה בין הכנסה, רווח, עלויות מודל/אירוח, וזמן עבודה אנושי. אין הבטחות הכנסה!
4. אישור אנושי (Human-in-the-loop): חובה לציין במפורש היכן נדרש אדם לבדוק או לאשר לפני שליחה או שינוי נתונים.
5. כלל פסילה: אסור להציע רעיונות הכוללים ספאם מסיבי, גישה לא חוקית למידע, מסחר פיננסי או הפרת תנאי שירות.

פרופיל המשתמש:
- תחום מקצועי: ${userInput.professionField} ${userInput.customField ? `(${userInput.customField})` : ''}
- סוג לקוחות מוכר: ${userInput.targetClients || 'עסקים קטנים ובינוניים'}
- כישורים שניתן למכור מיד: ${Array.isArray(userInput.sellableSkills) ? userInput.sellableSkills.join(', ') : userInput.sellableSkills}
- תהליכים חוזרים/יקרים מוכרים: ${userInput.recurringProcesses || 'טיפול בפניות, ניהול מסמכים, מעקב לידים'}
- נגישות לקוחות: ${userInput.clientAccess} (exists = יש לקוחות בהישג יד, partial = היכרות חלקית, none = אין כרגע)
- שעות פנויות בשבוע: ${userInput.weeklyHours}
- תקציב ראשוני: ${userInput.budget} ש"ח
- מודל עסקי מועדף: ${userInput.businessModel}
- יעד זמן לבדיקה: ${userInput.validationDays || 14} ימים
- שפה ואזור: ${userInput.languageRegion || 'ישראל (עברית)'}
- מגבלות/החרגות: ${userInput.excludedAreas || 'ללא'}
- רגישות מידע: ${userInput.dataSensitivity || 'סטנדרטית'}

הפק בדיוק 3 רעיונות עסקיים בעברית רהוטה ומקצועית, מותאמים אישית לפרופיל זה, בפורמט JSON הבא.
כל רעיון יקבל ציונים 0 עד 5 ב-7 הממדים:
1. התאמה לכישורי המשתמש (משקל 20%)
2. נגישות לקונים וערוץ מכירה (משקל 20%)
3. דחיפות הבעיה ונכונות תשלום קיימת (משקל 20%)
4. מהירות אימות הביקוש (משקל 15%)
5. היתכנות טכנית עם OpenClaw וצורך בפיקוח אנושי (משקל 10%)
6. עלויות וסיכונים ראשוניים (משקל 10%)
7. רגישות מידע והרשאות (משקל 5%)
`;
}

// Structured schema for Gemini
const ideaResponseSchema = {
  type: Type.OBJECT,
  properties: {
    ideas: {
      type: Type.ARRAY,
      description: 'Up to 3 vetted business ideas for OpenClaw',
      items: {
        type: Type.OBJECT,
        properties: {
          id: { type: Type.STRING },
          title: { type: Type.STRING, description: 'Idea name' },
          oneLineValue: { type: Type.STRING, description: 'Single sentence customer value proposition' },
          targetCustomer: {
            type: Type.OBJECT,
            properties: {
              whoPays: { type: Type.STRING },
              businessType: { type: Type.STRING },
              role: { type: Type.STRING },
            },
            required: ['whoPays', 'businessType', 'role'],
          },
          painPoint: {
            type: Type.OBJECT,
            properties: {
              currentAction: { type: Type.STRING },
              costAndFriction: { type: Type.STRING },
            },
            required: ['currentAction', 'costAndFriction'],
          },
          initialOffer: { type: Type.STRING, description: 'Service or deliverable sold without building full product' },
          openClawRole: {
            type: Type.OBJECT,
            properties: {
              automatedSteps: { type: Type.ARRAY, items: { type: Type.STRING } },
              suggestedIntegrations: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['automatedSteps', 'suggestedIntegrations'],
          },
          humanInTheLoop: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Where human must verify/approve before sending or committing',
          },
          demandExperiment: {
            type: Type.OBJECT,
            properties: {
              timeframeDays: { type: Type.NUMBER },
              targetMetric: { type: Type.STRING },
              steps: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['timeframeDays', 'targetMetric', 'steps'],
          },
          pricingHypothesis: {
            type: Type.OBJECT,
            properties: {
              range: { type: Type.STRING },
              drivers: { type: Type.STRING },
              disclaimer: { type: Type.STRING },
            },
            required: ['range', 'drivers', 'disclaimer'],
          },
          economicEstimate: {
            type: Type.OBJECT,
            properties: {
              potentialRevenue: { type: Type.STRING },
              directCosts: { type: Type.STRING },
              laborHours: { type: Type.STRING },
              platformFees: { type: Type.STRING },
              netMarginNote: { type: Type.STRING },
              statusLabel: { type: Type.STRING },
            },
            required: ['potentialRevenue', 'directCosts', 'laborHours', 'platformFees', 'netMarginNote', 'statusLabel'],
          },
          successAndStopMetrics: {
            type: Type.OBJECT,
            properties: {
              successSignals: { type: Type.ARRAY, items: { type: Type.STRING } },
              stopOrPivotSignals: { type: Type.ARRAY, items: { type: Type.STRING } },
            },
            required: ['successSignals', 'stopOrPivotSignals'],
          },
          securityAndRisks: {
            type: Type.OBJECT,
            properties: {
              permissionsRisk: { type: Type.STRING },
              privacyNotes: { type: Type.STRING },
              platformDependency: { type: Type.STRING },
              hallucinationRisk: { type: Type.STRING },
            },
            required: ['permissionsRisk', 'privacyNotes', 'platformDependency', 'hallucinationRisk'],
          },
          confidence: {
            type: Type.OBJECT,
            properties: {
              level: { type: Type.STRING },
              reason: { type: Type.STRING },
            },
            required: ['level', 'reason'],
          },
          scores: {
            type: Type.OBJECT,
            properties: {
              userSkillsFit: {
                type: Type.OBJECT,
                properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } },
                required: ['score', 'explanation'],
              },
              buyerAccess: {
                type: Type.OBJECT,
                properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } },
                required: ['score', 'explanation'],
              },
              problemUrgency: {
                type: Type.OBJECT,
                properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } },
                required: ['score', 'explanation'],
              },
              fastValidation: {
                type: Type.OBJECT,
                properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } },
                required: ['score', 'explanation'],
              },
              techFeasibility: {
                type: Type.OBJECT,
                properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } },
                required: ['score', 'explanation'],
              },
              initialCostsRisk: {
                type: Type.OBJECT,
                properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } },
                required: ['score', 'explanation'],
              },
              dataRisk: {
                type: Type.OBJECT,
                properties: { score: { type: Type.NUMBER }, explanation: { type: Type.STRING } },
                required: ['score', 'explanation'],
              },
              weightedTotal: { type: Type.NUMBER },
            },
            required: [
              'userSkillsFit',
              'buyerAccess',
              'problemUrgency',
              'fastValidation',
              'techFeasibility',
              'initialCostsRisk',
              'dataRisk',
              'weightedTotal',
            ],
          },
          disqualificationCheck: {
            type: Type.OBJECT,
            properties: {
              passed: { type: Type.BOOLEAN },
              reason: { type: Type.STRING },
            },
            required: ['passed'],
          },
        },
        required: [
          'id',
          'title',
          'oneLineValue',
          'targetCustomer',
          'painPoint',
          'initialOffer',
          'openClawRole',
          'humanInTheLoop',
          'demandExperiment',
          'pricingHypothesis',
          'economicEstimate',
          'successAndStopMetrics',
          'securityAndRisks',
          'confidence',
          'scores',
          'disqualificationCheck',
        ],
      },
    },
  },
  required: ['ideas'],
};

// High-fidelity fallback ideas generator strictly adhering to PRD requirements
function generateCuratedFallbackIdeas(userInput: any) {
  const profession = userInput.professionField || 'marketing';
  const targetClients = userInput.targetClients || 'עסקים קטנים ובינוניים';
  const timeframe = Number(userInput.validationDays) || 14;

  const templates: Record<string, any[]> = {
    marketing: [
      {
        id: 'mkt-1',
        title: 'אימות וסינון לידים נכנסים מרובי ערוצים בזמן אמת',
        oneLineValue: 'סינון לידים קרקעי והעברת לידים בשלים עם תקציר שיחה מוכן ישירות ליומן הנציג בתוך 3 דקות.',
        targetCustomer: {
          whoPays: 'מנהל סוכנות או סמנכ"ל שיווק בחברת B2B או שירותים מקצועיים',
          businessType: 'סוכנויות שיווק, נותני שירותי פרמיום, מכללות מקצועיות',
          role: 'Head of Growth / בעל סוכנות',
        },
        painPoint: {
          currentAction: 'לידים נכנסים מטפסים ופייסבוק נשארים שעות ללא מענה, ונציגי מכירות מבזבזים 60% מזמנם על פניות סרק.',
          costAndFriction: 'אובדן של 30%-40% מפניות חמות, ותסכול גבוה של צוות המכירות שמבזבז 15 שעות שבועיות.',
        },
        initialOffer: 'שירות פיילוט מנוהל ל-14 יום: הטמעת בוט תחקור ליד מקדים ב-WhatsApp/אימייל המעביר לנציג רק פניות שעברו אימות תקציב וצורך.',
        openClawRole: {
          automatedSteps: [
            'קליטת Webhook של ליד חדש (מאתר, קמפיין Meta, טופס Typeform)',
            'הפעלת סוכן OpenClaw לתחקור ראשוני קצר בוואטסאפ או באימייל',
            'חילוץ שדות קריטיים (גודל צוות, תקציב, דחיפות) ודירוג איכות הפנייה',
            'יצירת כרטיס ליד מעודכן ב-CRM (Hubspot/Monday) עם סיכום תמציתי',
          ],
          suggestedIntegrations: ['Webhooks', 'WhatsApp Business API / GreenAPI', 'Google Sheets / Monday CRM', 'Slack Alert'],
        },
        humanInTheLoop: [
          'הנציג האנושי מקבל התרעה ומאשר לפני שליחת הצעת מחיר או שיחת תיאום סופית.',
          'במקרים של תשובות עמומות או התנגדות, הפנייה מנותבת מיד לטלפון של נציג אנושי.',
        ],
        demandExperiment: {
          timeframeDays: timeframe,
          targetMetric: `פנייה ישירה ל-10 בעלי סוכנויות/מנהלי שיווק והשגת 3 שיחות גישוש לבדיקת כאב הלידים`,
          steps: [
            'ניסוח הודעת פנייה אישית המציגה את בעיית זמני התגובה ללידים',
            'שליחת 10 הודעות ממוקדות בלינקדאין או בוואטסאפ ללקוחות מוכרים',
            'קיום 3 שיחות קצרות של 15 דקות למיפוי תהליך קליטת הליד הנוכחי שלהם',
            'הצעת פיילוט בדיקה לשבוע אחד ללא התחייבות ארוכת טווח במחיר סמלי',
          ],
        },
        pricingHypothesis: {
          range: '1,800 ₪ – 3,200 ₪ להקמה + 900 ₪ ריטיינר חודשי',
          drivers: 'מספר מקורות הלידים, מורכבות התחקור, נפח הפניות החודשי',
          disclaimer: 'השערה לבדיקה בלבד, אינה התחייבות לנתוני שוק',
        },
        economicEstimate: {
          potentialRevenue: '2,500 ₪ לפרויקט פיילוט ראשון',
          directCosts: '~90 ₪ (עלויות טוקנים OpenClaw/LLM וחיבור WhatsApp API)',
          laborHours: '6-8 שעות עבודה (הגדרה, בדיקות, וליווי לקוח ראשון)',
          platformFees: '~120 ₪ לחודש (אירוח ותשתית מסרים)',
          netMarginNote: 'אומדן רווח תפעולי גולמי כ-2,290 ₪ לפני מס ושעות עבודה',
          statusLabel: 'אומדן',
        },
        successAndStopMetrics: {
          successSignals: ['לפחות לקוח אחד מוכן להפקיד מקדמה או להתחיל פיילוט בתוך שבועיים', 'נציגי המכירות מדווחים על חיסכון של שעתיים ביום'],
          stopOrPivotSignals: ['אף לקוח אינו מוכן לשלם עבור הסינון המוקדם כי נפח הלידים שלו נמוך מ-50 בחודש'],
        },
        securityAndRisks: {
          permissionsRisk: 'גישה לקריאת פרטי ליד (שם, טלפון, אימייל). חובה להגדיר הרשאות מינימליות בלבד.',
          privacyNotes: 'עמידה בחוק הגנת הפרטיות הישראלי ותקנות אבטחת מידע – ללא שמירת מידע רגיש מעבר לצורך.',
          platformDependency: 'תלות בחיבור יציב ל-WhatsApp Business API ובמדיניות מטא למניעת חסימות.',
          hallucinationRisk: 'נמוך – תסריט התחקור מוגדר בקפידה ללא יצירת עובדות חדשות.',
        },
        confidence: {
          level: 'גבוהה',
          reason: 'כאב ברור של סוכנויות שיווק שמשלמות הרבה כסף על קמפיינים ומפסידות לידים בגלל זמני מענה.',
        },
        scores: {
          userSkillsFit: { score: 4.5, explanation: 'מתאים במיוחד לבעלי רקע בשיווק ומשפכי מכירה' },
          buyerAccess: { score: 4.2, explanation: 'קל לאתר סוכנויות דיגיטל ועסקים שמפרסמים כרגע מודעות' },
          problemUrgency: { score: 4.6, explanation: 'אובדן לידים שורף תקציב פרסום מיידי' },
          fastValidation: { score: 4.3, explanation: 'ניתן לבדוק נכונות לשלם בתוך 7-10 ימים בשיחות קצרות' },
          techFeasibility: { score: 4.2, explanation: 'מימוש פשוט של Webhook ואינטגרציית הודעות' },
          initialCostsRisk: { score: 4.8, explanation: 'עלויות התחלתיות כמעט אפסיות' },
          dataRisk: { score: 4.0, explanation: 'פרטי קשר בסיסיים, דורש שמירה על פרטיות' },
          weightedTotal: 4.4,
        },
        disqualificationCheck: { passed: true },
      },
      {
        id: 'mkt-2',
        title: 'הפקת דוחות ביצועים וקריאיטיב מותאמים אישית ללקוחות סוכנות',
        oneLineValue: 'סיכום שבועי חכם של ביצועי קמפיינים עם תובנות קונקרטיות ורעיונות לקריאיטיב הבא.',
        targetCustomer: {
          whoPays: 'מנהל סוכנות דיגיטל שמנהל 15-40 לקוחות ריטיינר',
          businessType: 'סוכנויות PPC / SEO / סושיאל',
          role: 'Agency Founder / Account Director',
        },
        painPoint: {
          currentAction: 'מנהלי תיקים מבלים את כל יום ראשון בחיתוך נתונים מגוגל/פייסבוק וכתיבת מיילים מייגעים ללקוחות.',
          costAndFriction: '20 שעות עבודה שבועיות של מנהל תיק בכיר, דוחות יבשים שלקוחות לא קוראים, וחיכוך בחידוש ריטיינרים.',
        },
        initialOffer: 'חבילת דוחות מנוהלת: מחולל סיכום שבועי שמייצר טיוטת אימייל מנהלים בעברית ברורה לכל לקוח לאישור מנהל התיק.',
        openClawRole: {
          automatedSteps: [
            'משיכת קובץ נתוני קמפיינים שבועי מ-Google Sheets / Looker',
            'סוכן OpenClaw מזהה מגמות עיקריות (עלייה ב-CPA, מודעות מצטיינות, ירידה בהמרות)',
            'ניסוח טיוטת אימייל תמציתית ומכבדת בעברית עם 3 המלצות פעולה',
            'שליחת הטיוטה למנהל התיק ב-Slack / אימייל פרטי לאישור בלחיצת כפתור',
          ],
          suggestedIntegrations: ['Google Sheets / Drive', 'OpenClaw Agent', 'Slack Bot', 'Gmail (טיוטה בלבד)'],
        },
        humanInTheLoop: [
          'הדוח מופק תמיד כטיוטה (Draft) – מנהל התיק חייב לקרוא ולאשר לפני שליחה ללקוח הקצה.',
          'התובנות העסקיות והתקציביות נבדקות על ידי איש המקצוע.',
        ],
        demandExperiment: {
          timeframeDays: timeframe,
          targetMetric: 'הצגת דוח לדוגמה מבוסס נתונים פיקטיביים ל-5 מנהלי סוכנויות וקבלת משוב',
          steps: [
            'בניית דוגמה של דוח מנהלים שבועי בן עמוד אחד על בסיס נתונים פשוטים',
            'פנייה ל-8 מנהלי סוכנויות: "כמה זמן הצוות שלך שורף ביום ראשון על דוחות לקוחות?"',
            'הדגמת הפורמט בשיחת וידאו של 10 דקות',
            'בדיקת נכונות לשלם 500-1,000 ₪ לחודש עבור אוטומציית הטיוטות',
          ],
        },
        pricingHypothesis: {
          range: '1,200 ₪ – 2,500 ₪ ריטיינר חודשי לסוכנות (עד 20 לקוחות)',
          drivers: 'כמות הלקוחות בסוכנות, עומק הניתוח ומספר מקורות המידע',
          disclaimer: 'השערה לבדיקה בלבד, אינה התחייבות לנתוני שוק',
        },
        economicEstimate: {
          potentialRevenue: '1,500 ₪ לחודש לסוכנות ראשונה',
          directCosts: '~60 ₪ (עלויות טוקנים לניתוח שבועי מרוכז)',
          laborHours: '4-5 שעות להגדרה ראשונית + שעה שבועית לתחזוקה',
          platformFees: '~50 ₪ (אחסון וכלים בסיסיים)',
          netMarginNote: 'אומדן רווח חודשי שוטף כ-1,390 ₪ בריטיינר',
          statusLabel: 'הנחה',
        },
        successAndStopMetrics: {
          successSignals: ['מנהל סוכנות מעוניין להריץ פיילוט על 3 לקוחות קצה שלו בשבוע הקרוב'],
          stopOrPivotSignals: ['הסוכנויות כבר משתמשות בפתרון BI מובנה והדוחות האנושיים אינם צוואר בקבוק'],
        },
        securityAndRisks: {
          permissionsRisk: 'גישה לנתוני ביצועי קמפיינים. אין צורך בפרטי כרטיסי אשראי או סיסמאות.',
          privacyNotes: 'נתונים אגרגטיביים בלבד, ללא מידע מזהה אישי (PII).',
          platformDependency: 'תלות בפורמט ייצוא הנתונים של פלטפורמות הפרסום.',
          hallucinationRisk: 'בינוני – מחייב בדיקה ידנית של המספרים מול הגיליון.',
        },
        confidence: {
          level: 'בינונית',
          reason: 'צורך קיים ונפוץ, אך סוכנויות רבות רגילות לפורמטים משלהן ודורשות גמישות.',
        },
        scores: {
          userSkillsFit: { score: 4.6, explanation: 'ניסיון שיווקי מאפשר ניסוח תובנות איכותיות שהלקוח מעריך' },
          buyerAccess: { score: 4.0, explanation: 'נגישות גבוהה למנהלי סוכנויות מקומיות' },
          problemUrgency: { score: 3.8, explanation: 'כאב מעיק אך לא משתק את העסק' },
          fastValidation: { score: 4.4, explanation: 'קל מאוד להציג דוגמת דוח ולמדוד תגובה' },
          techFeasibility: { score: 4.5, explanation: 'קריאת קובץ CSV/Sheets וכתיבת טיוטה פשוטה' },
          initialCostsRisk: { score: 4.7, explanation: 'עלות אפסית לבדיקה' },
          dataRisk: { score: 4.5, explanation: 'סיכון נמוך ביותר, ללא נתונים אישיים' },
          weightedTotal: 4.3,
        },
        disqualificationCheck: { passed: true },
      },
      {
        id: 'mkt-3',
        title: 'ניטור מתחרים ואיתור שינויי מחיר ומבצעים בענף מקומי',
        oneLineValue: 'התראה תמציתית פעמיים בשבוע על מבצעים חדשים, שינויי תמחור וקמפיינים של מתחרים מרכזיים.',
        targetCustomer: {
          whoPays: 'בעל עסק קמעונאי, חנות איקומרס או רשת מקומית',
          businessType: 'איקומרס, קליניקות אסתטיקה, סוכנויות תיירות מקומיות',
          role: 'בעל עסק / מנהל סחר',
        },
        painPoint: {
          currentAction: 'בדיקה ידנית ספורדית של אתרי מתחרים ודפי פייסבוק, או גילוי מאוחר של מבצע עוקף.',
          costAndFriction: 'הפסד עסקאות בגלל חוסר מודעות לתמחור אגרסיבי של מתחרה, ללא זמן לעקוב בקביעות.',
        },
        initialOffer: 'דוח מודיעין תחרותי חודשי: ניטור 5 מתחרים עיקריים ודיווח שבועי ישירות לווטסאפ של בעל העסק.',
        openClawRole: {
          automatedSteps: [
            'סריקה תקופתית חוקית של דפי נחיתה ומבצעים פומביים של 5 מתחרים',
            'השוואת נתונים מול סריקה קודמת ואיתור שינויי מחיר, מבצעים או באנרים חדשים',
            'ניסוח תקציר מנהלים קצר בן 4 נקודות עיקריות',
            'שליחה לאישור המשתמש לפני העברה ללקוח',
          ],
          suggestedIntegrations: ['Web Scraper / Public URL Reader', 'OpenClaw Agent', 'Telegram/WhatsApp Bot'],
        },
        humanInTheLoop: [
          'סינון אנושי של התראות שווא (כגון שינויים טכניים באתר שאינם מבצע אמיתי).',
          'הערכת ההשלכות העסקיות על ידי המשתמש.',
        ],
        demandExperiment: {
          timeframeDays: timeframe,
          targetMetric: 'הכנת דוח ניטור אחד בחינם עבור עסק מוכר ובדיקת רצון לשלם על המשך שבועי',
          steps: [
            'בחירת עסק מוכר שיש לו 3 מתחרים מובהקים',
            'הפקה ידנית/סמי-אוטומטית של דוח השוואה שבועי ראשון',
            'שליחת הדוח לבעל העסק: "זה מה שהמתחרים שלך עשו השבוע, שווה לך לקבל כזה קבוע ב-600 ₪ לחודש?"',
            'איסוף תגובות מ-4 עסקים דומים',
          ],
        },
        pricingHypothesis: {
          range: '600 ₪ – 1,200 ₪ ריטיינר חודשי לעסק',
          drivers: 'כמות המתחרים המנוטרים ותדירות העדכונים (שבועי / דו-שבועי)',
          disclaimer: 'השערה לבדיקה בלבד, אינה התחייבות לנתוני שוק',
        },
        economicEstimate: {
          potentialRevenue: '800 ₪ לחודש ללקוח',
          directCosts: '~40 ₪ (עלויות שרת וסריקה)',
          laborHours: 'שעה שבועית לפיקוח על הדוחות',
          platformFees: '~30 ₪',
          netMarginNote: 'אומדן רווח חודשי כ-730 ₪ ללקוח',
          statusLabel: 'אומדן',
        },
        successAndStopMetrics: {
          successSignals: ['בעל העסק מבקש להוסיף עוד 3 מתחרים ומאשר תשלום לחודש הבא'],
          stopOrPivotSignals: ['אתרי המתחרים חוסמים סריקה או שאין שינויי מחיר במשך שבועות ארוכים'],
        },
        securityAndRisks: {
          permissionsRisk: 'סריקת דפים פומביים בלבד ללא עקיפת מנגנוני אבטחה או התחזות.',
          privacyNotes: 'מידע עסקי פומבי בלבד, אין איסוף מידע אישי.',
          platformDependency: 'רגישות לשינויי עיצוב באתרי היעד.',
          hallucinationRisk: 'נמוך – השוואת טקסט ומחירים בלבד.',
        },
        confidence: {
          level: 'בינונית',
          reason: 'פשוט למימוש אך דורש ענף תחרותי שבו יש שינויי מחירים תכופים.',
        },
        scores: {
          userSkillsFit: { score: 4.2, explanation: 'דורש הבנה בסיסית של הענף והצעות המתחרים' },
          buyerAccess: { score: 3.9, explanation: 'עסקים קטנים לרוב נגישים אך בעלי תקציב מוגבל' },
          problemUrgency: { score: 3.7, explanation: 'חשוב מאוד בענפים תחרותיים, פחות בענפים מסורתיים' },
          fastValidation: { score: 4.6, explanation: 'אפשר להפיק דוח ראשון תוך שעתיים ולשלוח' },
          techFeasibility: { score: 4.0, explanation: 'סריקת אתרים דורשת תחזוקה בעת שינויי HTML' },
          initialCostsRisk: { score: 4.7, explanation: 'ללא עלויות כבדות' },
          dataRisk: { score: 4.8, explanation: 'מידע פומבי לחלוטין' },
          weightedTotal: 4.1,
        },
        disqualificationCheck: { passed: true },
      },
    ],
    real_estate: [
      {
        id: 're-1',
        title: 'אוטומציית אימות והתאמת נכסים לרוכשים עבור משרדי תיווך',
        oneLineValue: 'הצלבת דרישות קונים מול מאגר הנכסים של המשרד ותזמון שיחות עניין לנכסים חדשים בתוך שעה.',
        targetCustomer: {
          whoPays: 'בעל משרד תיווך או מנהל צוות סוכנים מקומי',
          businessType: 'משרדי תיווך נדל"ן למגורים ולמסחרי',
          role: 'Broker / Agency Owner',
        },
        painPoint: {
          currentAction: 'סוכנים רושמים קונים במחברות או בווטסאפ, וכשנכנס נכס חדש הם זוכרים רק 2 קונים מתוך 50 שחיפשו.',
          costAndFriction: 'עסקאות מתפספסות, נכסים יושבים במלאי שבועות, והקונים עוברים למתווך אחר.',
        },
        initialOffer: 'מערכת הצלבה קלה: סוכן OpenClaw שמקבל תיאור נכס חדש, מחפש במאגר הקונים הקיים ומכין לסוכן רשימת 5 קונים מתאימים עם הודעת הצעה מוכנה.',
        openClawRole: {
          automatedSteps: [
            'קליטת פרטי נכס חדש מטופס פשוט או הודעת וואטסאפ של הסוכן',
            'סריקת רשימת הקונים הפעילים (Google Sheets / CRM) והצלבת מאפיינים (תקציב, חדרים, שכונה)',
            'הפקת רשימת מועמדים מדורגת עם הסבר קצר להתאמה',
            'ניסוח טיוטת הודעה מותאמת אישית לכל קונה',
          ],
          suggestedIntegrations: ['Google Sheets / Airtable', 'WhatsApp Webhook', 'OpenClaw Agent'],
        },
        humanInTheLoop: [
          'הסוכן מקבל את ההודעות כטיוטה ומאשר או עורך בעצמו לפני שליחה לקונה.',
          'לסוכן שליטה מלאה על שמירת הקשר האישי.',
        ],
        demandExperiment: {
          timeframeDays: timeframe,
          targetMetric: 'שיחה עם 5 מנהלי משרדי תיווך ובדיקת מספר העסקאות שהם מעריכים שמתפספסות',
          steps: [
            'הגעה ל-5 משרדי תיווך באזור גיאוגרפי מוגדר',
            'שאלה ישירה: "איך אתם מוודאים שנכס חדש מוצג לכל הקונים הרלוונטיים שכבר דיברו איתכם?"',
            'הצעת פיילוט חינם לשבוע על נכס אחד לבדיקת איכות ההצלבה',
            'הצגת הצעת מחיר חודשית להמשך',
          ],
        },
        pricingHypothesis: {
          range: '1,500 ₪ – 3,000 ₪ הקמה + 800 ₪ – 1,500 ₪ ריטיינר חודשי',
          drivers: 'כמות הסוכנים במשרד ונפח העסקאות החודשי',
          disclaimer: 'השערה לבדיקה בלבד, אינה התחייבות לנתוני שוק',
        },
        economicEstimate: {
          potentialRevenue: '2,200 ₪ להקמה + 1,000 ₪ לחודש',
          directCosts: '~80 ₪ לחודש (טוקנים וחיבורים)',
          laborHours: '10 שעות לפרויקט ראשון',
          platformFees: '~100 ₪',
          netMarginNote: 'אומדן רווח שנתי מלקוח אחד: מעל 12,000 ₪',
          statusLabel: 'אומדן',
        },
        successAndStopMetrics: {
          successSignals: ['סוכן סגר פגישת נכס עם קונה שנשכח ברשימה בזכות ההצלבה'],
          stopOrPivotSignals: ['המתווכים לא מנהלים רישום של קונים כלל ואינם מוכנים להזין נתונים בסיסיים'],
        },
        securityAndRisks: {
          permissionsRisk: 'גישה למאגר קונים ופרטי התקשרות. חובה להגדיר סביבת נתונים סגורה.',
          privacyNotes: 'שמירה על סודיות לקוחות המשרד.',
          platformDependency: 'אינטגרציה לגיליון נתונים של המשרד.',
          hallucinationRisk: 'נמוך – הצלבת פרמטרים מוגדרים (תקציב, אזור, מספר חדרים).',
        },
        confidence: {
          level: 'גבוהה',
          reason: 'שווי כל עסקה בנדל"ן גבוה מאוד, כך שהחיסכון באיבוד קונה אחד מחזיר את כל עלות המערכת מיד.',
        },
        scores: {
          userSkillsFit: { score: 4.4, explanation: 'הבנת תהליך המכירה בנדל"ן ומשפך הקונים' },
          buyerAccess: { score: 4.3, explanation: 'קל מאוד לפגוש מתווכים במשרדיהם' },
          problemUrgency: { score: 4.7, explanation: 'עסקה שמתפספסת שווה עשרות אלפי שקלים בעמלות' },
          fastValidation: { score: 4.2, explanation: 'ניתן לבדוק בשבוע אחד מול משרד אחד' },
          techFeasibility: { score: 4.5, explanation: 'הצלבה לוגית פשוטה שמתאימה מאוד ל-OpenClaw' },
          initialCostsRisk: { score: 4.8, explanation: 'עלויות מינימליות' },
          dataRisk: { score: 3.9, explanation: 'מידע לקוחות עסקי רגיש שמחייב זהירות' },
          weightedTotal: 4.4,
        },
        disqualificationCheck: { passed: true },
      },
    ],
  };

  // Select matching or general fallbacks
  const list = templates[profession] || templates.marketing;
  return list;
}

// API Route: Generate Ideas
app.post('/api/generate-ideas', async (req, res) => {
  try {
    const userInput = req.body;
    if (!userInput) {
      return res.status(400).json({ error: 'Missing request body' });
    }

    // Try Gemini if available
    if (aiClient) {
      try {
        const prompt = buildPrompt(userInput);
        const parsed = await llmJSON(
          'אתה מומחה לאסטרטגיה עסקית, ייעול תהליכים ומכירת שירותי אוטומציה מבוססי AI. כתוב בעברית מקצועית, שקופה, ללא הייפ וללא הבטחות כוזבות. עקוב במדויק אחר הנחיות ה-PRD.',
          prompt + '\n\nמבנה ה-JSON הנדרש (JSON Schema): ' + JSON.stringify(ideaResponseSchema),
        );
        {
          if (parsed && Array.isArray(parsed.ideas) && parsed.ideas.length > 0) {
            setOpenClawIdeas(parsed.ideas);
            return res.json({
              source: 'deepseek',
              ideas: parsed.ideas,
            });
          }
        }
      } catch (geminiError: any) {
        console.warn('LLM (DeepSeek) generation failed, using curated fallback:', geminiError?.message);
      }
    }

    // Fallback: curated PRD-compliant generator
    const fallbackIdeas = generateCuratedFallbackIdeas(userInput);
    setOpenClawIdeas(fallbackIdeas);
    return res.json({
      source: 'curated-generator',
      ideas: fallbackIdeas,
    });
  } catch (err: any) {
    console.error('Error generating ideas:', err);
    res.status(500).json({ error: 'Internal server error', details: err?.message });
  }
});

// API Route: Generate Outreach & Discovery Plan for selected idea
app.post('/api/generate-outreach', async (req, res) => {
  try {
    const { idea, userProfile } = req.body;
    if (!idea) {
      return res.status(400).json({ error: 'Idea object is required' });
    }

    if (aiClient) {
      try {
        const prompt = `
עבור הרעיון העסקי הבא מבוסס OpenClaw:
שם: ${idea.title}
הצעת ערך: ${idea.oneLineValue}
קהל יעד: ${idea.targetCustomer?.role || ''} ב${idea.targetCustomer?.businessType || ''}
הצעה ראשונית: ${idea.initialOffer}

צור חבילת אימות מעשית בעברית הכוללת:
1. הודעת פנייה קרה (Outreach) לוואטסאפ / לינקדאין – קצרה (עד 75 מילים), לא ספאמית, מכבדת וממוקדת בכאב הלקוח.
2. אימייל פנייה רשמי לקביעת שיחת גישוש קצרה (עד 120 מילים).
3. 5 שאלות מפתח לראיון גילוי לקוח (Customer Discovery Interview) לבדיקת נכונות לשלם בלי למכור באגרסיביות.
4. תבנית הצעת פיילוט ממוקדת בת 4 סעיפים (מטרה, מה כלול, מה דורש אישור אנושי, תמחור ניסיוני).
החזר הכל במבנה JSON הבא:
{
  "whatsappMessage": "...",
  "coldEmail": "...",
  "interviewQuestions": ["...", "...", "...", "...", "..."],
  "pilotProposal": {
    "objective": "...",
    "scope": "...",
    "humanOversight": "...",
    "pilotPrice": "..."
  }
}
`;
        const parsed = await llmJSON('אתה מומחה למכירות B2B ואימות לקוחות. כתוב בעברית מקצועית ומכבדת.', prompt);
        if (parsed && parsed.whatsappMessage) {
          return res.json(parsed);
        }
      } catch (err) {
        console.warn('LLM (DeepSeek) outreach fallback:', err);
      }
    }

    // Curated fallback outreach package
    const fallbackOutreach = {
      whatsappMessage: `היי ${idea.targetCustomer?.role || 'שם'}, ראיתי שאתם מנהלים פעילות ענפה ב${idea.targetCustomer?.businessType || 'התחום'}. שמתי לב שאצל הרבה עסקים דומים, ${idea.painPoint?.currentAction || 'טיפול בפניות ידניות'} שורף שעות עבודה יקרות כל שבוע. 

בניתי תהליך אוטומציה ממוקד עם בדיקה אנושית שמסנן ומסדר את הכל בתוך 3 דקות. אשמח להראות לך הדגמה של 5 דקות ללא שום התחייבות. מתאים לדבר בקצרה מחר?`,
      coldEmail: `שלום ${idea.targetCustomer?.role || 'שם'},

אני פונה אליך כי שמתי לב לצוואר הבקבוק המוכר ב${idea.targetCustomer?.businessType || 'תחומך'}: ${idea.painPoint?.currentAction || 'עבודה ידנית חוזרת'}.

פיתחתי פתרון מבוסס אוטומציית OpenClaw המאפשר ${idea.oneLineValue}. 
היתרון המרכזי: כל פעולה עוברת בדיקה ואישור אנושי שלך לפני שליחה או שינוי נתונים, כך שאין שום סיכון לפגיעה בלקוחות או אובדן שליטה.

אשמח לתאם שיחת וידאו קצרה בת 10 דקות להציג לך דוגמה מעשית לבדיקה.
האם יום שלישי בשעה 11:00 עשוי להתאים?`,
      interviewQuestions: [
        `כמה זמן בשבוע אתם או הצוות שלכם משקיעים כרגע ב-${idea.painPoint?.currentAction || 'משימה זו'}?`,
        'מה הניסיון שלכם עם פתרונות אוטומציה בעבר, ומה גרם להם להצליח או להיכשל?',
        'אם בעיה זו הייתה נפתרת כמעט לחלוטין עם אישור אנושי שלכם, כמה זה היה שווה לכם בחודש?',
        'מי בעסק מקבל את ההחלטה על הטמעת כלי כזה, ומה המדד המרכזי שיוכיח הצלחה?',
        'אם נציע פיילוט מנוהל ל-14 יום בעלות סמלית, האם הייתם מעוניינים לבדוק את זה עכשיו?',
      ],
      pilotProposal: {
        objective: `אימות שירות '${idea.title}' בסביבת ניסיון מוגבלת ללא הפרעה לפעילות השוטפת.`,
        scope: `${idea.initialOffer} הכולל חיבור ראשוני, הגדרת סוכן OpenClaw והרצת 10 תרחישים לדוגמה.`,
        humanOversight: 'שום הודעה או שינוי נתונים לא ישלחו ללא אישור מפורש של נציג אנושי.',
        pilotPrice: `${idea.pricingHypothesis?.range || '1,500 ₪'} לפיילוט בן 14 יום הכולל תמיכה צמודה.`,
      },
    };

    res.json(fallbackOutreach);
  } catch (err: any) {
    res.status(500).json({ error: 'Outreach generation failed', details: err?.message });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  // Seed initial ideas for OpenClaw sync
  try {
    setOpenClawIdeas(generateCuratedFallbackIdeas({ professionField: 'marketing' }));
  } catch (e) {
    // ignore
  }

  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(Number(port), process.env.HOST || '127.0.0.1', () => {
    console.log(`Server listening on http://localhost:${port}`);
  });
}

startServer();
