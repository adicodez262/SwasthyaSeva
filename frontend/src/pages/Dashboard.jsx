import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { mockApi } from '../services/mockApi';
import { RiskBadge } from '../components/RiskComponents';
import { useAuth } from '../context/AuthContext';

const getGreeting = (lang) => {
  const hour = new Date().getHours();
  
  let period;
  if (hour >= 5 && hour < 12) period = 'morning';
  else if (hour >= 12 && hour < 17) period = 'afternoon';
  else if (hour >= 17 && hour < 21) period = 'evening';
  else period = 'night'; // Covers 9 PM to 5 AM

  const greetings = {
    en: { morning: 'Good Morning', afternoon: 'Good Afternoon', evening: 'Good Evening', night: 'Good Night' },
    mr: { morning: 'शुभ प्रभात', afternoon: 'शुभ दुपार', evening: 'शुभ संध्याकाळ', night: 'शुभ रात्री' },
  };
  
  return greetings[lang]?.[period] || greetings.en[period];
};

const Dashboard = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState('all');
  const [filterGender, setFilterGender] = useState('all');

  useEffect(() => {
    mockApi.getPatients().then(setPatients).catch(console.error).finally(() => setLoading(false));
  }, []);

  const isRiskMatch = (pRisk, filterVal) => {
    if (!pRisk) return false;
    const r = String(pRisk).toLowerCase();
    if (filterVal === 'critical') return r === 'critical' || r.includes('red');
    if (filterVal === 'moderate') return r === 'moderate' || r.includes('yellow');
    if (filterVal === 'low') return r === 'low' || r.includes('green');
    return r === String(filterVal).toLowerCase();
  };

  const stats = useMemo(() => ({
    total: patients.length,
    critical: patients.filter(p => isRiskMatch(p.risk_level, 'critical')).length,
    moderate: patients.filter(p => isRiskMatch(p.risk_level, 'moderate')).length,
    low: patients.filter(p => isRiskMatch(p.risk_level, 'low')).length,
  }), [patients]);

  const filtered = useMemo(() => patients.filter(p => {
    const q = search.toLowerCase();
    const matchSearch = !q || p.name?.toLowerCase().includes(q) || p.patient_id?.toLowerCase().includes(q);
    const matchRisk   = filterRisk   === 'all' || isRiskMatch(p.risk_level, filterRisk);
    const matchGender = filterGender === 'all' || p.gender     === filterGender;
    return matchSearch && matchRisk && matchGender;
  }), [patients, search, filterRisk, filterGender]);

  const th = { padding: '0.45rem 0.65rem', background: '#1a3a6b', color: 'white', fontWeight: 'bold', border: '1px solid #0f2447', textAlign: 'left', fontSize: '0.95rem' };

  const currentLang = i18n.resolvedLanguage || 'en';

  return (
    <div>
      {/* Page heading */}
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1rem' }}>
        <tbody>
          <tr>
            <td style={{ padding: '0.5rem 0', verticalAlign: 'middle' }}>
              <h1 style={{ fontSize: '1.4rem', margin: 0 }}>{getGreeting(currentLang)}</h1>
              <div style={{ fontSize: '0.95rem', color: '#444', marginTop: '2px' }}>ASHA Worker Health Risk Assessment Field Portal</div>
            </td>
            <td style={{ textAlign: 'right', verticalAlign: 'middle' }}>
              <button className="btn btn-primary" onClick={() => navigate('/patients/add')}>+ {t('nav.add_patient')}</button>
            </td>
          </tr>
        </tbody>
      </table>

      {/* ── Summary Statistics ── */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #999', marginBottom: '1.25rem' }}>
        <thead>
          <tr><th colSpan={4} style={th}>Summary — Patient Risk Statistics</th></tr>
        </thead>
        <tbody>
          <tr>
            {[
              { label: 'Total Patients', value: stats.total, color: '#1a3a6b' },
              { label: 'Critical Risk',  value: stats.critical, color: '#cc0000' },
              { label: 'Moderate Risk',  value: stats.moderate, color: '#994400' },
              { label: 'Low Risk',       value: stats.low,      color: '#006600' },
            ].map(({ label, value, color }) => (
              <td key={label} style={{ padding: '0.75rem', border: '1px solid #ccc', background: '#fffff0', textAlign: 'center', width: '25%' }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 'bold', color: '#333', marginBottom: '0.25rem' }}>{label}</div>
                <div style={{ fontSize: '2.2rem', fontWeight: 'bold', color, lineHeight: 1 }}>{value}</div>
              </td>
            ))}
          </tr>
        </tbody>
      </table>

      {/* ── Patient Records ── */}
      <div style={{ background: '#1a3a6b', color: 'white', padding: '0.4rem 0.75rem', fontWeight: 'bold', fontSize: '1rem', display: 'flex', justifyContent: 'space-between' }}>
        <span>Patient Records</span>
        <span style={{ fontWeight: 'normal', fontSize: '0.9rem' }}>{filtered.length} record(s) found</span>
      </div>

      {/* Filter bar */}
      <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #999', borderTop: 'none', background: '#f5f5dc', marginBottom: 0 }}>
        <tbody>
          <tr>
            <td style={{ padding: '0.5rem' }}>
              <label style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'block', marginBottom: '2px' }}>Search by Name / ID</label>
              <input type="text" className="form-control" style={{ padding: '0.3rem 0.4rem' }} placeholder="Type to search..." value={search} onChange={e => setSearch(e.target.value)} />
            </td>
            <td style={{ padding: '0.5rem', width: '160px' }}>
              <label style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'block', marginBottom: '2px' }}>Risk Level</label>
              <select className="form-control" style={{ padding: '0.3rem 0.4rem' }} value={filterRisk} onChange={e => setFilterRisk(e.target.value)}>
                <option value="all">All</option>
                <option value="critical">Critical</option>
                <option value="moderate">Moderate</option>
                <option value="low">Low</option>
              </select>
            </td>
            <td style={{ padding: '0.5rem', width: '130px' }}>
              <label style={{ fontWeight: 'bold', fontSize: '0.9rem', display: 'block', marginBottom: '2px' }}>Gender</label>
              <select className="form-control" style={{ padding: '0.3rem 0.4rem' }} value={filterGender} onChange={e => setFilterGender(e.target.value)}>
                <option value="all">All</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </td>
          </tr>
        </tbody>
      </table>

      {/* Data Table */}
      {loading ? (
        <div style={{ padding: '1rem', border: '1px solid #ccc', borderTop: 'none', background: '#fffff0' }}>Loading records, please wait...</div>
      ) : filtered.length === 0 ? (
        <div style={{ padding: '1rem', border: '1px solid #ccc', borderTop: 'none', background: '#fffff0', color: '#555' }}>
          {patients.length === 0 ? 'No patients registered. Click "+ Add Patient" to begin.' : 'No records match the selected filters.'}
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th>#</th>
                <th>{t('patient_table.id')}</th>
                <th>{t('patient_table.name')}</th>
                <th>{t('patient_table.age')}</th>
                <th>{t('patient_table.gender')}</th>
                <th>BP (mmHg)</th>
                <th>Blood Sugar</th>
                <th>{t('patient_table.risk')}</th>
                <th>Status</th>
                <th>{t('patient_table.action')}</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p, i) => (
                <tr key={p.patient_id}>
                  <td>{i + 1}</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 'bold' }}>{p.patient_id}</td>
                  <td style={{ fontWeight: 'bold' }}>{p.name}</td>
                  <td>{p.age}</td>
                  <td style={{ textTransform: 'capitalize' }}>{p.gender}</td>
                  <td style={{ fontFamily: 'monospace' }}>{p.Systolic_BP || p.bp_systolic || '--'}/{p.Diastolic_BP || p.bp_diastolic || '--'}</td>
                  <td style={{ fontFamily: 'monospace' }}>{p.Blood_Sugar_Fasting || p.sugar_level || '--'}</td>
                  <td><RiskBadge riskLevel={p.risk_level} /></td>
                  <td style={{ fontSize: '0.9rem' }}>
                    {p.savedLocally
                      ? <span style={{ color: '#994400', fontWeight: 'bold' }}>&#9888; Pending</span>
                      : <span style={{ color: '#006600', fontWeight: 'bold' }}>&#10003; Saved</span>}
                  </td>
                  <td>
                    <button className="btn btn-primary btn-sm" onClick={() => navigate(`/patients/${p.patient_id}`)}>View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
