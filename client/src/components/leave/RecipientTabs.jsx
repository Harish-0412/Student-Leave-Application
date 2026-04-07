function RecipientTabs({ recipients, activeTab, onTabChange }) {
  return (
    <div className="recipient-tabs">
      {recipients.map((recipient, index) => (
        <button
          key={index}
          className={activeTab === index ? 'active' : ''}
          onClick={() => onTabChange(index)}
        >
          {recipient.name}
        </button>
      ))}
    </div>
  );
}

export default RecipientTabs;