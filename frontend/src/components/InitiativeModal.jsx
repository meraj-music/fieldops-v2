import React, { useState, useEffect, useCallback } from 'react';
import { X, Send, Link as LinkIcon, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function InitiativeModal({ isOpen, onClose, initiative, currentUser, refreshData, activeProjectId, activeBoard }) {
  const [formData, setFormData] = useState({
    title: '', description: '', status: 'Ideation', due_date: '',
    next_action: '', last_update: '', raci_supervising: [], raci_responsible: [], raci_consulted_informed: []
  });

  const [dbUsers, setDbUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [resources, setResources] = useState([]);
  const [newResource, setNewResource] = useState({ title: '', url: '' });

  const fetchUsers = useCallback(async () => {
    try {
      const res = await fetch('http://localhost:5002/api/users');
      if (res.ok) setDbUsers(await res.json());
    } catch (error) { console.error("User Fetch Error:", error); }
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    fetchUsers();

    if (initiative) {
      setFormData({
        title: initiative.title || '',
        description: initiative.description || '',
        status: initiative.status || 'Ideation',
        due_date: initiative.due_date && initiative.due_date !== 'null' ? new Date(initiative.due_date).toISOString().split('T')[0] : '',
        next_action: initiative.next_action || '',
        last_update: initiative.last_update || '',
        raci_supervising: initiative.supervising_name ? initiative.supervising_name.split(', ') : [],
        raci_responsible: initiative.owner_name ? initiative.owner_name.split(', ') : [],
        raci_consulted_informed: initiative.raci_consulted_informed || []
      });
      fetch(`http://localhost:5002/api/initiatives/${initiative.id}/comments`).then(res => res.json()).then(setComments).catch(console.error);
      fetch(`http://localhost:5002/api/initiatives/${initiative.id}/resources`).then(res => res.json()).then(setResources).catch(console.error);
    } else {
      setFormData({ title: '', description: '', status: 'Ideation', due_date: '', next_action: '', last_update: '', raci_supervising: [], raci_responsible: [], raci_consulted_informed: [] });
      setComments([]); setResources([]); setNewResource({ title: '', url: '' });
    }
  }, [initiative, isOpen, fetchUsers]);

  const handleInputChange = (e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    try {
      const url = initiative ? `http://localhost:5002/api/initiatives/${initiative.id}` : 'http://localhost:5002/api/initiatives';
      const payload = { 
        ...formData, 
        supervising_name: formData.raci_supervising.join(', '),
        owner_name: formData.raci_responsible.join(', '), 
        department: currentUser.department, 
        board_type: activeProjectId ? 'Project' : activeBoard, 
        owner_id: currentUser.id, 
        project_id: activeProjectId || null 
      };
      
      const response = await fetch(url, { method: initiative ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      
      if (!response.ok) {
        const errorText = await response.text();
        alert(`Server Error: ${errorText}`);
        return; 
      }
      refreshData(); onClose();
    } catch (error) { 
      console.error(error); 
      alert("Network Error: Could not reach backend."); 
    }
  };

  const handlePostComment = async () => {
    if (!newComment.trim() || !initiative) return;
    try {
      const res = await fetch(`http://localhost:5002/api/initiatives/${initiative.id}/comments`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: currentUser.id, content: newComment })
      });
      if (res.ok) { setNewComment(''); fetch(`http://localhost:5002/api/initiatives/${initiative.id}/comments`).then(r => r.json()).then(setComments); }
    } catch (error) { console.error(error); }
  };

  const handleAddResource = async () => {
    if (!newResource.title.trim() || !newResource.url.trim() || !initiative) return;
    try {
      const res = await fetch(`http://localhost:5002/api/initiatives/${initiative.id}/resources`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newResource.title, url: newResource.url })
      });
      if (res.ok) { 
        setNewResource({ title: '', url: '' }); 
        fetch(`http://localhost:5002/api/initiatives/${initiative.id}/resources`).then(r => r.json()).then(setResources); 
      }
    } catch (error) { console.error(error); }
  };

  const overlayVariants = { hidden: { opacity: 0 }, visible: { opacity: 1 }, exit: { opacity: 0 } };
  const modalVariants = { 
    hidden: { x: '100%' }, 
    visible: { x: 0, transition: { type: 'tween', ease: 'easeInOut', duration: 0.35 } }, 
    exit: { x: '100%', transition: { type: 'tween', ease: 'easeInOut', duration: 0.3 } } 
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <motion.div className="fixed inset-0 bg-black/25 backdrop-blur-[1px]" variants={overlayVariants} initial="hidden" animate="visible" exit="exit" onClick={onClose} />
          
          <motion.div className={`relative w-full h-full bg-white shadow-2xl flex flex-col border-l border-gray-100 ${initiative ? 'max-w-3xl' : 'max-w-xl'}`} variants={modalVariants} initial="hidden" animate="visible" exit="exit">
            
            <div className="flex items-center justify-between px-8 py-5 border-b border-gray-100">
              <h2 className="text-lg font-bold text-gray-800">{initiative ? 'Task Details' : 'Create New Task'}</h2>
              <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all"><X size={20} /></button>
            </div>

            <div className="flex-1 overflow-y-auto px-8 py-8 space-y-10 pb-40">
              <input type="text" name="title" value={formData.title} onChange={handleInputChange} placeholder="Untitled Task" className="w-full text-3xl font-bold text-gray-900 border-none p-0 focus:ring-0 placeholder-gray-200" />

              <div className="space-y-8">
                <div className="grid grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Status</label>
                    <select name="status" value={formData.status} onChange={handleInputChange} className="w-full border-gray-200 rounded-xl text-sm py-2.5 focus:border-brand-orange focus:ring-brand-orange">
                      <option value="Ideation">Ideation</option><option value="In Progress">In Progress</option><option value="Done">Done</option><option value="Cancelled">Cancelled</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Due Date</label>
                    <input type="date" name="due_date" value={formData.due_date} onChange={handleInputChange} className="w-full border-gray-200 rounded-xl text-sm py-2.5 focus:border-brand-orange focus:ring-brand-orange" />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Description</label>
                  <textarea name="description" value={formData.description} onChange={handleInputChange} rows="4" placeholder="Add a detailed description..." className="w-full border-gray-200 rounded-xl text-sm focus:border-brand-orange focus:ring-brand-orange" />
                </div>

                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Last Update</label>
                    <input type="text" name="last_update" value={formData.last_update} onChange={handleInputChange} placeholder="What was the latest progress?" className="w-full border-gray-200 rounded-xl text-sm py-2.5 focus:border-brand-orange focus:ring-brand-orange" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Next Action</label>
                    <input type="text" name="next_action" value={formData.next_action} onChange={handleInputChange} placeholder="What needs to happen next?" className="w-full border-gray-200 rounded-xl text-sm py-2.5 focus:border-brand-orange focus:ring-brand-orange" />
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100 space-y-6">
                   <h3 className="text-sm font-bold text-gray-800">Share With</h3>
                   
                   <div className="space-y-5">
                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Supervising</label>
                        <select onChange={(e) => {
                          const v = e.target.value;
                          if (v && !formData.raci_supervising.includes(v)) setFormData(prev => ({...prev, raci_supervising: [...prev.raci_supervising, v]}));
                          e.target.value = "";
                        }} className="w-full border-gray-200 rounded-xl text-sm py-2">
                          <option value="">Add member...</option>
                          {dbUsers.map(u => <option key={u.id} value={u.username}>{u.username}</option>)}
                        </select>
                        <div className="flex flex-wrap gap-2">{formData.raci_supervising.map((u, i) => (
                          <span key={i} className="flex items-center gap-2 px-3 py-1 bg-gray-100 text-[11px] font-bold rounded-lg border border-gray-200">{u} <X size={12} className="cursor-pointer text-gray-400 hover:text-red-500" onClick={() => setFormData(prev => ({...prev, raci_supervising: prev.raci_supervising.filter((_, idx) => idx !== i)}))} /></span>
                        ))}</div>
                      </div>

                      <div className="space-y-2">
                        <label className="text-[10px] font-bold text-gray-400 uppercase">Responsible</label>
                        <select onChange={(e) => {
                          const v = e.target.value;
                          if (v && !formData.raci_responsible.includes(v)) setFormData(prev => ({...prev, raci_responsible: [...prev.raci_responsible, v]}));
                          e.target.value = "";
                        }} className="w-full border-gray-200 rounded-xl text-sm py-2">
                          <option value="">Add member...</option>
                          {dbUsers.map(u => <option key={u.id} value={u.username}>{u.username}</option>)}
                        </select>
                        <div className="flex flex-wrap gap-2">{formData.raci_responsible.map((u, i) => (
                          <span key={i} className="flex items-center gap-2 px-3 py-1 bg-brand-orange/5 text-brand-orange text-[11px] font-bold rounded-lg border border-brand-orange/20">{u} <X size={12} className="cursor-pointer hover:text-red-500" onClick={() => setFormData(prev => ({...prev, raci_responsible: prev.raci_responsible.filter((_, idx) => idx !== i)}))} /></span>
                        ))}</div>
                      </div>
                   </div>
                </div>
              </div>

              {initiative && (
                <div className="pt-10 border-t border-gray-100 grid grid-cols-1 md:grid-cols-2 gap-8">
                  
                  {/* RESOURCES FIX: Stacked layout with min-w-0 to prevent overlap */}
                  <div className="flex flex-col min-w-0 space-y-4">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Resources</label>
                    
                    <div className="flex flex-col gap-2 bg-gray-50 p-3 rounded-2xl border border-gray-100">
                      <input type="text" value={newResource.title} onChange={e => setNewResource({...newResource, title: e.target.value})} placeholder="Link Title (e.g. Figma Design)" className="w-full text-sm border-gray-200 rounded-xl px-3 py-2 bg-white" />
                      <div className="flex gap-2">
                        <input type="url" value={newResource.url} onChange={e => setNewResource({...newResource, url: e.target.value})} placeholder="https://..." className="flex-1 text-sm border-gray-200 rounded-xl px-3 py-2 bg-white" />
                        <button onClick={handleAddResource} className="px-4 py-2 bg-gray-900 text-white text-xs font-bold rounded-xl hover:bg-gray-800 transition-colors shadow-md">Add</button>
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 mt-2">
                      {resources.length === 0 && <div className="text-xs text-gray-400 italic px-2">No resources attached yet.</div>}
                      {resources.map(r => (
                        <div key={r.id} className="flex items-center justify-between p-3 bg-white border border-gray-200 shadow-sm rounded-xl text-xs overflow-hidden">
                          <a href={r.url} target="_blank" rel="noreferrer" className="text-brand-orange font-bold hover:underline flex items-center gap-2 truncate"><LinkIcon size={12} className="shrink-0"/> <span className="truncate">{r.title}</span></a>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* DISCUSSION FIX: min-w-0 added here as well */}
                  <div className="flex flex-col min-w-0 space-y-4">
                    <label className="text-[11px] font-bold uppercase tracking-widest text-gray-400">Discussion</label>
                    <div className="bg-gray-50 rounded-2xl p-4 h-64 overflow-y-auto flex flex-col space-y-4 border border-gray-100">
                      {comments.length === 0 && <div className="text-xs text-gray-400 italic text-center mt-4">No comments yet.</div>}
                      {comments.map(c => (
                        <div key={c.id} className="bg-white p-3 rounded-xl shadow-sm border border-gray-100">
                          <div className="flex justify-between items-start mb-1 gap-2">
                            <div className="font-bold text-[11px] text-gray-900 truncate">{c.username}</div>
                            <div className="text-[9px] text-gray-400 font-medium whitespace-nowrap">
                              {new Date(c.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                          <div className="text-gray-600 text-xs leading-relaxed break-words">{c.content}</div>
                        </div>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input type="text" value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a comment..." className="flex-1 text-sm border-gray-200 rounded-xl px-4" />
                      <button onClick={handlePostComment} className="p-2.5 bg-brand-orange text-white rounded-xl shadow-orange-200 shadow-lg hover:bg-orange-600 shrink-0"><Send size={16} /></button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="absolute bottom-0 left-0 right-0 p-6 bg-white border-t border-gray-100 flex gap-3 shadow-[0_-10px_40px_rgba(0,0,0,0.04)]">
              <button onClick={onClose} className="flex-1 py-3 text-sm font-bold text-gray-400 hover:text-gray-600 transition-colors">Cancel</button>
              <button onClick={handleSave} className="flex-[2] py-3 text-sm font-bold bg-brand-orange text-white rounded-xl shadow-lg shadow-orange-200 hover:bg-orange-600 transition-all">Save Changes</button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}