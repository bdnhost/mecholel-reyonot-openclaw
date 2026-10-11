import React from 'react';

interface HeaderProps {
  activeTab: 'questionnaire' | 'ideas' | 'comparison' | 'validation' | 'feedback' | 'openclaw';
  setActiveTab: (tab: 'questionnaire' | 'ideas' | 'comparison' | 'validation' | 'feedback' | 'openclaw') => void;
  hasIdeas: boolean;
  onNewAnalysis: () => void;
  pendingApprovalsCount?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  hasIdeas,
  onNewAnalysis,
  pendingApprovalsCount = 0,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-8 h-16">
          {/* Zone 1: Single text element wordmark */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('questionnaire')}
              className="text-lg font-bold tracking-tight text-slate-900 whitespace-nowrap shrink-0 hover:text-indigo-600 transition-colors text-right"
            >
              מחולל רעיונות OpenClaw
            </button>
          </div>

          {/* Zone 2: clean single-line text navigation links */}
          <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-slate-600">
            <button
              onClick={() => setActiveTab('questionnaire')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
                activeTab === 'questionnaire'
                  ? 'border-indigo-600 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-600'
              }`}
            >
              שאלון התאמה
            </button>
            <button
              onClick={() => setActiveTab('ideas')}
              disabled={!hasIdeas}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                activeTab === 'ideas'
                  ? 'border-indigo-600 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-600'
              }`}
            >
              רעיונות מוצעים
            </button>
            <button
              onClick={() => setActiveTab('comparison')}
              disabled={!hasIdeas}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                activeTab === 'comparison'
                  ? 'border-indigo-600 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-600'
              }`}
            >
              השוואת 3 הרעיונות
            </button>
            <button
              onClick={() => setActiveTab('validation')}
              disabled={!hasIdeas}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 disabled:opacity-40 disabled:cursor-not-allowed ${
                activeTab === 'validation'
                  ? 'border-indigo-600 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-600'
              }`}
            >
              תוכנית אימות ופיילוט
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
                activeTab === 'feedback'
                  ? 'border-indigo-600 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-600'
              }`}
            >
              יומן ניסויים
            </button>
            <button
              onClick={() => setActiveTab('openclaw')}
              className={`flex items-center gap-1.5 hover:text-slate-900 transition-colors whitespace-nowrap shrink-0 pb-1 border-b-2 ${
                activeTab === 'openclaw'
                  ? 'border-indigo-600 text-slate-900 font-semibold'
                  : 'border-transparent text-slate-600'
              }`}
            >
              <span>סנכרון OpenClaw & API</span>
              {pendingApprovalsCount > 0 && (
                <span className="bg-amber-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  {pendingApprovalsCount}
                </span>
              )}
            </button>
          </nav>

          {/* Zone 3: 1 primary action */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onNewAnalysis}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 shadow-sm"
            >
              שאלון חדש
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};
