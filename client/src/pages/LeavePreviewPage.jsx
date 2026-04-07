import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Copy, Mail, Clock, CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { getLeaveById } from '../features/leave/leave.api';

function LeavePreviewPage() {
  const [searchParams] = useSearchParams();
  const leaveId = searchParams.get('leaveId');
  const [leave, setLeave] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchLeave = async () => {
      if (!leaveId) return;
      try {
        const response = await getLeaveById(leaveId);
        setLeave(response.data);
      } catch (error) {
        console.error('Failed to fetch leave:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchLeave();
  }, [leaveId]);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard!');
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  if (!leave) {
    return (
      <div className="flex h-screen items-center justify-center">
        <p className="text-xl font-bold text-muted-foreground">
          Leave application not found.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-8 px-4 py-16">
      <div className="rounded-[2rem] border border-border bg-card p-8 shadow-xl flex flex-wrap items-center justify-between gap-6 houses">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.28em] text-blue-600">
            Final Preview
          </p>
          <h1 className="mt-3 text-4xl font-bold text-foreground">
            Saved Leave Drafts
          </h1>
          <p className="mt-3 text-muted-foreground">
            This preview shows the final edited draft exactly as it was preserved
            with the leave application.
          </p>
        </div>
        
        <div className={`rounded-[2rem] px-8 py-6 flex flex-col items-center gap-3 border shadow-lg animate-in fade-in zoom-in duration-500 ${
          leave.status === 'pending' ? 'bg-amber-500/10 border-amber-500/20 text-amber-600' :
          leave.status === 'approved' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' :
          leave.status === 'on-hold' ? 'bg-blue-500/10 border-blue-500/20 text-blue-600' :
          'bg-red-500/10 border-red-500/20 text-red-600'
        }`}>
          {leave.status === 'pending' ? <Clock className="w-10 h-10 animate-spin-slow" /> :
           leave.status === 'approved' ? <CheckCircle2 className="w-10 h-10" /> :
           leave.status === 'on-hold' ? <AlertCircle className="w-10 h-10" /> :
           <XCircle className="w-10 h-10" />}
          <div className="text-center">
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-70">Application Status</p>
            <p className="text-xl font-black uppercase tracking-tight">
              {leave.status === 'pending' ? 'Waiting for Approval' : leave.status}
            </p>
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {Object.entries(leave.finalDrafts || {}).map(([recipient, content]) => (
          <div
            key={recipient}
            className="flex flex-col rounded-[2.5rem] border border-border bg-card p-8 shadow-2xl"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-blue-600/10 p-3 text-blue-600">
                  <Mail className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold capitalize text-foreground">
                    {recipient} Draft
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    Finalized message for your {recipient}
                  </p>
                </div>
              </div>
              <button
                onClick={() => copyToClipboard(content)}
                className="rounded-xl border border-border bg-muted/50 p-2.5 text-muted-foreground transition-all hover:bg-muted hover:text-foreground"
              >
                <Copy className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 rounded-3xl bg-muted/30 p-6">
              <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed text-foreground italic">
                {content}
              </pre>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LeavePreviewPage;
