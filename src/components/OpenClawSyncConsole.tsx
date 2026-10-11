import React, { useState, useEffect } from 'react';
import { IdeaItem } from '../types';
import {
  Cpu,
  Key,
  Copy,
  Check,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldCheck,
  Code,
  Send,
  Download,
  Terminal,
  RefreshCw,
  ExternalLink,
  AlertTriangle,
  Play,
  Layers,
} from 'lucide-react';

interface OpenClawSyncConsoleProps {
  ideas: IdeaItem[];
  selectedIdeaId: string;
}

interface ApprovalItem {
  id: string;
  ideaId: string;
  ideaTitle: string;
  actionType: string;
  title: string;
  recipient: string;
  payload: Record<string, any>;
  humanDecision: 'pending' | 'approved' | 'rejected';
  reviewerNotes?: string;
  createdAt: string;
  reviewedAt?: string;
  riskLevel: 'low' | 'medium' | 'high';
}

export const OpenClawSyncConsole: React.FC<OpenClawSyncConsoleProps> = ({
  ideas,
  selectedIdeaId,
}) => {
  const [activeSubTab, setActiveSubTab] = useState<'approvals' | 'workflow' | 'explorer' | 'webhooks' | 'vps_prompt'>('vps_prompt');
  const [apiKey, setApiKey] = useState('opclw_live_demo_key_778899');
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  // Approvals state
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [isLoadingApprovals, setIsLoadingApprovals] = useState(false);
  const [approvalFilter, setApprovalFilter] = useState<'all' | 'pending' | 'reviewed'>('all');

  // Workflow spec state
  const [currentIdeaId, setCurrentIdeaId] = useState<string>(selectedIdeaId || ideas[0]?.id || 'mkt-1');
  const [workflowSpec, setWorkflowSpec] = useState<any>(null);
  const [isLoadingSpec, setIsLoadingSpec] = useState(false);

  // API Explorer state
  const [selectedEndpoint, setSelectedEndpoint] = useState<string>('/api/openclaw/health');
  const [explorerMethod, setExplorerMethod] = useState<'GET' | 'POST'>('GET');
  const [explorerBody, setExplorerBody] = useState<string>('{}');
  const [explorerResponse, setExplorerResponse] = useState<any>(null);
  const [explorerStatus, setExplorerStatus] = useState<number | null>(null);
  const [isExecutingExplorer, setIsExecutingExplorer] = useState(false);

  // Webhook tester state
  const [webhookUrl, setWebhookUrl] = useState('https://openclaw.local:8080/webhook/approvals');
  const [webhookEventType, setWebhookEventType] = useState('approval.created');
  const [webhookResult, setWebhookResult] = useState<any>(null);
  const [isSendingWebhook, setIsSendingWebhook] = useState(false);

  // Load approvals
  const fetchApprovals = async () => {
    setIsLoadingApprovals(true);
    try {
      const res = await fetch('/api/openclaw/approvals');
      if (res.ok) {
        const data = await res.json();
        setApprovals(data);
      }
    } catch (e) {
      console.warn('Failed to load approvals:', e);
    } finally {
      setIsLoadingApprovals(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
  }, []);

  // Load workflow spec when idea changes
  useEffect(() => {
    if (!currentIdeaId) return;
    setIsLoadingSpec(true);
    fetch(`/api/openclaw/ideas/${currentIdeaId}/workflow-spec`)
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => setWorkflowSpec(data))
      .catch((e) => console.warn(e))
      .finally(() => setIsLoadingSpec(false));
  }, [currentIdeaId]);

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  const handleReview = async (id: string, decision: 'approved' | 'rejected', notes?: string) => {
    try {
      const res = await fetch(`/api/openclaw/approvals/${id}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          decision,
          reviewerNotes: notes || (decision === 'approved' ? 'אושר ידנית בלוח הבקרה' : 'נדחה על ידי המשתמש'),
        }),
      });
      if (res.ok) {
        fetchApprovals();
      }
    } catch (e) {
      console.error('Error reviewing approval:', e);
    }
  };

  const handleCreateMockApproval = async () => {
    try {
      const res = await fetch('/api/openclaw/approvals/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ideaId: currentIdeaId,
          ideaTitle: ideas.find((i) => i.id === currentIdeaId)?.title || 'אימות לידים ב-WhatsApp',
          actionType: 'outreach_message',
          title: `שליחת הודעת הצעה לליד חדש (${new Date().toLocaleTimeString('he-IL')})`,
          recipient: 'דנה שפירא (מנהלת שיווק, חברת B2B Tech)',
          payload: {
            channel: 'whatsapp',
            message: 'שלום דנה, זוהתה פנייה חדשה באתר. סוכן OpenClaw הכין הצעה לפיילוט לבדיקתך.',
            estimatedBudget: '9,500 ₪',
          },
          riskLevel: 'medium',
        }),
      });
      if (res.ok) {
        fetchApprovals();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleExecuteExplorer = async () => {
    setIsExecutingExplorer(true);
    setExplorerResponse(null);
    setExplorerStatus(null);
    try {
      const options: RequestInit = {
        method: explorerMethod,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
      };
      if (explorerMethod === 'POST') {
        options.body = explorerBody;
      }
      const res = await fetch(selectedEndpoint, options);
      setExplorerStatus(res.status);
      const data = await res.json();
      setExplorerResponse(data);
    } catch (err: any) {
      setExplorerStatus(500);
      setExplorerResponse({ error: err?.message || 'Network error' });
    } finally {
      setIsExecutingExplorer(false);
    }
  };

  const handleTestWebhook = async () => {
    setIsSendingWebhook(true);
    setWebhookResult(null);
    try {
      const res = await fetch('/api/openclaw/webhooks/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: webhookUrl,
          eventType: webhookEventType,
        }),
      });
      const data = await res.json();
      setWebhookResult(data);
    } catch (err: any) {
      setWebhookResult({ error: err?.message });
    } finally {
      setIsSendingWebhook(false);
    }
  };

  const pendingCount = approvals.filter((a) => a.humanDecision === 'pending').length;

  const filteredApprovals = approvals.filter((a) => {
    if (approvalFilter === 'pending') return a.humanDecision === 'pending';
    if (approvalFilter === 'reviewed') return a.humanDecision !== 'pending';
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {/* Top Title & Protocol Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6 mb-8">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-700 mb-1">
            <Cpu className="w-4 h-4" />
            <span>תשתית סנכרון ו-API עבור OpenClaw Agent</span>
          </div>
          <h2 className="text-2xl font-bold text-slate-900 tracking-tight">
            שער אינטגרציה ובקרת אנוש (OpenClaw Sync Gateway)
          </h2>
          <p className="text-xs text-slate-600 mt-1">
            סנכרון רעיונות עסקיים, הפקת מפרטי תהליך (Workflow Specs), ואכיפת אישור אנושי חובה לפני כל פעולה חיצונית.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <a
            href="/api/openclaw/openapi.json"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Code className="w-3.5 h-3.5 text-indigo-600" />
            <span>OpenAPI 3.0 JSON</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
          <a
            href="/api/openclaw/manifest.json"
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Terminal className="w-3.5 h-3.5 text-slate-700" />
            <span>Tool Manifest</span>
            <ExternalLink className="w-3 h-3 text-slate-400" />
          </a>
        </div>
      </div>

      {/* API Key & Connection Summary Box */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-8 shadow-xs">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div>
            <span className="text-slate-500 block mb-1">כתובת ה-API הבסיסית (Base Endpoint):</span>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-[11px] text-slate-800">
              <span className="truncate">{window.location.origin}/api/openclaw</span>
              <button
                onClick={() => copyToClipboard(`${window.location.origin}/api/openclaw`, 'url')}
                className="text-slate-500 hover:text-slate-800 shrink-0 ml-auto"
              >
                {copiedKey === 'url' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">מפתח הרשאה (OpenClaw API Key):</span>
            <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-lg p-2 font-mono text-[11px] text-slate-800">
              <Key className="w-3.5 h-3.5 text-amber-600 shrink-0" />
              <span className="truncate">{apiKey}</span>
              <button
                onClick={() => copyToClipboard(apiKey, 'key')}
                className="text-slate-500 hover:text-slate-800 shrink-0 ml-auto"
              >
                {copiedKey === 'key' ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div>
            <span className="text-slate-500 block mb-1">סטטוס סנכרון ובקרת אנוש:</span>
            <div className="flex items-center justify-between bg-slate-50 border border-slate-200 rounded-lg p-2 font-medium">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500" />
                <span className="text-slate-800">שער פעיל (v1.0)</span>
              </div>
              <span className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2 py-0.5 rounded font-mono">
                {pendingCount} פעולות ממתינות לאישור
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Sub Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 mb-8 overflow-x-auto">
        <button
          onClick={() => setActiveSubTab('approvals')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeSubTab === 'approvals'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>תור אישורים אנושיים (HITL Queue)</span>
          {pendingCount > 0 && (
            <span className="bg-amber-400 text-slate-900 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
              {pendingCount}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveSubTab('workflow')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeSubTab === 'workflow'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>מפרט תהליך OpenClaw (Workflow Spec)</span>
        </button>

        <button
          onClick={() => setActiveSubTab('explorer')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeSubTab === 'explorer'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Terminal className="w-3.5 h-3.5" />
          <span>API Explorer אינטראקטיבי</span>
        </button>

        <button
          onClick={() => setActiveSubTab('vps_prompt')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeSubTab === 'vps_prompt'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Code className="w-3.5 h-3.5 text-indigo-400" />
          <span>פרומפט והגדרות VPS ל-OpenClaw</span>
        </button>

        <button
          onClick={() => setActiveSubTab('webhooks')}
          className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
            activeSubTab === 'webhooks'
              ? 'bg-slate-900 text-white shadow-xs'
              : 'bg-white text-slate-700 border border-slate-200 hover:bg-slate-50'
          }`}
        >
          <Send className="w-3.5 h-3.5" />
          <span>בדיקת Webhooks</span>
        </button>
      </div>

      {/* SUBTAB 1: HUMAN IN THE LOOP APPROVALS QUEUE */}
      {activeSubTab === 'approvals' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                תור בדיקה ואישור אנושי (Human-in-the-Loop Gate)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                פעולות שהוכנו על ידי סוכן OpenClaw ונחסמו עד לקבלת אישור אנושי מפורש, בהתאם ל-PRD.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                <button
                  onClick={() => setApprovalFilter('all')}
                  className={`px-2.5 py-1 rounded font-medium ${approvalFilter === 'all' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'}`}
                >
                  הכל ({approvals.length})
                </button>
                <button
                  onClick={() => setApprovalFilter('pending')}
                  className={`px-2.5 py-1 rounded font-medium ${approvalFilter === 'pending' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'}`}
                >
                  ממתינים ({pendingCount})
                </button>
                <button
                  onClick={() => setApprovalFilter('reviewed')}
                  className={`px-2.5 py-1 rounded font-medium ${approvalFilter === 'reviewed' ? 'bg-white shadow-xs text-slate-900' : 'text-slate-600'}`}
                >
                  טופלו ({approvals.length - pendingCount})
                </button>
              </div>

              <button
                onClick={handleCreateMockApproval}
                className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
              >
                + סימולציית פעולת סוכן
              </button>

              <button
                onClick={fetchApprovals}
                className="p-1.5 text-slate-500 hover:text-slate-800 bg-white border border-slate-200 rounded-lg"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isLoadingApprovals ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {filteredApprovals.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center text-xs text-slate-500">
              אין פעולות בתור כעת התואמות לסינון.
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApprovals.map((appr) => (
                <div
                  key={appr.id}
                  className={`bg-white border rounded-xl p-5 shadow-xs transition-colors ${
                    appr.humanDecision === 'pending'
                      ? 'border-amber-300 ring-1 ring-amber-300/30'
                      : 'border-slate-200 opacity-90'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3 mb-3">
                    <div>
                      <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
                        <span className="font-mono text-[11px] text-slate-400">ID: {appr.id}</span>
                        <span>·</span>
                        <span>{appr.ideaTitle}</span>
                        <span>·</span>
                        <span>נוצר: {new Date(appr.createdAt).toLocaleTimeString('he-IL')}</span>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>{appr.title}</span>
                        {appr.riskLevel === 'high' && (
                          <span className="text-[10px] text-rose-700 bg-rose-50 border border-rose-200 px-1.5 py-0.2 rounded font-semibold">
                            רמת סיכון גבוהה
                          </span>
                        )}
                      </h4>

                      <div className="text-xs text-slate-600 mt-1">
                        <span className="font-semibold text-slate-800">נמען / יעד: </span>
                        <span>{appr.recipient}</span>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="shrink-0">
                      {appr.humanDecision === 'pending' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg">
                          <Clock className="w-3.5 h-3.5" />
                          ממתין לאישור אנושי
                        </span>
                      )}
                      {appr.humanDecision === 'approved' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          אושר ונשלח
                        </span>
                      )}
                      {appr.humanDecision === 'rejected' && (
                        <span className="inline-flex items-center gap-1 text-xs font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg">
                          <XCircle className="w-3.5 h-3.5" />
                          נדחה
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Payload Details */}
                  <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs text-slate-800 mb-4 font-sans">
                    <span className="font-semibold text-slate-700 block mb-1">תוכן הפעולה שתוכננה:</span>
                    {appr.payload?.message ? (
                      <div className="bg-white p-2.5 rounded border border-slate-200/80 text-slate-800 leading-relaxed whitespace-pre-wrap">
                        {appr.payload.message}
                      </div>
                    ) : (
                      <pre className="font-mono text-[11px] overflow-x-auto text-slate-700">
                        {JSON.stringify(appr.payload, null, 2)}
                      </pre>
                    )}
                  </div>

                  {/* Actions Bar */}
                  {appr.humanDecision === 'pending' ? (
                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                      <button
                        onClick={() => handleReview(appr.id, 'rejected')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        דחה פעולה
                      </button>
                      <button
                        onClick={() => handleReview(appr.id, 'approved')}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        אשר וסנכרן ל-OpenClaw
                      </button>
                    </div>
                  ) : (
                    <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100 flex items-center justify-between">
                      <span>הערת בודק: {appr.reviewerNotes}</span>
                      {appr.reviewedAt && (
                        <span>אושר ב-{new Date(appr.reviewedAt).toLocaleTimeString('he-IL')}</span>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* SUBTAB 2: WORKFLOW SPEC */}
      {activeSubTab === 'workflow' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900">
                מפרט תהליך OpenClaw (Workflow Specification)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                מפרט מובנה בפורמט JSON להזנה ישירה לסוכן OpenClaw עם שלבים מוגדרים וחסימות בקרת אנוש.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <select
                value={currentIdeaId}
                onChange={(e) => setCurrentIdeaId(e.target.value)}
                className="px-3 py-1.5 text-xs bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none"
              >
                {ideas.map((i) => (
                  <option key={i.id} value={i.id}>
                    {i.title}
                  </option>
                ))}
              </select>

              {workflowSpec && (
                <>
                  <button
                    onClick={() => copyToClipboard(JSON.stringify(workflowSpec, null, 2), 'spec')}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
                  >
                    {copiedKey === 'spec' ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-600" />
                        <span>הועתק</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>העתק JSON</span>
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => {
                      const blob = new Blob([JSON.stringify(workflowSpec, null, 2)], {
                        type: 'application/json',
                      });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `openclaw-spec-${currentIdeaId}.json`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>הורד קובץ תצורה</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="bg-slate-900 rounded-xl p-5 border border-slate-800 overflow-hidden shadow-lg">
            <div className="flex items-center justify-between text-xs text-slate-400 border-b border-slate-800 pb-3 mb-3 font-mono">
              <span>openclaw-workflow-spec-{currentIdeaId}.json</span>
              <span>JSON Schema v1.0</span>
            </div>
            <pre className="text-xs font-mono text-emerald-400 overflow-x-auto max-h-[480px] leading-relaxed dir-ltr text-left">
              {isLoadingSpec
                ? '// טוען מפרט תהליך מותאם...'
                : JSON.stringify(workflowSpec, null, 2)}
            </pre>
          </div>
        </div>
      )}

      {/* SUBTAB 3: INTERACTIVE API EXPLORER */}
      {activeSubTab === 'explorer' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              API Console אינטראקטיבי
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              הפעל בדיקות קריאה בזמן אמת לכל נקודות הקצה של OpenClaw ישירות מהדפדפן.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">מתודה</label>
                <select
                  value={explorerMethod}
                  onChange={(e) => setExplorerMethod(e.target.value as any)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono font-bold"
                >
                  <option value="GET">GET</option>
                  <option value="POST">POST</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">נקודת קצה (Endpoint)</label>
                <select
                  value={selectedEndpoint}
                  onChange={(e) => {
                    const ep = e.target.value;
                    setSelectedEndpoint(ep);
                    if (ep === '/api/openclaw/approvals/create') {
                      setExplorerMethod('POST');
                      setExplorerBody(
                        JSON.stringify(
                          {
                            ideaId: 'mkt-1',
                            actionType: 'outreach_message',
                            title: 'הודעת פנייה ללקוח',
                            recipient: '054-0000000',
                            payload: { channel: 'whatsapp', message: 'בדיקת API' },
                          },
                          null,
                          2
                        )
                      );
                    } else if (ep === '/api/openclaw/experiments/log') {
                      setExplorerMethod('POST');
                      setExplorerBody(
                        JSON.stringify(
                          {
                            ideaId: 'mkt-1',
                            eventType: 'customer_replied',
                            details: 'לקוח אישר פגישה',
                          },
                          null,
                          2
                        )
                      );
                    } else {
                      setExplorerMethod('GET');
                    }
                  }}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                >
                  <option value="/api/openclaw/health">GET /api/openclaw/health (בדיקת תקינות ושירותים)</option>
                  <option value="/api/openclaw/ideas">GET /api/openclaw/ideas (רשימת רעיונות מסונכרנים)</option>
                  <option value={`/api/openclaw/ideas/${currentIdeaId}/workflow-spec`}>
                    GET /api/openclaw/ideas/:id/workflow-spec (מפרט תהליך סוכן)
                  </option>
                  <option value={`/api/openclaw/ideas/${currentIdeaId}/outreach`}>
                    GET /api/openclaw/ideas/:id/outreach (תבניות פנייה ושאלות)
                  </option>
                  <option value="/api/openclaw/approvals">GET /api/openclaw/approvals (תור אישורים אנושיים)</option>
                  <option value="/api/openclaw/approvals/create">POST /api/openclaw/approvals/create (בקשת אישור חדשה)</option>
                  <option value="/api/openclaw/experiments/log">POST /api/openclaw/experiments/log (רישום אירוע ניסוי)</option>
                  <option value="/api/openclaw/manifest.json">GET /api/openclaw/manifest.json (Tool Calling Manifest)</option>
                  <option value="/api/openclaw/openapi.json">GET /api/openclaw/openapi.json (OpenAPI 3.0 Spec)</option>
                </select>
              </div>

              <div className="flex items-end">
                <button
                  onClick={handleExecuteExplorer}
                  disabled={isExecutingExplorer}
                  className="w-full py-2 px-4 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors flex items-center justify-center gap-1.5 shadow-xs disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>שגר קריאה (Send)</span>
                </button>
              </div>
            </div>

            {explorerMethod === 'POST' && (
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">גוף הבקשה (JSON Body)</label>
                <textarea
                  rows={4}
                  value={explorerBody}
                  onChange={(e) => setExplorerBody(e.target.value)}
                  className="w-full px-3 py-2 text-xs font-mono bg-slate-50 border border-slate-200 rounded-lg dir-ltr text-left"
                />
              </div>
            )}

            {/* Response Console */}
            {explorerResponse && (
              <div className="pt-4 border-t border-slate-200">
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="font-semibold text-slate-800">תשובת השרת (Response):</span>
                  <div className="flex items-center gap-2 font-mono text-[11px]">
                    <span className={explorerStatus === 200 || explorerStatus === 201 ? 'text-emerald-700 font-bold' : 'text-rose-700 font-bold'}>
                      Status: {explorerStatus}
                    </span>
                  </div>
                </div>
                <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-200 overflow-x-auto max-h-80 dir-ltr text-left">
                  <pre>{JSON.stringify(explorerResponse, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 4: WEBHOOK TESTER */}
      {activeSubTab === 'webhooks' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              בדיקת Webhooks מול OpenClaw
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              שליחת אירועים אסינכרוניים (כגון אישור אנושי שהתקבל או הפקת רעיון) ישירות לכתובת ה-Listener של OpenClaw.
            </p>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  כתובת יעד (Webhook URL של OpenClaw)
                </label>
                <input
                  type="text"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono text-slate-800"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">סוג אירוע (Event Type)</label>
                <select
                  value={webhookEventType}
                  onChange={(e) => setWebhookEventType(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg font-mono"
                >
                  <option value="approval.created">approval.created (נוצרה פעולה הממתינה לאישור)</option>
                  <option value="approval.resolved">approval.resolved (אדם אישר או דחה פעולה)</option>
                  <option value="idea.generated">idea.generated (הופקו רעיונות חדשים)</option>
                  <option value="experiment.completed">experiment.completed (הסתיים ניסוי לקוח)</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleTestWebhook}
                disabled={isSendingWebhook}
                className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>שגר אירוע בדיקה (Simulate Webhook)</span>
              </button>
            </div>

            {webhookResult && (
              <div className="pt-4 border-t border-slate-200">
                <div className="text-xs font-semibold text-slate-800 mb-2">תוצאת הבדיקה:</div>
                <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-emerald-400 overflow-x-auto dir-ltr text-left">
                  <pre>{JSON.stringify(webhookResult, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SUBTAB 5: VPS SYSTEM PROMPT & QUICK CONFIG */}
      {activeSubTab === 'vps_prompt' && (
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-bold text-slate-900">
              פרומפט מערכת והגדרות ל-OpenClaw שרץ על ה-VPS שלך
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              העתק את הפרומפט והגדרות הסביבה ישירות לקובץ ההגדרות של OpenClaw בשרת ה-VPS כדי לחבר אותו ליישום.
            </p>
          </div>

          {/* 1. The Master System Prompt */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Terminal className="w-4 h-4 text-indigo-700" />
                <span>1. System Prompt לסוכן OpenClaw (העתק לקובץ ההנחיות ב-VPS)</span>
              </div>
              <button
                onClick={() => {
                  const promptText = `אתה סוכן AI מבוסס OpenClaw המחובר למערכת 'מחולל רעיונות OpenClaw' בכתובת:
${window.location.origin}/api/openclaw

תפקידך ומטרתך:
1. למשוך מפרטי תהליך מאומתים (Workflow Specs) מנקודת הקצה: GET /api/openclaw/ideas
2. להוציא לפועל אך ורק תהליכים עסקיים בעלי ערך מוכח וכאב לקוח אמיתי (אימות לידים, הפקת דוחות, ניטור מבצעים, אוטומציית מסמכים).
3. כלל ברזל מחייב (HUMAN-IN-THE-LOOP):
   לעולם אינך שולח הודעות חיצוניות (WhatsApp, Email), אינך משנה סטטוסים ב-CRM ואינך שולח הצעות מחיר ללא קבלת אישור אנושי מפורש.
4. בכל פעולה חיצונית, עליך לשלוח בקשת אישור ל-API:
   POST /api/openclaw/approvals/create
   עם הפרטים: { ideaId, actionType, title, recipient, payload, riskLevel }
5. עליך להמתין שהסטטוס ישתנה ל-approved לפני ביצוע הפעולה הסופית.
6. לאחר ביצוע שלב או שיחה עם לקוח, עליך לתעד את התוצאה:
   POST /api/openclaw/experiments/log`;
                  copyToClipboard(promptText, 'vps_prompt_copy');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {copiedKey === 'vps_prompt_copy' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>הועתק ללוח</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>העתק פרומפט</span>
                  </>
                )}
              </button>
            </div>

            <div className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto whitespace-pre-wrap dir-rtl text-right max-h-72">
{`אתה סוכן AI מבוסס OpenClaw המחובר למערכת 'מחולל רעיונות OpenClaw' בכתובת:
${window.location.origin}/api/openclaw

תפקידך ומטרתך:
1. למשוך מפרטי תהליך מאומתים (Workflow Specs) מנקודת הקצה: GET /api/openclaw/ideas
2. להוציא לפועל אך ורק תהליכים עסקיים בעלי ערך מוכח וכאב לקוח אמיתי (אימות לידים, הפקת דוחות, ניטור מבצעים, אוטומציית מסמכים).
3. כלל ברזל מחייב (HUMAN-IN-THE-LOOP):
   לעולם אינך שולח הודעות חיצוניות (WhatsApp, Email), אינך משנה סטטוסים ב-CRM ואינך שולח הצעות מחיר ללא קבלת אישור אנושי מפורש.
4. בכל פעולה חיצונית, עליך לשלוח בקשת אישור ל-API:
   POST /api/openclaw/approvals/create
   עם הפרטים: { ideaId, actionType, title, recipient, payload, riskLevel }
5. עליך להמתין שהסטטוס ישתנה ל-approved לפני ביצוע הפעולה הסופית.
6. לאחר ביצוע שלב או שיחה עם לקוח, עליך לתעד את התוצאה:
   POST /api/openclaw/experiments/log`}
            </div>
          </div>

          {/* 2. Environment Variables (.env) for VPS */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Key className="w-4 h-4 text-amber-600" />
                <span>2. הגדרות סביבה ב-VPS (.env)</span>
              </div>
              <button
                onClick={() => {
                  const envText = `OPENCLAW_APP_GATEWAY="${window.location.origin}/api/openclaw"\nOPENCLAW_API_KEY="${apiKey}"\nOPENCLAW_HITL_POLL_INTERVAL=5\nOPENCLAW_AUTO_EXECUTE=false\nOPENCLAW_REQUIRE_HUMAN_SIGNOFF=true`;
                  copyToClipboard(envText, 'env_copy');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {copiedKey === 'env_copy' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>הועתק ללוח</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>העתק .env</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-amber-300 leading-relaxed overflow-x-auto dir-ltr text-left">
{`# OpenClaw Sync Gateway on VPS
OPENCLAW_APP_GATEWAY="${window.location.origin}/api/openclaw"
OPENCLAW_API_KEY="${apiKey}"
OPENCLAW_HITL_POLL_INTERVAL=5
OPENCLAW_AUTO_EXECUTE=false
OPENCLAW_REQUIRE_HUMAN_SIGNOFF=true`}
            </pre>
          </div>

          {/* 3. Python Integration Snippet */}
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900">
                <Code className="w-4 h-4 text-emerald-600" />
                <span>3. סקריפט פייתון (Python Worker) לסנכרון ובקרת אנוש</span>
              </div>
              <button
                onClick={() => {
                  const pyCode = `import requests
import time

GATEWAY = "${window.location.origin}/api/openclaw"
API_KEY = "${apiKey}"
HEADERS = {"Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}"}

# 1. משיכת רעיונות ומפרט תהליך
print("Connecting to Gateway...")
ideas_res = requests.get(f"{GATEWAY}/ideas", headers=HEADERS).json()
idea = ideas_res["ideas"][0]
print(f"Loaded Workflow: {idea['title']}")

# 2. שליחת בקשת אישור לפעולה (בקרת אנוש מחייבת)
approval_payload = {
    "ideaId": idea["id"],
    "actionType": "outreach_message",
    "title": "הודעת וואטסאפ לליד חדש שנכנס",
    "recipient": "054-1234567",
    "payload": {"channel": "whatsapp", "text": "היי רועי, מצאנו התאמה לפיילוט."},
    "riskLevel": "medium"
}
appr = requests.post(f"{GATEWAY}/approvals/create", json=approval_payload, headers=HEADERS).json()
appr_id = appr["id"]
print(f"Created HITL Approval Task: {appr_id}. Waiting for human in UI...")

# 3. המתנה לאישור אנושי בלולאה
while True:
    time.sleep(3)
    approvals = requests.get(f"{GATEWAY}/approvals?status=pending", headers=HEADERS).json()
    is_pending = any(a["id"] == appr_id for a in approvals)
    if not is_pending:
        all_apprs = requests.get(f"{GATEWAY}/approvals", headers=HEADERS).json()
        item = next(a for a in all_apprs if a["id"] == appr_id)
        if item["humanDecision"] == "approved":
            print("Action APPROVED by Human! Executing action now...")
        else:
            print("Action REJECTED by Human. Halting.")
        break
`;
                  copyToClipboard(pyCode, 'py_copy');
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
              >
                {copiedKey === 'py_copy' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span>הועתק ללוח</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>העתק קוד פייתון</span>
                  </>
                )}
              </button>
            </div>

            <pre className="bg-slate-900 rounded-lg p-4 font-mono text-xs text-slate-200 leading-relaxed overflow-x-auto dir-ltr text-left max-h-80">
{`import requests
import time

GATEWAY = "${window.location.origin}/api/openclaw"
API_KEY = "${apiKey}"
HEADERS = {"Content-Type": "application/json", "Authorization": f"Bearer {API_KEY}"}

# 1. משיכת רעיונות ומפרט תהליך
print("Connecting to Gateway...")
ideas_res = requests.get(f"{GATEWAY}/ideas", headers=HEADERS).json()
idea = ideas_res["ideas"][0]
print(f"Loaded Workflow: {idea['title']}")

# 2. שליחת בקשת אישור לפעולה (בקרת אנוש מחייבת)
approval_payload = {
    "ideaId": idea["id"],
    "actionType": "outreach_message",
    "title": "הודעת וואטסאפ לליד חדש שנכנס",
    "recipient": "054-1234567",
    "payload": {"channel": "whatsapp", "text": "היי רועי, מצאנו התאמה לפיילוט."},
    "riskLevel": "medium"
}
appr = requests.post(f"{GATEWAY}/approvals/create", json=approval_payload, headers=HEADERS).json()
appr_id = appr["id"]
print(f"Created HITL Approval Task: {appr_id}. Waiting for human review...")

# 3. האזנה לתשובת המשתמש מהאפליקציה
while True:
    time.sleep(3)
    approvals = requests.get(f"{GATEWAY}/approvals?status=pending", headers=HEADERS).json()
    is_pending = any(a["id"] == appr_id for a in approvals)
    if not is_pending:
        all_apprs = requests.get(f"{GATEWAY}/approvals", headers=HEADERS).json()
        item = next(a for a in all_apprs if a["id"] == appr_id)
        if item["humanDecision"] == "approved":
            print("Action APPROVED by Human! Executing action now...")
        else:
            print("Action REJECTED by Human. Halting.")
        break`}
            </pre>
          </div>
        </div>
      )}
    </div>
  );
};
