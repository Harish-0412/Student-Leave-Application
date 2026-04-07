import Topbar from './Topbar';
import Sidebar from './Sidebar';

function AppShell({ children }) {
  return (
    <div className="app-shell">
      <Topbar />
      <div className="main-content">
        <Sidebar />
        <main>{children}</main>
      </div>
    </div>
  );
}

export default AppShell;