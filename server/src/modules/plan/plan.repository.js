const path = require('path');
const { readJsonFile, writeJsonFile } = require('../../shared/utils/file-db');

const PLANS_FILE = path.join(__dirname, '../../data/plans.json');

const readPlans = () => readJsonFile(PLANS_FILE);
const writePlans = (plans) => writeJsonFile(PLANS_FILE, plans);

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
