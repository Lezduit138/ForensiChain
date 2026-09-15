import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getEvidenceById, getFindingsByEvidence, toggleFindingReportStatus, runForensicScan } from '../services/evidenceService';
import { getCaseById } from '../services/caseService';
import { VideoPlayer } from '../components/player/VideoPlayer';
import { TimelineTrack } from '../components/player/TimelineTrack';
import { ChannelSelector } from '../components/player/ChannelSelector';
import { StatusBadge } from '../components/common/StatusBadge';
import { HashDisplay } from '../components/common/HashDisplay';
import { AIForensicPanel } from '../components/analysis/AIForensicPanel';
import {
  Video,
  ShieldCheck,
  ShieldAlert,
  AlertTriangle,
  FileCheck,
  Cpu,
  Layers,
  ChevronDown,
  ChevronUp,
  RotateCw,
  Plus,
  Clock,
  Terminal,
  FileText
} from 'lucide-react';

export const EvidenceAnalysis = () => {
  const { id, evidenceId: paramEvidenceId } = useParams();
  const navigate = useNavigate();
  const { setActiveCaseId } = useAuth();

  const caseId = id || 'CASE-2026-0841';
  const evidenceId = paramEvidenceId || 'EVD-841-01';

  const [evidence, setEvidence] = useState(null);
  const [caseData, setCaseData] = useState(null);
  const [findings, setFindings] = useState([]);
  const [loading, setLoading] = useState(true);

  // Playback state
  const [customVideoUrl, setCustomVideoUrl] = useState(null);
  const [currentTime, setCurrentTime] = useState(134); // starts around 02:14:00 mark for instant demo wow factor
  const [duration, setDuration] = useState(255);
  const [activeChannelId, setActiveChannelId] = useState(1);
  const [isScanning, setIsScanning] = useState(false);
  const [showMetadataInspector, setShowMetadataInspector] = useState(true);
  const [selectedFinding, setSelectedFinding] = useState(null);

  const handleCustomVideoLoaded = (file, repOrUrl) => {
    let targetUrl = null;
    if (typeof repOrUrl === 'string') {
      targetUrl = repOrUrl;
    } else if (repOrUrl?.web_video_url) {
      targetUrl = repOrUrl.web_video_url;
    } else if (file && (file.type === 'video/mp4' || file.name.match(/\.(mp4|webm)$/i))) {
      targetUrl = URL.createObjectURL(file);
    }
    if (targetUrl) {
      setCustomVideoUrl(targetUrl);
    }
    setCurrentTime(0);
    if (repOrUrl?.summary?.duration_seconds) {
      setDuration(repOrUrl.summary.duration_seconds);
    }
  };

  const loadData = async () => {
    setLoading(true);
    try {
      setActiveCaseId(caseId);
      const ev = await getEvidenceById(evidenceId);
      const c = await getCaseById(caseId);
      const f = await getFindingsByEvidence(evidenceId);
      setEvidence(ev);
      setCaseData(c);
      setFindings(f);
      if (f.length > 0) setSelectedFinding(f[0]);

      if (evidenceId === 'EVD-841-01') {
        setCurrentTime(134);
      } else {
        setCurrentTime(0);
      }
      if (ev?.durationSeconds) {
        setDuration(ev.durationSeconds);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [evidenceId, caseId]);

  const handleTimeUpdate = (time, dur) => {
    setCurrentTime(time);
    if (dur && dur > 1) setDuration(dur);
  };

  const handleSeek = (targetSec) => {
    setCurrentTime(targetSec);
  };

  const handleToggleReport = async (findingId) => {
    const updated = await toggleFindingReportStatus(findingId);
    setFindings(prev => prev.map(f => f.id === findingId ? updated : f));
  };

  const handleTriggerScan = async () => {
    setIsScanning(true);
    try {
      const updatedFindings = await runForensicScan(evidenceId);
      setFindings(updatedFindings);
      // Reload evidence to reflect integrity status change
      const ev = await getEvidenceById(evidenceId);
      setEvidence(ev);
    } catch (e) {
      console.error(e);
    } finally {
      setIsScanning(false);
    }
  };

  if (loading) {
    return (
      <div className="p-8 text-center text-slate-500 font-mono">
        Mounting Forensic Video Stream: {evidenceId}...
      </div>
    );
  }

  if (!evidence) {
    return (
      <div className="p-8 text-center space-y-4">
        <div className="text-slate-400 font-mono text-sm">
          Evidence item <span className="text-cyan-300">{evidenceId}</span> could not be loaded.
        </div>
        <button
          onClick={loadData}
          className="px-4 py-2 bg-forensic-800 text-forensic-cyan border border-forensic-cyan/40 rounded-lg text-xs font-bold"
        >
          Retry
        </button>
      </div>
    );
  }

  const channels = evidence.channels || [];
  const activeChannel = channels.find(ch => ch.id === activeChannelId) || channels[0] || { name: 'CH-01', resolution: '1920x1080', bitrate: '4096 kbps' };

  return (
    <div className="p-4 sm:p-6 space-y-4 max-w-7xl mx-auto">
      {/* Top Evidence Context Bar */}
      <div className="bg-forensic-900 border border-forensic-border rounded-xl p-4 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 shadow-xl">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-forensic-850 border border-forensic-cyan/40 flex items-center justify-center text-forensic-cyan shadow-glow-cyan">
            <Video className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-xs text-cyan-300">{evidence.id}</span>
              <span className="text-slate-500">Î“Ã‡Ã³</span>
              <h2 className="text-sm font-extrabold text-slate-100">{evidence.name}</h2>
              <span className="bg-forensic-800 text-slate-300 border border-forensic-border px-2 py-0.5 rounded text-[10px] font-mono">
                {evidence.vendor}
              </span>
            </div>
            <div className="text-[11px] text-slate-400 font-mono mt-0.5">
              Case: <span className="text-slate-300">{caseData?.firNumber}</span> Î“Ã‡Ã³ Storage: {evidence.fileSize} Î“Ã‡Ã³ Rec Range: {evidence.recordingStart} &rarr; {evidence.recordingEnd}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          <div className="text-right">
            <div className="text-[10px] font-mono text-slate-500 uppercase">Stream Integrity Verdict</div>
            <StatusBadge status={evidence.integrityStatus} size="sm" />
          </div>

          <button
            onClick={handleTriggerScan}
            disabled={isScanning}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-forensic-800 hover:bg-forensic-750 text-forensic-cyan border border-forensic-cyan/40 rounded-lg text-xs font-bold transition-all shadow-glow-cyan disabled:opacity-50"
          >
            <RotateCw className={`w-3.5 h-3.5 ${isScanning ? 'animate-spin' : ''}`} />
            <span>{isScanning ? 'Deep Scanning Bitstream...' : 'Run Forensic Scan'}</span>
          </button>
        </div>
      </div>

      {/* Centerpiece 2-Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left Column (8 cols): Video Player + Controls + Scrub Timeline */}
        <div className="lg:col-span-8 space-y-4">
          {/* Working Video Player */}
          <VideoPlayer
            videoUrl={customVideoUrl || evidence.videoUrl}
            channelName={activeChannel.name}
            resolution={activeChannel.resolution}
            bitrate={activeChannel.bitrate}
            vendor={evidence.vendor}
            containerFormat={evidence.containerFormat}
            currentTime={currentTime}
            duration={duration}
            onTimeUpdate={handleTimeUpdate}
            onSeek={handleSeek}
            findings={findings}
            onCustomVideoUploaded={handleCustomVideoLoaded}
          />

          {/* Scrubbable Timeline Track */}
          <TimelineTrack
            currentTime={currentTime}
            duration={duration}
            onSeek={handleSeek}
            findings={findings}
            onSelectFinding={(f) => setSelectedFinding(f)}
          />

          {/* Multi-Channel Camera Switcher */}
          {evidence.channels && evidence.channels.length > 1 && (
            <ChannelSelector
              channels={evidence.channels}
              activeChannelId={activeChannelId}
              onSelectChannel={(chId) => setActiveChannelId(chId)}
            />
          )}
        </div>

        {/* Right Column (4 cols): Forensic Findings Panel */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-forensic-900 border border-forensic-border rounded-xl p-4 flex flex-col h-full shadow-xl">
            {/* Panel Header */}
            <div className="flex items-center justify-between border-b border-forensic-border pb-3 mb-3">
              <div>
                <h3 className="text-xs font-bold text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-red-400" />
                  Forensic Findings ({findings.length})
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Tamper & discontinuity audit trail
                </p>
              </div>

              <span className="text-[10px] font-mono bg-red-950/80 text-red-300 border border-red-500/40 px-2 py-0.5 rounded font-bold">
                {findings.filter(f => f.addToReport).length} in Court Report
              </span>
            </div>

            {/* Findings List */}
            <div className="space-y-3 overflow-y-auto max-h-[580px] pr-1">
              {findings.length === 0 ? (
                <div className="p-6 text-center text-slate-500 font-mono text-xs">
                  Zero anomalies detected. Video stream passes continuous GOP integrity test.
                </div>
              ) : (
                findings.map((f) => {
                  const isSelected = selectedFinding?.id === f.id;
                  const isHigh = f.severity === 'High';

                  return (
                    <div
                      key={f.id}
                      onClick={() => {
                        setSelectedFinding(f);
                        // Jump video to offset
                        const [m, s] = f.timestampOffset.split(':').slice(-2).map(Number);
                        const sec = (m || 0) * 60 + (s || 0);
                        handleSeek(sec);
                      }}
                      className={`p-3 rounded-lg border text-xs cursor-pointer transition-all ${
                        isSelected
                          ? 'bg-forensic-800 border-forensic-cyan shadow-glow-cyan'
                          : 'bg-forensic-950/80 border-forensic-border hover:border-forensic-border-light'
                      }`}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <span className={`w-2 h-2 rounded-full ${isHigh ? 'bg-red-500 animate-pulse' : 'bg-amber-400'}`}></span>
                          <span className="font-bold text-slate-200">{f.title}</span>
                        </div>
                        <StatusBadge status={f.severity} size="xs" />
                      </div>

                      <div className="text-[11px] text-slate-400 mt-1 font-mono flex items-center justify-between">
                        <span>Offset: <strong className="text-cyan-300">{f.timestampOffset}</strong></span>
                        <span>Confidence: <strong className="text-emerald-400">{f.confidenceScore}%</strong></span>
                      </div>

                      <p className="text-[11px] text-slate-300 mt-1.5 line-clamp-2">
                        {f.description}
                      </p>

                      <div className="mt-2 pt-2 border-t border-forensic-border/60 flex items-center justify-between">
                        <span className="text-[10px] font-mono text-slate-500">
                          {f.channelName.split(':')[0]}
                        </span>

                        {/* Add to Legal Report Checkbox */}
                        <label
                          onClick={(e) => e.stopPropagation()}
                          className="flex items-center gap-1.5 cursor-pointer text-[10px] font-mono text-slate-300 hover:text-white"
                        >
                          <input
                            type="checkbox"
                            checked={f.addToReport}
                            onChange={() => handleToggleReport(f.id)}
                            className="rounded border-slate-700 text-forensic-cyan focus:ring-0 focus:ring-offset-0 bg-forensic-900 cursor-pointer"
                          />
                          <span>Affix to Section 65B Report</span>
                        </label>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {/* Selected Finding Detail Card */}
            {selectedFinding && (
              <div className="mt-3 p-3 bg-forensic-950 rounded-lg border border-forensic-border text-xs space-y-1.5">
                <div className="font-bold text-slate-200 flex items-center justify-between">
                  <span className="text-[10px] font-mono uppercase text-slate-400">Technical Analysis Detail:</span>
                  <span className="text-[10px] font-mono text-cyan-300">{selectedFinding.timecodeReal}</span>
                </div>
                <div className="text-[11px] font-mono text-slate-300 bg-forensic-900 p-2 rounded border border-forensic-border">
                  {selectedFinding.technicalDetails}
                </div>
                <div className="text-[10px] text-red-300/90 font-medium">
                  <strong>Evidentiary Impact:</strong> {selectedFinding.forensicImpact}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* AIML CCTV Forensic Object Detection & ByteTrack Tracking Console */}
      <AIForensicPanel
        evidenceId={evidenceId}
        onSeekTime={handleSeek}
        onCustomVideoLoaded={handleCustomVideoLoaded}
      />

      {/* Bottom Row: Raw Extracted Metadata Inspector */}
      <div className="bg-forensic-900 border border-forensic-border rounded-xl overflow-hidden shadow-xl">
        <button
          onClick={() => setShowMetadataInspector(!showMetadataInspector)}
          className="w-full px-5 py-3 bg-forensic-850 hover:bg-forensic-800 border-b border-forensic-border flex items-center justify-between text-xs transition-colors"
        >
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-forensic-cyan" />
            <span className="font-bold text-slate-200 uppercase tracking-wider">
              Raw Extracted Device Metadata & Partition Headers (Evidence Hex & Exif Table)
            </span>
            <span className="bg-forensic-950 text-slate-400 px-2 py-0.5 rounded text-[10px] font-mono border border-forensic-border">
              Read-Only
            </span>
          </div>

          <div className="flex items-center gap-2 text-slate-400">
            <span className="text-[11px] font-mono">
              {showMetadataInspector ? 'Collapse Inspector' : 'Expand Inspector'}
            </span>
            {showMetadataInspector ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </button>

        {showMetadataInspector && (
          <div className="p-4 bg-forensic-950/70 space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 text-xs font-mono">
              {Object.entries(evidence.rawMetadata || {}).map(([key, val]) => (
                <div key={key} className="bg-forensic-900 p-2.5 rounded border border-forensic-border">
                  <span className="text-[10px] text-slate-500 uppercase block">{key}</span>
                  <span className="text-slate-200 text-[11px] break-all mt-0.5 block">{String(val)}</span>
                </div>
              ))}
            </div>

            {/* Cryptographic Hashes Verification Strip */}
            <div className="p-3 bg-forensic-900 rounded border border-forensic-border flex flex-col md:flex-row items-start md:items-center justify-between gap-3 text-xs">
              <div className="space-y-1">
                <span className="text-[10px] font-mono text-slate-400 uppercase block">
                  Original Bitstream Evidence Hash (SHA-256):
                </span>
                <HashDisplay hash={evidence.sha256} truncate={false} />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigate(`/cases/${caseId}/report`)}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-forensic-cyan text-black font-bold rounded-lg hover:bg-cyan-300 text-xs shadow-glow-cyan"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Generate Court Certificate</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
