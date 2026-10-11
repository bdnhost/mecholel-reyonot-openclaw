import React, { useState } from 'react';
import { IdeaItem, UserProfileInput } from '../types';
import { X, Copy, Check, Download, FileText } from 'lucide-react';

interface ExportModalProps {
  idea: IdeaItem | null;
  allIdeas: IdeaItem[];
  userProfile: UserProfileInput;
  isOpen: boolean;
  onClose: () => void;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  idea,
  allIdeas,
  userProfile,
  isOpen,
  onClose,
}) => {
  const [exportMode, setExportMode] = useState<'single' | 'all'>('single');
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const currentIdea = idea || allIdeas[0];

  const generateMarkdown = () => {
    const formatSingle = (i: IdeaItem) => `
# ${i.title}
**הצעת ערך:** ${i.oneLineValue}
**סטטוס:** השערה לבדיקת שוק (ללא התחייבות לנתוני הכנסה מובטחים)
**ביטחון כאב שוק:** ${i.confidence?.level} (${i.confidence?.reason})

---

## 1. לקוח יעד ורוכש
- **מי משלם:** ${i.targetCustomer?.whoPays}
- **סוג עסק:** ${i.targetCustomer?.businessType}
- **תפקיד מקבל החלטה:** ${i.targetCustomer?.role}

## 2. בעיה בתשלום וחיכוך קיים
- **מה הלקוח עושה כיום:** ${i.painPoint?.currentAction}
- **עלות ונזק שנובעים מהבעיה:** ${i.painPoint?.costAndFriction}

## 3. הצעה ראשונית (Productized Service)
${i.initialOffer}

## 4. תפקיד OpenClaw ואינטגרציות
### צעדים אוטומטיים:
${i.openClawRole?.automatedSteps?.map((s) => `- ${s}`).join('\n')}

### אינטגרציות:
${i.openClawRole?.suggestedIntegrations?.join(' · ')}

## 5. בקרת אנוש חובה (Human-in-the-Loop)
${i.humanInTheLoop?.map((h) => `- ${h}`).join('\n')}

## 6. ניסוי ביקוש מעשי (יעד: ${i.demandExperiment?.timeframeDays} ימים)
**יעד מספרי:** ${i.demandExperiment?.targetMetric}
${i.demandExperiment?.steps?.map((step, idx) => `${idx + 1}. ${step}`).join('\n')}

## 7. תמחור לבדיקה (השערה בלבד)
- **טווח משוער:** ${i.pricingHypothesis?.range}
- **גורמים משפיעים:** ${i.pricingHypothesis?.drivers}
- **הערה שקופה:** ${i.pricingHypothesis?.disclaimer}

## 8. אומדן כלכלי שקוף
- **אומדן הכנסה:** ${i.economicEstimate?.potentialRevenue}
- **עלויות ישירות (טוקנים/LLM):** ${i.economicEstimate?.directCosts}
- **זמן עבודה אנושי:** ${i.economicEstimate?.laborHours}
- **פלטפורמות ואירוח:** ${i.economicEstimate?.platformFees}
- **חישוב שקוף:** ${i.economicEstimate?.netMarginNote}
- **סיווג נתון:** [${i.economicEstimate?.statusLabel}]

## 9. מדדי הצלחה ועצירה
### אותות הצלחה (Green Light):
${i.successAndStopMetrics?.successSignals?.map((s) => `- ${s}`).join('\n')}

### אותות עצירה או פיבוט:
${i.successAndStopMetrics?.stopOrPivotSignals?.map((s) => `- ${s}`).join('\n')}

## 10. אבטחה, פרטיות ותלות
- **הרשאות:** ${i.securityAndRisks?.permissionsRisk}
- **פרטיות:** ${i.securityAndRisks?.privacyNotes}
- **תלות טכנולוגית:** ${i.securityAndRisks?.platformDependency}
- **סיכון הזיות מודל:** ${i.securityAndRisks?.hallucinationRisk}

---
*נוצר באמצעות מחולל רעיונות OpenClaw לפי עקרונות ה-PRD לאימות שירותי AI מבוקרים.*
`;

    if (exportMode === 'single' && currentIdea) {
      return formatSingle(currentIdea).trim();
    }

    return (
      `# תיק רעיונות ותוכניות אימות OpenClaw\n` +
      `**תאריך יצירה:** ${new Date().toLocaleDateString('he-IL')}\n\n` +
      allIdeas.map((i, idx) => `## רעיון 0${idx + 1}: ${i.title}\n` + formatSingle(i)).join('\n\n---\n\n')
    ).trim();
  };

  const markdownContent = generateMarkdown();

  const handleCopy = () => {
    navigator.clipboard.writeText(markdownContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([markdownContent], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `openclaw-idea-${currentIdea ? currentIdea.id : 'all'}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-xl max-w-2xl w-full border border-slate-200 shadow-xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-700" />
            <h3 className="text-base font-bold text-slate-900">
              ייצוא תוכנית כ-Markdown
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Toggle Mode */}
        <div className="px-4 pt-3 flex items-center gap-2">
          <button
            onClick={() => setExportMode('single')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              exportMode === 'single'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            הרעיון הנבחר בלבד ({currentIdea?.title || 'רעיון'})
          </button>
          <button
            onClick={() => setExportMode('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
              exportMode === 'all'
                ? 'bg-slate-900 text-white border-slate-900'
                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
            }`}
          >
            כל 3 הרעיונות המלאים
          </button>
        </div>

        {/* Preview Area */}
        <div className="p-4 flex-1 overflow-y-auto">
          <pre className="bg-slate-50 border border-slate-200 p-4 rounded-lg text-xs font-mono text-slate-800 whitespace-pre-wrap leading-relaxed max-h-96 overflow-y-auto text-right dir-rtl">
            {markdownContent}
          </pre>
        </div>

        {/* Actions Footer */}
        <div className="p-4 border-t border-slate-200 flex items-center justify-between bg-slate-50/50">
          <span className="text-xs text-slate-500">
            מתאים לשימוש במסמכי עבודה, Notion או קבצי קוד.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span>הועתק ללוח</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>העתק ללוח</span>
                </>
              )}
            </button>
            <button
              onClick={handleDownload}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>הורד קובץ .md</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
