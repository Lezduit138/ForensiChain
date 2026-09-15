import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCases } from '../services/caseService';
import { StatusBadge } from '../components/common/StatusBadge';
import {
  FolderLock,
  Search,
  Filter,
  ChevronRight,
  ShieldAlert,
  Calendar,
  User,
  Plus
} from 'lucide-react';

export const CaseList = () => {
  const { setActiveCaseId, currentUser } = useAuth();
  const canCreateCase = currentUser?.role === 'Investigator' || currentUser?.role === 'Admin';
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchCases = async () => {
  setLoading(true);

  try {
    const data = await getCases(searchQuery, statusFilter);

    console.log('CASES FROM BACKEND:', data);

    setCases(data);
  } catch (error) {
    console.error('FAILED TO LOAD CASES:', error);
    setCases([]);
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
    fetchCases();
  }, [searchQuery, statusFilter]);

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 uppercase tracking-wide flex items-center gap-2">
            <FolderLock className="w-5 h-5 text-forensic-cyan" />
            Evidentiary Case Repository
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Centralized register of all seized DVR/NVR units under judicial examination
          </p>
        </div>

        {canCreateCase && (
          <button
            onClick={() => navigate('/dashboard')}
            className="flex items-center gap-2 px-3 py-1.5 bg-forensic-cyan text-black font-bold rounded-lg hover:bg-cyan-300 text-xs shadow-glow-cyan"
          >
            <Plus className="w-4 h-4" />
            <span>New Case Ingestion</span>
          </button>
        )}
      </div>

      {/* Filter & Search Bar */}
      <div className="bg-forensic-900 border border-forensic-border rounded-xl p-3 flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Search by FIR, Police Station, Officer, or Keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-forensic-950 border border-forensic-border rounded-lg pl-9 pr-3 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-forensic-cyan font-mono"
          />
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-1.5 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
          {[
            { id: 'ALL', label: 'All Cases' },
            { id: 'Open', label: 'Open' },
            { id: 'Analysis In Progress', label: 'In Progress' },
            { id: 'Pending Review', label: 'Pending Review' },
            { id: 'Closed', label: 'Closed' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={`px-3 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                statusFilter === tab.id
                  ? 'bg-forensic-800 text-forensic-cyan border border-forensic-cyan/40 font-bold'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-forensic-850'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table of Cases */}
      <div className="bg-forensic-900 border border-forensic-border rounded-xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-forensic-850 border-b border-forensic-border text-slate-400 font-mono text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4">Case / FIR No.</th>
                <th className="py-3 px-4">Police Station & Jurisdiction</th>
                <th className="py-3 px-4">Assigned Investigator</th>
                <th className="py-3 px-4">Seizure Date</th>
                <th className="py-3 px-4 text-center">Priority</th>
                <th className="py-3 px-4 text-center">DVR Units</th>
                <th className="py-3 px-4 text-center">Tamper Flags</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forensic-border/60">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-mono">
                    Querying encrypted case ledger...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-500 font-mono">
                    No matching forensic cases found for query.
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => {
                      setActiveCaseId(c.id);
                      navigate(`/cases/${c.id}`);
                    }}
                    className="hover:bg-forensic-850/80 cursor-pointer transition-colors group"
                  >
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-100 font-mono group-hover:text-forensic-cyan transition-colors">
                        {c.firNumber}
                      </div>
                      <div className="text-[11px] text-slate-400 truncate max-w-sm">
                        {c.title}
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-200">{c.policeStation}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{c.jurisdiction}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-300">
                      <div className="flex items-center gap-1.5">
                        <User className="w-3 h-3 text-slate-500" />
                        <span>{c.investigatingOfficer}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-mono text-slate-400">
                      {c.dateOpened}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                        c.priority === 'Critical' ? 'bg-red-950/80 text-red-300 border-red-500/50 font-bold' :
                        c.priority === 'High' ? 'bg-amber-950/80 text-amber-300 border-amber-500/50' :
                        'bg-forensic-950 text-slate-400 border-forensic-border'
                      }`}>
                        {c.priority}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-cyan-300">
                      {c.evidenceCount}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {c.tamperFlagsCount > 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-red-300 font-mono font-bold text-[11px]">
                          <ShieldAlert className="w-3 h-3 text-red-400" />
                          {c.tamperFlagsCount}
                        </span>
                      ) : (
                        <span className="text-slate-500 font-mono">0</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <StatusBadge status={c.status} />
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button className="p-1.5 rounded bg-forensic-850 hover:bg-forensic-800 text-slate-400 group-hover:text-forensic-cyan">
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
