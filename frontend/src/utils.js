export const statusBadge = (status) => {
  const map = {
    'Open': 'status-open',
    'Closed': 'status-closed',
    'Under Investigation': 'status-investigation',
    'Pending': 'status-pending',
    'Guilty': 'status-guilty',
    'Acquitted': 'status-acquitted',
    'Dismissed': 'status-dismissed',
  }
  return `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${map[status] || 'status-dismissed'}`
}

export const evidenceColor = (type) => {
  const map = {
    'CCTV Footage': 'ev-cctv',
    'Weapon': 'ev-weapon',
    'DNA': 'ev-dna',
    'Digital Evidence': 'ev-digital',
    'Witness Statement': 'ev-witness',
    'Document': 'ev-document',
    'Fingerprint': 'ev-fingerprint',
  }
  return map[type] || 'ev-other'
}

export const evidenceBadgeColor = (type) => {
  const map = {
    'CCTV Footage': 'bg-blue-900/40 text-blue-300',
    'Weapon': 'bg-red-900/40 text-red-300',
    'DNA': 'bg-green-900/40 text-green-300',
    'Digital Evidence': 'bg-purple-900/40 text-purple-300',
    'Witness Statement': 'bg-amber-900/40 text-amber-300',
    'Document': 'bg-orange-900/40 text-orange-300',
    'Fingerprint': 'bg-cyan-900/40 text-cyan-300',
  }
  return map[type] || 'bg-slate-800 text-slate-400'
}

export const CRIME_TYPES = ['Theft', 'Robbery', 'Assault', 'Fraud', 'Murder', 'Kidnapping', 'Cybercrime', 'Vandalism', 'Burglary', 'Extortion', 'Other']
export const CRIME_STATUSES = ['Open', 'Closed', 'Under Investigation']
export const CASE_STATUSES = ['Open', 'Closed', 'Under Investigation']
export const VERDICT_OPTIONS = ['Pending', 'Guilty', 'Acquitted', 'Dismissed']
export const DESIGNATIONS = ['Inspector', 'Sub-Inspector', 'ASP', 'Head Constable', 'Constable', 'DCP', 'SP', 'DSP']
export const GENDERS = ['Male', 'Female', 'Other']
export const EVIDENCE_TYPES = ['CCTV Footage', 'Weapon', 'DNA', 'Digital Evidence', 'Witness Statement', 'Document', 'Fingerprint', 'Other']
export const ROLES = ['Victim', 'Suspect', 'Witness']

export const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day:'2-digit', month:'short', year:'numeric' }) : '—'
