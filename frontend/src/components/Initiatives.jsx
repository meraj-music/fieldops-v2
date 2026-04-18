import React, { useState, useEffect, useMemo, useCallback, lazy, Suspense, useRef } from 'react';
import { ChevronDown, ChevronRight, Plus, ArrowRightCircle, CheckSquare, XCircle, Trash2, Users, Folder } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const InitiativeModal = lazy(() => import('./InitiativeModal'));
const ProjectModal = lazy(() => import('./ProjectModal'));

const getDueDateColor = (dateString) => {
  if (!dateString) return 'text-gray-500';
  const due = new Date(dateString);
  const now = new Date();
  const diffDays = Math.ceil((due - now) / (1000 * 60 * 60 * 24));
  if (diffDays < 0) return 'text-red-600 font-bold';
  if (diffDays <= 3) return 'text-orange-500 font-bold';
  if (diffDays <= 7) return 'text-yellow-600 font-medium';
  return 'text-green-600';
};

// UPDATE YOUR IMPORTS AT THE TOP OF THE FILE:
// import { ChevronDown, ChevronRight, Plus, ArrowRightCircle, CheckSquare, XCircle, Trash2, Users, Folder } from 'lucide-react';

const InitiativeRow = React.memo(({ init, index, isManagerTeamGoals, handleStatusChange, setSelectedInitiative, setIsModalOpen }) => {
  return (
    <tr className="border-b border-gray-100 hover:bg-brand-light transition-colors group">
      <td className="p-3 text-center text-gray-400">{index + 1}</td>
      {isManagerTeamGoals && <td className="p-3 text-sm font-medium">{init.owner_name}</td>}
      <td className="p-3 text-base font-bold text-brand-dark">{init.title}</td>
      <td className={`p-3 text-sm ${getDueDateColor(init.due_date)}`}>{init.due_date ? new Date(init.due_date).toLocaleDateString() : ''}</td>
      
      {/* FIXED: Truncated text so it doesn't break the table width */}
      <td className="p-3 text-xs text-gray-600 max-w-[150px] truncate" title={init.description}>
        {init.description || 'No updates'}
      </td>
      <td className="p-3 text-xs text-gray-600 max-w-[150px] truncate" title={init.next_action}>
        {init.next_action || 'None'}
      </td>
      
      {/* FIXED: New Icon and proper alignment */}
      <td className="p-3 text-center w-12">
        <button onClick={() => { setSelectedInitiative(init); setIsModalOpen(true); }} className="text-gray-400 hover:text-brand-orange transition-colors" title="Open Details">
          <ArrowRightCircle size={20} strokeWidth={1.5} />
        </button>
      </td>
      <td className="p-3 text-center w-12">
        <button onClick={() => handleStatusChange(init.id, 'Done')} className="text-gray-300 hover:text-green-500 transition-colors" title="Mark Complete">
          <CheckSquare size={18} />
        </button>
      </td>
      {!isManagerTeamGoals && (
        <td className="p-3 text-center w-12">
          <button onClick={() => handleStatusChange(init.id, 'Cancelled')} className="text-gray-300 hover:text-red-500 transition-colors" title="Cancel Initiative">
            <XCircle size={18} />
          </button>
        </td>
      )}
    </tr>
  );
});

export default function Initiatives() {
  const currentUser = useMemo(() => ({ id: 1, role: 'Manager', name: 'CSManager1', department: 'CS' }), []);
  
  const [isDirectoryOpen, setIsDirectoryOpen] = useState(false);
  const directoryRef = useRef(null); // NEW: Ref for clicking outside
  const [allUsers, setAllUsers] = useState([]);
  
  const [activeBoard, setActiveBoard] = useState('Team'); 
  const [activeProjectId, setActiveProjectId] = useState(null); 
  const [goalView, setGoalView] = useState('My Goals'); 
  
  const [initiatives, setInitiatives] = useState([]);
  const [projects, setProjects] = useState([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedInitiative, setSelectedInitiative] = useState(null);
  const [isProjectModalOpen, setIsProjectModalOpen] = useState(false);

  const [expandedSections, setExpandedSections] = useState({
    'Ideation': true, 'In Progress': true, 'Done': true, 'Cancelled': false
  });

  // NEW: Click outside listener for the Directory dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (directoryRef.current && !directoryRef.current.contains(event.target)) {
        setIsDirectoryOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    console.log("Fetching directory users...");
    fetch('http://localhost:5002/api/users')
      .then(res => {
        if (!res.ok) throw new Error("Server not responding");
        return res.json();
      })
      .then(data => {
        console.log("Successfully loaded users:", data.length);
        setAllUsers(data);
      })
      .catch(err => {
        console.error("Directory Fetch Error:", err);
        // If it fails, maybe the server isn't up?
      });
  }, []);

  const fetchProjects = useCallback(async () => {
    try {
      const res = await fetch(`http://localhost:5002/api/projects?user_id=${currentUser.id}&role=${currentUser.role}&department=${currentUser.department}`);
      if (res.ok) setProjects(await res.json());
    } catch (error) { console.error(error); }
  }, [currentUser]);

  const fetchInitiatives = useCallback(async () => {
    try {
      const queryParams = new URLSearchParams({ department: currentUser.department, user_id: currentUser.id });
      if (activeProjectId) queryParams.set('project_id', activeProjectId);
      else {
        queryParams.set('board_type', activeBoard);
        if (activeBoard === 'Goals' && goalView === 'Team Goals') queryParams.delete('user_id');
      }
      const response = await fetch(`http://localhost:5002/api/initiatives?${queryParams}`);
      if (response.ok) setInitiatives(await response.json());
    } catch (error) { console.error(error); }
  }, [currentUser, activeProjectId, activeBoard, goalView]);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);
  useEffect(() => { fetchInitiatives(); }, [fetchInitiatives]);

  const groupedInitiatives = useMemo(() => ({
    'Ideation': initiatives.filter(i => i.status === 'Ideation'),
    'In Progress': initiatives.filter(i => i.status === 'In Progress'),
    'Done': initiatives.filter(i => i.status === 'Done'),
    'Cancelled': initiatives.filter(i => i.status === 'Cancelled'),
  }), [initiatives]);

  const toggleSection = useCallback((section) => setExpandedSections(prev => ({ ...prev, [section]: !prev[section] })), []);

  const handleStatusChange = useCallback(async (id, newStatus) => {
    setInitiatives(prev => prev.map(init => init.id === id ? { ...init, status: newStatus } : init));
    try {
      await fetch(`http://localhost:5002/api/initiatives/${id}/status`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status: newStatus })
      });
      fetchInitiatives(); 
    } catch (error) { fetchInitiatives(); }
  }, [fetchInitiatives]);

  const deleteOldestCancelled = async () => {
    try {
      const res = await fetch(`http://localhost:5002/api/initiatives/cleanup/cancelled`, { method: 'DELETE' });
      if (res.ok) fetchInitiatives();
    } catch (error) { console.error(error); }
  };

  const renderTableSection = (statusName) => {
    const sectionInitiatives = groupedInitiatives[statusName];
    const isExpanded = expandedSections[statusName];
    const isManagerTeamGoals = activeBoard === 'Goals' && goalView === 'Team Goals' && currentUser.role.includes('manager');

    return (
      <div key={statusName} className="mb-6">
        <div className="flex items-center justify-between bg-white px-4 py-2 rounded-t-lg border-b-2 border-brand-orange cursor-pointer shadow-sm" onClick={() => toggleSection(statusName)}>
          <div className="flex items-center gap-2">
            {isExpanded ? <ChevronDown size={20} className="text-gray-500" /> : <ChevronRight size={20} className="text-gray-500" />}
            <h2 className="text-lg font-bold text-brand-dark">{statusName} <span className="text-sm font-normal text-gray-400 ml-2">({sectionInitiatives.length})</span></h2>
          </div>
          {statusName === 'Cancelled' && isExpanded && sectionInitiatives.length > 0 && (
             <button onClick={(e) => { e.stopPropagation(); deleteOldestCancelled(); }} className="text-xs flex items-center gap-1 text-red-500 hover:text-red-700 bg-red-50 px-2 py-1 rounded"><Trash2 size={14} /> Delete Oldest</button>
          )}
        </div>

        {isExpanded && (
          <div className="bg-white rounded-b-lg shadow-sm overflow-hidden">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                  <th className="p-3 w-12 text-center">#</th>
                  {isManagerTeamGoals && <th className="p-3 w-32">Owner</th>}
                  <th className="p-3 min-w-[200px]">Initiative</th>
                  <th className="p-3 w-32">Due Date</th>
                  <th className="p-3 w-48">Last Update</th>
                  <th className="p-3 w-48">Next Action</th>
                  <th className="p-3 w-12"></th><th className="p-3 w-12"></th>{!isManagerTeamGoals && <th className="p-3 w-12"></th>}
                </tr>
              </thead>
              <tbody>
                {sectionInitiatives.length === 0 ? (
                  <tr><td colSpan="9" className="p-4 text-center text-gray-400 italic">No initiatives in this section.</td></tr>
                ) : (
                  sectionInitiatives.map((init, index) => (
                    <InitiativeRow 
                      key={init.id} init={init} index={index} isManagerTeamGoals={isManagerTeamGoals} 
                      handleStatusChange={handleStatusChange} setSelectedInitiative={setSelectedInitiative} setIsModalOpen={setIsModalOpen} 
                    />
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const boardVariants = { hidden: { opacity: 0 }, visible: { opacity: 1, transition: { duration: 0.25 } }, exit: { opacity: 0 } };

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div className="flex items-center gap-4 flex-wrap w-full md:w-auto z-10">
          <div className="flex items-center bg-gray-200 p-1 rounded-lg">
            <button onClick={() => setIsProjectModalOpen(true)} className="px-2 py-1.5 text-gray-500 hover:text-brand-orange transition-colors" title="Create New Project"><Plus size={18} /></button>
            {projects.length > 0 && <div className="h-4 w-px bg-gray-300 mx-1"></div>}
            {projects.map(project => (
              <button key={project.id} onClick={() => { setActiveBoard('Project'); setActiveProjectId(project.id); }} className={`flex items-center gap-1 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${activeProjectId === project.id ? 'bg-white shadow text-brand-orange' : 'text-gray-600 hover:text-gray-900'}`}><Folder size={14} /> {project.name}</button>
            ))}
          </div>

          <div className="flex bg-gray-200 p-1 rounded-lg">
            {['Team', 'Goals', 'Personal'].map(board => (
              <button key={board} onClick={() => { setActiveProjectId(null); setActiveBoard(board); }} className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${activeBoard === board && !activeProjectId ? 'bg-white shadow text-brand-orange' : 'text-gray-600 hover:text-gray-900'}`}>{board}</button>
            ))}
          </div>

          <div className="relative shrink-0" ref={directoryRef}>
            <button onClick={() => setIsDirectoryOpen(!isDirectoryOpen)} className="flex items-center gap-2 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50"><Users size={16} /> Directory <ChevronDown size={14} /></button>
            {isDirectoryOpen && (
              <div className="absolute left-0 top-full mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-xl z-50">
                <div className="p-2 border-b border-gray-100 bg-gray-50 rounded-t-lg text-xs font-bold text-gray-500 uppercase tracking-wider">Team Members</div>
                <div className="max-h-64 overflow-y-auto">
                  {allUsers.map(user => (
                    <div key={user.id} className="px-4 py-2 hover:bg-brand-orange hover:text-white cursor-pointer text-sm transition-colors"><div className="font-bold">{user.username}</div><div className="text-xs opacity-75">{user.department} • {user.role}</div></div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        <button onClick={() => { setSelectedInitiative(null); setIsModalOpen(true); }} className="shrink-0 flex items-center gap-2 bg-brand-orange hover:bg-orange-600 text-white px-5 py-2 rounded-lg font-bold shadow-md transition-colors"><Plus size={20} /> Add Task</button>
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={activeProjectId || activeBoard} className="space-y-4" variants={boardVariants} initial="hidden" animate="visible" exit="exit">
          {renderTableSection('Ideation')}
          {renderTableSection('In Progress')}
          {renderTableSection('Done')}
          {renderTableSection('Cancelled')}
        </motion.div>
      </AnimatePresence>

      <Suspense fallback={<div className="hidden">Loading...</div>}>
        <InitiativeModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} initiative={selectedInitiative} currentUser={currentUser} refreshData={fetchInitiatives} activeProjectId={activeProjectId} activeBoard={activeBoard} />
        <ProjectModal isOpen={isProjectModalOpen} onClose={() => setIsProjectModalOpen(false)} currentUser={currentUser} refreshProjects={fetchProjects} />
      </Suspense>
    </div>
  );
}