import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import SimpleSmoothUI from './pages/SimpleSmoothUI'
import { AuthProvider } from './firebase/AuthProvider'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <SimpleSmoothUI />
      </BrowserRouter>
    </AuthProvider>
  </React.StrictMode>,
) 