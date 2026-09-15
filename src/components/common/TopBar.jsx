import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { getCases } from '../../services/caseService';
import { useNavigate, useLocation } from 'react-router-dom';
import { Shield, Clock, User, ChevronDown, Check, ExternalLink, ShieldCheck, Key } from 'lucide-react';

export const TopBar = () => {
  const { currentUser, switchRole, activeCaseId, setActiveCaseId } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [caseDropdownOpen, setCaseDropdownOpen] = useState(false);
  const [roleDropdownOpen, setRoleDropdownOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState('');
  const [cases, setCases] = useState([]);

  useEffect(() => {
    const fetchCases = async () => {
      const data = await getCases();
      setCases(data);
    };
    fetchCases();
    
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toISOString().replace('T', ' ').slice(0, 19) + ' UTC');
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []); // run only once on mount

  const activeCase = cases.find(c => c.id === activeCaseId) || cases[0] || {
    firNumber: 'NO-CASE-ACTIVE',
    policeStation: 'None',
    title: 'No case available'
  };

  const handleSelectCase = (caseId) => {
    setActiveCaseId(caseId);
    setCaseDropdownOpen(false);
    if (location.pathname.startsWith('/cases/')) {
      navigate(`/cases/${caseId}`);
    }
  };

  const handleRoleSelect = (role) => {
    switchRole(role);
    setRoleDropdownOpen(false);
  };

  return (
    <header className="h-14 bg-forensic-900 border-b border-forensic-border px-4 flex items-center justify-between z-30 sticky top-0">
      {/* Active Case Context Switcher */}
      <div className="flex items-center gap-3">
        <div className="relative">
          <button
            onClick={() => setCaseDropdownOpen(!caseDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-forensic-850 hover:bg-forensic-800 border border-forensic-border text-left transition-colors text-xs"
          >
            <div className="w-2 h-2 rounded-full bg-forensic-cyan"></div>
            <div>
              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-mono">Active Investigation</div>
              <div className="font-semibold text-slate-200 flex items-center gap-1.5">
                <span>{activeCase.firNumber}</span>
                <span className="text-slate-500 text-[10px]">({(activeCase.policeStation || '').slice(0, 24)}...)</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </div>
            </div>
          </button>

          {caseDropdownOpen && (
            <div className="absolute left-0 mt-1 w-80 bg-forensic-900 border border-forensic-border rounded-lg shadow-2xl py-1 z-50 text-xs">
              <div className="px-3 py-1.5 border-b border-forensic-border text-[10px] text-slate-400 uppercase font-mono">
                Switch Forensic Case
              </div>
              {cases.map(c => (
                <button
                  key={c.id}
                  onClick={() => handleSelectCase(c.id)}
                  className={`w-full text-left px-3 py-2 hover:bg-forensic-800 flex items-start justify-between ${
                    c.id === activeCaseId ? 'bg-forensic-800/80 text-forensic-cyan' : 'text-slate-300'
                  }`}
                >
                  <div>
                    <div className="font-semibold">{c.firNumber}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-[200px]">{c.title}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{c.policeStation}</div>
                  </div>
                  {c.id === activeCaseId && <Check className="w-4 h-4 text-forensic-cyan mt-1" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Center Forensic Clock */}
      <div className="hidden lg:flex items-center gap-2 text-xs font-mono bg-forensic-950/80 px-3 py-1 rounded border border-forensic-border/70 text-slate-300">
        <Clock className="w-3.5 h-3.5 text-forensic-cyan" />
        <span className="text-slate-400">LEGAL EVIDENCE TIMECODE:</span>
        <span className="text-cyan-300 font-bold">{currentTime}</span>
      </div>

      {/* Right User & Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Role Quick Switcher */}
        <div className="relative">
          <button
            onClick={() => setRoleDropdownOpen(!roleDropdownOpen)}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-forensic-850 hover:bg-forensic-800 border border-forensic-border text-xs transition-colors"
          >
            <div className="text-right">
              <div className="font-semibold text-slate-200">{currentUser.name}</div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center justify-end gap-1">
                <span>{currentUser.badgeNumber}</span>
                <span className="text-slate-600">•</span>
                <span className={`font-bold ${
                  currentUser.role === 'Admin' ? 'text-red-400' : currentUser.role === 'Reviewer' ? 'text-amber-400' : 'text-forensic-cyan'
                }`}>
                  {currentUser.role}
                </span>
              </div>
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs border ${
              currentUser.role === 'Admin'
                ? 'bg-red-950 border-red-500/50 text-red-300'
                : currentUser.role === 'Reviewer'
                ? 'bg-amber-950 border-amber-500/50 text-amber-300'
                : 'bg-forensic-800 border-forensic-cyan/50 text-forensic-cyan'
            }`}>
              {currentUser.avatar}
            </div>
            <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
          </button>

          {roleDropdownOpen && (
            <div className="absolute right-0 mt-1 w-64 bg-forensic-900 border border-forensic-border rounded-lg shadow-2xl py-1 z-50 text-xs">
              <div className="px-3 py-1.5 border-b border-forensic-border text-[10px] text-slate-400 uppercase font-mono">
                Switch Operational Role (Demo Auth)
              </div>
              <button
                onClick={() => handleRoleSelect('Investigator')}
                className={`w-full text-left px-3 py-2 hover:bg-forensic-800 flex items-center justify-between ${
                  currentUser.role === 'Investigator' ? 'bg-forensic-800 text-forensic-cyan' : 'text-slate-300'
                }`}
              >
                <div>
                  <div className="font-semibold">Investigator (Field/IO)</div>
                  <div className="text-[10px] text-slate-400">Upload evidence, ingest, timeline scrub</div>
                </div>
                {currentUser.role === 'Investigator' && <Check className="w-4 h-4 text-forensic-cyan" />}
              </button>
              <button
                onClick={() => handleRoleSelect('Reviewer')}
                className={`w-full text-left px-3 py-2 hover:bg-forensic-800 flex items-center justify-between ${
                  currentUser.role === 'Reviewer' ? 'bg-forensic-800 text-amber-400' : 'text-slate-300'
                }`}
              >
                <div>
                  <div className="font-semibold">Forensic Reviewer / SSO</div>
                  <div className="text-[10px] text-slate-400">Deep scan, report sign-off, chain audit</div>
                </div>
                {currentUser.role === 'Reviewer' && <Check className="w-4 h-4 text-amber-400" />}
              </button>
              <button
                onClick={() => handleRoleSelect('Admin')}
                className={`w-full text-left px-3 py-2 hover:bg-forensic-800 flex items-center justify-between ${
                  currentUser.role === 'Admin' ? 'bg-forensic-800 text-red-400' : 'text-slate-300'
                }`}
              >
                <div>
                  <div className="font-semibold">Forensic Lab Admin</div>
                  <div className="text-[10px] text-slate-400">Vendor library, signatures, user access</div>
                </div>
                {currentUser.role === 'Admin' && <Check className="w-4 h-4 text-red-400" />}
              </button>

              <div className="p-2 border-t border-forensic-border">
                <button
                  onClick={() => { setRoleDropdownOpen(false); navigate('/login'); }}
                  className="w-full text-center py-1 text-slate-400 hover:text-slate-200 text-[11px]"
                >
                  Switch Account via Login Screen
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
