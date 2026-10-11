import React, { useState, useEffect } from 'react';
import { UserProfileInput, IdeaItem } from './types';
import { PRESET_PROFILES, PresetProfile } from './data/presets';
import { Header } from './components/Header';
import { HeroBanner } from './components/HeroBanner';
import { Questionnaire } from './components/Questionnaire';
import { IdeaCard } from './components/IdeaCard';
import { ComparisonMatrix } from './components/ComparisonMatrix';
import { ValidationWorkspace } from './components/ValidationWorkspace';
import { FeedbackTracker } from './components/FeedbackTracker';
import { ExportModal } from './components/ExportModal';
import { OpenClawSyncConsole } from './components/OpenClawSyncConsole';
import { Sparkles, Download, Layers, CheckCircle2, RotateCcw } from 'lucide-react';

const STORAGE_KEY_IDEAS = 'openclaw_generated_ideas_v1';
const STORAGE_KEY_PROFILE = 'openclaw_user_profile_v1';

export default function App() {
  const [activeTab, setActiveTab] = useState<
    'questionnaire' | 'ideas' | 'comparison' | 'validation' | 'feedback' | 'openclaw'
  >('questionnaire');
  const [pendingApprovalsCount, setPendingApprovalsCount] = useState(0);

  const [userProfile, setUserProfile] = useState<UserProfileInput>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_PROFILE);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return PRESET_PROFILES[0].data;
  });

  const [ideas, setIdeas] = useState<IdeaItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_IDEAS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return [];
  });

  const [selectedIdeaId, setSelectedIdeaId] = useState<string>(() => {
    return ideas[0]?.id || '';
  });

  const [isLoading, setIsLoading] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROFILE, JSON.stringify(userProfile));
    } catch (e) {
      // ignore
    }
  }, [userProfile]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_IDEAS, JSON.stringify(ideas));
    } catch (e) {
      // ignore
    }
  }, [ideas]);

  useEffect(() => {
    if (ideas.length > 0 && (!selectedIdeaId || !ideas.find((i) => i.id === selectedIdeaId))) {
      setSelectedIdeaId(ideas[0].id);
    }
  }, [ideas, selectedIdeaId]);

  const handleSelectPreset = (preset: PresetProfile) => {
    setUserProfile(preset.data);
    const formElement = document.getElementById('questionnaire-form');
    if (formElement) {
      formElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleGenerate = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/generate-ideas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userProfile),
      });

      if (!res.ok) {
        throw new Error('Failed to generate ideas from server');
      }

      const data = await res.json();
      if (data && Array.isArray(data.ideas) && data.ideas.length > 0) {
        setIdeas(data.ideas);
        setSelectedIdeaId(data.ideas[0].id);
        setActiveTab('ideas');
      } else {
        throw new Error('Invalid response structure');
      }
    } catch (err: any) {
      console.error(err);
      setErrorMessage('אירעה שגיאה בעת הפקת הרעיונות. אנא נסה שוב.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateFeedback = (
    ideaId: string,
    feedback: {
      relevance?: 'relevant' | 'not_relevant' | null;
      testedWithClient?: 'tested' | 'not_tested' | null;
      notes?: string;
    }
  ) => {
    setIdeas((prev) =>
      prev.map((i) => {
        if (i.id !== ideaId) return i;
        const currentFeedback = i.userFeedback || {
          relevance: null,
          testedWithClient: null,
          notes: '',
        };
        return {
          ...i,
          userFeedback: {
            ...currentFeedback,
            ...feedback,
            updatedAt: new Date().toISOString(),
          },
        };
      })
    );
  };

  // Fetch pending approvals count for badge
  useEffect(() => {
    const checkApprovals = async () => {
      try {
        const res = await fetch('/api/openclaw/approvals?status=pending');
        if (res.ok) {
          const list = await res.json();
          setPendingApprovalsCount(Array.isArray(list) ? list.length : 0);
        }
      } catch (e) {
        // ignore
      }
    };
    checkApprovals();
    const interval = setInterval(checkApprovals, 10000);
    return () => clearInterval(interval);
  }, [activeTab]);

  const selectedIdea = ideas.find((i) => i.id === selectedIdeaId) || ideas[0] || null;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* 3-Zone Top Bar Contract */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        hasIdeas={ideas.length > 0}
        pendingApprovalsCount={pendingApprovalsCount}
        onNewAnalysis={() => {
          setActiveTab('questionnaire');
          const el = document.getElementById('questionnaire-form');
          if (el) el.scrollIntoView({ behavior: 'smooth' });
        }}
      />

      <main className="flex-1">
        {/* TAB 1: QUESTIONNAIRE */}
        {activeTab === 'questionnaire' && (
          <div>
            <HeroBanner
              onSelectPreset={handleSelectPreset}
              onScrollToForm={() => {
                const el = document.getElementById('questionnaire-form');
                if (el) el.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {errorMessage && (
              <div className="max-w-4xl mx-auto px-4 mt-6">
                <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs font-medium text-right">
                  {errorMessage}
                </div>
              </div>
            )}

            <Questionnaire
              formData={userProfile}
              setFormData={setUserProfile}
              onSubmit={handleGenerate}
              isLoading={isLoading}
            />
          </div>
        )}

        {/* TAB 2: IDEAS DETAILED CARDS */}
        {activeTab === 'ideas' && (
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
            {/* Header info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
              <div>
                <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
                  3 רעיונות ממוקדים לשירותי OpenClaw
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  הצעות בעלות ערך עסקי מוכח, תמחור השערה מבוקר ואישור אנושי מחייב.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setActiveTab('comparison')}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
                >
                  <Layers className="w-3.5 h-3.5" />
                  הצג טבלת השוואה
                </button>
                <button
                  onClick={() => setIsExportOpen(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
                >
                  <Download className="w-3.5 h-3.5" />
                  ייצוא Markdown
                </button>
              </div>
            </div>

            {/* Segmented Idea Selectors */}
            <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
              {ideas.map((idea, idx) => (
                <button
                  key={idea.id}
                  onClick={() => setSelectedIdeaId(idea.id)}
                  className={`px-4 py-2.5 rounded-lg text-xs font-medium border text-right transition-all shrink-0 ${
                    selectedIdeaId === idea.id
                      ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  <span className="font-mono ml-2 opacity-60">0{idx + 1}.</span>
                  <span className="font-semibold">{idea.title}</span>
                  <span className="text-[11px] opacity-75 mr-2">
                    (ציון: {idea.scores?.weightedTotal?.toFixed(1) || '4.0'})
                  </span>
                </button>
              ))}
            </div>

            {/* Selected Card View */}
            {selectedIdea && (
              <IdeaCard
                idea={selectedIdea}
                isSelected={true}
                onSelect={() => {}}
                onOpenValidation={() => setActiveTab('validation')}
                onUpdateFeedback={handleUpdateFeedback}
              />
            )}
          </div>
        )}

        {/* TAB 3: COMPARISON MATRIX */}
        {activeTab === 'comparison' && (
          <ComparisonMatrix
            ideas={ideas}
            selectedIdeaId={selectedIdeaId}
            onSelectIdea={(id) => setSelectedIdeaId(id)}
            onGoToDetail={(id) => {
              setSelectedIdeaId(id);
              setActiveTab('ideas');
            }}
          />
        )}

        {/* TAB 4: VALIDATION WORKSPACE */}
        {activeTab === 'validation' && selectedIdea && (
          <ValidationWorkspace
            idea={selectedIdea}
            userProfile={userProfile}
            onBackToIdeas={() => setActiveTab('ideas')}
            onOpenExport={() => setIsExportOpen(true)}
          />
        )}

        {/* TAB 5: FEEDBACK & DIARY */}
        {activeTab === 'feedback' && (
          <FeedbackTracker
            ideas={ideas}
            onUpdateFeedback={handleUpdateFeedback}
            onSelectIdea={(id) => {
              setSelectedIdeaId(id);
              setActiveTab('ideas');
            }}
          />
        )}

        {/* TAB 6: OPENCLAW INTEGRATION & API CONSOLE */}
        {activeTab === 'openclaw' && (
          <OpenClawSyncConsole
            ideas={ideas}
            selectedIdeaId={selectedIdeaId}
          />
        )}
      </main>

      {/* Export Modal */}
      <ExportModal
        idea={selectedIdea}
        allIdeas={ideas}
        userProfile={userProfile}
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-8 mt-16 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="text-right">
            <span className="font-bold text-slate-900">מחולל רעיונות OpenClaw</span>
            <span className="mx-2">·</span>
            <span>פיתוח שירותי אוטומציה מבוקרים עם בקרת אנוש (Human-in-the-Loop)</span>
          </div>
          <div>
            כל הנתונים הפיננסיים הם השערות בדיקה ראשוניות ואינם מהווים הבטחת הכנסה או רווח.
          </div>
        </div>
      </footer>
    </div>
  );
}
