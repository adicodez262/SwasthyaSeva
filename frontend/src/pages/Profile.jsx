import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from 'react-i18next';
import { User, Phone, Hash, Save } from 'lucide-react';

const Profile = () => {
  const { t } = useTranslation();
  const { user, updateProfile } = useAuth();
  
  const [form, setForm] = useState({
    name: user?.name || '',
    phone_number: user?.phone_number || ''
  });
  
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
    setSuccess(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    await updateProfile(form);
    setLoading(false);
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem', maxWidth: '600px', margin: '0 auto' }}>
      
      <div>
        <h1 style={{ fontSize: '1.75rem' }}>My Profile</h1>
        <p style={{ fontSize: '1rem', color: 'var(--color-text-muted)', marginTop: '4px' }}>
          Manage your personal information
        </p>
      </div>

      <div className="card">
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', marginBottom: '1rem' }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: 'var(--color-primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2.5rem' }}>
              👩‍⚕️
            </div>
            <div>
              <h2 style={{ fontSize: '1.4rem', margin: 0 }}>{user?.name}</h2>
              <div style={{ color: 'var(--color-text-muted)', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '0.25rem' }}>
                <Hash size={16} /> ASHA ID: <strong style={{ color: 'var(--color-text-dark)' }}>{user?.asha_id}</strong>
              </div>
            </div>
          </div>

          <div className="divider" style={{ margin: '0.5rem 0' }} />

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <User size={18} /> Full Name
            </label>
            <input 
              type="text" 
              className="form-control" 
              value={form.name} 
              onChange={e => handleChange('name', e.target.value)}
              style={{ padding: '0.8rem', fontSize: '1.1rem' }}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0 }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Phone size={18} /> Phone Number
            </label>
            <input 
              type="tel" 
              className="form-control" 
              value={form.phone_number} 
              onChange={e => handleChange('phone_number', e.target.value.replace(/\D/g, ''))}
              maxLength={10}
              style={{ padding: '0.8rem', fontSize: '1.1rem' }}
            />
          </div>

          {success && (
            <div style={{ background: 'var(--color-success-bg)', color: 'var(--color-success)', padding: '1rem', borderRadius: 'var(--radius-md)', fontWeight: 700, fontSize: '1rem', border: '2px solid var(--color-success-border)' }}>
              Profile updated successfully!
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ padding: '0.8rem 1.5rem', fontSize: '1.1rem' }}>
              {loading ? 'Saving...' : <><Save size={20} /> Save Changes</>}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Profile;
