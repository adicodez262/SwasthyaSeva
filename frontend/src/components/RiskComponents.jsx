import React from 'react';
import { useTranslation } from 'react-i18next';

export const normalizeRiskLevel = (riskLevel) => {
  if (!riskLevel && riskLevel !== 0) return 'low';
  const r = String(riskLevel).trim().toUpperCase();
  if (r === '2' || r.includes('RED') || r.includes('CRITICAL') || r.includes('HIGH')) return 'critical';
  if (r === '1' || r.includes('YELLOW') || r.includes('MODERATE')) return 'moderate';
  if (r === '0' || r.includes('GREEN') || r.includes('LOW')) return 'low';
  return 'low';
};

export const RISK_DISPLAY_MAP = {
  low: 'LOW RISK',
  moderate: 'MODERATE RISK',
  critical: 'HIGH RISK',
};

export const getRiskDisplay = (riskLevel) => {
  const normalized = normalizeRiskLevel(riskLevel);
  return RISK_DISPLAY_MAP[normalized] || 'LOW RISK';
};

export const RiskBadge = ({ riskLevel }) => {
  const { t } = useTranslation();
  if (!riskLevel && riskLevel !== 0) return null;

  const normalized = normalizeRiskLevel(riskLevel);
  const cls = { critical: 'badge-critical', moderate: 'badge-moderate', low: 'badge-low' }[normalized] || 'badge-low';
  const dotCls = { critical: 'badge-dot-critical', moderate: 'badge-dot-moderate', low: 'badge-dot-low' }[normalized] || 'badge-dot-low';

  return (
    <span className={`badge ${cls}`}>
      <div className={`badge-dot ${dotCls}`}></div>
      {getRiskDisplay(riskLevel)}
    </span>
  );
};

export const RiskAlert = ({ riskLevel }) => {
  const { t } = useTranslation();
  if (!riskLevel) return null;

  const normalized = normalizeRiskLevel(riskLevel);
  const cls = {
    critical: 'risk-alert risk-alert-critical',
    moderate: 'risk-alert risk-alert-moderate',
    low: 'risk-alert risk-alert-low',
  }[normalized];

  const titleColor = { critical: 'var(--color-danger)', moderate: 'var(--color-warning)', low: 'var(--color-success)' }[normalized];

  return (
    <div className={cls}>
      <div style={{ fontWeight: 800, fontSize: '1.2rem', color: titleColor, marginBottom: '0.5rem' }}>
        {t(`alerts.${normalized}_title`)}
      </div>
      <div style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--color-text-dark)' }}>
        {t(`alerts.${normalized}_msg`)}
      </div>
      
      {normalized === 'critical' && (
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ backgroundColor: 'var(--color-danger)', borderColor: 'var(--color-danger)' }} onClick={() => alert('Calling Ambulance...')}>
            🚑 Call Ambulance
          </button>
          <button className="btn btn-primary" onClick={() => alert('Referring to nearest hospital...')}>
            🏥 Refer to Hospital
          </button>
        </div>
      )}

      {normalized === 'moderate' && (
        <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', flexWrap: 'wrap' }}>
          <button className="btn btn-primary" style={{ backgroundColor: 'var(--color-warning)', borderColor: 'var(--color-warning)', color: 'white' }} onClick={() => alert('Connecting to e-Sanjeevani...')}>
            💻 e-Sanjeevani Teleconsult
          </button>
        </div>
      )}
    </div>
  );
};
