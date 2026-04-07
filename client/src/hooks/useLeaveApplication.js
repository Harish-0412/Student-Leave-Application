import { useState } from 'react';
import { submitLeaveApplication } from '../features/leave/leave.api';

export function useLeaveApplication() {
  const [loading, setLoading] = useState(false);

  const submitApplication = async (data) => {
    setLoading(true);
    try {
      await submitLeaveApplication(data);
      // Handle success
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return { submitApplication, loading };
}