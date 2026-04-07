const http = require('node:http');
const app = require('../app');

describe('AI routes', () => {
  let server;
  let baseUrl;

  beforeAll(async () => {
    await new Promise((resolve) => {
      server = http.createServer(app);
      server.listen(0, () => {
        const { port } = server.address();
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => {
        if (error) {
          reject(error);
          return;
        }

        resolve();
      });
    });
  });

  test('GET /api/ai/health reports Groq status safely', async () => {
    const response = await fetch(`${baseUrl}/api/ai/health`);
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(payload.data.provider).toBe('groq');
  });

  test('POST /api/ai/study-plan returns structured data without a key', async () => {
    const response = await fetch(`${baseUrl}/api/ai/study-plan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        student: {
          fullName: 'Aarav Sharma',
          department: 'Computer Science',
          semester: '6',
        },
        timelineDays: 30,
        subjects: ['FSD', 'ML', 'DS'],
      }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(Array.isArray(payload.data.weeklyFocus)).toBe(true);
  });

  test('POST /api/ai/chat returns chatbot reply data', async () => {
    const response = await fetch(`${baseUrl}/api/ai/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'How do I apply leave?',
        history: [],
        pageContext: '/',
      }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(typeof payload.data.reply).toBe('string');
    expect(Array.isArray(payload.data.quickReplies)).toBe(true);
  });

  test('POST /api/ai/leave-letter/refine returns refined draft data', async () => {
    const response = await fetch(`${baseUrl}/api/ai/leave-letter/refine`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        recipient: 'Principal',
        student: { fullName: 'Aarav Sharma', department: 'Computer Science' },
        leave: {
          fromDate: '2026-04-10',
          toDate: '2026-04-12',
          numberOfDays: 3,
          reason: 'medical appointment',
        },
        draft: {
          subject: 'Leave request',
          body: 'Please grant me leave.',
        },
        userEdits: 'Mention that I will catch up with all classes.',
        format: 'email',
        tone: 'formal',
      }),
    });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload.ok).toBe(true);
    expect(typeof payload.data.subject).toBe('string');
    expect(typeof payload.data.body).toBe('string');
  });

  test('POST /api/leave saves final edited drafts with the application', async () => {
    const response = await fetch(`${baseUrl}/api/leave`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        studentId: 'local-student',
        reason: 'medical leave',
        fromDate: '2026-04-10',
        toDate: '2026-04-12',
        numberOfDays: 3,
        finalDrafts: {
          Principal: {
            subject: 'Leave request',
            body: 'Final edited principal draft.',
          },
        },
        generatedDrafts: {
          Principal: {
            subject: 'Leave request',
            body: 'Generated principal draft.',
          },
        },
      }),
    });
    const payload = await response.json();

    expect(response.status).toBe(201);
    expect(payload.finalDrafts.Principal.body).toBe('Final edited principal draft.');
  });
});
