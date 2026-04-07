import { useState, useEffect } from 'react';
import { getStudyPlan } from '../features/plan/plan.api';

export function useStudyPlan(studentId) {
  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPlan = async () => {
      try {
        const data = await getStudyPlan(studentId);
        setPlan(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    if (studentId) fetchPlan();
  }, [studentId]);

  return { plan, loading };
}