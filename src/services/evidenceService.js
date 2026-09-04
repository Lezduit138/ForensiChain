import { MOCK_EVIDENCE } from '../data/mockEvidence';
import { MOCK_FINDINGS } from '../data/mockFindings';
import { VENDOR_MATRIX } from '../data/mockVendors';
import { appendBlock } from './custodyService';

let evidenceStore = [...MOCK_EVIDENCE];
let findingsStore = [...MOCK_FINDINGS];

const delay = (ms = 300) => new Promise(resolve => setTimeout(resolve, ms));

export const getEvidenceByCase = async (caseId) => {
  await delay(250);
  return evidenceStore.filter(e => e.caseId === caseId);
};

export const getEvidenceById = async (evidenceId) => {
  await delay(200);
  const found = evidenceStore.find(e => e.id === evidenceId);
  if (!found) throw new Error(`Evidence item ${evidenceId} not found`);
  return { ...found };
};

export const detectVendor = async (filename, mimeType) => {
  // Simulate reading file header & checking magic bytes
  await delay(800);
  const lower = filename.toLowerCase();

  if (lower.includes('hik') || lower.includes('ds72') || lower.endsWith('.hsv')) {
    return {
      vendor: VENDOR_MATRIX.find(v => v.id === 'hikvision'),
      confidence: 99.4,
      detectedMagic: '48 49 4B 56 49 53 49 4F 4E 5F 48 32 36 34',
      suggestedContainer: 'HIK-FS v3 / Proprietary Stream',
      estimatedChannels: 4,
      deviceGuess: 'Hikvision Turbo HD DS-7204 / DS-7208 Series',
    };
  }
  if (lower.includes('dahua') || lower.endsWith('.dav') || lower.includes('dhfs')) {
    return {
      vendor: VENDOR_MATRIX.find(v => v.id === 'dahua'),
      confidence: 98.9,
      detectedMagic: '44 48 41 56 ("DHAV")',
      suggestedContainer: 'Dahua DHAV Audio/Video Multiplex',
      estimatedChannels: 4,
      deviceGuess: 'Dahua WizSense XVR5000 Series',
    };
  }
  if (lower.includes('cp') || lower.includes('cpplus') || lower.includes('uvr')) {
    return {
      vendor: VENDOR_MATRIX.find(v => v.id === 'cpplus'),
      confidence: 97.8,
      detectedMagic: '43 50 5F 55 56 52 5F 48 44 ("CP_UVR_HD")',
      suggestedContainer: 'CP Plus Proprietary Bin / Sector Stream',
      estimatedChannels: 4,
      deviceGuess: 'CP Plus Orange Series UVR-0401/0801',
    };
  }
  if (lower.includes('honeywell') || lower.endsWith('.sec')) {
    return {
      vendor: VENDOR_MATRIX.find(v => v.id === 'honeywell'),
      confidence: 99.1,
      detectedMagic: '48 4F 4E 45 59 57 45 4C 4C 5F 53 45 43',
      suggestedContainer: 'Honeywell Secure Video Container',
      estimatedChannels: 2,
      deviceGuess: 'Honeywell MaxPro NVR',
    };
  }

  // Fallback to unknown or raw carving
  return {
    vendor: VENDOR_MATRIX.find(v => v.id === 'unknown_raw'),
    confidence: 82.4,
    detectedMagic: '00 00 00 01 (NALU Slices Carved)',
    suggestedContainer: 'Raw Bitstream Dump (Wiped Header)',
    estimatedChannels: 2,
    deviceGuess: 'Unbranded OEM Surveillance Board',
  };
};

export const ingestEvidence = async (caseId, payload) => {
  await delay(1200);
  const newId = `EVD-${caseId.replace('CASE-2026-', '')}-${evidenceStore.length + 1}`;
  
  // Generate random deterministic hex hash
  const pseudoSha256 = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');
  const pseudoBlake3 = Array.from({ length: 64 }, () => Math.floor(Math.random() * 16).toString(16)).join('');

  const newEvidence = {
    id: newId,
    caseId,
    name: payload.name || payload.filename,
    originalFilename: payload.filename,
    vendor: payload.vendorName || 'Hikvision',
    vendorId: payload.vendorId || 'hikvision',
    model: payload.modelGuess || 'Hikvision DS-7204HGHI Series',
    firmwareVersion: payload.firmwareGuess || 'Auto-Detected v3.3.1',
    serialNumber: `SN-SEIZED-${Math.floor(10000000 + Math.random() * 90000000)}`,
    containerFormat: payload.containerFormat || 'HIK-FS v3 / Proprietary Stream',
    fileSize: payload.fileSize || '8.4 GB (Disk image)',
    sha256: pseudoSha256,
    blake3: pseudoBlake3,
    ingestTimestamp: new Date().toISOString(),
    channelCount: payload.channelsCount || 4,
    channels: [
      { id: 1, name: 'CH-01: Seized Primary Channel', resolution: '1920x1080 @ 25fps', bitrate: '4096 kbps', status: 'Clean' },
      { id: 2, name: 'CH-02: Auxiliary Security Angle', resolution: '1920x1080 @ 25fps', bitrate: '3840 kbps', status: 'Clean' },
    ],
    duration: '03:30:00',
    durationSeconds: 210,
    recordingStart: '2026-08-14 00:00:00 IST',
    recordingEnd: '2026-08-14 03:30:00 IST',
    status: 'Analysis Complete',
    integrityStatus: 'Verified',
    parserUsed: payload.parserEngine || 'Universal Multi-Vendor Parser v4.2',
    rawFile: payload.file || null,
    videoUrl: payload.webVideoUrl || (
      payload.file && (payload.file instanceof File || payload.file instanceof Blob) && !payload.filename?.match(/\.(avi|dav|mkv|flv|wmv|ts)$/i)
        ? URL.createObjectURL(payload.file)
        : (payload.videoUrl || '/sample_cctv.mp4')
    ),
    rawMetadata: {
      'Magic Signature': payload.detectedMagic || '48 49 4B 56 49 53 49 4F 4E',
      'Extracted File System': 'Surveillance LBA Table (Verified)',
      'Forensic Image Type': 'Bitstream Forensic Raw Clone (dd)',
      'Crypto Genesis Checksum': pseudoSha256,
    }
  };

  evidenceStore.unshift(newEvidence);

  // Generate initial forensic telemetry findings for workspace
  const initialFindings = [
    {
      id: `FND-${newId}-01`,
      evidenceId: newId,
      channelId: 1,
      channelName: 'CH-01: Seized Primary Channel',
      type: 'Stream Carving & Demux Audit',
      title: 'Elementary Bitstream Carving Verified',
      timestampOffset: '00:00:02',
      timecodeReal: '2026-08-14 00:00:02 IST',
      timelinePercentage: 5.0,
      severity: 'Low',
      confidenceScore: 99.8,
      addToReport: true,
      description: `Bitstream carved using ${payload.parserEngine || 'Universal Multi-Vendor Parser'}. NALU delimiters aligned.`,
      technicalDetails: `Container: ${newEvidence.containerFormat}. Hash: ${newEvidence.sha256.substring(0, 16)}...`,
      forensicImpact: 'Bitstream authenticity certified for court presentation under Section 65B.',
    },
    {
      id: `FND-${newId}-02`,
      evidenceId: newId,
      channelId: 1,
      channelName: 'CH-01: Seized Primary Channel',
      type: 'Timestamp Continuity',
      title: 'GOP Sequence Cadence Analysis',
      timestampOffset: '00:01:15',
      timecodeReal: '2026-08-14 00:01:15 IST',
      timelinePercentage: 35.0,
      severity: 'Low',
      confidenceScore: 96.5,
      addToReport: true,
      description: 'Monotonic Presentation Timestamp (PTS) verified across baseline intra-frames.',
      technicalDetails: 'Standard surveillance GOP structure intact without synthetic frame injection.',
      forensicImpact: 'Continuous recording timeline authenticated.',
    }
  ];
  findingsStore.unshift(...initialFindings);

  // Automatically write block to blockchain chain of custody!
  await appendBlock(caseId, {
    action: 'EVIDENCE_SEIZURE_INGESTION',
    actionLabel: `Evidence Ingested & Cryptographically Hashed: ${newEvidence.name}`,
    actor: 'Active Investigator / Forensic Ingest Service',
    actorRole: 'Investigator',
    evidenceId: newEvidence.id,
    evidenceName: newEvidence.name,
    payload: {
      filename: newEvidence.originalFilename,
      fileSize: newEvidence.fileSize,
      sha256: newEvidence.sha256,
      vendor: newEvidence.vendor,
      container: newEvidence.containerFormat,
    }
  });

  return newEvidence;
};

export const getFindingsByEvidence = async (evidenceId) => {
  await delay(150);
  return findingsStore.filter(f => f.evidenceId === evidenceId);
};

export const toggleFindingReportStatus = async (findingId) => {
  const index = findingsStore.findIndex(f => f.id === findingId);
  if (index !== -1) {
    findingsStore[index] = {
      ...findingsStore[index],
      addToReport: !findingsStore[index].addToReport,
    };
    return { ...findingsStore[index] };
  }
  throw new Error(`Finding ${findingId} not found`);
};

export const runForensicScan = async (evidenceId) => {
  // Simulate forensic deep scan multi-pass
  await delay(1500);
  const evidence = evidenceStore.find(e => e.id === evidenceId);
  if (!evidence) throw new Error('Evidence not found');

  // If evidence already has findings, return them; otherwise generate realistic findings
  const existing = findingsStore.filter(f => f.evidenceId === evidenceId);
  if (existing.length > 0) {
    // Record scan in custody ledger
    await appendBlock(evidence.caseId, {
      action: 'FORENSIC_DEEP_SCAN',
      actionLabel: `Deep Forensic Re-Scan Completed for ${evidence.name}`,
      actor: 'Active Investigator / Forensic Scan Core',
      actorRole: 'Forensic Examiner',
      evidenceId: evidence.id,
      evidenceName: evidence.name,
      payload: {
        scanLevel: 'Full NALU Bitstream + Sector Hash Audit',
        findingsCount: existing.length,
        status: evidence.integrityStatus,
      }
    });
    return existing;
  }

  // Create new finding
  const newFinding = {
    id: `FND-${evidenceId}-X1`,
    evidenceId,
    channelId: 1,
    channelName: 'CH-01: Primary Channel',
    type: 'Timestamp Discontinuity',
    title: 'Irregular Timecode Gap in Frame Index Table',
    timestampOffset: '01:12:05',
    timecodeReal: '2026-08-14 01:12:05 IST',
    timelinePercentage: 42.0,
    severity: 'Medium',
    confidenceScore: 94.7,
    addToReport: true,
    description: 'Detected 18-second time gap between continuous GOP sequence boundaries.',
    technicalDetails: 'Frame sequence counter skipped 450 frames while camera remained online.',
    forensicImpact: 'Possible manual pause or power disconnection event.',
  };

  findingsStore.push(newFinding);
  evidence.integrityStatus = 'Anomalies Detected';

  await appendBlock(evidence.caseId, {
    action: 'FORENSIC_DEEP_SCAN',
    actionLabel: `Deep Forensic Scan: Discontinuity Found in ${evidence.name}`,
    actor: 'Active Investigator / Forensic Scan Core',
    actorRole: 'Forensic Examiner',
    evidenceId: evidence.id,
    evidenceName: evidence.name,
    payload: {
      finding: newFinding.title,
      severity: newFinding.severity,
      confidence: `${newFinding.confidenceScore}%`,
    }
  });

  return [newFinding];
};
