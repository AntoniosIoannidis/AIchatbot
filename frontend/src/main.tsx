/* Production Fix 2.0 */
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './chatbot.css'
import App from './App.jsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
