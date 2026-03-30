import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import ResetPassword from './ResetPassword.jsx'

const path = window.location.pathname;
let ComponentToRender = App;

if (path === '/reset-password') {
  ComponentToRender = ResetPassword;
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ComponentToRender />
  </StrictMode>,
)
