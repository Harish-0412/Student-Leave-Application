import { useEffect, useMemo, useState } from 'react';
import {
  Copy,
  FilePenLine,
  Mail,
  NotebookPen,
  RefreshCw,
  Sparkles,
  WandSparkles,
} from 'lucide-react';
import api from '../../services/http';
import { getCurrentSession, recordAuthenticatedActivity } from '../../features/auth/auth.api';

const recipients = ['Principal', 'HOD', 'Teacher'];

function DraftingSkeleton({ lines = [] }) {
  return (
    <div className="space-y-4 rounded-[1.5rem] border border-border bg-background/80 p-5">
      <div className="h-5 w-40 animate-pulse rounded-full bg-muted" />
      {lines.map((line) => (
        <div key={line} className="space-y-2">
          <p className="text-sm text-muted-foreground">{line}</p>
          <div className="h-3 w-full animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-4/5 animate-pulse rounded-full bg-muted" />
          <div className="h-3 w-3/5 animate-pulse rounded-full bg-muted" />
        </div>
      ))}
    </div>
  );
}

function LeaveDraftStudio({
  leavePayload,
  studentContext,
  onDraftsChange,
  submittedLeave,
}) {
  const [activeRecipient, setActiveRecipient] = useState('Principal');
  const [drafts, setDrafts] = useState({});
  const [draftMeta, setDraftMeta] = useState({});
  const [tone, setTone] = useState('formal');
  const [format, setFormat] = useState('email');
  const [userEdits, setUserEdits] = useState('');
  const [loadingDrafts, setLoadingDrafts] = useState(false);
  const [refining, setRefining] = useState(false);
  const [copied, setCopied] = useState(false);
  const [activeAssist, setActiveAssist] = useState('');
  const session = getCurrentSession();

  useEffect(() => {
    if (submittedLeave?.finalDrafts && Object.keys(submittedLeave.finalDrafts).length) {
      setDrafts(submittedLeave.finalDrafts);
    }
  }, [submittedLeave]);

  const hasEnoughData =
    leavePayload.reason &&
    leavePayload.fromDate &&
    leavePayload.toDate &&
    leavePayload.numberOfDays > 0;

  const currentDraft = drafts[activeRecipient] || {
    subject: '',
    body: '',
  };

  const syncDrafts = (updater) => {
    setDrafts((current) => {
      const next =
        typeof updater === 'function' ? updater(current) : updater;
      onDraftsChange?.({
        finalDrafts: next,
        generatedDrafts: next,
        tone,
        format,
        userEdits,
      });
      return next;
    });
  };

  const checklist = useMemo(
    () => [
      `Reason: ${leavePayload.reason || 'Add a reason'}`,
      `Dates: ${leavePayload.fromDate || '--'} to ${leavePayload.toDate || '--'}`,
      `Days: ${leavePayload.numberOfDays || 0}`,
      `Recipient: ${activeRecipient}`,
      `Tone: ${tone}`,
      `Format: ${format}`,
    ],
    [activeRecipient, format, leavePayload, tone],
  );

  const generateDrafts = async () => {
    if (!hasEnoughData || loadingDrafts) {
      return;
    }

    setLoadingDrafts(true);
    try {
      const response = await api.post('/ai/leave-letter', {
        student: studentContext,
        leave: leavePayload,
        recoveryPlanSummary:
          'The student will follow the revised study plan and make up missed FSD, ML, and DS classes on the next available active study days.',
      });

      const mappedDrafts = {};
      response.data.recipientCopies.forEach((copy) => {
        mappedDrafts[copy.recipient] = {
          subject: copy.subject,
          body: copy.body,
        };
      });
      setDraftMeta((current) => ({
        ...current,
        generationMode: response.data.mode,
        generationModel: response.data.model,
      }));
      syncDrafts(mappedDrafts);
      await recordAuthenticatedActivity({
        type: 'leave_draft_generated',
        role: session?.user?.role || 'student',
        details: {
          recipientCount: response.data.recipientCopies?.length || 0,
          mode: response.data.mode,
          model: response.data.model || '',
        },
      });
    } finally {
      setLoadingDrafts(false);
    }
  };

  const updateDraftField = (field, value) => {
    syncDrafts((current) => ({
      ...current,
      [activeRecipient]: {
        ...current[activeRecipient],
        [field]: value,
      },
    }));
  };

  const refineDraft = async () => {
    if (!currentDraft.body || refining) {
      return;
    }

    setRefining(true);
    try {
      const response = await api.post('/ai/leave-letter/refine', {
        recipient: activeRecipient,
        student: studentContext,
        leave: leavePayload,
        draft: currentDraft,
        userEdits,
        format,
        tone,
      });

      syncDrafts((current) => ({
        ...current,
        [activeRecipient]: {
          subject: response.data.subject,
          body: response.data.body,
        },
      }));
      setDraftMeta((current) => ({
        ...current,
        [activeRecipient]: {
          mode: response.data.mode,
          model: response.data.model,
        },
      }));
      await recordAuthenticatedActivity({
        type: 'leave_draft_refined',
        role: session?.user?.role || 'student',
        details: {
          recipient: activeRecipient,
          mode: response.data.mode,
          model: response.data.model || '',
          format,
          tone,
        },
      });
    } finally {
      setRefining(false);
    }
  };

  const runAssist = async (instructionLabel, instructionText) => {
    if (!currentDraft.body || refining) {
      return;
    }

    setActiveAssist(instructionLabel);
    setRefining(true);
    try {
      const response = await api.post('/ai/leave-letter/refine', {
        recipient: activeRecipient,
        student: studentContext,
        leave: leavePayload,
        draft: currentDraft,
        userEdits: userEdits
          ? `${userEdits}\n\nAI instruction: ${instructionText}`
          : `AI instruction: ${instructionText}`,
        format,
        tone,
      });

      syncDrafts((current) => ({
        ...current,
        [activeRecipient]: {
          subject: response.data.subject,
          body: response.data.body,
        },
      }));
      setDraftMeta((current) => ({
        ...current,
        [activeRecipient]: {
          mode: response.data.mode,
          model: response.data.model,
        },
      }));
      await recordAuthenticatedActivity({
        type: 'leave_draft_ai_quick_action',
        role: session?.user?.role || 'student',
        details: {
          recipient: activeRecipient,
          action: instructionLabel,
          mode: response.data.mode,
          model: response.data.model || '',
        },
      });
    } finally {
      setRefining(false);
      setActiveAssist('');
    }
  };

  const copyDraft = async () => {
    const text = `Subject: ${currentDraft.subject}\n\n${currentDraft.body}`;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <section className="rounded-[2rem] border border-border bg-card p-6 shadow-2xl">
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <p className="mb-2 flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.24em] text-blue-600">
            <Sparkles className="h-4 w-4" />
            Leave-letter drafting
          </p>
          <h2 className="text-2xl font-semibold text-foreground">
            AI draft studio for leave letters and emails
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
            Generate recipient-specific drafts, edit them in the canvas, and
            refine the final email or letter with your own modifications before
            sending.
          </p>
        </div>
        <button
          type="button"
          onClick={generateDrafts}
          disabled={!hasEnoughData || loadingDrafts}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loadingDrafts ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              Drafting...
            </>
          ) : (
            <>
              <WandSparkles className="h-4 w-4" />
              Leave-letter drafting
            </>
          )}
        </button>
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[0.85fr_1.6fr]">
        <aside className="space-y-5 rounded-[1.5rem] border border-border bg-background/70 p-5">
          <div>
            <p className="text-sm font-semibold text-foreground">
              Draft checklist
            </p>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              {checklist.map((item) => (
                <li key={item} className="rounded-xl bg-muted/60 px-3 py-2">
                  {item}
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">Extra features</p>
            <div className="mt-3 space-y-3">
              <label className="block text-sm text-muted-foreground">
                Tone
                <select
                  value={tone}
                  onChange={(event) => {
                    const next = event.target.value;
                    setTone(next);
                    onDraftsChange?.({
                      finalDrafts: drafts,
                      generatedDrafts: drafts,
                      tone: next,
                      format,
                      userEdits,
                    });
                  }}
                  className="mt-2 w-full rounded-xl border border-border bg-input px-3 py-2 text-foreground"
                >
                  <option value="formal">Formal</option>
                  <option value="warm">Warm</option>
                  <option value="urgent">Urgent</option>
                  <option value="apologetic">Apologetic</option>
                </select>
              </label>
              <label className="block text-sm text-muted-foreground">
                Output style
                <select
                  value={format}
                  onChange={(event) => {
                    const next = event.target.value;
                    setFormat(next);
                    onDraftsChange?.({
                      finalDrafts: drafts,
                      generatedDrafts: drafts,
                      tone,
                      format: next,
                      userEdits,
                    });
                  }}
                  className="mt-2 w-full rounded-xl border border-border bg-input px-3 py-2 text-foreground"
                >
                  <option value="email">Email</option>
                  <option value="letter">Letter</option>
                </select>
              </label>
              <label className="block text-sm text-muted-foreground">
                Student modification notes
                <textarea
                  value={userEdits}
                  onChange={(event) => {
                    const next = event.target.value;
                    setUserEdits(next);
                    onDraftsChange?.({
                      finalDrafts: drafts,
                      generatedDrafts: drafts,
                      tone,
                      format,
                      userEdits: next,
                    });
                  }}
                  placeholder="Add the points you want preserved, such as special requests, tone changes, or details to highlight."
                  className="mt-2 min-h-28 w-full rounded-2xl border border-border bg-input px-4 py-3 text-foreground"
                />
              </label>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-foreground">
              AI quick actions
            </p>
            <div className="mt-3 grid gap-2">
              {[
                {
                  label: 'Formal institutional polish',
                  instruction:
                    'Make this draft more formal and institution-style. Use a precise academic tone, a stronger subject line, and a polished salutation and closing.',
                },
                {
                  label: 'Strengthen continuity',
                  instruction:
                    'Improve the academic continuity paragraph. Clearly reassure the recipient that the missed FSD, ML, and DS classes will be recovered responsibly.',
                },
                {
                  label: 'Make concise for email',
                  instruction:
                    'Shorten the draft for email while keeping it respectful, complete, and recipient-specific.',
                },
                {
                  label: 'Improve reason clarity',
                  instruction:
                    'Rewrite the reason paragraph so it is more precise, natural, and professionally detailed without sounding dramatic.',
                },
              ].map((assist) => (
                <button
                  key={assist.label}
                  type="button"
                  onClick={() => runAssist(assist.label, assist.instruction)}
                  disabled={!currentDraft.body || refining}
                  className="rounded-xl border border-border bg-background px-3 py-3 text-left text-sm font-medium text-foreground transition hover:bg-muted disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {assist.label}
                </button>
              ))}
            </div>
          </div>
        </aside>

        <div className="rounded-[1.5rem] border border-border bg-background/70 p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              {recipients.map((recipient) => (
                <button
                  key={recipient}
                  type="button"
                  onClick={() => setActiveRecipient(recipient)}
                  className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                    activeRecipient === recipient
                      ? 'bg-foreground text-background'
                      : 'bg-muted text-foreground'
                  }`}
                >
                  {recipient}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-2">
              {draftMeta[activeRecipient]?.mode ? (
                <div className="rounded-full bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-600">
                  {draftMeta[activeRecipient].mode === 'groq'
                    ? `AI refined via ${draftMeta[activeRecipient].model}`
                    : 'Fallback refinement'}
                </div>
              ) : draftMeta.generationMode ? (
                <div className="rounded-full bg-blue-500/10 px-3 py-2 text-xs font-semibold text-blue-600">
                  {draftMeta.generationMode === 'groq'
                    ? `AI drafted via ${draftMeta.generationModel}`
                    : 'Fallback draft'}
                </div>
              ) : null}
              <button
                type="button"
                onClick={copyDraft}
                disabled={!currentDraft.body}
                className="inline-flex items-center gap-2 rounded-xl border border-border px-4 py-2 text-sm font-medium text-foreground transition hover:bg-muted disabled:opacity-50"
              >
                <Copy className="h-4 w-4" />
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                type="button"
                onClick={refineDraft}
                disabled={!currentDraft.body || refining}
                className="inline-flex items-center gap-2 rounded-xl bg-foreground px-4 py-2 text-sm font-medium text-background transition hover:bg-muted-foreground disabled:opacity-50"
              >
                {refining ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Refining...
                  </>
                ) : (
                  <>
                    <FilePenLine className="h-4 w-4" />
                    Finalize tailored draft
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="mt-5 grid gap-4">
            {loadingDrafts ? (
              <DraftingSkeleton
                lines={[
                  'Drafting the email according to the preferences...',
                  'Preparing a recipient-aware subject line and formal salutation...',
                  'Adding reason, dates, and class recovery details...',
                ]}
              />
            ) : refining ? (
              <DraftingSkeleton
                lines={[
                  activeAssist
                    ? `${activeAssist} in progress...`
                    : 'Refining the draft according to your edits...',
                  'Preserving your modifications and improving clarity...',
                  'Tailoring the final email or letter for the selected recipient...',
                ]}
              />
            ) : (
              <>
                <label className="text-sm text-muted-foreground">
                  Subject / heading
                  <input
                    value={currentDraft.subject}
                    onChange={(event) =>
                      updateDraftField('subject', event.target.value)
                    }
                    placeholder={`Leave request for ${activeRecipient}`}
                    className="mt-2 w-full rounded-2xl border border-border bg-input px-4 py-3 text-foreground"
                  />
                </label>

                <label className="text-sm text-muted-foreground">
                  Editable drafting canvas
                  <textarea
                    value={currentDraft.body}
                    onChange={(event) =>
                      updateDraftField('body', event.target.value)
                    }
                    placeholder="Generate a draft first, then edit it here for a better personalized experience."
                    className="mt-2 min-h-[22rem] w-full rounded-[1.5rem] border border-border bg-input px-4 py-4 text-sm leading-7 text-foreground"
                  />
                </label>
              </>
            )}

            <div className="grid gap-3 rounded-[1.25rem] border border-dashed border-border bg-muted/40 p-4 md:grid-cols-3">
              <div className="rounded-xl bg-background px-3 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  Draft mode
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {format === 'email' ? 'Email-ready' : 'Letter-ready'}
                </p>
              </div>
              <div className="rounded-xl bg-background px-3 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  Suggested recipient
                </p>
                <p className="mt-2 text-sm font-semibold text-foreground">
                  {activeRecipient}
                </p>
              </div>
              <div className="rounded-xl bg-background px-3 py-3">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  Delivery helper
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Mail className="h-4 w-4 text-blue-600" />
                  Ready to copy and send
                </p>
              </div>
              <div className="rounded-xl bg-background px-3 py-3 md:col-span-3">
                <p className="text-xs uppercase tracking-[0.22em] text-muted-foreground">
                  AI drafting enhancements
                </p>
                <p className="mt-2 flex items-center gap-2 text-sm font-semibold text-foreground">
                  <NotebookPen className="h-4 w-4 text-blue-600" />
                  Formal subject lines, recipient-aware wording, academic continuity, and reason-specific refinement
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

export default LeaveDraftStudio;
