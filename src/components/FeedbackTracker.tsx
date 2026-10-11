import React from 'react';
import { IdeaItem } from '../types';
import { CheckCircle2, Clock, ThumbsUp, ThumbsDown, MessageSquare, AlertCircle } from 'lucide-react';

interface FeedbackTrackerProps {
  ideas: IdeaItem[];
  onUpdateFeedback: (
    ideaId: string,
    feedback: {
      relevance?: 'relevant' | 'not_relevant' | null;
      testedWithClient?: 'tested' | 'not_tested' | null;
      notes?: string;
    }
  ) => void;
  onSelectIdea: (id: string) => void;
}

export const FeedbackTracker: React.FC<FeedbackTrackerProps> = ({
  ideas,
  onUpdateFeedback,
  onSelectIdea,
}) => {
  // Statistics calculations according to PRD Section 4
  const total = ideas.length;
  const relevantCount = ideas.filter((i) => i.userFeedback?.relevance === 'relevant').length;
  const testedCount = ideas.filter((i) => i.userFeedback?.testedWithClient === 'tested').length;

  const relevanceRate = total > 0 ? Math.round((relevantCount / total) * 100) : 0;
  const testedRate = total > 0 ? Math.round((testedCount / total) * 100) : 0;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
          יומן ניסויים ומעקב משוב
        </h2>
        <p className="text-xs text-slate-500 mt-1">
          תיעוד שיחות לקוח, תגובות מהשטח והתקדמות בדיקת הביקוש בתוך 14 יום.
        </p>
      </div>

      {/* KPI Metrics Strip per PRD Section 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs text-slate-500 mb-1">רעיונות שדורגו כרלוונטיים</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {relevantCount} / {total}
            </span>
            <span className="text-xs font-semibold text-indigo-700 tabular-nums">
              ({relevanceRate}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">יעד ה-MVP: מעל 70%</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs text-slate-500 mb-1">ניסויים שנבדקו מול לקוח אמיתי</div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 tabular-nums">
              {testedCount} / {total}
            </span>
            <span className="text-xs font-semibold text-emerald-700 tabular-nums">
              ({testedRate}%)
            </span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">יעד ה-MVP: מעל 20% בתוך 14 יום</div>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-xs">
          <div className="text-xs text-slate-500 mb-1">סטטוס אימות כללי</div>
          <div className="text-sm font-bold text-slate-800 mt-1">
            {testedCount > 0 ? 'ניסויים פעילים בשטח' : 'טרם בוצעו שיחות לקוח'}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            נשמר מקומית בדפדפן (ללא צורך בהרשמה)
          </div>
        </div>
      </div>

      {/* List of Ideas Feedback */}
      {ideas.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <p className="text-sm text-slate-500">
            טרם הופקו רעיונות. מלא את השאלון כדי להתחיל לעקוב אחר ניסויים.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {ideas.map((idea, idx) => (
            <div
              key={idea.id}
              className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs transition-colors text-right"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-4">
                <div>
                  <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                    <span className="font-mono">רעיון 0{idx + 1}</span>
                    <span>·</span>
                    <span>{idea.targetCustomer?.role} ב-{idea.targetCustomer?.businessType}</span>
                  </div>
                  <h3 className="text-base font-bold text-slate-900">{idea.title}</h3>
                  <p className="text-xs text-slate-600 mt-1">{idea.oneLineValue}</p>
                </div>

                <button
                  onClick={() => onSelectIdea(idea.id)}
                  className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors shrink-0"
                >
                  צפה בתוכנית המלאה
                </button>
              </div>

              {/* Status Toggles */}
              <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-slate-100">
                <span className="text-xs font-medium text-slate-700 ml-2">דירוג:</span>

                <button
                  onClick={() =>
                    onUpdateFeedback(idea.id, {
                      relevance: idea.userFeedback?.relevance === 'relevant' ? null : 'relevant',
                    })
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    idea.userFeedback?.relevance === 'relevant'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <ThumbsUp className="w-3.5 h-3.5" />
                  <span>רלוונטי</span>
                </button>

                <button
                  onClick={() =>
                    onUpdateFeedback(idea.id, {
                      relevance: idea.userFeedback?.relevance === 'not_relevant' ? null : 'not_relevant',
                    })
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    idea.userFeedback?.relevance === 'not_relevant'
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <ThumbsDown className="w-3.5 h-3.5" />
                  <span>לא רלוונטי</span>
                </button>

                <span className="text-slate-300 mx-1">|</span>

                <button
                  onClick={() =>
                    onUpdateFeedback(idea.id, {
                      testedWithClient: idea.userFeedback?.testedWithClient === 'tested' ? null : 'tested',
                    })
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    idea.userFeedback?.testedWithClient === 'tested'
                      ? 'bg-emerald-800 text-white border-emerald-800'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>בדקתי מול לקוח</span>
                </button>

                <button
                  onClick={() =>
                    onUpdateFeedback(idea.id, {
                      testedWithClient: idea.userFeedback?.testedWithClient === 'not_tested' ? null : 'not_tested',
                    })
                  }
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    idea.userFeedback?.testedWithClient === 'not_tested'
                      ? 'bg-slate-800 text-white border-slate-800'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <span>טרם בדקתי</span>
                </button>
              </div>

              {/* Notes */}
              <div className="mt-3">
                <textarea
                  rows={2}
                  value={idea.userFeedback?.notes || ''}
                  onChange={(e) => onUpdateFeedback(idea.id, { notes: e.target.value })}
                  placeholder="יומן שיחה: עם מי דיברת, מה אמרו על המחיר, אילו התנגדויות עלו, והאם סוכם המשך בדיקה?"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
