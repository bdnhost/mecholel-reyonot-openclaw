import React from 'react';
import { IdeaItem } from '../types';
import {
  Users,
  AlertCircle,
  Briefcase,
  Cpu,
  UserCheck,
  Target,
  DollarSign,
  Calculator,
  ShieldCheck,
  HelpCircle,
  Compass,
  FileText,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface IdeaCardProps {
  idea: IdeaItem;
  isSelected: boolean;
  onSelect: () => void;
  onOpenValidation: () => void;
  onUpdateFeedback: (
    ideaId: string,
    feedback: {
      relevance?: 'relevant' | 'not_relevant' | null;
      testedWithClient?: 'tested' | 'not_tested' | null;
      notes?: string;
    }
  ) => void;
}

export const IdeaCard: React.FC<IdeaCardProps> = ({
  idea,
  isSelected,
  onSelect,
  onOpenValidation,
  onUpdateFeedback,
}) => {
  return (
    <article
      className={`bg-white border rounded-xl p-6 sm:p-8 transition-all shadow-xs ${
        isSelected
          ? 'border-indigo-600 ring-1 ring-indigo-600/20'
          : 'border-slate-200 hover:border-slate-300'
      }`}
    >
      {/* 1. Header: Name & 1-Line Proposition */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1.5">
            <span>רמת ביטחון: {idea.confidence?.level || 'בינונית'}</span>
            <span aria-hidden="true">·</span>
            <span>ציון משוקלל: {idea.scores?.weightedTotal?.toFixed(1) || '4.2'} / 5.0</span>
            <span aria-hidden="true">·</span>
            <span>אימות ב-{idea.demandExperiment?.timeframeDays || 14} יום</span>
          </div>

          <h3 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight leading-snug">
            {idea.title}
          </h3>

          <p className="text-sm text-slate-600 mt-2 font-medium leading-relaxed">
            {idea.oneLineValue}
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onOpenValidation}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors whitespace-nowrap shadow-xs"
          >
            פתח ערכת אימות ופיילוט
          </button>
        </div>
      </div>

      {/* Grid of Sections */}
      <div className="space-y-6 text-right">
        {/* Row 1: Target Customer & Paid Pain Point */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 2. Target Customer */}
          <div className="bg-slate-50/80 border border-slate-200/70 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2">
              <Users className="w-4 h-4 text-slate-700" />
              <span>2. לקוח יעד ורוכש</span>
            </div>
            <div className="text-xs text-slate-700 space-y-1">
              <p><span className="font-semibold text-slate-900">מי משלם: </span>{idea.targetCustomer?.whoPays}</p>
              <p><span className="font-semibold text-slate-900">סוג עסק: </span>{idea.targetCustomer?.businessType}</p>
              <p><span className="font-semibold text-slate-900">תפקיד: </span>{idea.targetCustomer?.role}</p>
            </div>
          </div>

          {/* 3. Paid Pain Point */}
          <div className="bg-slate-50/80 border border-slate-200/70 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2">
              <AlertCircle className="w-4 h-4 text-slate-700" />
              <span>3. בעיה בתשלום וחיכוך נוכחי</span>
            </div>
            <div className="text-xs text-slate-700 space-y-1.5 leading-relaxed">
              <p><span className="font-semibold text-slate-900">מה הלקוח עושה כיום: </span>{idea.painPoint?.currentAction}</p>
              <p><span className="font-semibold text-slate-900">עלות ונזק: </span>{idea.painPoint?.costAndFriction}</p>
            </div>
          </div>
        </div>

        {/* 4. Initial Offer */}
        <div className="bg-indigo-50/40 border border-indigo-100 rounded-lg p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-indigo-950 mb-1.5">
            <Briefcase className="w-4 h-4 text-indigo-700" />
            <span>4. הצעה ראשונית (Productized Service) ללא בניית מוצר מלא מראש</span>
          </div>
          <p className="text-xs text-indigo-900 leading-relaxed font-medium">
            {idea.initialOffer}
          </p>
        </div>

        {/* Row 2: OpenClaw Role & Human-in-the-Loop */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 5. OpenClaw Role */}
          <div className="bg-slate-50/80 border border-slate-200/70 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2">
              <Cpu className="w-4 h-4 text-slate-700" />
              <span>5. תפקיד OpenClaw ואינטגרציות</span>
            </div>
            <div className="space-y-2 text-xs text-slate-700">
              <div>
                <span className="font-semibold text-slate-900 block mb-1">צעדים אוטומטיים:</span>
                <ul className="list-disc list-inside space-y-1 text-slate-600">
                  {idea.openClawRole?.automatedSteps?.map((step, idx) => (
                    <li key={idx} className="leading-relaxed">{step}</li>
                  ))}
                </ul>
              </div>
              <div className="pt-1 border-t border-slate-200/60">
                <span className="font-semibold text-slate-900">אינטגרציות מומלצות: </span>
                <span className="text-slate-600">{idea.openClawRole?.suggestedIntegrations?.join(' · ')}</span>
              </div>
            </div>
          </div>

          {/* 6. Human in the Loop */}
          <div className="bg-amber-50/50 border border-amber-200/80 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-amber-950 mb-2">
              <UserCheck className="w-4 h-4 text-amber-800" />
              <span>6. נקודות אישור אנושי חובה (Human-in-the-loop)</span>
            </div>
            <p className="text-[11px] text-amber-800 mb-2">
              שלבים שבהם מפעיל אנושי חייב לבדוק או לאשר לפני שליחה או שינוי נתונים:
            </p>
            <ul className="list-disc list-inside space-y-1.5 text-xs text-amber-900 leading-relaxed">
              {idea.humanInTheLoop?.map((item, idx) => (
                <li key={idx} className="font-medium">{item}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* Row 3: Demand Validation Experiment & Pricing Hypothesis */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 7. Demand Experiment */}
          <div className="bg-slate-50/80 border border-slate-200/70 rounded-lg p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                <Target className="w-4 h-4 text-slate-700" />
                <span>7. ניסוי ביקוש מעשי</span>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                {idea.demandExperiment?.timeframeDays} ימים
              </span>
            </div>
            <div className="mb-2 text-xs">
              <span className="font-semibold text-slate-900">יעד מספרי ברור: </span>
              <span className="text-slate-700">{idea.demandExperiment?.targetMetric}</span>
            </div>
            <ol className="list-decimal list-inside space-y-1 text-xs text-slate-600 leading-relaxed">
              {idea.demandExperiment?.steps?.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ol>
          </div>

          {/* 8. Pricing Hypothesis */}
          <div className="bg-slate-50/80 border border-slate-200/70 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2">
              <DollarSign className="w-4 h-4 text-slate-700" />
              <span>8. תמחור לבדיקה (השערה בלבד)</span>
            </div>
            <div className="text-base font-bold text-slate-900 tabular-nums mb-1">
              {idea.pricingHypothesis?.range}
            </div>
            <p className="text-xs text-slate-600 mb-2 leading-relaxed">
              <span className="font-semibold text-slate-900">גורמים משפיעים: </span>
              {idea.pricingHypothesis?.drivers}
            </p>
            <div className="text-[11px] text-amber-700 bg-amber-50 px-2.5 py-1.5 rounded border border-amber-200/60 font-medium">
              שימו לב: {idea.pricingHypothesis?.disclaimer}
            </div>
          </div>
        </div>

        {/* 9. Transparent Economic Breakdown */}
        <div className="bg-slate-50 border border-slate-200 rounded-lg p-5">
          <div className="flex items-center justify-between border-b border-slate-200/80 pb-3 mb-3">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
              <Calculator className="w-4 h-4 text-slate-700" />
              <span>9. אומדן כלכלי שקוף והפרדת עלויות</span>
            </div>
            <span className="text-[11px] font-medium text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded">
              סטטוס נתון: {idea.economicEstimate?.statusLabel}
            </span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs mb-3">
            <div className="bg-white p-3 rounded border border-slate-200">
              <span className="text-slate-500 block text-[11px]">אומדן הכנסה ראשונית:</span>
              <span className="font-bold text-slate-900 tabular-nums text-sm">
                {idea.economicEstimate?.potentialRevenue}
              </span>
            </div>
            <div className="bg-white p-3 rounded border border-slate-200">
              <span className="text-slate-500 block text-[11px]">עלויות ישירות (טוקנים/LLM):</span>
              <span className="font-medium text-slate-800 tabular-nums text-sm">
                {idea.economicEstimate?.directCosts}
              </span>
            </div>
            <div className="bg-white p-3 rounded border border-slate-200">
              <span className="text-slate-500 block text-[11px]">שעות עבודה אנושיות:</span>
              <span className="font-medium text-slate-800 tabular-nums text-sm">
                {idea.economicEstimate?.laborHours}
              </span>
            </div>
            <div className="bg-white p-3 rounded border border-slate-200">
              <span className="text-slate-500 block text-[11px]">פלטפורמות ואירוח:</span>
              <span className="font-medium text-slate-800 tabular-nums text-sm">
                {idea.economicEstimate?.platformFees}
              </span>
            </div>
          </div>

          <p className="text-xs text-slate-600 bg-white/70 p-2.5 rounded border border-slate-200/60 leading-relaxed">
            <span className="font-semibold text-slate-900">חישוב שקוף: </span>
            {idea.economicEstimate?.netMarginNote}
          </p>
        </div>

        {/* 10. Success & Stop Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-slate-50/80 border border-slate-200/70 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 mb-2">
              <CheckCircle className="w-4 h-4 text-emerald-600" />
              <span>אותות הצלחה וביקוש (Green Light)</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 leading-relaxed">
              {idea.successAndStopMetrics?.successSignals?.map((sig, idx) => (
                <li key={idx}>{sig}</li>
              ))}
            </ul>
          </div>

          <div className="bg-slate-50/80 border border-slate-200/70 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-rose-800 mb-2">
              <XCircle className="w-4 h-4 text-rose-600" />
              <span>סימני עצירה או פיבוט (Stop / Pivot)</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-xs text-slate-700 leading-relaxed">
              {idea.successAndStopMetrics?.stopOrPivotSignals?.map((sig, idx) => (
                <li key={idx}>{sig}</li>
              ))}
            </ul>
          </div>
        </div>

        {/* 11 & 12. Security, Privacy & Confidence */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Security & Privacy */}
          <div className="bg-slate-50/80 border border-slate-200/70 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2">
              <ShieldCheck className="w-4 h-4 text-slate-700" />
              <span>11. אבטחה, פרטיות ותלות</span>
            </div>
            <div className="text-xs text-slate-700 space-y-1 leading-relaxed">
              <p><span className="font-semibold text-slate-900">הרשאות: </span>{idea.securityAndRisks?.permissionsRisk}</p>
              <p><span className="font-semibold text-slate-900">פרטיות: </span>{idea.securityAndRisks?.privacyNotes}</p>
              <p><span className="font-semibold text-slate-900">תלות: </span>{idea.securityAndRisks?.platformDependency}</p>
              <p><span className="font-semibold text-slate-900">הזיות מודל: </span>{idea.securityAndRisks?.hallucinationRisk}</p>
            </div>
          </div>

          {/* Confidence */}
          <div className="bg-slate-50/80 border border-slate-200/70 rounded-lg p-4">
            <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2">
              <Compass className="w-4 h-4 text-slate-700" />
              <span>12. רמת ביטחון וסיבה</span>
            </div>
            <div className="text-xs text-slate-700 space-y-1.5 leading-relaxed">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">רמה: </span>
                <span className="font-bold text-slate-900">{idea.confidence?.level}</span>
              </div>
              <p><span className="font-semibold text-slate-900">נימוק: </span>{idea.confidence?.reason}</p>
              <p className="text-[11px] text-slate-500 italic mt-1">
                * ציון הביטחון אינו מבטא חיזוי הצלחה אלא רמת ודאות של קיומו של כאב שוק מוכח.
              </p>
            </div>
          </div>
        </div>

        {/* Feedback Section per PRD Section 10 */}
        <div className="border-t border-slate-200 pt-5 mt-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="text-xs font-semibold text-slate-800">
              משוב ומעקב ניסוי מקומי:
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {/* Relevance toggle */}
              <button
                type="button"
                onClick={() =>
                  onUpdateFeedback(idea.id, {
                    relevance: idea.userFeedback?.relevance === 'relevant' ? null : 'relevant',
                  })
                }
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition-colors ${
                  idea.userFeedback?.relevance === 'relevant'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ThumbsUp className="w-3 h-3" />
                <span>רלוונטי</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateFeedback(idea.id, {
                    relevance: idea.userFeedback?.relevance === 'not_relevant' ? null : 'not_relevant',
                  })
                }
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition-colors ${
                  idea.userFeedback?.relevance === 'not_relevant'
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <ThumbsDown className="w-3 h-3" />
                <span>לא רלוונטי</span>
              </button>

              <span className="text-slate-300">|</span>

              {/* Client tested toggle */}
              <button
                type="button"
                onClick={() =>
                  onUpdateFeedback(idea.id, {
                    testedWithClient: idea.userFeedback?.testedWithClient === 'tested' ? null : 'tested',
                  })
                }
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition-colors ${
                  idea.userFeedback?.testedWithClient === 'tested'
                    ? 'bg-emerald-800 text-white border-emerald-800'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <CheckCircle className="w-3 h-3" />
                <span>בדקתי מול לקוח</span>
              </button>
              <button
                type="button"
                onClick={() =>
                  onUpdateFeedback(idea.id, {
                    testedWithClient: idea.userFeedback?.testedWithClient === 'not_tested' ? null : 'not_tested',
                  })
                }
                className={`inline-flex items-center gap-1 px-2.5 py-1 text-xs rounded border transition-colors ${
                  idea.userFeedback?.testedWithClient === 'not_tested'
                    ? 'bg-slate-800 text-white border-slate-800'
                    : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                }`}
              >
                <span>לא בדקתי</span>
              </button>
            </div>
          </div>

          {/* Notes input */}
          <div className="mt-3">
            <input
              type="text"
              value={idea.userFeedback?.notes || ''}
              onChange={(e) => onUpdateFeedback(idea.id, { notes: e.target.value })}
              placeholder="הערות אישיות (תגובת לקוח ראשונה, התנגדויות שנשמעו, מחיר שהוצע)..."
              className="w-full px-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>
    </article>
  );
};
