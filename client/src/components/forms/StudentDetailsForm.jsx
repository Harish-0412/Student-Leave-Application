import { useState } from 'react';
import Button from '../common/Button';

function StudentDetailsForm({ onSubmit, initialValues }) {
  const [formData, setFormData] = useState({
    name: '',
    email: initialValues?.email || '',
    studentId: '',
    department: '',
    semester: '',
    section: '',
    ...initialValues,
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto flex w-full max-w-xl flex-col gap-4 rounded-3xl border border-border bg-card p-6 shadow-lg"
    >
      <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
        Name
        <input
          className="rounded-2xl border border-border bg-input px-4 py-3"
          type="text"
          name="name"
          value={formData.name}
          onChange={handleChange}
          required
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
        Email
        <input
          className="rounded-2xl border border-border bg-input px-4 py-3"
          type="email"
          name="email"
          value={formData.email}
          onChange={handleChange}
          required
        />
      </label>
      <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
        Student ID
        <input
          className="rounded-2xl border border-border bg-input px-4 py-3"
          type="text"
          name="studentId"
          value={formData.studentId}
          onChange={handleChange}
          required
        />
      </label>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
          Department
          <input
            className="rounded-2xl border border-border bg-input px-4 py-3"
            type="text"
            name="department"
            value={formData.department}
            onChange={handleChange}
          />
        </label>
        <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
          Semester
          <input
            className="rounded-2xl border border-border bg-input px-4 py-3"
            type="text"
            name="semester"
            value={formData.semester}
            onChange={handleChange}
          />
        </label>
      </div>
      <label className="flex flex-col gap-2 text-sm font-medium text-foreground">
        Section
        <input
          className="rounded-2xl border border-border bg-input px-4 py-3"
          type="text"
          name="section"
          value={formData.section}
          onChange={handleChange}
        />
      </label>
      <div>
        <Button type="submit">Continue</Button>
      </div>
    </form>
  );
}

export default StudentDetailsForm;
