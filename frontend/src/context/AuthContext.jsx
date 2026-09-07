import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

const MOCK_WORKERS = [
  {
    asha_id: 'ASHA001',
    name: 'Priya Sharma',
    phone_number: '9876543210',
    pin_hash: '1234',
  },
  {
    asha_id: 'ASHA002',
    name: 'Sunita Patil',
    phone_number: '9823456780',
    pin_hash: '5678',
  },
];

if (!localStorage.getItem('asha_workers')) {
  localStorage.setItem('asha_workers', JSON.stringify(MOCK_WORKERS));
}

const mockLogin = async (asha_id, phone_number, pin) => {
  await new Promise(r => setTimeout(r, 800));
  const workers = JSON.parse(localStorage.getItem('asha_workers') || '[]');
  const worker = workers.find(
    w =>
      w.asha_id.toLowerCase() === asha_id.trim().toLowerCase() &&
      w.phone_number === phone_number.trim()
  );

  if (!worker) throw new Error('ASHA ID or phone number not found.');
  if (worker.pin_hash !== pin) throw new Error('Incorrect PIN. Please try again.');

  const session = { asha_id: worker.asha_id, name: worker.name, phone_number: worker.phone_number };
  localStorage.setItem('asha_session', JSON.stringify(session));
  return session;
};

const mockRegister = async (asha_id, name, phone_number, pin) => {
  await new Promise(r => setTimeout(r, 800));
  const workers = JSON.parse(localStorage.getItem('asha_workers') || '[]');
  
  if (workers.some(w => w.asha_id.toLowerCase() === asha_id.trim().toLowerCase())) {
    throw new Error('An account with this ASHA ID already exists.');
  }
  
  const newWorker = {
    asha_id: asha_id.trim().toUpperCase(),
    name: name.trim(),
    phone_number: phone_number.trim(),
    pin_hash: pin.trim()
  };
  
  workers.push(newWorker);
  localStorage.setItem('asha_workers', JSON.stringify(workers));
  
  const session = { asha_id: newWorker.asha_id, name: newWorker.name, phone_number: newWorker.phone_number };
  localStorage.setItem('asha_session', JSON.stringify(session));
  return session;
};

const mockUpdateProfile = async (updates) => {
  await new Promise(r => setTimeout(r, 500));
  const session = JSON.parse(localStorage.getItem('asha_session') || '{}');
  const updatedSession = { ...session, ...updates };
  
  const workers = JSON.parse(localStorage.getItem('asha_workers') || '[]');
  const workerIndex = workers.findIndex(w => w.asha_id === session.asha_id);
  if (workerIndex > -1) {
    workers[workerIndex] = { ...workers[workerIndex], ...updates };
    localStorage.setItem('asha_workers', JSON.stringify(workers));
  }
  
  localStorage.setItem('asha_session', JSON.stringify(updatedSession));
  return updatedSession;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('asha_session');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (asha_id, phone_number, pin) => {
    const session = await mockLogin(asha_id, phone_number, pin);
    setUser(session);
    return session;
  };

  const register = async (asha_id, name, phone_number, pin) => {
    const session = await mockRegister(asha_id, name, phone_number, pin);
    setUser(session);
    return session;
  };

  const updateProfile = async (updates) => {
    const updatedSession = await mockUpdateProfile(updates);
    setUser(updatedSession);
  };

  const logout = () => {
    localStorage.removeItem('asha_session');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, updateProfile, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
