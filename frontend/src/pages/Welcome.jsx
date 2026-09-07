import React from 'react';
import { Navigate } from 'react-router-dom';

// Simple welcome page that redirects to dashboard
const Welcome = () => {
  return <Navigate to="/dashboard" replace />;
};

export default Welcome;
