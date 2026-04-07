const aiService = require('./ai.service');

const getStatus = (_req, res) => {
  res.json({
    ok: true,
    data: aiService.getAiStatus(),
  });
};

const generatePlan = async (req, res, next) => {
  try {
    const plan = await aiService.generateStudyPlan(req.body || {});
    res.json({ ok: true, data: plan });
  } catch (error) {
    next(error);
  }
};

const reviewReschedule = async (req, res, next) => {
  try {
    const review = await aiService.reviewReschedule(req.body || {});
    res.json({ ok: true, data: review });
  } catch (error) {
    next(error);
  }
};

const generateLeaveLetter = async (req, res, next) => {
  try {
    const draft = await aiService.generateLeaveLetters(req.body || {});
    res.json({ ok: true, data: draft });
  } catch (error) {
    next(error);
  }
};

const refineLeaveLetter = async (req, res, next) => {
  try {
    const draft = await aiService.refineLeaveLetter(req.body || {});
    res.json({ ok: true, data: draft });
  } catch (error) {
    next(error);
  }
};

const chat = async (req, res, next) => {
  try {
    const reply = await aiService.chatWithAssistant(req.body || {});
    res.json({ ok: true, data: reply });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStatus,
  generatePlan,
  reviewReschedule,
  generateLeaveLetter,
  refineLeaveLetter,
  chat,
};
