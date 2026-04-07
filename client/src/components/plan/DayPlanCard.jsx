function DayPlanCard({ plan }) {
  return (
    <div className="day-plan-card">
      <h3>{plan.date}</h3>
      <p>{plan.subject}: {plan.topic}</p>
    </div>
  );
}

export default DayPlanCard;