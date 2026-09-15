import { apiRequest } from './api';

// Map backend snake_case fields to camelCase for BlockCard.jsx
const mapBlock = (block, index) => ({
  index,                                   // sequential display index
  id: block.id,
  action: block.action || '',
  actionLabel: block.action_label || block.actionLabel || '',
  actor: block.actor || '',
  actorRole: block.actor_role || block.actorRole || '',
  timestamp: block.timestamp || '',
  evidenceId: block.evidence_id || block.evidenceId || null,
  evidenceName: block.evidence_name || block.evidenceName || null,
  previousHash: block.previous_hash || block.previousHash || '0'.repeat(64),
  currentHash: block.current_hash || block.currentHash || '',
  payload: block.payload_data || block.payload || {},
  isTampered: block.is_tampered ?? block.isTampered ?? false,
});

export const getCustodyChain = async (caseId) => {
  try {
    const raw = await apiRequest(`/cases/${caseId}/custody`);
    if (!Array.isArray(raw)) return [];
    return raw.map(mapBlock);
  } catch (err) {
    console.error(`getCustodyChain failed: ${err.message}`);
    return [];
  }
};

export const appendBlock = async (caseId, blockData) => {
  try {
    return await apiRequest(`/cases/${caseId}/custody`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(blockData)
    });
  } catch (err) {
    console.error(`appendBlock failed: ${err.message}`);
    throw err;
  }
};

// Helper to compute SHA-256 hash using Web Crypto API
const computeHash = async (text) => {
  const encoder = new TextEncoder();
  const data = encoder.encode(text);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
};

export const verifyChainIntegrity = async (caseId) => {
  const chain = await getCustodyChain(caseId);
  const brokenLinks = [];
  
  for (let i = 0; i < chain.length; i++) {
    const curr = chain[i];
    const prev = i > 0 ? chain[i - 1] : null;

    // Verify parent-child link
    if (prev && curr.previousHash !== prev.currentHash) {
      brokenLinks.push({
        failedIndex: i,
        brokenBetween: `Block #${i - 1} and Block #${i}`,
        expectedPrevHash: prev.currentHash,
        recordedPrevHash: curr.previousHash,
        reason: `Hash mismatch: Parent block SHA-256 does not match child reference`,
      });
      continue;
    }

    // Verify block data integrity by recomputing hash
    // Backend formula: f"{previous_hash}{current_time}{block_data.action}"
    // Note: The genesis block hash in the backend is hardcoded to "GENESIS_HASH"
    if (curr.action !== "GENESIS_BLOCK") {
      const hashInput = `${curr.previousHash}${curr.timestamp}${curr.action}`;
      const recomputedHash = await computeHash(hashInput);
      
      if (recomputedHash !== curr.currentHash || curr.isTampered) {
        brokenLinks.push({
          failedIndex: i,
          brokenBetween: `Block #${i}`,
          expectedPrevHash: curr.currentHash,
          recordedPrevHash: recomputedHash,
          reason: `Block data corrupted post-minting! Recomputed SHA-256 does not match stored block hash.`,
        });
      }
    }
  }

  const isValid = brokenLinks.length === 0;

  // Generate a merkle root stub for verification response
  const merkleRoot = chain.length > 0 ? chain[chain.length-1].current_hash : '000000';

  return {
    isValid,
    totalBlocksChecked: chain.length,
    brokenLinksCount: brokenLinks.length,
    brokenLinks,
    auditTimestamp: new Date().toISOString(),
    merkleRoot,
  };
};

export const toggleSimulateTamper = async (caseId, blockIndex = 3) => {
  // Not implemented on backend yet for live system to prevent actual tampering.
  // We'll leave a stub or throw error.
  console.warn("Tampering is not allowed on a live custody ledger!");
  return null;
};
