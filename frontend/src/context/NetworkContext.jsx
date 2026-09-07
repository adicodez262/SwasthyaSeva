import React, { createContext, useState, useEffect, useContext } from 'react';
import { mockApi } from '../services/mockApi';

const NetworkContext = createContext();

export const NetworkProvider = ({ children }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      mockApi.syncOfflinePatients().catch(console.error);
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    if (navigator.onLine) {
      mockApi.syncOfflinePatients().catch(console.error);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // For demo purposes, allow manual toggling of network state
  const toggleNetwork = () => {
    setIsOnline(prev => {
      const next = !prev;
      if (next) {
        mockApi.syncOfflinePatients().catch(console.error);
      }
      return next;
    });
  };

  return (
    <NetworkContext.Provider value={{ isOnline, toggleNetwork }}>
      {children}
    </NetworkContext.Provider>
  );
};

export const useNetwork = () => useContext(NetworkContext);
