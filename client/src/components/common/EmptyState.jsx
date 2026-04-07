function EmptyState({ message, icon }) {
  return (
    <div className="empty-state">
      {icon && <span className="icon">{icon}</span>}
      <p>{message}</p>
    </div>
  );
}

export default EmptyState;