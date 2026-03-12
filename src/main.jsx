import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ReconBot from './ReconBot'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ReconBot />
  </StrictMode>
)
