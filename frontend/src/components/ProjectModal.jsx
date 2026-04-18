import React, { useState, useEffect } from 'react';
import { X, Save, Folder, Users } from 'lucide-react';

export default function ProjectModal({ isOpen, onClose, currentUser, refreshProjects }) {
  const [name, setName] = useState('');
  const [dbUsers, setDbUsers] = useState([]);
  const [selectedMembers, setSelectedMembers] = useState([]);

  // Fetch users when the modal opens
  useEffect(() => {
    if (isOpen) {
      const fetchUsers = async () => {
        try {
          const res = await fetch('http://localhost:5002/api/users');
          if (res.ok) setDbUsers(await res.json());
        } catch (error) {
          console.error("Error fetching users:", error);
        }
      };
      fetchUsers();
      
      // Reset form and auto-select the current user
      setName('');
      setSelectedMembers([currentUser.id]);
    }
  }, [isOpen, currentUser]);

  const toggleMember = (id) => {
    setSelectedMembers(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!name.trim()) return alert("Please enter a project name.");
    
    try {
      const response = await fetch('http://localhost:5002/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name,
          department: currentUser.department,
          members: selectedMembers
        })
      });

      if (!response.ok) throw new Error('Failed to create project');
      
      refreshProjects();
      onClose();
    } catch (error) {
      console.error("Error creating project:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-sm transition-opacity" onClick={onClose}></div>

      <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col transform transition-transform border-l border-gray-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <h2 className="text-xl font-bold text-brand-dark flex items-center gap-2">
            <Folder size={20} className="text-brand-orange" /> Create Project
          </h2>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Project Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Digital Brief 2026"
              className="w-full border-gray-300 rounded-lg shadow-sm focus:border-brand-orange focus:ring-brand-orange text-sm"
              autoFocus
            />
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-semibold text-gray-700 mb-3 border-b pb-2">
              <Users size={16} className="text-brand-orange" /> Team Access
            </label>
            <div className="space-y-2">
              {dbUsers.map(user => (
                <label key={user.id} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 cursor-pointer border border-transparent hover:border-gray-100 transition-colors">
                  <input 
                    type="checkbox"
                    checked={selectedMembers.includes(user.id)}
                    onChange={() => toggleMember(user.id)}
                    disabled={user.id === currentUser.id} // Cannot remove yourself
                    className="rounded text-brand-orange focus:ring-brand-orange"
                  />
                  <div>
                    <div className="text-sm font-bold text-gray-800">{user.username}</div>
                    <div className="text-xs text-gray-400">{user.role}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-white flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors">
            Cancel
          </button>
          <button onClick={handleSave} className="px-6 py-2 flex items-center gap-2 text-sm font-bold text-white bg-brand-orange rounded-lg hover:bg-[#e65a00] shadow-md transition-colors">
            <Save size={16} /> Create Project
          </button>
        </div>

      </div>
    </div>
  );
}