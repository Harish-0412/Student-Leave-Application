const SUBJECT_TOPICS = {
  FSD: [
    'HTML semantics and page structure',
    'CSS layouts and responsive design',
    'JavaScript fundamentals for UI behavior',
    'DOM events and interactive components',
    'React component structure and props',
    'React state, forms, and controlled inputs',
    'Routing and multi-page application flow',
    'API integration and async data loading',
    'Authentication flow and protected routes',
    'UI polishing, testing, and deployment',
  ],
  ML: [
    'Introduction to machine learning workflow',
    'Data preprocessing and feature handling',
    'Supervised learning and regression basics',
    'Classification models and evaluation',
    'Model metrics and validation strategies',
    'Feature engineering and tuning',
    'Decision trees and ensemble methods',
    'Clustering and unsupervised learning',
    'Model interpretation and bias checks',
    'Mini project review and recap',
  ],
  DS: [
    'Arrays, strings, and complexity review',
    'Linked lists and pointer techniques',
    'Stacks, queues, and practical usage',
    'Hash maps and set operations',
    'Trees and traversal methods',
    'Binary search trees and balancing concepts',
    'Graphs, BFS, and DFS',
    'Greedy techniques and recursion patterns',
    'Dynamic programming foundations',
    'Mock coding practice and revision',
  ],
};

const SUBJECT_ORDER = ['FSD', 'ML', 'DS'];
const SLOT_ORDER = ['Class 1', 'Class 2', 'Class 3'];
const DEFAULT_DURATION_DAYS = 30;

const formatDateKey = (date) => {
  const normalizedDate = new Date(date);
  normalizedDate.setHours(0, 0, 0, 0);
  return normalizedDate.toISOString().slice(0, 10);
};

const buildClassEntry = (subject, dayIndex, slotIndex) => {
  const topics = SUBJECT_TOPICS[subject];
  const topic = topics[dayIndex % topics.length];

  return {
    subject,
    slot: SLOT_ORDER[slotIndex],
    topic,
    description: `${subject} session focused on ${topic.toLowerCase()}.`,
    deliveryType: slotIndex === 2 ? 'practice' : 'theory',
  };
};

const buildDayPlan = (baseDate, dayIndex) => {
  const currentDate = new Date(baseDate);
  currentDate.setDate(baseDate.getDate() + dayIndex);

  const classes = SUBJECT_ORDER.map((subject, slotIndex) =>
    buildClassEntry(subject, dayIndex, slotIndex),
  );

  return {
    date: currentDate.toISOString(),
    dateKey: formatDateKey(currentDate),
    dayNumber: dayIndex + 1,
    status: 'scheduled',
    classes,
  };
};

const buildDaysByDate = (days) =>
  days.reduce((accumulator, day) => {
    accumulator[day.dateKey] = {
      classes: day.classes,
      status: day.status,
      dayNumber: day.dayNumber,
      date: day.date,
    };
    return accumulator;
  }, {});

const generatePlan = async (studentId, options = {}) => {
  const durationDays = options.durationDays || DEFAULT_DURATION_DAYS;
  const startDate = options.startDate ? new Date(options.startDate) : new Date();
  startDate.setHours(0, 0, 0, 0);

  const days = Array.from({ length: durationDays }, (_, dayIndex) =>
    buildDayPlan(startDate, dayIndex),
  );

  return {
    studentId,
    generatedAt: new Date().toISOString(),
    startDate: startDate.toISOString(),
    durationDays,
    subjects: SUBJECT_ORDER,
    days,
    daysByDate: buildDaysByDate(days),
    guidance: {
      summary:
        'Thirty-day academic calendar with fixed daily FSD, ML, and DS coverage.',
      weeklyFocus: [
        'Week 1: establish fundamentals',
        'Week 2: build applied confidence',
        'Week 3: strengthen weak areas',
        'Week 4: revision and consolidation',
      ],
    },
  };
};

module.exports = {
  generatePlan,
};
