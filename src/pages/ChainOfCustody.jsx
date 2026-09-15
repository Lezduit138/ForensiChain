import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getCustodyChain } from '../services/custodyService';
import { getCaseById } from '../services/caseService';
import { ChainViewer } from '../components/ledger/ChainViewer';
import { Link2, ArrowLeft } from 'lucide-react';

export const ChainOfCustody = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { setActiveCaseId } = useAuth();
  const caseId = id || 'CASE-2026-0841';

  const [chain, setChain] = useState([]);
  const [caseData, setCaseData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadChain = async () => {
    setLoading(true);
    setError(null);
    try {
      setActiveCaseId(caseId);
      const [c, blocks] = await Promise.all([
        getCaseById(caseId),
        getCustodyChain(caseId),
      ]);
      setCaseData(c);
      setChain(Array.isArray(blocks) ? blocks : []);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadChain();
  }, [caseId]);

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono">
        <div className="animate-spin w-6 h-6 border-2 border-forensic-cyan border-t-transparent rounded-full mx-auto mb-3" />
        Connecting to Blockchain Ledger Node for {caseId}...
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-8 text-center text-red-400 font-mono">
        <p className="font-bold">Failed to load custody chain</p>
        <p className="text-xs mt-1 text-slate-400">{error}</p>
        <button onClick={loadChain} className="mt-4 px-4 py-2 bg-forensic-cyan text-black text-xs rounded-lg font-bold">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 uppercase tracking-wide flex items-center gap-2">
            <Link2 className="w-5 h-5 text-forensic-cyan" />
            Blockchain-Backed Chain of Custody Ledger
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Case: <strong className="text-cyan-300 font-mono">
              {caseData?.firNumber || caseId}
            </strong>{caseData?.policeStation ? ` • ${caseData.policeStation}` : ''}
          </p>
        </div>

        <button
          onClick={() => navigate(`/cases/${caseId}`)}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-forensic-850 hover:bg-forensic-800 text-slate-300 rounded-lg text-xs border border-forensic-border"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Case Detail</span>
        </button>
      </div>

      {/* Embedded Chain Viewer */}
      <ChainViewer
        chain={chain}
        caseId={caseId}
        onTamperToggle={null}
        onReloadChain={loadChain}
      />
    </div>
  );
};
