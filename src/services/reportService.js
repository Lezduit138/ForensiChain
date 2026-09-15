import { getCaseById } from './caseService';
import { getEvidenceByCase, getFindingsByEvidence } from './evidenceService';
import { getCustodyChain, appendBlock } from './custodyService';

const delay = (ms = 200) => new Promise(resolve => setTimeout(resolve, ms));

export const getReportData = async (caseId) => {
  await delay(300);

  let caseData = null;
  try {
    caseData = await getCaseById(caseId);
  } catch (err) {
    console.warn('getReportData: getCaseById failed', err.message);
    caseData = { id: caseId, firNumber: `CASE-${caseId}`, title: 'Report', policeStation: '—', jurisdiction: '—', investigatingOfficer: '—', forensicExaminer: '—', status: 'Open', priority: 'High', summary: '', tags: [] };
  }

  const evidenceList = await getEvidenceByCase(caseId);
  
  let allFindings = [];
  for (const ev of evidenceList) {
    const findings = await getFindingsByEvidence(ev.id);
    allFindings = [...allFindings, ...findings];
  }

  const chain = await getCustodyChain(caseId);

  return {
    caseData,
    evidenceList,
    findings: allFindings,
    chainSummary: chain,
    legalStandard: 'Section 65B Indian Evidence Act, 1872 / Section 63 Bharatiya Sakshya Adhiniyam (BSA), 2023',
    labName: 'National Technical Research Organisation (NTRO) - Digital Forensics & Multimedia Examination Lab',
    certificateId: `NTRO-BSA-CERT-${String(caseId).replace('CASE-', '')}-${new Date().getFullYear()}`,
    generatedAt: new Date().toISOString(),
  };
};

export const signReport = async (caseId, examinerNotes, examinerName, pin) => {
  await delay(600);
  // Log report generation in custody ledger
  const block = await appendBlock(caseId, {
    action: 'COURT_REPORT_GENERATION',
    actionLabel: `Court Certificate Minted under BSA Sec 63 / IEA Sec 65B`,
    actor: examinerName || 'Dr. Sunita Rao (SSO Digital Forensics)',
    actorRole: 'Forensic Certifying Officer',
    payload: {
      action: 'Digital Signature & Section 65B Seal Affixed',
      notesSnippet: examinerNotes ? examinerNotes.slice(0, 100) : 'Evidence certified authentic with identified tamper markers.',
      cryptographicSeal: 'ECDSA-SECP256K1-NTRO-GOV-IN-VERIFIED',
    }
  });

  return {
    success: true,
    blockHash: block.currentHash,
    signatureTimestamp: new Date().toISOString(),
  };
};
