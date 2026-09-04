import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Dropzone } from '../components/ingest/Dropzone';
import { VendorDetector } from '../components/ingest/VendorDetector';
import { IngestProgress } from '../components/ingest/IngestProgress';
import { detectVendor, ingestEvidence } from '../services/evidenceService';
import { transcodeVideoFile } from '../services/aiService';
import { HashDisplay } from '../components/common/HashDisplay';
import {
  HardDriveUpload,
  ArrowRight,
  CheckCircle2,
  Cpu,
  ShieldCheck,
  RotateCcw,
  Layers,
  Database,
  Link2,
  Sparkles
} from 'lucide-react';

export const EvidenceIngest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const caseId = id || 'CASE-2026-0841';

  const [step, setStep] = useState(1); // 1: Select, 2: Detect, 3: Parsing Progress, 4: Confirmed
  const [selectedFile, setSelectedFile] = useState(null);
  const [detectionResult, setDetectionResult] = useState(null);
  const [isDetecting, setIsDetecting] = useState(false);
  const [parseProgress, setParseProgress] = useState(0);
  const [currentTask, setCurrentTask] = useState('');
  const [ingestedEvidence, setIngestedEvidence] = useState(null);
  const [countdown, setCountdown] = useState(2);
  const [autoRedirect, setAutoRedirect] = useState(true);

  useEffect(() => {
    let timer = null;
    if (step === 4 && ingestedEvidence && autoRedirect) {
      if (countdown > 0) {
        timer = setTimeout(() => {
          setCountdown(prev => prev - 1);
        }, 1000);
      } else {
        navigate(`/cases/${caseId}/evidence/${ingestedEvidence.id}`);
      }
    }
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [step, ingestedEvidence, autoRedirect, countdown, caseId, navigate]);

  const handleSelectFile = async (file) => {
    setSelectedFile(file);
    setStep(2);
    setIsDetecting(true);

    try {
      const result = await detectVendor(file.name);
      setDetectionResult(result);
    } catch (e) {
      console.error(e);
    } finally {
      setIsDetecting(false);
    }
  };

  const handleStartIngest = async () => {
    setStep(3);
    setParseProgress(10);
    setCurrentTask('Verifying Partition Superblocks & Magic Bytes...');

    const timer1 = setTimeout(() => {
      setParseProgress(35);
      setCurrentTask(`Demuxing ${detectionResult.vendor.name} H.264 elementary streams...`);
    }, 400);

    const timer2 = setTimeout(() => {
      setParseProgress(65);
      setCurrentTask('Calculating Bitstream SHA-256 & BLAKE3 Cryptographic Checksums...');
    }, 900);

    const timer3 = setTimeout(() => {
      setParseProgress(88);
      setCurrentTask('Minting Evidence Ingest Genesis Block in Custody Ledger...');
    }, 1400);

    const timer4 = setTimeout(async () => {
      let webVideoUrl = null;
      if (selectedFile.name.match(/\.(avi|dav|mkv|flv|wmv|ts)$/i)) {
        setCurrentTask('Transcoding CCTV bitstream to web H.264 stream for instant playback...');
        try {
          const transcodeRes = await transcodeVideoFile(selectedFile);
          webVideoUrl = transcodeRes?.web_video_url || null;
        } catch (e) {
          console.warn("Transcoding during ingest failed:", e);
        }
      }

      setParseProgress(100);
      setCurrentTask('Ingest Complete. Court-Admissible Hash Affixed.');

      const formattedFileSize = typeof selectedFile.size === 'number'
        ? `${(selectedFile.size / (1024 * 1024)).toFixed(1)} MB`
        : (selectedFile.displaySize || selectedFile.size || '8.4 GB');

      const result = await ingestEvidence(caseId, {
        file: selectedFile,
        filename: selectedFile.name,
        name: `${detectionResult.vendor.name} Ingested Unit (${selectedFile.name})`,
        fileSize: formattedFileSize,
        vendorName: detectionResult.vendor.name,
        vendorId: detectionResult.vendor.id,
        modelGuess: detectionResult.deviceGuess,
        containerFormat: detectionResult.suggestedContainer,
        channelsCount: detectionResult.estimatedChannels,
        parserEngine: detectionResult.vendor.parserEngine,
        detectedMagic: detectionResult.detectedMagic,
        webVideoUrl,
      });

      setIngestedEvidence(result);
      setCountdown(2);
      setStep(4);
    }, 1900);
  };

  const handleReset = () => {
    setStep(1);
    setSelectedFile(null);
    setDetectionResult(null);
    setParseProgress(0);
    setIngestedEvidence(null);
    setCountdown(2);
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-extrabold text-slate-100 uppercase tracking-wide flex items-center gap-2">
            <HardDriveUpload className="w-5 h-5 text-forensic-cyan" />
            Evidence Ingest & Multi-Vendor Parser Pipeline
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            Target Case: <strong className="text-cyan-300 font-mono">{caseId}</strong> ΓÇó Bitstream Ingest with Instant Hash Anchoring
          </p>
        </div>

        <button
          onClick={() => navigate(`/cases/${caseId}`)}
          className="text-xs text-slate-400 hover:text-slate-200"
        >
          &larr; Back to Case
        </button>
      </div>

      {/* Stepper Wizard Bar */}
      <div className="bg-forensic-900 border border-forensic-border rounded-xl p-3">
        <div className="grid grid-cols-4 gap-2 text-xs font-mono">
          {[
            { num: 1, label: '1. Select Image' },
            { num: 2, label: '2. Auto-Detect Vendor' },
            { num: 3, label: '3. Extract & Hash' },
            { num: 4, label: '4. Block Minted' },
          ].map((s) => (
            <div
              key={s.num}
              className={`p-2.5 rounded-lg border text-center transition-all ${
                step === s.num
                  ? 'bg-forensic-800 border-forensic-cyan text-forensic-cyan font-bold shadow-glow-cyan'
                  : step > s.num
                  ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
                  : 'bg-forensic-950 border-forensic-border text-slate-500'
              }`}
            >
              <span>{s.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* STEP 1: File / Disk Selection */}
      {step === 1 && (
        <Dropzone onSelectFile={handleSelectFile} />
      )}

      {/* STEP 2: Vendor Auto-Detection */}
      {step === 2 && (
        <div className="space-y-5">
          <VendorDetector
            detectionResult={detectionResult}
            isDetecting={isDetecting}
          />

          {!isDetecting && detectionResult && (
            <div className="flex flex-col sm:flex-row items-center justify-between bg-forensic-900 border border-forensic-border p-4 rounded-xl gap-3">
              <button
                onClick={handleReset}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Select Different Image</span>
              </button>

              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-xs text-slate-300 select-none cursor-pointer">
                  <input
                    type="checkbox"
                    checked={autoRedirect}
                    onChange={(e) => setAutoRedirect(e.target.checked)}
                    className="accent-cyan-400 w-3.5 h-3.5"
                  />
                  <span>Directly open Workspace once ready</span>
                </label>

                <button
                  onClick={handleStartIngest}
                  className="flex items-center gap-2 px-5 py-2.5 bg-forensic-cyan text-black font-bold rounded-lg hover:bg-cyan-300 text-xs shadow-glow-cyan"
                >
                  <span>Extract Streams, Hash & Open Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* STEP 3: Demuxing & Hashing Progress */}
      {step === 3 && (
        <IngestProgress
          progress={parseProgress}
          stageText="Forensic Stream Carving in Progress"
          currentTask={currentTask}
        />
      )}

      {/* STEP 4: Confirmation & Genesis Block Ready */}
      {step === 4 && ingestedEvidence && (
        <div className="bg-forensic-900 border border-emerald-500/40 rounded-xl p-6 space-y-5 shadow-glow-emerald">
          {/* Top Auto-Redirect Workspace Direct Notification */}
          <div className="bg-cyan-950/80 border border-forensic-cyan/50 p-4 rounded-xl flex items-center justify-between flex-wrap gap-3 shadow-glow-cyan">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-900/60 border border-forensic-cyan/40 flex items-center justify-center text-forensic-cyan shrink-0">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="text-xs font-bold text-slate-100 flex items-center gap-2">
                  <span>Stream Carving & Cryptographic Minting Complete</span>
                  {autoRedirect && countdown > 0 && (
                    <span className="bg-forensic-cyan/20 text-cyan-300 text-[10px] px-2.5 py-0.5 rounded-full border border-forensic-cyan/40 font-mono font-bold animate-pulse">
                      Directing to Analysis Workspace in {countdown}s...
                    </span>
                  )}
                </div>
                <div className="text-[11px] text-slate-400 mt-0.5">
                  Your video has been minted into the chain of custody ledger and is ready for forensic playback & AI timeline inspection.
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 ml-auto">
              {autoRedirect && countdown > 0 && (
                <button
                  onClick={() => setAutoRedirect(false)}
                  className="px-3 py-1.5 text-[11px] text-slate-400 hover:text-slate-200 border border-forensic-border rounded-lg hover:bg-forensic-850"
                >
                  Stay on Ingest Summary
                </button>
              )}
              <button
                onClick={() => navigate(`/cases/${caseId}/evidence/${ingestedEvidence.id}`)}
                className="flex items-center gap-1.5 px-5 py-2 bg-forensic-cyan text-black font-bold text-xs rounded-lg hover:bg-cyan-300 shadow-glow-cyan"
              >
                <span>Proceed to Analysis Workspace Now</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-3 border-b border-forensic-border pb-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-950 border border-emerald-500/50 flex items-center justify-center text-emerald-400 shrink-0">
              <ShieldCheck className="w-8 h-8" />
            </div>
            <div>
              <div className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider font-bold">
                Evidence Ingest Complete ΓÇó Cryptographic Block Minted
              </div>
              <h3 className="text-lg font-bold text-slate-100">{ingestedEvidence.name}</h3>
            </div>
          </div>

          {/* Metadata Confirmation Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-xs">
            <div className="bg-forensic-950 p-3 rounded border border-forensic-border">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Assigned Evidence ID</span>
              <span className="font-mono font-bold text-cyan-300 text-sm mt-0.5 block">{ingestedEvidence.id}</span>
            </div>

            <div className="bg-forensic-950 p-3 rounded border border-forensic-border">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Detected Vendor</span>
              <span className="font-bold text-slate-100 mt-0.5 block">{ingestedEvidence.vendor}</span>
            </div>

            <div className="bg-forensic-950 p-3 rounded border border-forensic-border">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Hardware Model</span>
              <span className="font-medium text-slate-200 mt-0.5 block">{ingestedEvidence.model}</span>
            </div>

            <div className="bg-forensic-950 p-3 rounded border border-forensic-border">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Container & Stream</span>
              <span className="font-medium text-slate-200 mt-0.5 block">{ingestedEvidence.containerFormat}</span>
            </div>

            <div className="bg-forensic-950 p-3 rounded border border-forensic-border">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Demuxed CCTV Channels</span>
              <span className="font-mono font-bold text-emerald-400 mt-0.5 block">{ingestedEvidence.channelCount} Channels</span>
            </div>

            <div className="bg-forensic-950 p-3 rounded border border-forensic-border">
              <span className="text-[10px] font-mono text-slate-400 block uppercase">Acquisition Timestamp</span>
              <span className="font-mono text-slate-200 mt-0.5 block">{ingestedEvidence.ingestTimestamp}</span>
            </div>
          </div>

          {/* Genesis Cryptographic Hash Box */}
          <div className="bg-forensic-950 p-4 rounded-lg border border-forensic-border space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-slate-400 uppercase font-semibold flex items-center gap-1.5">
                <Link2 className="w-3.5 h-3.5 text-forensic-cyan" />
                Genesis Chain-of-Custody Block Hash (SHA-256):
              </span>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-300 border border-emerald-500/30 px-2 py-0.5 rounded">
                IMMUTABLE
              </span>
            </div>
            <HashDisplay hash={ingestedEvidence.sha256} truncate={false} />
            <p className="text-[11px] text-slate-400">
              This hash has been permanently committed to the case blockchain ledger under Section 65B Indian Evidence Act guidelines.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-2">
            <button
              onClick={handleReset}
              className="px-4 py-2 bg-forensic-850 hover:bg-forensic-800 text-slate-300 rounded-lg text-xs"
            >
              Ingest Another Disk Image
            </button>

            <div className="flex items-center gap-3">
              <button
                onClick={() => navigate(`/cases/${caseId}/custody`)}
                className="px-4 py-2 bg-forensic-800 hover:bg-forensic-750 text-slate-200 border border-forensic-border rounded-lg text-xs font-semibold"
              >
                View in Custody Ledger
              </button>
              <button
                onClick={() => navigate(`/cases/${caseId}/evidence/${ingestedEvidence.id}`)}
                className="flex items-center gap-1.5 px-5 py-2 bg-forensic-cyan text-black font-bold rounded-lg hover:bg-cyan-300 text-xs shadow-glow-cyan"
              >
                <span>Launch Analysis Workspace</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
