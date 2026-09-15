import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCases, createCase, getCaseStats } from '../services/caseService';
import { MetricCard } from '../components/common/MetricCard';
import { StatusBadge } from '../components/common/StatusBadge';
import { Modal } from '../components/common/Modal';
import {
  FolderLock,
  HardDrive,
  Clock,
  ShieldAlert,
  Plus,
  ArrowRight,
  TrendingUp,
  Activity,
  Layers,
  ChevronRight
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  PieChart,
  Pie,
  Cell
} from 'recharts';

export const Dashboard = () => {
  const { setActiveCaseId, currentUser } = useAuth();
  const canCreateCase = currentUser?.role === 'Investigator' || currentUser?.role === 'Admin';
  const navigate = useNavigate();
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [stats, setStats] = useState({
    active_cases: 0,
    evidence_processed: 0,
    pending_reviews: 0,
    tamper_flags: 0,
    vendor_data: []
  });

  // New Case form state
  const [newCaseData, setNewCaseData] = useState({
    title: '',
    firNumber: '',
    policeStation: '',
    jurisdiction: 'New Delhi (NCT)',
    priority: 'High',
    summary: '',
  });

  const loadData = async () => {
    setLoading(true);
    const [casesData, statsData] = await Promise.all([
      getCases(),
      getCaseStats()
    ]);
    setCases(casesData);
    setStats(statsData);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateCase = async (e) => {
    e.preventDefault();
    try {
      const created = await createCase(newCaseData);
      setNewCaseData({ title: '', firNumber: '', policeStation: '', jurisdiction: 'New Delhi (NCT)', priority: 'High', summary: '' });
      setIsModalOpen(false);
      setActiveCaseId(String(created.id));
      navigate(`/cases/${created.id}`);
    } catch (err) {
      console.error('Failed to create case:', err);
      alert(`Failed to create case: ${err.message}`);
    }
  };

  const monthlyTamperData = [
    { month: 'Apr', clean: 6, tampered: 2 },
    { month: 'May', clean: 8, tampered: 4 },
    { month: 'Jun', clean: 11, tampered: 3 },
    { month: 'Jul', clean: 9, tampered: 5 },
    { month: 'Aug', clean: stats.active_cases + 11, tampered: stats.tamper_flags }
  ];

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 uppercase tracking-wide">
            Forensic Command Dashboard
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            National Technical Research Organisation (NTRO) • Evidentiary Case Queue
          </p>
        </div>

        {canCreateCase ? (
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-forensic-cyan text-black font-bold rounded-lg hover:bg-cyan-300 transition-all text-xs shadow-glow-cyan"
          >
            <Plus className="w-4 h-4" />
            <span>Register New Case</span>
          </button>
        ) : (
          <span className="text-xs text-slate-400 font-mono border border-forensic-border px-3 py-1.5 rounded-lg">
            Read-Only Access (Reviewer)
          </span>
        )}
      </div>

      {/* Metric Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Forensic Cases"
          value={stats.active_cases}
          subtitle="All jurisdictions"
          icon={FolderLock}
          trend={{ value: 'Live tracking', positive: true }}
          alertLevel="normal"
        />
        <MetricCard
          title="Evidence Items Processed"
          value={`${stats.evidence_processed} Items`}
          subtitle="Total disk/video units"
          icon={HardDrive}
          trend={{ value: '100% hash anchored', positive: true }}
          alertLevel="normal"
        />
        <MetricCard
          title="Pending SSO Reviews"
          value={`${stats.pending_reviews} Cases`}
          subtitle="Awaiting Section 65B sign-off"
          icon={Clock}
          alertLevel={stats.pending_reviews > 0 ? "warning" : "normal"}
        />
        <MetricCard
          title="Tamper Flags Raised"
          value={`${stats.tamper_flags} Flags`}
          subtitle="Timestamp jumps & anomalies"
          icon={ShieldAlert}
          trend={{ value: 'Critical alerts', positive: false }}
          alertLevel={stats.tamper_flags > 0 ? "critical" : "normal"}
        />
      </div>

      {/* Charts & Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vendor Distribution Chart */}
        <div className="bg-forensic-900 border border-forensic-border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-forensic-cyan" />
              Vendor Format Distribution
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Demuxed Samples</span>
          </div>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stats.vendor_data} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" stroke="#475569" fontSize={10} fontVariant="mono" />
                <YAxis dataKey="name" type="category" stroke="#94a3b8" fontSize={11} width={80} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0c121b', borderColor: '#1f2e43', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {stats.vendor_data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Monthly Tamper Rate Trend */}
        <div className="bg-forensic-900 border border-forensic-border rounded-xl p-4 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-forensic-cyan" />
              Monthly Anomaly & Tamper Detection Trend
            </h3>
            <span className="text-[10px] font-mono text-slate-400">Section 65B Corroborated</span>
          </div>

          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyTamperData} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#475569" fontSize={11} />
                <YAxis stroke="#475569" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0c121b', borderColor: '#1f2e43', borderRadius: '8px', fontSize: '11px' }}
                />
                <Bar dataKey="clean" name="Authentic Streams" fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="tampered" name="Tamper Flags Detected" fill="#ef4444" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Cases Table */}
      <div className="bg-forensic-900 border border-forensic-border rounded-xl overflow-hidden">
        <div className="p-4 border-b border-forensic-border flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-slate-100 uppercase tracking-wide">
              Recent Forensic Case Repository
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click any case to inspect attached DVR/NVR disk images and hash ledger
            </p>
          </div>
          <button
            onClick={() => navigate('/cases')}
            className="flex items-center gap-1 text-xs text-forensic-cyan hover:underline font-semibold"
          >
            <span>View All Cases</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-forensic-850 border-b border-forensic-border text-slate-400 font-mono text-[10px] uppercase">
              <tr>
                <th className="py-3 px-4">Case / FIR No.</th>
                <th className="py-3 px-4">Police Station & Jurisdiction</th>
                <th className="py-3 px-4">Investigating Officer</th>
                <th className="py-3 px-4">Seizure Date</th>
                <th className="py-3 px-4 text-center">Evidence Units</th>
                <th className="py-3 px-4 text-center">Tamper Flags</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-forensic-border/60">
              {cases.slice(0, 5).map((c) => (
                <tr
                  key={c.id}
                  onClick={() => {
                    setActiveCaseId(c.id);
                    navigate(`/cases/${c.id}`);
                  }}
                  className="hover:bg-forensic-850/80 cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4">
                    <div className="font-bold text-slate-100 font-mono">{c.firNumber}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-xs">{c.title}</div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="text-slate-200">{c.policeStation}</div>
                    <div className="text-[10px] text-slate-400 font-mono">{c.jurisdiction}</div>
                  </td>
                  <td className="py-3 px-4 text-slate-300">
                    {c.investigatingOfficer}
                  </td>
                  <td className="py-3 px-4 font-mono text-slate-400">
                    {c.dateOpened}
                  </td>
                  <td className="py-3 px-4 text-center font-mono font-bold text-cyan-300">
                    {c.evidenceCount}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {c.tamperFlagsCount > 0 ? (
                      <span className="inline-block px-2 py-0.5 rounded bg-red-950/80 border border-red-500/50 text-red-300 font-mono font-bold text-[11px]">
                        {c.tamperFlagsCount} Flagged
                      </span>
                    ) : (
                      <span className="text-slate-500 font-mono">0</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button className="p-1.5 rounded hover:bg-forensic-800 text-slate-400 hover:text-forensic-cyan">
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Case Registration Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Register New Law Enforcement Case"
        subtitle="Spawns a genesis blockchain ledger and assigns an evidentiary vault ID"
      >
        <form onSubmit={handleCreateCase} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                FIR / Seizure Memorandum No.:
              </label>
              <input
                type="text"
                placeholder="e.g. FIR No. 512/2026"
                value={newCaseData.firNumber}
                onChange={(e) => setNewCaseData({ ...newCaseData, firNumber: e.target.value })}
                required
                className="w-full bg-forensic-950 border border-forensic-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-forensic-cyan font-mono"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                Priority Classification:
              </label>
              <select
                value={newCaseData.priority}
                onChange={(e) => setNewCaseData({ ...newCaseData, priority: e.target.value })}
                className="w-full bg-forensic-950 border border-forensic-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-forensic-cyan"
              >
                <option value="Critical">Critical (National Security / Strongroom)</option>
                <option value="High">High (Major Felony / Tampered DVR)</option>
                <option value="Medium">Medium (Routine Forensic Intake)</option>
                <option value="Low">Low (Regulatory Verification)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
              Case Title / Brief Subject:
            </label>
            <input
              type="text"
              placeholder="e.g. Unauthorized Server Room Access & Camera Footage Excision"
              value={newCaseData.title}
              onChange={(e) => setNewCaseData({ ...newCaseData, title: e.target.value })}
              required
              className="w-full bg-forensic-950 border border-forensic-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-forensic-cyan"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                Police Station / Unit:
              </label>
              <input
                type="text"
                placeholder="e.g. Cyber Crime PS, New Delhi"
                value={newCaseData.policeStation}
                onChange={(e) => setNewCaseData({ ...newCaseData, policeStation: e.target.value })}
                required
                className="w-full bg-forensic-950 border border-forensic-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-forensic-cyan"
              />
            </div>
            <div>
              <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
                Jurisdiction State/UT:
              </label>
              <input
                type="text"
                placeholder="e.g. Delhi (NCT)"
                value={newCaseData.jurisdiction}
                onChange={(e) => setNewCaseData({ ...newCaseData, jurisdiction: e.target.value })}
                className="w-full bg-forensic-950 border border-forensic-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-forensic-cyan"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase text-slate-400 mb-1">
              Seizure Background & Summary:
            </label>
            <textarea
              rows={3}
              placeholder="Record details of seized CCTV DVRs/NVRs, hard drive models, anti-static seal numbers..."
              value={newCaseData.summary}
              onChange={(e) => setNewCaseData({ ...newCaseData, summary: e.target.value })}
              className="w-full bg-forensic-950 border border-forensic-border rounded-lg px-3 py-2 text-xs text-slate-200 focus:outline-none focus:border-forensic-cyan resize-none"
            ></textarea>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2 border-t border-forensic-border">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 bg-forensic-850 hover:bg-forensic-800 text-slate-300 rounded-lg text-xs"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-forensic-cyan text-black font-bold rounded-lg hover:bg-cyan-300 text-xs shadow-glow-cyan"
            >
              Mint Case & Genesis Block
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
