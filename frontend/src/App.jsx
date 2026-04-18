import React from 'react';
import { BrowserRouter as Router, Routes, Route, NavLink } from 'react-router-dom';
import { LayoutDashboard, FolderKanban, Target, Megaphone } from 'lucide-react';

// Import your components and assets
import Initiatives from './components/Initiatives';
import fnLogo from './assets/logo.webp'; 

// Temporary placeholders for other pages
const Dashboard = () => <div className="p-8"><h1 className="text-3xl font-bold">CS Dashboard</h1></div>;
const Campaigns = () => <div className="p-8"><h1 className="text-3xl font-bold">Marketing Campaigns</h1></div>;
const Goals = () => <div className="p-8"><h1 className="text-3xl font-bold">Goals Overview</h1></div>;

const SidebarItem = ({ to, icon: Icon, label }) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 px-4 py-3 rounded-lg transition-colors font-medium ${
        isActive 
          ? 'bg-[#1f1f1e] text-brand-orange'
          : 'text-gray-300 hover:bg-[#40403f] hover:text-white'
      }`
    }
  >
    <Icon size={20} />
    <span>{label}</span>
  </NavLink>
);

const AppLayout = ({ children }) => {
  return (
    <div className="flex h-screen bg-brand-gray font-sans">
      {/* Left Sidebar - Dark Theme */}
      <aside className="w-64 bg-[#323231] flex flex-col shadow-lg z-10">
        
        {/* Logo and App Name - Aligned and Divided */}
        <div className="pt-8 pb-6 px-6 flex items-center gap-3 border-b border-[#4d4d4b]">
          <img src={fnLogo} alt="Field Nation Logo" className="w-8 h-8 object-contain" />
          <span className="text-xl font-bold text-white tracking-tight">FieldOps</span>
        </div>
        
        {/* Navigation Menu */}
        <nav className="flex-1 px-4 space-y-1 mt-8">
          <SidebarItem to="/" icon={LayoutDashboard} label="Dashboard" />
          <SidebarItem to="/initiatives" icon={FolderKanban} label="Initiatives" />
          <SidebarItem to="/campaigns" icon={Megaphone} label="Marketing Campaigns" />
          <SidebarItem to="/goals" icon={Target} label="Goals" />
        </nav>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {children}
      </main>
    </div>
  );
};

export default function App() {
  return (
    <Router>
      <AppLayout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/initiatives" element={<Initiatives />} />
          <Route path="/campaigns" element={<Campaigns />} />
          <Route path="/goals" element={<Goals />} />
        </Routes>
      </AppLayout>
    </Router>
  );
}