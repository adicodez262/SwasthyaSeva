import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const { t, i18n } = useTranslation();
  const { login, register } = useAuth();
  const navigate = useNavigate();

  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ asha_id: '', name: '', phone_number: '', pin: '' });
  const [showPin, setShowPin] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const currentLang = i18n.resolvedLanguage || 'en';
  const handleChange = (field, value) => { setForm(prev => ({ ...prev, [field]: value })); setError(''); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.asha_id.trim()) { setError('Please enter your ASHA ID.'); return; }
    if (!isLogin && !form.name.trim()) { setError('Please enter your full name.'); return; }
    if (!form.phone_number.trim()) { setError('Please enter your registered phone number.'); return; }
    if (!form.pin.trim()) { setError('Please enter your PIN.'); return; }
    setLoading(true);
    try {
      if (isLogin) { await login(form.asha_id, form.phone_number, form.pin); }
      else { await register(form.asha_id, form.name, form.phone_number, form.pin); }
      navigate('/dashboard');
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  const cellStyle = { padding: '0.5rem 0.75rem', border: '1px solid #cccccc', background: '#fffff0' };
  const labelCellStyle = { ...cellStyle, fontWeight: 'bold', width: '35%' };

  return (
    <div style={{ minHeight: '100vh', background: '#d6d6d6', fontFamily: 'Arial, Helvetica, sans-serif' }}>

      {/* ── Top strip ── */}
      <div style={{ background: '#1a3a6b', color: 'white', borderBottom: '3px solid #cc6600', padding: '0 1rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '36px', fontSize: '0.9rem' }}>
          <span>Government of Maharashtra &nbsp;|&nbsp; National Health Mission</span>
          <span>
            Language:&nbsp;
            <button onClick={() => i18n.changeLanguage('mr')} style={{ color: 'white', textDecoration: currentLang === 'mr' ? 'none' : 'underline', fontWeight: currentLang === 'mr' ? 'bold' : 'normal', background: 'none', padding: '0 4px' }}>मराठी</button>
            &nbsp;|&nbsp;
            <button onClick={() => i18n.changeLanguage('en')} style={{ color: 'white', textDecoration: currentLang === 'en' ? 'none' : 'underline', fontWeight: currentLang === 'en' ? 'bold' : 'normal', background: 'none', padding: '0 4px' }}>English</button>
          </span>
        </div>
      </div>

      {/* ── Site header ── */}
      <div style={{ background: '#fffff0', borderBottom: '2px solid #999', padding: '0.6rem 1rem' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ width: '56px', height: '56px', background: '#1a3a6b', border: '2px solid #cc6600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', flexShrink: 0 }}>🏥</div>
          <div>
            <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#1a3a6b' }}>{t('app.title')}</div>
            <div style={{ fontSize: '0.95rem', color: '#333' }}>ASHA Worker Health Risk Assessment Portal · NHM Maharashtra</div>
          </div>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ maxWidth: '580px', margin: '1.5rem auto', padding: '0 1rem' }}>

        {/* Demo credentials table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #999', marginBottom: '1.25rem' }}>
          <thead>
            <tr><th colSpan={2} style={{ background: '#1a3a6b', color: 'white', padding: '0.4rem 0.75rem', textAlign: 'left', fontSize: '1rem', fontWeight: 'bold', border: '1px solid #0f2447' }}>Demo Access Credentials</th></tr>
          </thead>
          <tbody>
            <tr><td style={labelCellStyle}>ASHA ID</td><td style={{ ...cellStyle, fontFamily: 'monospace', fontSize: '1.1rem' }}>ASHA001</td></tr>
            <tr><td style={labelCellStyle}>Phone</td><td style={{ ...cellStyle, fontFamily: 'monospace', fontSize: '1.1rem' }}>9876543210</td></tr>
            <tr><td style={labelCellStyle}>PIN</td><td style={{ ...cellStyle, fontFamily: 'monospace', fontSize: '1.1rem' }}>1234</td></tr>
          </tbody>
        </table>

        {/* Login/Register box */}
        <div style={{ border: '1px solid #999', background: '#fffff0' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '2px solid #999' }}>
            <button onClick={() => { setIsLogin(true); setError(''); }} style={{ flex: 1, padding: '0.6rem', fontSize: '1rem', fontWeight: 'bold', background: isLogin ? '#1a3a6b' : '#d6d6d6', color: isLogin ? 'white' : '#000', borderRight: '1px solid #999', cursor: 'pointer' }}>
              Sign In
            </button>
            <button onClick={() => { setIsLogin(false); setError(''); }} style={{ flex: 1, padding: '0.6rem', fontSize: '1rem', fontWeight: 'bold', background: !isLogin ? '#1a3a6b' : '#d6d6d6', color: !isLogin ? 'white' : '#000', cursor: 'pointer' }}>
              New Registration
            </button>
          </div>

          <div style={{ padding: '1.25rem' }}>
            <form onSubmit={handleSubmit}>

              {/* ASHA ID */}
              <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '0.5rem' }}>
                <tbody>
                  <tr>
                    <td style={{ padding: '0.4rem 0.5rem', fontWeight: 'bold', width: '40%', verticalAlign: 'middle' }}>ASHA Worker ID <span style={{ color: 'red' }}>*</span></td>
                    <td style={{ padding: '0.4rem 0.5rem' }}>
                      <input type="text" className="form-control" placeholder="e.g. ASHA001" value={form.asha_id} onChange={e => handleChange('asha_id', e.target.value.toUpperCase())} />
                    </td>
                  </tr>
                  {!isLogin && (
                    <tr>
                      <td style={{ padding: '0.4rem 0.5rem', fontWeight: 'bold', verticalAlign: 'middle' }}>Full Name <span style={{ color: 'red' }}>*</span></td>
                      <td style={{ padding: '0.4rem 0.5rem' }}>
                        <input type="text" className="form-control" placeholder="Enter your full name" value={form.name} onChange={e => handleChange('name', e.target.value)} />
                      </td>
                    </tr>
                  )}
                  <tr>
                    <td style={{ padding: '0.4rem 0.5rem', fontWeight: 'bold', verticalAlign: 'middle' }}>Mobile Number <span style={{ color: 'red' }}>*</span></td>
                    <td style={{ padding: '0.4rem 0.5rem' }}>
                      <input type="tel" className="form-control" placeholder="10-digit mobile" maxLength={10} value={form.phone_number} onChange={e => handleChange('phone_number', e.target.value.replace(/\D/g, ''))} />
                    </td>
                  </tr>
                  <tr>
                    <td style={{ padding: '0.4rem 0.5rem', fontWeight: 'bold', verticalAlign: 'middle' }}>PIN <span style={{ color: 'red' }}>*</span></td>
                    <td style={{ padding: '0.4rem 0.5rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type={showPin ? 'text' : 'password'} className="form-control" placeholder="Numeric PIN" maxLength={6} value={form.pin} onChange={e => handleChange('pin', e.target.value.replace(/\D/g, ''))} inputMode="numeric" style={{ flex: 1 }} />
                        <button type="button" onClick={() => setShowPin(v => !v)} style={{ padding: '0.35rem 0.6rem', border: '1px solid #666', background: '#e0e0e0', fontSize: '0.9rem', fontWeight: 'bold', cursor: 'pointer' }}>
                          {showPin ? 'Hide' : 'Show'}
                        </button>
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>

              {error && (
                <div style={{ background: '#ffe6e6', border: '1px solid red', padding: '0.5rem 0.75rem', fontSize: '1rem', color: '#cc0000', fontWeight: 'bold', marginBottom: '0.75rem' }}>
                  &#9888; {error}
                </div>
              )}

              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', borderTop: '1px solid #ccc', paddingTop: '0.75rem', marginTop: '0.5rem' }}>
                <button type="submit" disabled={loading} style={{ padding: '0.5rem 2rem', fontSize: '1.05rem', fontWeight: 'bold', background: '#1a3a6b', color: 'white', border: '2px solid #0f2447', cursor: 'pointer' }}>
                  {loading ? 'Please wait...' : (isLogin ? 'Sign In' : 'Register')}
                </button>
                <span style={{ fontSize: '0.9rem', color: '#555' }}>(<span style={{ color: 'red' }}>*</span>) Mandatory fields</span>
              </div>
            </form>
          </div>
        </div>

        {/* Help */}
        <div style={{ marginTop: '0.75rem', padding: '0.5rem 0.75rem', border: '1px solid #ccc', background: '#f5f5dc', fontSize: '0.9rem', color: '#333' }}>
          For login assistance, contact your District Health Officer or Block Supervisor.
        </div>
      </div>
    </div>
  );
};

export default Login;
