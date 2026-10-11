import React from 'react';
import { IdeaItem } from '../types';
import { CheckCircle2, AlertTriangle, ArrowRight, ArrowLeft } from 'lucide-react';

interface ComparisonMatrixProps {
  ideas: IdeaItem[];
  selectedIdeaId: string;
  onSelectIdea: (id: string) => void;
  onGoToDetail: (id: string) => void;
}

export const ComparisonMatrix: React.FC<ComparisonMatrixProps> = ({
  ideas,
  selectedIdeaId,
  onSelectIdea,
  onGoToDetail,
}) => {
  if (!ideas || ideas.length === 0) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <p className="text-slate-500 text-sm">אין עדיין רעיונות להשוואה. מלא את שאלון ההתאמה תחילה.</p>
      </div>
    );
  }

  const dimensions = [
    { key: 'userSkillsFit', label: 'התאמה לכישורים', weight: '20%' },
    { key: 'buyerAccess', label: 'נגישות לקונים וערוץ מכירה', weight: '20%' },
    { key: 'problemUrgency', label: 'דחיפות הבעיה ונכונות תשלום', weight: '20%' },
    { key: 'fastValidation', label: 'מהירות אימות ביקוש', weight: '15%' },
    { key: 'techFeasibility', label: 'היתכנות OpenClaw ובקרת אנוש', weight: '10%' },
    { key: 'initialCostsRisk', label: 'עלויות וסיכונים ראשוניים', weight: '10%' },
    { key: 'dataRisk', label: 'בטיחות מידע והרשאות', weight: '5%' },
  ] as const;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
              השוואת 3 הרעיונות לפי 7 ממדי ה-PRD
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              שקלול משוקלל (0 עד 5) עם הסבר מפורט לכל קריטריון, המפריד בין התאמה אישית, מהירות בדיקה וסיכוני ביצוע.
            </p>
          </div>
        </div>
      </div>

      {/* Grid Comparison Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-right border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="p-4 text-xs font-semibold text-slate-600 w-1/4">
                  קריטריון שקלול
                </th>
                {ideas.map((idea, idx) => (
                  <th
                    key={idea.id}
                    className={`p-4 text-xs font-bold text-slate-900 w-1/4 ${
                      selectedIdeaId === idea.id ? 'bg-indigo-50/50' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] font-mono text-slate-400">0{idx + 1}.</span>
                      <span className="text-[11px] text-slate-500 font-normal">
                        ביטחון: {idea.confidence?.level || 'בינונית'}
                      </span>
                    </div>
                    <div className="text-sm font-bold text-slate-900 line-clamp-2">
                      {idea.title}
                    </div>
                    <div className="text-[11px] font-normal text-slate-500 mt-1 line-clamp-1">
                      {idea.targetCustomer?.role} · {idea.targetCustomer?.businessType}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {/* Overall Score */}
              <tr className="bg-slate-50/70 font-semibold">
                <td className="p-4 text-slate-900 font-bold">
                  ציון משוקלל סופי
                  <span className="block text-[11px] font-normal text-slate-500">
                    מבוסס על שבעת הממדים
                  </span>
                </td>
                {ideas.map((idea) => (
                  <td
                    key={idea.id}
                    className={`p-4 tabular-nums ${
                      selectedIdeaId === idea.id ? 'bg-indigo-50/60' : ''
                    }`}
                  >
                    <div className="text-lg font-bold text-slate-900 font-mono">
                      {idea.scores?.weightedTotal?.toFixed(1) || '4.0'}
                      <span className="text-xs text-slate-400 font-normal font-sans"> / 5.0</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Economic Summary Row */}
              <tr>
                <td className="p-4 text-slate-700">
                  <span className="font-semibold block text-slate-900">תמחור השערה לבדיקה</span>
                  <span className="text-[11px] text-slate-500">הנחה ראשונית לבדיקת נכונות</span>
                </td>
                {ideas.map((idea) => (
                  <td
                    key={idea.id}
                    className={`p-4 ${selectedIdeaId === idea.id ? 'bg-indigo-50/30' : ''}`}
                  >
                    <div className="font-semibold text-slate-900 tabular-nums">
                      {idea.pricingHypothesis?.range}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {idea.pricingHypothesis?.drivers}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Fast Validation Target */}
              <tr>
                <td className="p-4 text-slate-700">
                  <span className="font-semibold block text-slate-900">יעד ניסוי הביקוש</span>
                  <span className="text-[11px] text-slate-500">בתוך 7–14 ימים</span>
                </td>
                {ideas.map((idea) => (
                  <td
                    key={idea.id}
                    className={`p-4 ${selectedIdeaId === idea.id ? 'bg-indigo-50/30' : ''}`}
                  >
                    <div className="text-slate-800 leading-relaxed">
                      {idea.demandExperiment?.targetMetric}
                    </div>
                  </td>
                ))}
              </tr>

              {/* Human-in-the-loop */}
              <tr>
                <td className="p-4 text-slate-700">
                  <span className="font-semibold block text-slate-900">אישור אנושי חובה</span>
                  <span className="text-[11px] text-slate-500">נקודת ביקורת לפני פעולה</span>
                </td>
                {ideas.map((idea) => (
                  <td
                    key={idea.id}
                    className={`p-4 ${selectedIdeaId === idea.id ? 'bg-indigo-50/30' : ''}`}
                  >
                    <ul className="list-disc list-inside space-y-1 text-slate-600">
                      {idea.humanInTheLoop?.slice(0, 2).map((h, i) => (
                        <li key={i} className="line-clamp-2">{h}</li>
                      ))}
                    </ul>
                  </td>
                ))}
              </tr>

              {/* Dimension scores breakdown */}
              {dimensions.map(({ key, label, weight }) => (
                <tr key={key} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-4 text-slate-700">
                    <div className="font-medium text-slate-900">{label}</div>
                    <div className="text-[11px] text-slate-400">משקל: {weight}</div>
                  </td>
                  {ideas.map((idea) => {
                    const dim = (idea.scores as any)?.[key];
                    return (
                      <td
                        key={idea.id}
                        className={`p-4 ${selectedIdeaId === idea.id ? 'bg-indigo-50/30' : ''}`}
                      >
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-mono font-bold text-slate-900 tabular-nums">
                            {dim?.score ?? '4.0'}
                          </span>
                          <div className="flex-1 bg-slate-100 h-1.5 rounded-full overflow-hidden max-w-[80px]">
                            <div
                              className="bg-slate-800 h-full rounded-full"
                              style={{ width: `${((dim?.score || 4) / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-relaxed">
                          {dim?.explanation || 'מותאם לפרופיל המשתמש'}
                        </p>
                      </td>
                    );
                  })}
                </tr>
              ))}

              {/* Disqualification check row */}
              <tr className="bg-slate-50/30">
                <td className="p-4 text-slate-700">
                  <span className="font-semibold block text-slate-900">כלל פסילה ובטיחות</span>
                  <span className="text-[11px] text-slate-500">בדיקת ספאם, TOS וחוקיות</span>
                </td>
                {ideas.map((idea) => (
                  <td
                    key={idea.id}
                    className={`p-4 ${selectedIdeaId === idea.id ? 'bg-indigo-50/30' : ''}`}
                  >
                    <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-medium">
                      <CheckCircle2 className="w-4 h-4" />
                      <span>עבר בהצלחה — פעילות חוקית ומבוקרת</span>
                    </div>
                  </td>
                ))}
              </tr>

              {/* Action row */}
              <tr className="bg-white">
                <td className="p-4"></td>
                {ideas.map((idea) => (
                  <td
                    key={idea.id}
                    className={`p-4 ${selectedIdeaId === idea.id ? 'bg-indigo-50/40' : ''}`}
                  >
                    <button
                      onClick={() => onGoToDetail(idea.id)}
                      className={`w-full py-2 px-3 text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                        selectedIdeaId === idea.id
                          ? 'bg-slate-900 text-white hover:bg-slate-800'
                          : 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      <span>פתח כרטיס מלא ותוכנית</span>
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
