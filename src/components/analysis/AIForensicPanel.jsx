import React, { useState, useEffect } from 'react';
import {
  BrainCircuit,
  Search,
  Crosshair,
  Car,
  User,
  Activity,
  Play,
  CheckCircle2,
  RefreshCw,
  Sparkles,
  Layers,
  UploadCloud,
  FileVideo,
  AlertTriangle,
  Zap,
  MapPin,
  Navigation,
  ShieldAlert,
  Eye,
  Bike,
  Truck,
  Package,
} from 'lucide-react';
import { runAIAnalysis, getAIReport, getAIStatus, analyzeVideoFile } from '../../services/aiService';

const SEVERITY_STYLES = {
  critical: 'bg-red-950/80 border-red-500/60 text-red-300',
  high:     'bg-blue-950/60 border-blue-500/40 text-blue-300',
  medium:   'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
  low:      'bg-slate-800/60 border-slate-600/40 text-slate-300',
};

const SEVERITY_DOT = {
  critical: 'bg-red-500 animate-pulse',
  high:     'bg-blue-400',
  medium:   'bg-emerald-400',
  low:      'bg-slate-400',
};

const CLASS_ICON = {
  person:       <User className="w-3.5 h-3.5 text-blue-400" />,
  bicycle:      <Bike className="w-3.5 h-3.5 text-emerald-400" />,
  car:          <Car className="w-3.5 h-3.5 text-emerald-400" />,
  motorcycle:   <Zap className="w-3.5 h-3.5 text-amber-400" />,
  bus:          <Truck className="w-3.5 h-3.5 text-emerald-400" />,
  truck:        <Truck className="w-3.5 h-3.5 text-orange-400" />,
  backpack:     <Package className="w-3.5 h-3.5 text-amber-300" />,
  suitcase:     <Package className="w-3.5 h-3.5 text-amber-300" />,
  handbag:      <Package className="w-3.5 h-3.5 text-amber-300" />,
  knife:        <ShieldAlert className="w-3.5 h-3.5 text-red-400" />,
  'cell phone': <Eye className="w-3.5 h-3.5 text-slate-300" />,
};

const DEFAULT_ICON = <Layers className="w-3.5 h-3.5 text-slate-400" />;

const DIRECTION_ARROWS = {
  N: '↑', NE: '↗', E: '→', SE: '↘',
  S: '↓', SW: '↙', W: '←', NW: '↖',
  stationary: '•',
};

export const AIForensicPanel = ({ evidenceId, onSeekTime, onCustomVideoLoaded }) => {
  const [report, setReport] = useState(null);
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);
  const [analyzingFile, setAnalyzingFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState('all');
  const [activeTab, setActiveTab] = useState('timeline'); // 'timeline' | 'tracking' | 'alerts'

  const loadAI = async () => {
    setLoading(true);
    try {
      const st = await getAIStatus();
      setStatus(st);
      const rep = await getAIReport(evidenceId);
      setReport(rep);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadAI(); }, [evidenceId]);

  const handleRunAnalysis = async () => {
    setLoading(true);
    try {
      const rep = await runAIAnalysis(evidenceId);
      setReport(rep);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    setAnalyzingFile(file.name);
    try {
      const rep = await analyzeVideoFile(file);
      setReport(rep);
      if (onCustomVideoLoaded) onCustomVideoLoaded(file, rep);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
      setAnalyzingFile(null);
    }
  };

  const summary        = report?.summary        || {};
  const timelineEvents = report?.timeline_events || [];
  const trackingRecords = report?.tracking_records || [];
  const criticalAlerts  = report?.critical_alerts  || [];

  const filterCategories = ['all', 'person', 'vehicle', 'suspicious', 'weapon', 'infra'];

  const filteredEvents = timelineEvents.filter((item) => {
    const matchesCat    = activeFilter === 'all' || item.category === activeFilter || item.class === activeFilter;
    const matchesSearch = !searchQuery ||
      item.class.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.event.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (item.zone || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const filteredTracks = trackingRecords.filter((item) => {
    const matchesCat    = activeFilter === 'all' || item.category === activeFilter || item.object === activeFilter;
    const matchesSearch = !searchQuery ||
      item.object.toLowerCase().includes(searchQuery.toLowerCase()) ||
      String(item.track_id).includes(searchQuery) ||
      (item.zone || '').toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const alertCount = criticalAlerts.length;

  return (
    <div className="bg-forensic-900 border border-forensic-border rounded-xl p-4 shadow-xl space-y-4">

      {/* ── Top Banner ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-3 border-b border-forensic-border">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-forensic-cyan">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-100 tracking-wide">
                AI Object Detection & Multi-Target Tracking
              </h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                {status?.engine || 'YOLO26n + ByteTrack'}
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-mono mt-0.5">
              {analyzingFile ? (
                <span className="text-cyan-300 font-bold flex items-center gap-1">
                  <FileVideo className="w-3.5 h-3.5 text-forensic-cyan" />
                  Analyzing: {analyzingFile}
                </span>
              ) : (
                'CLAHE-enhanced inference • Per-class confidence gates • ByteTrack trajectory tracking'
              )}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <label className="flex items-center gap-2 px-3 py-1.5 bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 hover:text-white border border-cyan-500/40 rounded-lg text-xs font-mono transition-colors cursor-pointer">
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Real Footage</span>
            <input
              type="file"
              accept="video/*,.avi,.dav,.mkv,.mp4,.mov,.flv,.wmv"
              onChange={handleFileUpload}
              className="hidden"
              disabled={loading}
            />
          </label>
          <button
            onClick={handleRunAnalysis}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-1.5 bg-forensic-800 hover:bg-forensic-750 text-slate-300 hover:text-white border border-forensic-border rounded-lg text-xs font-mono transition-colors disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-forensic-cyan' : ''}`} />
            <span>{loading ? 'Processing Model...' : 'Re-Run Inference'}</span>
          </button>
        </div>
      </div>

      {/* ── Processing Banner ──────────────────────────────────────────────── */}
      {loading && (
        <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-500/40 flex items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2.5">
            <RefreshCw className="w-4 h-4 text-cyan-400 animate-spin" />
            <div>
              <span className="font-bold text-cyan-200">
                {analyzingFile ? `Analyzing: ${analyzingFile}` : 'Running YOLO26n + ByteTrack inference...'}
              </span>
              <div className="text-[10px] text-cyan-400/70 mt-0.5">
                CLAHE preprocessing → object detection → tracking → zone mapping
              </div>
            </div>
          </div>
          <span className="text-[11px] text-cyan-400/80 bg-cyan-500/10 px-2 py-0.5 rounded border border-cyan-500/20">
            Enhanced Pipeline Active
          </span>
        </div>
      )}

      {/* ── Summary Metric Cards ───────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
        {[
          { label: 'Total Events',      value: summary.total_events     ?? '—', color: 'text-cyan-300' },
          { label: 'Unique Persons',    value: summary.unique_persons   ?? '—', color: 'text-blue-400' },
          { label: 'Unique Vehicles',   value: summary.unique_vehicles  ?? '—', color: 'text-emerald-400' },
          { label: 'Suspicious Items',  value: summary.suspicious_items ?? '—', color: 'text-amber-400' },
          { label: 'Critical Alerts',   value: summary.critical_alerts  ?? 0,   color: (summary.critical_alerts ?? 0) > 0 ? 'text-red-400 animate-pulse' : 'text-slate-400' },
          { label: 'Frames Analyzed',   value: summary.frames_analyzed  ?? '—', color: 'text-slate-300' },
        ].map(({ label, value, color }) => (
          <div key={label} className="bg-forensic-950 p-2.5 rounded-lg border border-forensic-border">
            <span className="text-[10px] font-mono text-slate-400 uppercase block leading-tight">{label}</span>
            <span className={`text-base font-bold font-mono ${color}`}>{value}</span>
          </div>
        ))}
      </div>

      {/* ── Hotspot Zones ─────────────────────────────────────────────────── */}
      {summary.hotspot_zones?.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap text-[11px] font-mono">
          <span className="text-slate-500 flex items-center gap-1">
            <MapPin className="w-3 h-3" /> Top Activity Zones:
          </span>
          {summary.hotspot_zones.map((zone, i) => (
            <span key={zone} className={`px-2 py-0.5 rounded border ${
              i === 0 ? 'bg-red-950/50 border-red-500/40 text-red-300 font-bold' :
              i === 1 ? 'bg-amber-950/50 border-amber-500/40 text-amber-300' :
                        'bg-forensic-850 border-forensic-border text-slate-400'
            }`}>
              {zone}
            </span>
          ))}
        </div>
      )}

      {/* ── Tab Controller ─────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 pt-1">
        <div className="flex bg-forensic-950 p-1 rounded-lg border border-forensic-border text-xs font-mono gap-1">
          {[
            { id: 'timeline', label: `Detection Timeline (${filteredEvents.length})`,   icon: <Activity className="w-3.5 h-3.5" /> },
            { id: 'tracking', label: `ByteTrack IDs (${filteredTracks.length})`,         icon: <Crosshair className="w-3.5 h-3.5" /> },
            { id: 'alerts',   label: `Critical Alerts (${alertCount})`,                  icon: <AlertTriangle className="w-3.5 h-3.5" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-1 rounded transition-colors flex items-center gap-1.5 ${
                activeTab === tab.id
                  ? tab.id === 'alerts' && alertCount > 0
                    ? 'bg-red-600 text-white font-bold shadow-sm'
                    : 'bg-forensic-cyan text-black font-bold shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Search input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search class, zone, or track ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-8 pr-3 py-1.5 bg-forensic-950 border border-forensic-border rounded-lg text-xs font-mono text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
          />
        </div>
      </div>

      {/* ── Category Filter Chips ─────────────────────────────────────────── */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] font-mono">
        <span className="text-slate-500 text-[10px] uppercase mr-1">Filter:</span>
        {filterCategories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveFilter(cat)}
            className={`px-2.5 py-0.5 rounded capitalize transition-colors whitespace-nowrap ${
              activeFilter === cat
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                : 'bg-forensic-950 text-slate-400 border border-forensic-border hover:text-slate-200'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* ── Data Viewer ───────────────────────────────────────────────────── */}
      <div className="max-h-72 overflow-y-auto space-y-1.5 pr-1 font-mono text-xs">

        {/* ── Timeline Tab ──────────────────────────────────────────────── */}
        {activeTab === 'timeline' && (
          filteredEvents.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">No detection events matched your query.</div>
          ) : filteredEvents.map((evt, idx) => (
            <div
              key={idx}
              className={`p-2.5 rounded-lg border transition-colors flex items-center justify-between gap-3 group ${
                SEVERITY_STYLES[evt.severity] || SEVERITY_STYLES.low
              }`}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                {/* Severity indicator */}
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${SEVERITY_DOT[evt.severity] || 'bg-slate-500'}`} />

                {/* Class icon */}
                <div className="p-1.5 rounded bg-black/20 border border-white/10 flex-shrink-0">
                  {CLASS_ICON[evt.class] || DEFAULT_ICON}
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-bold text-inherit capitalize">{evt.class}</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-black/20 border border-white/10">
                      ×{evt.count}
                    </span>
                    {evt.severity === 'critical' && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/20 border border-red-500/40 text-red-300 font-bold">
                        ⚠ CRITICAL
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] opacity-70 flex-wrap">
                    <span>Conf: <strong>{Math.round(evt.confidence * 100)}%</strong></span>
                    {evt.zone && (
                      <span className="flex items-center gap-0.5">
                        <MapPin className="w-2.5 h-2.5" />{evt.zone}
                      </span>
                    )}
                    <span className="capitalize">{evt.category}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60 whitespace-nowrap">
                  {evt.time || `${Math.floor(evt.timestamp_seconds / 60)}:${Math.floor(evt.timestamp_seconds % 60).toString().padStart(2, '0')}`}
                </span>
                <button
                  onClick={() => onSeekTime && onSeekTime(evt.timestamp_seconds)}
                  title="Jump to this frame"
                  className="p-1.5 bg-black/20 hover:bg-forensic-cyan hover:text-black text-slate-300 rounded border border-white/10 transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                </button>
              </div>
            </div>
          ))
        )}

        {/* ── Tracking Tab ──────────────────────────────────────────────── */}
        {activeTab === 'tracking' && (
          filteredTracks.length === 0 ? (
            <div className="text-center py-6 text-slate-500 text-xs">No ByteTrack records matched your query.</div>
          ) : filteredTracks.map((tr, idx) => (
            <div
              key={idx}
              className="bg-forensic-950 p-2.5 rounded-lg border border-forensic-border hover:border-amber-500/50 transition-colors flex items-center justify-between gap-3"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded bg-amber-500/10 border border-amber-500/30 text-amber-400 flex-shrink-0">
                  <Crosshair className="w-3.5 h-3.5" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-amber-300 font-bold">ID #{tr.track_id}</span>
                    <span className="text-slate-300 capitalize text-[11px]">({tr.object})</span>
                    {tr.direction && tr.direction !== 'stationary' && (
                      <span className="text-[11px] bg-forensic-850 border border-forensic-border px-1.5 rounded flex items-center gap-1">
                        <Navigation className="w-2.5 h-2.5 text-cyan-400" />
                        {DIRECTION_ARROWS[tr.direction] || ''} {tr.direction}
                        {tr.velocity_px > 0 && <span className="text-slate-500 ml-1">{tr.velocity_px}px/f</span>}
                      </span>
                    )}
                    {tr.direction === 'stationary' && (
                      <span className="text-[10px] text-slate-500 bg-forensic-900 border border-forensic-border px-1.5 rounded">Stationary</span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 text-[10px] text-slate-500 flex-wrap">
                    <span>Conf: {Math.round(tr.confidence * 100)}%</span>
                    {tr.zone && <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{tr.zone}</span>}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 flex-shrink-0">
                <span className="text-slate-400 text-[11px] bg-forensic-900 border border-forensic-border px-2 py-0.5 rounded whitespace-nowrap">
                  {tr.time || `${tr.timestamp_seconds}s`}
                </span>
                <button
                  onClick={() => onSeekTime && onSeekTime(tr.timestamp_seconds)}
                  title="Jump to track timestamp"
                  className="p-1.5 bg-forensic-800 hover:bg-forensic-cyan hover:text-black text-slate-300 rounded border border-slate-700 transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                </button>
              </div>
            </div>
          ))
        )}

        {/* ── Alerts Tab ────────────────────────────────────────────────── */}
        {activeTab === 'alerts' && (
          alertCount === 0 ? (
            <div className="text-center py-8 space-y-2">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto" />
              <div className="text-emerald-400 font-mono text-xs font-bold">No Critical Alerts Detected</div>
              <div className="text-slate-500 text-[11px]">No weapons or critical-severity objects found in this footage.</div>
            </div>
          ) : criticalAlerts.map((alert, idx) => (
            <div
              key={idx}
              className="p-3 rounded-lg border border-red-500/50 bg-red-950/40 flex items-start justify-between gap-3"
            >
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5 flex-shrink-0 animate-pulse" />
                <div>
                  <div className="text-red-200 font-bold text-xs">{alert.message || `CRITICAL: ${alert.object} detected`}</div>
                  <div className="flex items-center gap-3 mt-1 text-[10px] text-red-300/70 flex-wrap">
                    <span>Conf: {Math.round(alert.confidence * 100)}%</span>
                    <span className="flex items-center gap-0.5"><MapPin className="w-2.5 h-2.5" />{alert.zone}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-red-300 font-mono text-[11px] bg-red-950/60 border border-red-500/30 px-2 py-0.5 rounded">
                  {alert.time}
                </span>
                <button
                  onClick={() => onSeekTime && onSeekTime(alert.timestamp_seconds)}
                  className="p-1.5 bg-red-900/50 hover:bg-red-600 text-red-300 hover:text-white rounded border border-red-500/40 transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
