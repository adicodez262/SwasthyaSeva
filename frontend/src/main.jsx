import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import './i18n'
import { NetworkProvider } from './context/NetworkContext.jsx'
import { AuthProvider } from './context/AuthContext.jsx'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <NetworkProvider>
      <AuthProvider>
        <App />
      </AuthProvider>
    </NetworkProvider>
  </React.StrictMode>,
)
