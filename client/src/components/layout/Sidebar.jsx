function Sidebar() {
  return (
    <aside className="sidebar">
      <nav>
        <ul>
          <li><a href="/">Home</a></li>
          <li><a href="/student/dashboard">Dashboard</a></li>
          <li><a href="/leave/apply">Apply Leave</a></li>
          {/* Add more links */}
        </ul>
      </nav>
    </aside>
  );
}

export default Sidebar;