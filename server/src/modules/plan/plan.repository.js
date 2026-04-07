const fs = require('fs').promises;
const path = require('path');

const PLANS_FILE = path.join(__dirname, '../../data/plans.json');

const readPlans = async () => {
  try {
    const data = await fs.readFile(PLANS_FILE, 'utf8');
    return JSON.parse(data);
  } catch {
    return [];
  }
};

const writePlans = async (plans) => {
  await fs.writeFile(PLANS_FILE, JSON.stringify(plans, null, 2));
};

const findByStudentId = async (studentId) => {
  const plans = await readPlans();
  return plans.find(p => p.studentId === studentId);
};

const create = async (data) => {
  const plans = await readPlans();
  const existingIndex = plans.findIndex((plan) => plan.studentId === data.studentId);

  if (existingIndex >= 0) {
    plans[existingIndex] = data;
  } else {
    plans.push(data);
  }

  await writePlans(plans);
  return data;
};

const update = async (studentId, data) => {
  const plans = await readPlans();
  const existingIndex = plans.findIndex((plan) => plan.studentId === studentId);

  if (existingIndex >= 0) {
    plans[existingIndex] = data;
  } else {
    plans.push(data);
  }

  await writePlans(plans);
  return data;
};

module.exports = {
  findByStudentId,
  create,
  update,
};
