import {
  subcontractors,
  certificates,
  gcSubcontractors,
  insuranceAgents,
  subAgents,
  complianceRules,
} from '../data/mockData';

// --- Date helpers ---

export function daysUntil(dateStr) {
  const target = new Date(dateStr);
  const now = new Date();
  const diff = target.getTime() - now.getTime();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function formatDateShort(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: '2-digit',
    day: '2-digit',
    year: '2-digit',
  });
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

// --- Certificate status helpers ---

export function getCertStatus(cert) {
  if (!cert) return 'missing';
  const days = daysUntil(cert.expiration_date);
  if (days < 0) return 'expired';
  if (days <= complianceRules.expiration_warning_days) return 'expiring';
  return 'current';
}

export function getCertStatusLabel(cert) {
  const status = getCertStatus(cert);
  if (status === 'missing') return 'Missing';
  if (status === 'expired') return 'Expired';
  if (status === 'expiring') {
    const days = daysUntil(cert.expiration_date);
    return `${days}d left`;
  }
  return 'Current';
}

// --- Compliance evaluation for a subcontractor ---

export function getLatestCert(subId, coverageType) {
  const certs = certificates
    .filter((c) => c.sub_id === subId && c.coverage_type === coverageType)
    .sort((a, b) => new Date(b.uploaded_at) - new Date(a.uploaded_at));
  return certs[0] || null;
}

export function evaluateSubCompliance(subId) {
  const sub = subcontractors.find((s) => s.id === subId);
  if (!sub) return { overall: 'non_compliant', gl: 'missing', wc: 'missing', w9: 'missing', issues: ['Subcontractor not found'] };

  const glCert = getLatestCert(subId, 'gl');
  const wcCert = getLatestCert(subId, 'wc');

  const issues = [];

  // GL evaluation
  let glStatus = getCertStatus(glCert);
  if (glCert && glStatus === 'current' && glCert.limit_per_occurrence < complianceRules.gl_minimum_per_occurrence) {
    glStatus = 'non_compliant';
    issues.push(`GL limit ($${(glCert.limit_per_occurrence / 1000).toFixed(0)}K) below $1M minimum`);
  }
  if (glStatus === 'expired') issues.push('GL policy has expired');
  if (glStatus === 'missing') issues.push('No GL certificate on file');
  if (glStatus === 'expiring') issues.push(`GL policy expiring in ${daysUntil(glCert.expiration_date)} days`);

  // WC evaluation
  let wcStatus;
  if (sub.is_sole_proprietor && complianceRules.wc_sole_proprietor_exempt) {
    if (wcCert && wcCert.is_ghost_policy) {
      wcStatus = 'ghost';
    } else if (wcCert) {
      wcStatus = getCertStatus(wcCert);
    } else {
      wcStatus = 'exempt';
    }
  } else {
    wcStatus = getCertStatus(wcCert);
    if (wcStatus === 'expired') issues.push('WC policy has expired');
    if (wcStatus === 'missing') issues.push('No WC certificate on file');
    if (wcStatus === 'expiring') issues.push(`WC policy expiring in ${daysUntil(wcCert.expiration_date)} days`);
  }

  // W-9 evaluation
  let w9Status = 'missing';
  if (sub.w9_on_file) {
    const w9Days = sub.w9_expires_at ? daysUntil(sub.w9_expires_at) : -1;
    if (w9Days < 0) {
      w9Status = 'expired';
      issues.push('W-9 has expired');
    } else if (w9Days <= 30) {
      w9Status = 'expiring';
      issues.push(`W-9 expiring in ${w9Days} days`);
    } else {
      w9Status = 'current';
    }
  } else {
    issues.push('No W-9 on file');
  }

  // Overall status
  const statuses = [glStatus, wcStatus, w9Status];
  let overall;
  if (statuses.includes('expired') || statuses.includes('missing') || statuses.includes('non_compliant')) {
    overall = 'non_compliant';
  } else if (statuses.includes('expiring')) {
    overall = 'expiring';
  } else {
    overall = 'compliant';
  }

  return { overall, gl: glStatus, wc: wcStatus, w9: w9Status, issues };
}

// --- GC compliance summary ---

export function getGCSubIds(gcId) {
  return gcSubcontractors.filter((gs) => gs.gc_id === gcId).map((gs) => gs.sub_id);
}

export function getGCComplianceSummary(gcId) {
  const subIds = getGCSubIds(gcId);
  let compliant = 0;
  let expiring = 0;
  let nonCompliant = 0;

  subIds.forEach((subId) => {
    const { overall } = evaluateSubCompliance(subId);
    if (overall === 'compliant') compliant++;
    else if (overall === 'expiring') expiring++;
    else nonCompliant++;
  });

  const total = subIds.length;
  const pct = total > 0 ? Math.round((compliant / total) * 100) : 0;

  return { total, compliant, expiring, nonCompliant, compliancePercent: pct };
}

// --- Lookups ---

export function getSubById(id) {
  return subcontractors.find((s) => s.id === id);
}

export function getAgentForSub(subId) {
  const link = subAgents.find((sa) => sa.sub_id === subId);
  if (!link) return null;
  return insuranceAgents.find((a) => a.id === link.agent_id);
}

export function getSubsForGC(gcId) {
  const subIds = getGCSubIds(gcId);
  return subIds.map((id) => subcontractors.find((s) => s.id === id)).filter(Boolean);
}

export function getGCsForSub(subId) {
  const gcIds = gcSubcontractors.filter((gs) => gs.sub_id === subId).map((gs) => gs.gc_id);
  return gcIds;
}

export function getCertsForSub(subId) {
  return certificates.filter((c) => c.sub_id === subId);
}
