import React from 'react';
import { useTranslation } from 'react-i18next';
import { useNetwork } from '../context/NetworkContext';
import { useAuth } from '../context/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';
import { Menu } from 'lucide-react';

const PAGE_TITLES = {
  '/dashboard':    { en: 'ASHA Dashboard',    mr: 'आशा डॅशबोर्ड' },
  '/patients/add': { en: 'Register Patient',  mr: 'रुग्णाची नोंदणी' },
  '/reports':      { en: 'Reports',           mr: 'अहवाल' },
  '/profile':      { en: 'My Profile',        mr: 'माझी प्रोफाइल' },
};

const Header = ({ toggleSidebar }) => {
  const { t, i18n } = useTranslation();
  const { isOnline, toggleNetwork } = useNetwork();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const currentLang = i18n.resolvedLanguage || 'en';
  const toggleLanguage = lang => i18n.changeLanguage(lang);
  const handleLogout = () => { logout(); navigate('/login'); };

  const pageTitle = PAGE_TITLES[location.pathname]?.[currentLang]
    || PAGE_TITLES[location.pathname]?.en || 'Swasthya Seva';

  return (
    <header className="govt-header">

      {/* Row 1 – Dark navy banner */}
      <div className="govt-header-top">
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <button onClick={toggleSidebar} style={{ color: 'white', display: 'none', padding: '0.2rem', border: '1px solid rgba(255,255,255,0.4)' }} className="hamburger-btn">
            <Menu size={22} />
          </button>
          <style>{`@media(max-width:768px){ .hamburger-btn{display:block!important} }`}</style>

          <div style={{ width: '44px', height: '44px', background: '#fffff0', border: '2px solid #cc6600', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', flexShrink: 0 }}>🏥</div>
          <div>
            <div style={{ fontWeight: 'bold', fontSize: '1.25rem', lineHeight: 1.1 }}>{t('app.title')}</div>
            <div style={{ fontSize: '0.8rem', opacity: 0.85 }}>National Health Mission · Government of Maharashtra</div>
          </div>
        </div>

        {/* Language */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
          <span style={{ fontSize: '0.9rem' }}>Language:</span>
          <button onClick={() => toggleLanguage('mr')} style={{ color: 'white', background: currentLang === 'mr' ? 'rgba(255,255,255,0.25)' : 'none', fontWeight: currentLang === 'mr' ? 'bold' : 'normal', textDecoration: currentLang === 'mr' ? 'none' : 'underline', padding: '0.1rem 0.4rem', border: '1px solid rgba(255,255,255,0.4)', fontSize: '0.9rem', cursor: 'pointer' }}>मराठी</button>
          <button onClick={() => toggleLanguage('en')} style={{ color: 'white', background: currentLang === 'en' ? 'rgba(255,255,255,0.25)' : 'none', fontWeight: currentLang === 'en' ? 'bold' : 'normal', textDecoration: currentLang === 'en' ? 'none' : 'underline', padding: '0.1rem 0.4rem', border: '1px solid rgba(255,255,255,0.4)', fontSize: '0.9rem', cursor: 'pointer' }}>English</button>
        </div>
      </div>

      {/* Row 2 – Breadcrumb + user info */}
      <div className="govt-header-bottom">
        <div style={{ fontSize: '0.95rem' }}>
          <span style={{ color: '#555' }}>You are here : Home &gt; </span>
          <strong style={{ color: '#1a3a6b' }}>{pageTitle}</strong>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem', flexWrap: 'wrap' }}>
          <button onClick={toggleNetwork} style={{ padding: '0.1rem 0.5rem', border: `1px solid ${isOnline ? '#006600' : '#cc0000'}`, background: isOnline ? '#e6ffe6' : '#ffe6e6', color: isOnline ? '#006600' : '#cc0000', fontWeight: 'bold', fontSize: '0.85rem', cursor: 'pointer' }}>
            ● {isOnline ? t('app.online') : t('app.offline')}
          </button>

          <span style={{ color: '#555' }}>
            Logged in as:&nbsp;
            <button onClick={() => navigate('/profile')} style={{ color: '#0000cc', fontWeight: 'bold', textDecoration: 'underline', cursor: 'pointer', background: 'none', fontSize: '0.9rem' }}>
              {user?.name || 'ASHA Worker'}
            </button>
            &nbsp;({user?.asha_id})
          </span>
          <span style={{ color: '#ccc' }}>|</span>
          <button onClick={handleLogout} style={{ color: '#0000cc', textDecoration: 'underline', fontWeight: 'bold', fontSize: '0.9rem', cursor: 'pointer', background: 'none' }}>Logout</button>
        </div>
      </div>
    </header>
  );
};

export default Header;
