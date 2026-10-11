import React, { useState } from 'react';
import { UserProfileInput } from '../types';
import { PRESET_PROFILES } from '../data/presets';
import { Check, ShieldAlert, ArrowLeft, RotateCcw, Sparkles } from 'lucide-react';

interface QuestionnaireProps {
  formData: UserProfileInput;
  setFormData: React.Dispatch<React.SetStateAction<UserProfileInput>>;
  onSubmit: () => void;
  isLoading: boolean;
}

const AVAILABLE_SKILLS = [
  'לידים ומכירות',
  'אוטומציה ואינטגרציות',
  'דוחות וניתוח נתונים',
  'ניהול מסמכים וחוזים',
  'שירות לקוחות ו-FAQ',
  'תפעול יומיומי',
  'סריקת ואיסוף מידע פומבי',
  'ניהול תיקי לקוחות (Account Management)',
];

export const Questionnaire: React.FC<QuestionnaireProps> = ({
  formData,
  setFormData,
  onSubmit,
  isLoading,
}) => {
  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1);

  const toggleSkill = (skill: string) => {
    if (formData.sellableSkills.includes(skill)) {
      setFormData((prev) => ({
        ...prev,
        sellableSkills: prev.sellableSkills.filter((s) => s !== skill),
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        sellableSkills: [...prev.sellableSkills, skill],
      }));
    }
  };

  const handleReset = () => {
    setFormData(PRESET_PROFILES[0].data);
    setActiveStep(1);
  };

  return (
    <div id="questionnaire-form" className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {/* Steps Navigation Bar */}
      <div className="flex items-center justify-between border-b border-slate-200 pb-4 mb-8">
        <div>
          <h2 className="text-xl font-bold text-slate-900">
            שאלון התאמה עסקית
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            הזן את נתוני הרקע והזמינות שלך להפקת עד 3 רעיונות ניתנים לאימות מהיר
          </p>
        </div>

        {/* Segmented Step Buttons */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setActiveStep(1)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeStep === 1
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            שלב 1: תחום ומומחיות
          </button>
          <button
            type="button"
            onClick={() => setActiveStep(2)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeStep === 2
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            שלב 2: לקוחות ותהליכים
          </button>
          <button
            type="button"
            onClick={() => setActiveStep(3)}
            className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap ${
              activeStep === 3
                ? 'bg-white text-slate-900 shadow-sm'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            שלב 3: משאבים ומודל
          </button>
        </div>
      </div>

      {/* Safety Notice per PRD */}
      <div className="flex items-start gap-3 bg-slate-100/80 border border-slate-200 rounded-xl p-4 mb-8 text-right">
        <ShieldAlert className="w-5 h-5 text-slate-600 shrink-0 mt-0.5" />
        <div className="text-xs text-slate-700 leading-relaxed">
          <span className="font-semibold text-slate-900">מדיניות פרטיות ובטיחות: </span>
          אין להזין סיסמאות, מפתחות API, פרטי כרטיסי אשראי או מידע סודי של מעסיק/לקוח. 
          כל הרעיונות מיועדים לבדיקה אנושית ידנית ולניסויי שוק מבוקרים בלבד.
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (activeStep < 3) {
            setActiveStep((prev) => (prev + 1) as 2 | 3);
          } else {
            onSubmit();
          }
        }}
        className="space-y-8"
      >
        {/* STEP 1: Profession & Domain */}
        {activeStep === 1 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                1. תחום מקצועי עיקרי
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                {[
                  { id: 'marketing', label: 'שיווק ופרסום דיגיטלי' },
                  { id: 'real_estate', label: 'נדל"ן ותיווך' },
                  { id: 'operations', label: 'תפעול, CRM ואוטומציות' },
                  { id: 'legal_accounting', label: 'עו"ד, רו"ח ופיננסים' },
                  { id: 'ecommerce', label: 'איקומרס ומסחר מקוון' },
                  { id: 'dev', label: 'פיתוח תוכנה וטכנולוגיה' },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, professionField: item.id })}
                    className={`p-3 text-right text-xs font-medium rounded-lg border transition-colors ${
                      formData.professionField === item.id
                        ? 'bg-indigo-50/70 border-indigo-600 text-indigo-950 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                פירוט נוסף או תחום מותאם אישית
              </label>
              <input
                type="text"
                value={formData.customField || ''}
                onChange={(e) => setFormData({ ...formData, customField: e.target.value })}
                placeholder="לדוגמה: יועץ משפכי מכירות לקורסים דיגיטליים, מנהל משרד תיווך..."
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                2. כישורים שניתן למכור כבר עכשיו (בחר את הרלוונטיים)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {AVAILABLE_SKILLS.map((skill) => {
                  const isSelected = formData.sellableSkills.includes(skill);
                  return (
                    <button
                      key={skill}
                      type="button"
                      onClick={() => toggleSkill(skill)}
                      className={`flex items-center justify-between p-2.5 text-right text-xs rounded-lg border transition-colors ${
                        isSelected
                          ? 'bg-slate-900 border-slate-900 text-white font-medium'
                          : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                      }`}
                    >
                      <span className="truncate">{skill}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 shrink-0 mr-1.5" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: Clients & Pain Points */}
        {activeStep === 2 && (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                3. סוג הלקוחות או הענפים שאתה מכיר מקרוב
              </label>
              <p className="text-xs text-slate-500 mb-2">
                מי הם האנשים שאתה מבין את שגרת יומם או שיש לך דרך להגיע אליהם?
              </p>
              <input
                type="text"
                value={formData.targetClients}
                onChange={(e) => setFormData({ ...formData, targetClients: e.target.value })}
                placeholder="למשל: סוכנויות PPC מקומיות, חנויות שופיפיי בישראל, משרדי רואי חשבון..."
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-1">
                4. תהליכים חוזרים, יקרים או מעיקים שאתה מכיר
              </label>
              <p className="text-xs text-slate-500 mb-2">
                משימות ידניות שגוזלות שעות שבועיות, גורמות לשגיאות או מעכבות תגובה ללקוחות.
              </p>
              <textarea
                rows={3}
                value={formData.recurringProcesses}
                onChange={(e) => setFormData({ ...formData, recurringProcesses: e.target.value })}
                placeholder="למשל: סינון לידים ידני, איסוף קבלות ומסמכים חודשי, יצירת דוחות לקוח שבועיים מקבצי אקסל..."
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                5. רמת הנגישות ללקוחות פוטנציאליים כרגע
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {[
                  {
                    id: 'exists',
                    label: 'קיימת',
                    desc: 'יש לי קשר ישיר ל-3-5 לקוחות שאוכל לשוחח איתם השבוע',
                  },
                  {
                    id: 'partial',
                    label: 'חלקית',
                    desc: 'מכיר אנשים בענף אך אצטרך לפנות אליהם מחדש',
                  },
                  {
                    id: 'none',
                    label: 'אין כרגע',
                    desc: 'אצטרך להתחיל מפנייה קרה (Outreach) או קבוצות מקצועיות',
                  },
                ].map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, clientAccess: item.id as any })}
                    className={`p-3.5 text-right rounded-lg border transition-colors ${
                      formData.clientAccess === item.id
                        ? 'bg-indigo-50/70 border-indigo-600 text-indigo-950 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold mb-1">{item.label}</div>
                    <div className="text-[11px] text-slate-500 leading-normal">{item.desc}</div>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* STEP 3: Resources, Model & Validation */}
        {activeStep === 3 && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  זמן פנוי בשבוע
                </label>
                <select
                  value={formData.weeklyHours}
                  onChange={(e) => setFormData({ ...formData, weeklyHours: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                >
                  <option value="5-10">5–10 שעות בשבוע</option>
                  <option value="10-20">10–20 שעות בשבוע</option>
                  <option value="20+">20+ שעות בשבוע</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  תקציב התחלתי חודשי לכלי AI
                </label>
                <select
                  value={formData.budget}
                  onChange={(e) => setFormData({ ...formData, budget: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                >
                  <option value="0-100">0 – 100 ₪ (בדיקות חינם/מינימום)</option>
                  <option value="100-500">100 – 500 ₪ (מנוי בסיסי וטוקנים)</option>
                  <option value="500-2000">500 – 2,000 ₪ (תשתיות ייעודיות)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1.5">
                  יעד זמן לבדיקת ביקוש
                </label>
                <select
                  value={formData.validationDays}
                  onChange={(e) => setFormData({ ...formData, validationDays: Number(e.target.value) as any })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                >
                  <option value={7}>7 ימים (ניסוי מהיר)</option>
                  <option value={14}>14 ימים (מומלץ ל-MVP)</option>
                  <option value={30}>30 ימים (בדיקת עומק)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-900 mb-2">
                העדפת מודל עסקי
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {[
                  { id: 'retainer', label: 'ריטיינר חודשי', hint: 'שירות שוטף ותחזוקה' },
                  { id: 'one_off_service', label: 'שירות חד־פעמי', hint: 'הקמה ותשלום פרויקטאלי' },
                  { id: 'productized_service', label: 'שירות מוצר מוגדר', hint: 'חבילה סגורה במחיר קבוע' },
                  { id: 'internal_savings', label: 'חיסכון בעסק קיים', hint: 'צמצום עלויות עבודה פנימיות' },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setFormData({ ...formData, businessModel: m.id as any })}
                    className={`p-3 text-right rounded-lg border transition-colors ${
                      formData.businessModel === m.id
                        ? 'bg-indigo-50/70 border-indigo-600 text-indigo-950 font-semibold'
                        : 'bg-white border-slate-200 text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold">{m.label}</div>
                    <div className="text-[11px] text-slate-500 mt-0.5">{m.hint}</div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  תחומים שיש להימנע מהם (אופציונלי)
                </label>
                <input
                  type="text"
                  value={formData.excludedAreas || ''}
                  onChange={(e) => setFormData({ ...formData, excludedAreas: e.target.value })}
                  placeholder="למשל: ייעוץ רפואי, ספאם לא מבוקר, פיננסים..."
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-900 mb-1">
                  רמת רגישות למידע
                </label>
                <select
                  value={formData.dataSensitivity}
                  onChange={(e) => setFormData({ ...formData, dataSensitivity: e.target.value as any })}
                  className="w-full px-3 py-2 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                >
                  <option value="standard">סטנדרטית (פרטי קשר, תיאומים, נתונים עסקיים פומביים)</option>
                  <option value="sensitive">רגישה (מסמכים משפטיים, רפואיים, הנהלת חשבונות - דורש אבטחה מוגברת)</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Footer Controls */}
        <div className="flex items-center justify-between border-t border-slate-200 pt-6">
          <div className="flex items-center gap-2">
            {activeStep > 1 && (
              <button
                type="button"
                onClick={() => setActiveStep((prev) => (prev - 1) as 1 | 2)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
              >
                חזרה לשלב קודם
              </button>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-slate-500 hover:text-slate-800 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              איפוס שדות
            </button>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center gap-2 px-6 py-2.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>מנתח ומפיק רעיונות...</span>
              </>
            ) : activeStep < 3 ? (
              <>
                <span>המשך לשלב הבא</span>
                <ArrowLeft className="w-3.5 h-3.5" />
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                <span>הפק עד 3 רעיונות מותאמים ל-OpenClaw</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
