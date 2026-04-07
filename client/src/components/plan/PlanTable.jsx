function PlanTable({ plans }) {
  return (
    <table className="plan-table">
      <thead>
        <tr>
          <th>Date</th>
          <th>Subject</th>
          <th>Topic</th>
        </tr>
      </thead>
      <tbody>
        {plans.map((plan, index) => (
          <tr key={index}>
            <td>{plan.date}</td>
            <td>{plan.subject}</td>
            <td>{plan.topic}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

export default PlanTable;