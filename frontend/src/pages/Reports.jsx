import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { mockApi } from '../services/mockApi';
import { RiskBadge } from '../components/RiskComponents';

const Reports = () => {
  const { t } = useTranslation();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    mockApi.getPatients().then(setPatients).catch(console.error).finally(() => setLoading(false));
  }, []);

  if (loading) return <p style={{ padding: '1rem' }}>Loading...</p>;

  const isCritical = (r) => r && (String(r).toLowerCase() === 'critical' || String(r).toLowerCase().includes('red'));
  const isModerate = (r) => r && (String(r).toLowerCase() === 'moderate' || String(r).toLowerCase().includes('yellow'));
  const isLow = (r) => r && (String(r).toLowerCase() === 'low' || String(r).toLowerCase().includes('green'));

  const stats = {
    total: patients.length,
    critical: patients.filter(p => isCritical(p.risk_level)).length,
    moderate: patients.filter(p => isModerate(p.risk_level)).length,
    low: patients.filter(p => isLow(p.risk_level)).length,
    queued: patients.filter(p => p.status === 'queued').length,
    female: patients.filter(p => p.gender === 'female').length,
    male: patients.filter(p => p.gender === 'male').length,
  };

  const pct = (n) => stats.total ? Math.round((n / stats.total) * 100) : 0;

  return (
    <div>
      {/* Page title */}
      <div style={{ borderBottom: '2px solid var(--color-primary)', paddingBottom: '0.5rem', marginBottom: '1rem' }}>
        <h1 style={{ fontSize: '1.5rem', margin: 0 }}>Reports &amp; Analytics</h1>
        <p style={{ color: '#555', fontSize: '1rem', marginTop: '0.25rem' }}>Summary of all patient assessments recorded in this session.</p>
      </div>

      {/* Summary Table */}
      <div className="section-header" style={{ marginBottom: 0 }}>Overall Summary</div>
      <table className="data-table" style={{ marginBottom: '1.5rem' }}>
        <thead>
          <tr>
            <th>Indicator</th>
            <th>Count</th>
            <th>Percentage</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td><strong>Total Patients Assessed</strong></td>
            <td><strong>{stats.total}</strong></td>
            <td>100%</td>
          </tr>
          <tr>
            <td style={{ color: 'var(--color-danger)', fontWeight: 'bold' }}>Critical Risk</td>
            <td>{stats.critical}</td>
            <td>{pct(stats.critical)}%</td>
          </tr>
          <tr>
            <td style={{ color: 'var(--color-warning)', fontWeight: 'bold' }}>Moderate Risk</td>
            <td>{stats.moderate}</td>
            <td>{pct(stats.moderate)}%</td>
          </tr>
          <tr>
            <td style={{ color: 'var(--color-success)', fontWeight: 'bold' }}>Low Risk</td>
            <td>{stats.low}</td>
            <td>{pct(stats.low)}%</td>
          </tr>
          <tr>
            <td>Pending Teleconsultations</td>
            <td>{stats.queued}</td>
            <td>{pct(stats.queued)}%</td>
          </tr>
          <tr>
            <td>Female Patients</td>
            <td>{stats.female}</td>
            <td>{pct(stats.female)}%</td>
          </tr>
          <tr>
            <td>Male Patients</td>
            <td>{stats.male}</td>
            <td>{pct(stats.male)}%</td>
          </tr>
        </tbody>
      </table>

      {/* Risk distribution bars */}
      <div className="section-header" style={{ marginBottom: 0 }}>Risk Distribution</div>
      <div style={{ border: '1px solid #ccc', borderTop: 'none', background: 'white', padding: '1rem', marginBottom: '1.5rem' }}>
        {[
          { label: 'Critical Risk', count: stats.critical, color: 'var(--color-danger)' },
          { label: 'Moderate Risk', count: stats.moderate, color: 'var(--color-warning)' },
          { label: 'Low Risk', count: stats.low, color: 'var(--color-success)' },
        ].map(({ label, count, color }) => (
          <div key={label} style={{ marginBottom: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '1rem', fontWeight: 'bold' }}>
              <span style={{ color }}>{label}</span>
              <span>{count} patients ({pct(count)}%)</span>
            </div>
            <div style={{ width: '100%', height: '20px', background: '#e0e0e0', border: '1px solid #bbb' }}>
              <div style={{ width: `${pct(count)}%`, height: '100%', background: color }} />
            </div>
          </div>
        ))}
        {stats.total === 0 && <p style={{ color: '#555' }}>No patients recorded yet.</p>}
      </div>

      {/* Patient List in table format */}
      {patients.length > 0 && (
        <>
          <div className="section-header" style={{ marginBottom: 0 }}>Patient-wise Risk Summary</div>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Patient ID</th>
                <th>Name</th>
                <th>Age</th>
                <th>Gender</th>
                <th>Risk Level</th>
              </tr>
            </thead>
            <tbody>
              {patients.map((p, i) => (
                <tr key={p.patient_id}>
                  <td>{i + 1}</td>
                  <td style={{ fontFamily: 'monospace' }}>{p.patient_id}</td>
                  <td style={{ fontWeight: 'bold' }}>{p.name}</td>
                  <td>{p.age}</td>
                  <td style={{ textTransform: 'capitalize' }}>{p.gender}</td>
                  <td>
                    <RiskBadge riskLevel={p.risk_level} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}
    </div>
  );
};

export default Reports;
