import { apiRequest } from './api';


// Convert backend case data into the format
// already expected by the React frontend.
const mapCaseFromBackend = (backendCase) => ({
  id: backendCase.id,

  // Frontend naming
  firNumber: backendCase.fir_number,
  title: backendCase.case_name,

  policeStation: backendCase.police_station,
  jurisdiction: backendCase.jurisdiction,

  investigatingOfficer: backendCase.investigating_officer,
  forensicExaminer: backendCase.forensic_examiner,

  incidentDate: backendCase.incident_date,
  dateOpened: backendCase.date_opened,

  priority: backendCase.priority,
  status: backendCase.status,

  summary: backendCase.description,

  // These will come from the Evidence API later.
  evidenceCount: 0,
  tamperFlagsCount: 0,

  // Keep this so the existing UI does not break.
  tags: [],
});


// GET ALL CASES
export const getCases = async (
  searchQuery = '',
  statusFilter = 'ALL'
) => {
  let data = [];
  try {
    data = await apiRequest('/cases/');
  } catch (err) {
    console.warn('getCases: backend unreachable, returning empty list.', err.message);
    return [];
  }

  let cases = data.map(mapCaseFromBackend);

  // Frontend search
  if (searchQuery.trim()) {
    const query = searchQuery.toLowerCase();
    cases = cases.filter((c) =>
      (c.firNumber || '').toLowerCase().includes(query) ||
      (c.title || '').toLowerCase().includes(query) ||
      (c.policeStation || '').toLowerCase().includes(query) ||
      (c.investigatingOfficer || '').toLowerCase().includes(query)
    );
  }

  // Frontend status filter
  if (statusFilter !== 'ALL') {
    cases = cases.filter(
      (c) => c.status === statusFilter
    );
  }

  return cases;
};

// GET STATS
export const getCaseStats = async () => {
  try {
    return await apiRequest('/cases/stats');
  } catch (err) {
    console.error('Failed to get case stats', err);
    return {
      active_cases: 0,
      evidence_processed: 0,
      pending_reviews: 0,
      tamper_flags: 0,
      vendor_data: []
    };
  }
};


// GET ONE CASE
export const getCaseById = async (id) => {
  try {
    const data = await apiRequest(`/cases/${id}`);
    if (data && data.message === 'Case not found') {
      return null;
    }
    return mapCaseFromBackend(data);
  } catch (err) {
    console.error(`getCaseById(${id}): failed — ${err.message}.`);
    return null;
  }
};


// CREATE CASE
export const createCase = async (newCaseData) => {
  const today = new Date().toISOString().split('T')[0];

  const data = await apiRequest('/cases/', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      fir_number: newCaseData.firNumber || `FIR-${Math.floor(100 + Math.random() * 900)}/2026`,
      case_name: newCaseData.title || 'Untitled Forensic Seizure',
      description: newCaseData.summary || 'Evidence seized and awaiting forensic examination.',
      police_station: newCaseData.policeStation || 'Cyber Crime Police Station',
      jurisdiction: newCaseData.jurisdiction || 'State Cyber Command',
      investigating_officer: newCaseData.investigatingOfficer || 'Insp. Rajesh Kumar (Badge #DL-8821)',
      forensic_examiner: newCaseData.forensicExaminer || 'Dr. Sunita Rao (CFSL / NTRO Lab)',
      incident_date: newCaseData.incidentDate || today,
      date_opened: newCaseData.dateOpened || today,
      priority: newCaseData.priority || 'High',
    }),
  });

  return mapCaseFromBackend(data);
};


// UPDATE CASE
export const updateCaseStatus = async (
  id,
  status
) => {

  const data = await apiRequest(`/cases/${id}`, {
    method: 'PUT',

    headers: {
      'Content-Type': 'application/json',
    },

    body: JSON.stringify({
      status: status,
    }),
  });

  return mapCaseFromBackend(data);
};