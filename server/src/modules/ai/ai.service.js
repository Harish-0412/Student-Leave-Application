const {
  GROQ_MODEL,
  createGroqRequest,
  isGroqEnabled,
} = require('../../config/groq');
const {
  buildStudyPlanMessages,
  buildRescheduleMessages,
  buildLeaveLetterMessages,
  buildRefineLeaveLetterMessages,
  buildChatMessages,
} = require('./prompts');

const parseJsonContent = (content) => {
  if (!content) {
    return null;
  }

  try {
    return JSON.parse(content);
  } catch (error) {
    return null;
  }
};

const requestGroqJson = async (messages) => {
  const response = await createGroqRequest({ messages });
  const content = response.choices?.[0]?.message?.content;
  const parsed = parseJsonContent(content);

  if (!parsed) {
    throw new Error('Groq response was not valid JSON.');
  }

  return parsed;
};

const fallbackStudyPlan = ({ student, timelineDays, subjects }) => ({
  mode: 'fallback',
  model: 'local-template',
  summary: `${student.fullName || 'The student'} should keep a steady ${timelineDays}-day cycle with equal attention on ${subjects.join(', ')} while leaving room for revision and project practice.`,
  weeklyFocus: [
    'Week 1: rebuild fundamentals and align daily routines.',
    'Week 2: combine theory with short implementation tasks.',
    'Week 3: strengthen weak spots using focused revision blocks.',
    'Week 4: simulate assessments and consolidate notes.',
  ],
  dailyAdvice: [
    'Start with FSD implementation, move to ML concepts, and end with DS problem-solving.',
    'Reserve one short review block at the end of every day.',
    'Track unfinished work so leave adjustments can be redistributed clearly.',
  ],
  riskFlags: [
    'Avoid stacking too many missed sessions into a single recovery day.',
  ],
});

const fallbackRescheduleReview = ({ leave }) => ({
  mode: 'fallback',
  model: 'local-template',
  explanation: `The leave from ${leave.fromDate} to ${leave.toDate} can be recovered gradually if the missed FSD, ML, and DS sessions are spread across the next active study days.`,
  scheduleRiskLevel: 'medium',
  recommendedStudentNote:
    'I will follow the updated recovery plan and use daily revision blocks to avoid backlog.',
  recoveryTips: [
    'Limit recovery to one extra class focus per day.',
    'Keep the original subject order whenever possible.',
    'Add a weekly checkpoint to verify backlog is shrinking.',
  ],
});

const buildRecipientCopies = ({ student, leave, recoveryPlanSummary }) => {
  const recipients = ['Principal', 'HOD', 'Teacher'];

  return recipients.map((recipient) => ({
    recipient,
    subject: `Leave application for ${student.fullName || 'student'} - ${leave.fromDate} to ${leave.toDate}`,
    body: `Respected ${recipient},\n\nI am ${student.fullName || 'the student'} from ${student.department || 'the department'}, semester ${student.semester || 'N/A'}. I request leave from ${leave.fromDate} to ${leave.toDate} for ${leave.numberOfDays} day(s) due to ${leave.reason}. I will remain responsible for the missed FSD, ML, and DS classes and follow the recovery plan: ${recoveryPlanSummary}. Kindly consider and approve my request.\n\nThank you.`,
  }));
};

const fallbackLeaveLetter = ({ student, leave, recoveryPlanSummary }) => ({
  mode: 'fallback',
  model: 'local-template',
  recipientCopies: buildRecipientCopies({
    student,
    leave,
    recoveryPlanSummary,
  }),
});

const fallbackRefineLeaveLetter = ({
  recipient = 'Principal',
  student = {},
  leave = {},
  draft = {},
  userEdits = '',
  format = 'email',
  tone = 'formal',
}) => ({
  mode: 'fallback',
  model: 'local-template',
  subject:
    draft.subject ||
    `Leave request for ${recipient} - ${leave.fromDate || ''} to ${leave.toDate || ''}`,
  body: [
    format === 'letter' ? `Respected ${recipient},` : `Dear ${recipient},`,
    '',
    `I am ${student.fullName || 'the student'} from ${student.department || 'the department'}${student.semester ? `, semester ${student.semester}` : ''}. I request leave from ${leave.fromDate} to ${leave.toDate} for ${leave.numberOfDays} day(s) due to ${leave.reason || 'personal reasons'}.`,
    userEdits ? ` ${userEdits}` : '',
    '',
    tone === 'warm'
      ? 'I would be grateful for your kind support and understanding.'
      : 'Kindly consider and approve my request.',
    '',
    `Regards,\n${student.fullName || 'Student'}`,
  ]
    .join('\n')
    .replace(/\n{3,}/g, '\n\n'),
});

const fallbackChatReply = ({ message = '' }) => ({
  mode: 'fallback',
  model: 'local-template',
  reply:
    message.toLowerCase().includes('leave')
      ? 'To apply for leave, share your reason, from date, to date, and number of days. The platform will then prepare recipient-ready letters and a revised study plan.'
      : 'I can help with onboarding, class planning for FSD, ML, and DS, leave requests, and rescheduling missed classes.',
  quickReplies: [
    'How do I apply leave?',
    'How does rescheduling work?',
    'What details do I need for onboarding?',
  ],
});

const generateStudyPlan = async ({
  student = {},
  timelineDays = 30,
  subjects = ['FSD', 'ML', 'DS'],
}) => {
  if (!isGroqEnabled()) {
    return fallbackStudyPlan({ student, timelineDays, subjects });
  }

  try {
    const result = await requestGroqJson(
      buildStudyPlanMessages({
        student,
        timelineDays,
        subjects,
      }),
    );

    return {
      mode: 'groq',
      model: GROQ_MODEL,
      summary: result.summary,
      weeklyFocus: result.weeklyFocus || [],
      dailyAdvice: result.dailyAdvice || [],
      riskFlags: result.riskFlags || [],
    };
  } catch (error) {
    return fallbackStudyPlan({ student, timelineDays, subjects });
  }
};

const reviewReschedule = async ({
  student = {},
  leave = {},
  originalPlan = [],
  rescheduledPlan = [],
}) => {
  if (!isGroqEnabled()) {
    return fallbackRescheduleReview({ leave });
  }

  try {
    const result = await requestGroqJson(
      buildRescheduleMessages({
        student,
        leave,
        originalPlan,
        rescheduledPlan,
      }),
    );

    return {
      mode: 'groq',
      model: GROQ_MODEL,
      explanation: result.explanation,
      scheduleRiskLevel: result.scheduleRiskLevel || 'medium',
      recommendedStudentNote: result.recommendedStudentNote,
      recoveryTips: result.recoveryTips || [],
    };
  } catch (error) {
    return fallbackRescheduleReview({ leave });
  }
};

const generateLeaveLetters = async ({
  student = {},
  leave = {},
  recoveryPlanSummary = '',
}) => {
  if (!isGroqEnabled()) {
    return fallbackLeaveLetter({
      student,
      leave,
      recoveryPlanSummary,
    });
  }

  try {
    const result = await requestGroqJson(
      buildLeaveLetterMessages({
        student,
        leave,
        recoveryPlanSummary,
      }),
    );

    return {
      mode: 'groq',
      model: GROQ_MODEL,
      recipientCopies:
        result.recipientCopies?.length > 0
          ? result.recipientCopies
          : buildRecipientCopies({ student, leave, recoveryPlanSummary }),
    };
  } catch (error) {
    return fallbackLeaveLetter({
      student,
      leave,
      recoveryPlanSummary,
    });
  }
};

const getAiStatus = () => ({
  provider: 'groq',
  enabled: isGroqEnabled(),
  model: GROQ_MODEL,
});

const refineLeaveLetter = async ({
  recipient = 'Principal',
  student = {},
  leave = {},
  draft = {},
  userEdits = '',
  format = 'email',
  tone = 'formal',
}) => {
  if (!isGroqEnabled()) {
    return fallbackRefineLeaveLetter({
      recipient,
      student,
      leave,
      draft,
      userEdits,
      format,
      tone,
    });
  }

  try {
    const result = await requestGroqJson(
      buildRefineLeaveLetterMessages({
        recipient,
        student,
        leave,
        draft,
        userEdits,
        format,
        tone,
      }),
    );

    return {
      mode: 'groq',
      model: GROQ_MODEL,
      subject: result.subject || draft.subject || '',
      body: result.body || draft.body || '',
    };
  } catch (error) {
    return fallbackRefineLeaveLetter({
      recipient,
      student,
      leave,
      draft,
      userEdits,
      format,
      tone,
    });
  }
};

const chatWithAssistant = async ({
  message = '',
  history = [],
  pageContext = 'general',
}) => {
  if (!message.trim()) {
    return fallbackChatReply({ message });
  }

  if (!isGroqEnabled()) {
    return fallbackChatReply({ message });
  }

  try {
    const result = await requestGroqJson(
      buildChatMessages({
        message,
        history,
        pageContext,
      }),
    );

    return {
      mode: 'groq',
      model: GROQ_MODEL,
      reply: result.reply,
      quickReplies: result.quickReplies || [],
    };
  } catch (error) {
    return fallbackChatReply({ message });
  }
};

module.exports = {
  getAiStatus,
  generateStudyPlan,
  reviewReschedule,
  generateLeaveLetters,
  refineLeaveLetter,
  chatWithAssistant,
};
