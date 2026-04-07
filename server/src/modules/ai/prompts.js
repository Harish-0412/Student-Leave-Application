const buildStudyPlanMessages = ({ student, timelineDays, subjects }) => [
  {
    role: 'system',
    content:
      'You are an academic planning assistant for a student leave and scheduling platform. Respond with strict JSON only.',
  },
  {
    role: 'user',
    content: JSON.stringify({
      task: 'Create an AI guidance layer for a 30-day academic plan.',
      outputShape: {
        summary: 'string',
        weeklyFocus: ['string'],
        dailyAdvice: ['string'],
        riskFlags: ['string'],
      },
      student,
      timelineDays,
      subjects,
      constraints: [
        'The plan is for three daily classes: FSD, ML, DS.',
        'Keep advice practical for a college student.',
        'Mention pacing, revision, and project work.',
      ],
    }),
  },
];

const buildRescheduleMessages = ({
  student,
  leave,
  originalPlan,
  rescheduledPlan,
}) => [
  {
    role: 'system',
    content:
      'You review leave-based schedule recovery plans for students. Respond with strict JSON only.',
  },
  {
    role: 'user',
    content: JSON.stringify({
      task: 'Review a leave-adjusted plan and explain whether it remains balanced.',
      outputShape: {
        explanation: 'string',
        scheduleRiskLevel: 'low | medium | high',
        recommendedStudentNote: 'string',
        recoveryTips: ['string'],
      },
      student,
      leave,
      originalPlan,
      rescheduledPlan,
      rules: [
        'Be concise and implementation-friendly.',
        'Recommend only realistic recovery actions.',
        'Avoid changing the schedule structure directly.',
      ],
    }),
  },
];

const buildLeaveLetterMessages = ({ student, leave, recoveryPlanSummary }) => [
  {
    role: 'system',
    content:
      'You draft polished academic leave communication for multiple recipients. Respond with strict JSON only.',
  },
  {
    role: 'user',
    content: JSON.stringify({
      task: 'Draft leave letters for Principal, HOD, and Teacher.',
      outputShape: {
        recipientCopies: [
          {
            recipient: 'Principal | HOD | Teacher',
            subject: 'string',
            body: 'string',
          },
        ],
      },
      student,
      leave,
      recoveryPlanSummary,
      instructions: [
        'Use respectful formal English.',
        'Keep each body between 90 and 140 words.',
        'Mention the recovery plan summary clearly.',
      ],
    }),
  },
];

const buildRefineLeaveLetterMessages = ({
  recipient,
  student,
  leave,
  draft,
  userEdits,
  format,
  tone,
}) => [
  {
    role: 'system',
    content:
      'You refine academic leave communication after the student edits it manually. Respond with strict JSON only.',
  },
  {
    role: 'user',
    content: JSON.stringify({
      task: 'Refine a leave letter or email while preserving the student intent.',
      outputShape: {
        subject: 'string',
        body: 'string',
      },
      recipient,
      student,
      leave,
      draft,
      userEdits,
      format,
      tone,
    }),
  },
];

const buildChatMessages = ({ message, history = [], pageContext = 'general' }) => [
  {
    role: 'system',
    content:
      'You are the Schedulr assistant for a student leave planner application. Respond with strict JSON only.',
  },
  {
    role: 'user',
    content: JSON.stringify({
      task: 'Answer the latest user message inside the product chatbot.',
      outputShape: {
        reply: 'string',
        quickReplies: ['string'],
      },
      message,
      history,
      pageContext,
    }),
  },
];

module.exports = {
  buildStudyPlanMessages,
  buildRescheduleMessages,
  buildLeaveLetterMessages,
  buildRefineLeaveLetterMessages,
  buildChatMessages,
};
