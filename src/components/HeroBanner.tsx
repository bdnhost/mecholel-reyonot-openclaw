import React from 'react';
import { PRESET_PROFILES, PresetProfile } from '../data/presets';
import { ShieldCheck, ArrowDown, Sparkles } from 'lucide-react';

interface HeroBannerProps {
  onSelectPreset: (preset: PresetProfile) => void;
  onScrollToForm: () => void;
}

export const HeroBanner: React.FC<HeroBannerProps> = ({
  onSelectPreset,
  onScrollToForm,
}) => {
  return (
    <section className="bg-white border-b border-slate-200 py-12 md:py-16">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
        {/* Editorial Subtitle */}
        <p className="text-sm font-semibold tracking-wide text-indigo-700 mb-3">
          מחולל השערות עסקיות לאוטומציית B2B
        </p>

        {/* Hero Headline */}
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-slate-900 mb-5 leading-tight max-w-3xl mx-auto">
          בניית שירותי OpenClaw שיש להם לקוח משלם וכאב אמיתי
        </h1>

        {/* Hero Description */}
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
          במקום רשימות רעיונות כלליות או הבטחות להכנסה פסיבית, המערכת מפיקה 3 הצעות ממוקדות הניתנות לאימות מול לקוחות אמיתיים בתוך 7–14 יום — עם שקיפות כלכלית מלאה והגדרת אישור אנושי חובה.
        </p>

        {/* Core Principles Callout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-4xl mx-auto mb-10 text-right">
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              ללא הבטחות שווא
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              הפרדה מלאה בין הכנסה גולמית, שעות עבודה, עלויות מודל/אירוח והנחות שוק שטרם אומתו.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              אימות מהיר (7–14 יום)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              תוכנית ניסוי קונקרטית לבדיקת נכונות לשלם לפני כתיבת שורת קוד אחת או בניית סוכן מורכב.
            </p>
          </div>
          <div className="bg-slate-50 border border-slate-200/80 rounded-xl p-4">
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              בקרת אנוש (Human-in-the-Loop)
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              הגדרה מפורשת של נקודות הביקורת שבהן אדם חייב לבדוק ולאשר לפני כל שליחה או שינוי נתונים.
            </p>
          </div>
        </div>

        {/* Rapid Preset Selector */}
        <div className="border-t border-slate-200 pt-8">
          <p className="text-xs font-medium text-slate-500 mb-3">
            טעינה מהירה של פרופיל מקצועי לדוגמה:
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {PRESET_PROFILES.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onSelectPreset(preset)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg border border-slate-200/70 transition-colors"
              >
                <span>{preset.name}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500 text-[11px]">{preset.badge}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
