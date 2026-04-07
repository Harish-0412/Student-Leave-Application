const planService = require('./plan.service');

const getPlan = async (req, res) => {
  try {
    const plan = await planService.getPlanByStudentId(req.params.studentId);
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updatePlan = async (req, res) => {
  try {
    const plan = await planService.updatePlanByStudentId(
      req.params.studentId,
      req.body || {},
    );
    res.json(plan);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  getPlan,
  updatePlan,
};
