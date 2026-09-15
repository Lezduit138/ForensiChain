import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCaseById } from '../services/caseService';
import { getEvidenceByCase } from '../services/evidenceService';
import { getCustodyChain, toggleSimulateTamper } from '../services/custodyService';
import { StatusBadge } from '../components/common/StatusBadge';
import { HashDisplay } from '../components/common/HashDisplay';
import { ChainViewer } from '../components/ledger/ChainViewer';
import { ReportPreview } from './ReportPreview';
import {
  FolderLock,
  HardDrive,
  Link2,
  FileText,
  Plus,
  ArrowRight,
  ShieldCheck,
  ShieldAlert,
  Calendar,
  User,
  Clock,
  Play,
  Cpu,
  Layers,
  ChevronRight,
  AlertTriangle
} from 'lucide-react';

export const CaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setActiveCaseId, setActiveCaseFir, refreshCaseCount } = useAuth();

  const caseId = id || 'CASE-2026-0841';

  const [activeTab, setActiveTab] = useState('evidence'); // 'evidence' | 'custody' | 'report'
  const [caseData, setCaseData] = useState(null);
  const [evidenceList, setEvidenceList] = useState([]);
  const [custodyChain, setCustodyChain] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadCaseData = async () => {
    setLoading(true);
    try {
      setActiveCaseId(caseId);
      const c = await getCaseById(caseId);
      const ev = await getEvidenceByCase(caseId);
      const chain = await getCustodyChain(caseId);
      setCaseData(c);
      setEvidenceList(ev);
      setCustodyChain(chain);
      // Sync sidebar FIR badge and case count
      if (c?.firNumber) setActiveCaseFir(c.firNumber);
      refreshCaseCount();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCaseData();
  }, [caseId]);

  const handleTamperToggle = async (blockIndex) => {
    await toggleSimulateTamper(caseId, blockIndex);
    const updated = await getCustodyChain(caseId);
    setCustodyChain(updated);
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono">
        <div className="animate-spin w-6 h-6 border-2 border-forensic-cyan border-t-transparent rounded-full mx-auto mb-3" />
        Decrypting Case Ledger & Metadata: {caseId}...
      </div>
    );
  }

  if (!caseData) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono space-y-4">
        <p className="text-red-400 font-bold">Case not found or failed to load.</p>
        <button onClick={() => navigate('/cases')} className="px-4 py-2 bg-forensic-cyan text-black text-xs rounded-lg font-bold">
          Back to Cases
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Case Header Card */}
      <div className="bg-forensic-900 border border-forensic-border rounded-xl p-5 shadow-xl">
        <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 border-b border-forensic-border/70 pb-4">
          <div>
            <div className="flex items-center gap-3">
              <span className="text-xl font-extrabold text-slate-100 font-mono tracking-tight">
                {caseData.firNumber}
              </span>
              <StatusBadge status={caseData.status} size="sm" />
              <span className="bg-forensic-800 text-forensic-cyan border border-forensic-cyan/30 text-[10px] px-2 py-0.5 rounded font-mono">
                Priority: {caseData.priority}
              </span>
            </div>
            <h2 className="text-sm font-semibold text-slate-300 mt-1">
              {caseData.title}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate(`/cases/${caseId}/ingest`)}
              className="flex items-center gap-2 px-3 py-1.5 bg-forensic-cyan text-black font-bold rounded-lg hover:bg-cyan-300 text-xs shadow-glow-cyan"
            >
              <Plus className="w-4 h-4" />
              <span>Add DVR/NVR Evidence</span>
            </button>
          </div>
        </div>

        {/* Metadata Details Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 text-xs">
          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Police Station</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">{caseData.policeStation}</span>
            <span className="text-[10px] font-mono text-slate-400">{caseData.jurisdiction}</span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Investigating Officer (IO)</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">{caseData.investigatingOfficer}</span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Forensic Examiner</span>
            <span className="font-semibold text-slate-200 mt-0.5 block">{caseData.forensicExaminer}</span>
          </div>

          <div>
            <span className="text-[10px] font-mono uppercase text-slate-400 block">Seizure Record Date</span>
            <span className="font-mono text-slate-200 mt-0.5 block">{caseData.incidentDate}</span>
          </div>
        </div>

        {/* Summary Snippet */}
        <div className="mt-4 p-3 bg-forensic-950 rounded-lg border border-forensic-border text-xs text-slate-300">
          <strong className="text-slate-200 font-mono text-[11px]">CASE SEIZURE BRIEF: </strong>
          {caseData.summary}
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-forensic-border">
        <button
          onClick={() => setActiveTab('evidence')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'evidence'
              ? 'border-forensic-cyan text-forensic-cyan bg-forensic-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-forensic-900/30'
          }`}
        >
          <HardDrive className="w-4 h-4" />
          <span>Seized Evidence Items ({evidenceList.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('custody')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'custody'
              ? 'border-forensic-cyan text-forensic-cyan bg-forensic-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-forensic-900/30'
          }`}
        >
          <Link2 className="w-4 h-4" />
          <span>Blockchain Custody Ledger ({custodyChain.length} Blocks)</span>
        </button>

        <button
          onClick={() => setActiveTab('report')}
          className={`flex items-center gap-2 px-4 py-2.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'report'
              ? 'border-forensic-cyan text-forensic-cyan bg-forensic-900/50'
              : 'border-transparent text-slate-400 hover:text-slate-200 hover:bg-forensic-900/30'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Section 65B BSA Court Report</span>
        </button>
      </div>

      {/* TAB 1: Evidence Items List */}
      {activeTab === 'evidence' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-forensic-cyan" />
              Attached DVR/NVR Hardware & Video Containers
            </h3>
            <span className="text-[10px] font-mono text-slate-400">
              Direct Sector Extraction Ready
            </span>
          </div>

          {evidenceList.length === 0 ? (
            <div className="bg-forensic-900 border border-forensic-border rounded-xl p-8 text-center space-y-3">
              <HardDrive className="w-12 h-12 mx-auto text-slate-600" />
              <div className="text-slate-300 font-bold text-sm">No Evidence Items Ingested Yet</div>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Attach seized DVR hard drive images or exported video files to begin automated vendor detection and forensic scanning.
              </p>
              <button
                onClick={() => navigate(`/cases/${caseId}/ingest`)}
                className="px-4 py-2 bg-forensic-cyan text-black font-bold rounded-lg text-xs"
              >
                Launch Evidence Ingest Wizard
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {evidenceList.map((ev) => {
                const isFlagged = ev.integrityStatus === 'Anomalies Detected';

                return (
                  <div
                    key={ev.id}
                    className={`bg-forensic-900 border rounded-xl p-4 transition-all hover:border-forensic-border-light shadow-lg ${
                      isFlagged ? 'border-red-500/40 bg-red-950/5' : 'border-forensic-border'
                    }`}
                  >
                    <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 border-b border-forensic-border/60 pb-3">
                      <div className="flex items-center gap-3">
                        <div className={`p-2.5 rounded-lg border ${
                          isFlagged
                            ? 'bg-red-950/70 border-red-500/50 text-red-400'
                            : 'bg-forensic-850 border-forensic-cyan/40 text-forensic-cyan'
                        }`}>
                          <HardDrive className="w-6 h-6" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-cyan-300">{ev.id}</span>
                            <span className="text-slate-500">•</span>
                            <h4 className="text-sm font-bold text-slate-100">{ev.name}</h4>
                            <span className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${
                              ev.vendorId === 'hikvision' ? 'bg-blue-950 text-blue-300 border-blue-500/40' :
                              ev.vendorId === 'dahua' ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40' :
                              ev.vendorId === 'cpplus' ? 'bg-amber-950 text-amber-300 border-amber-500/40' :
                              ev.vendorId === 'honeywell' ? 'bg-emerald-950 text-emerald-300 border-emerald-500/40' :
                              'bg-red-950 text-red-300 border-red-500/40'
                            }`}>
                              {ev.vendor}
                            </span>
                          </div>
                          <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                            Original File: <span className="text-slate-300">{ev.originalFilename}</span> • Size: {ev.fileSize} • Model: {ev.model}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <StatusBadge status={ev.integrityStatus} size="sm" />
                        <button
                          onClick={() => navigate(`/cases/${caseId}/evidence/${ev.id}`)}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-forensic-800 hover:bg-forensic-750 text-forensic-cyan border border-forensic-cyan/40 rounded-lg text-xs font-bold transition-all shadow-glow-cyan"
                        >
                          <Play className="w-3.5 h-3.5 fill-current" />
                          <span>Enter Analysis Workspace</span>
                        </button>
                      </div>
                    </div>

                    {/* Hash & Channel Grid */}
                    <div className="pt-3 grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] font-mono text-slate-400 block mb-1">
                          Immutable Evidence SHA-256 Checksum:
                        </span>
                        <HashDisplay hash={ev.sha256} truncate={false} />
                      </div>

                      <div className="flex items-center justify-between bg-forensic-950 p-2 rounded border border-forensic-border">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400 block">Parser Engine</span>
                          <span className="font-semibold text-slate-200">{ev.parserUsed}</span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono text-slate-400 block">Channels Extracted</span>
                          <span className="font-mono font-bold text-cyan-300">{ev.channelCount} Streams</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Chain of Custody */}
      {activeTab === 'custody' && (
        <ChainViewer
          chain={custodyChain}
          caseId={caseId}
          onTamperToggle={handleTamperToggle}
          onReloadChain={loadCaseData}
        />
      )}

      {/* TAB 3: Report Preview */}
      {activeTab === 'report' && (
        <ReportPreview caseId={caseId} embedded={true} />
      )}
    </div>
  );
};
