import { useState } from 'react';
import Button from '../common/Button';

function LeaveApplicationForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    reason: '',
    startDate: '',
    endDate: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="leave-application-form">
      <label>
        Reason:
        <textarea name="reason" value={formData.reason} onChange={handleChange} required />
      </label>
      <label>
        Start Date:
        <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} required />
      </label>
      <label>
        End Date:
        <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} required />
      </label>
      <Button type="submit">Apply</Button>
    </form>
  );
}

export default LeaveApplicationForm;