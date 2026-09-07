import React from 'react';
import { NavLink } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { X } from 'lucide-react';

const Sidebar = ({ isOpen, setIsOpen }) => {
  const { t } = useTranslation();

  const navItems = [
    { path: '/dashboard',    label: t('nav.dashboard') },
    { path: '/patients/add', label: t('nav.add_patient') },
    { path: '/reports',      label: t('nav.reports') },
    { path: '/profile',      label: 'My Profile' },
  ];

  return (
    <>
      {isOpen && <div className="sidebar-overlay" onClick={() => setIsOpen(false)} />}
      <aside className={`sidebar ${isOpen ? 'open' : ''}`}>
        {/* Logo */}
        <div className="sidebar-logo-area">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="sidebar-logo-text">{t('app.title')}</div>
              <div className="sidebar-logo-sub">ASHA Portal · NHM</div>
            </div>
            <button onClick={() => setIsOpen(false)} style={{ color: 'white', display: 'none' }} className="sidebar-close-btn"><X size={18} /></button>
          </div>
          <style>{`@media(max-width:768px){ .sidebar-close-btn{display:block!important} }`}</style>
        </div>

        <div className="nav-section-label">Main Navigation</div>
        <nav>
          {navItems.map(item => (
            <NavLink key={item.path} to={item.path} className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`} onClick={() => setIsOpen(false)}>
              &raquo; {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div style={{ fontWeight: 'bold' }}>National Health Mission</div>
          <div>Govt. of Maharashtra</div>
          <div style={{ marginTop: '0.35rem', fontSize: '0.8rem', color: '#555' }}>Version 1.0</div>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
