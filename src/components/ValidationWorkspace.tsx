import React, { useState, useEffect } from 'react';
import { IdeaItem, OutreachPackage, UserProfileInput } from '../types';
import {
  Copy,
  Check,
  MessageSquare,
  Mail,
  HelpCircle,
  FileCheck2,
  Calendar,
  Sparkles,
  Download,
  Share2,
} from 'lucide-react';

interface ValidationWorkspaceProps {
  idea: IdeaItem;
  userProfile: UserProfileInput;
  onBackToIdeas: () => void;
  onOpenExport: () => void;
}

export const ValidationWorkspace: React.FC<ValidationWorkspaceProps> = ({
  idea,
  userProfile,
  onBackToIdeas,
  onOpenExport,
}) => {
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [outreachData, setOutreachData] = useState<OutreachPackage | null>(null);
  const [isLoadingOutreach, setIsLoadingOutreach] = useState(false);

  // Load or fetch outreach package
  useEffect(() => {
    let isMounted = true;
    async function fetchOutreach() {
      setIsLoadingOutreach(true);
      try {
        const res = await fetch('/api/generate-outreach', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idea, userProfile }),
        });
        if (res.ok) {
          const data = await res.json();
          if (isMounted) setOutreachData(data);
        }
      } catch (e) {
        console.warn('Failed to load dynamic outreach:', e);
      } finally {
        if (isMounted) setIsLoadingOutreach(false);
      }
    }

    fetchOutreach();
    return () => {
      isMounted = false;
    };
  }, [idea.id]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const toggleStep = (idx: number) => {
    setCompletedSteps((prev) =>
      prev.includes(idx) ? prev.filter((i) => i !== idx) : [...prev, idx]
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      {/* Top Bar Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <button
              onClick={onBackToIdeas}
              className="hover:text-indigo-600 transition-colors"
            >
              רעיונות
            </button>
            <span>/</span>
            <span>תוכנית אימות ופיילוט מעשית</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            תוכנית אימות ל-14 יום: {idea.title}
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            כלים, תסריטי פנייה ושאלות ראיון לבדיקת נכונות לשלם לפני בניית מערכת מלאה.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenExport}
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5" />
            ייצוא ל-Markdown
          </button>
          <button
            onClick={onBackToIdeas}
            className="px-4 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            חזרה לכל הרעיונות
          </button>
        </div>
      </div>

      {/* Progress & Target Card */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 mb-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <div className="text-xs font-bold text-slate-900 mb-1">יעד האימות המוגדר:</div>
            <div className="text-sm font-semibold text-slate-800 leading-relaxed">
              {idea.demandExperiment?.targetMetric}
            </div>
          </div>
          <div className="text-xs text-slate-500 text-left sm:text-right">
            זמן בדיקה: <span className="font-bold text-slate-900 tabular-nums">{idea.demandExperiment?.timeframeDays} ימים</span>
          </div>
        </div>

        {/* Step-by-Step Checklist */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          <div className="text-xs font-semibold text-slate-700 mb-2">צעדי הניסוי לביצוע:</div>
          {idea.demandExperiment?.steps?.map((step, idx) => {
            const isDone = completedSteps.includes(idx);
            return (
              <label
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-lg border transition-colors cursor-pointer text-xs ${
                  isDone
                    ? 'bg-slate-50 border-slate-200 text-slate-500 line-through'
                    : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300'
                }`}
              >
                <input
                  type="checkbox"
                  checked={isDone}
                  onChange={() => toggleStep(idx)}
                  className="mt-0.5 rounded text-slate-900 focus:ring-0"
                />
                <span className="leading-relaxed font-medium">{step}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Grid of Outreach & Interview Assets */}
      <div className="space-y-8">
        {/* Asset 1: WhatsApp / LinkedIn Message */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <MessageSquare className="w-4 h-4 text-emerald-600" />
              <span>הודעת פנייה אישית (WhatsApp / LinkedIn)</span>
            </div>
            {outreachData?.whatsappMessage && (
              <button
                onClick={() => copyToClipboard(outreachData.whatsappMessage, 'wa')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
              >
                {copiedKey === 'wa' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>הועתק ללוח</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>העתק נוסח</span>
                  </>
                )}
              </button>
            )}
          </div>
          <p className="text-xs text-slate-500 mb-3">
            פנייה ישירה ומכבדת ללא ספאם. המטרה אינה מכירה מיידית אלא פתיחת שיחת גישוש קצרה.
          </p>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-line">
            {outreachData?.whatsappMessage || 'טוען נוסח מותאם...'}
          </div>
        </div>

        {/* Asset 2: Cold Email */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <Mail className="w-4 h-4 text-indigo-600" />
              <span>תבנית אימייל ממוקד למנהל עסק</span>
            </div>
            {outreachData?.coldEmail && (
              <button
                onClick={() => copyToClipboard(outreachData.coldEmail, 'email')}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
              >
                {copiedKey === 'email' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>הועתק ללוח</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>העתק נוסח</span>
                  </>
                )}
              </button>
            )}
          </div>
          <div className="bg-slate-50 p-4 rounded-lg border border-slate-200 text-xs text-slate-800 leading-relaxed font-sans whitespace-pre-line">
            {outreachData?.coldEmail || 'טוען נוסח אימייל...'}
          </div>
        </div>

        {/* Asset 3: Customer Discovery Interview Script */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <HelpCircle className="w-4 h-4 text-slate-700" />
              <span>5 שאלות מפתח לראיון גילוי לקוח (Customer Discovery)</span>
            </div>
          </div>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            שאלות אלו מאפשרות לברר אם הכאב בוער ואם יש נכונות לשלם בלי להישמע כמו סוכן מכירות לוחץ.
          </p>
          <ol className="list-decimal list-inside space-y-2.5 text-xs text-slate-800">
            {outreachData?.interviewQuestions?.map((q, idx) => (
              <li key={idx} className="p-2.5 bg-slate-50 rounded border border-slate-200/70 font-medium leading-relaxed">
                {q}
              </li>
            ))}
          </ol>
        </div>

        {/* Asset 4: 1-Page Pilot Proposal */}
        <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
              <FileCheck2 className="w-4 h-4 text-indigo-700" />
              <span>תבנית הצעת פיילוט ממוקדת (Pilot Agreement Draft)</span>
            </div>
            {outreachData?.pilotProposal && (
              <button
                onClick={() =>
                  copyToClipboard(
                    `הצעת פיילוט: ${idea.title}\nמטרה: ${outreachData.pilotProposal.objective}\nתכולה: ${outreachData.pilotProposal.scope}\nבקרת אנוש: ${outreachData.pilotProposal.humanOversight}\nמחיר פיילוט: ${outreachData.pilotProposal.pilotPrice}`,
                    'pilot'
                  )
                }
                className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
              >
                {copiedKey === 'pilot' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>הועתק ללוח</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>העתק הצעה</span>
                  </>
                )}
              </button>
            )}
          </div>

          <div className="bg-slate-50 p-5 rounded-lg border border-slate-200 text-xs space-y-3 text-slate-800">
            <div>
              <span className="font-bold text-slate-900 block mb-0.5">מטרת הניסוי:</span>
              <p className="text-slate-700">{outreachData?.pilotProposal?.objective}</p>
            </div>
            <div className="pt-2 border-t border-slate-200/70">
              <span className="font-bold text-slate-900 block mb-0.5">תכולת העבודה בפיילוט:</span>
              <p className="text-slate-700">{outreachData?.pilotProposal?.scope}</p>
            </div>
            <div className="pt-2 border-t border-slate-200/70">
              <span className="font-bold text-amber-900 block mb-0.5">סעיף בקרת אנוש מחייב:</span>
              <p className="text-amber-900">{outreachData?.pilotProposal?.humanOversight}</p>
            </div>
            <div className="pt-2 border-t border-slate-200/70">
              <span className="font-bold text-slate-900 block mb-0.5">תמחור מוסכם לתקופת הניסיון:</span>
              <p className="text-slate-800 font-semibold tabular-nums">{outreachData?.pilotProposal?.pilotPrice}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
