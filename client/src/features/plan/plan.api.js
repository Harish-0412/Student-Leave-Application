import api from '../../services/http';

export const getStudyPlan = async (studentId) => api.get(`/plan/${studentId}`);

export const updateStudyPlan = async (studentId, data) => api.post(`/plan/${studentId}`, data);
