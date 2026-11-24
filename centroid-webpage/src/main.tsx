import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import './index.css'
import App from './App.tsx'

/**
 * Entry point: mounts the app into `<div id="root">` in index.html.
 * `BrowserRouter` enables the URL-based routes in App.tsx. `StrictMode` runs extra
 * checks during development (it runs effects twice to catch missing cleanups); it
 * has no effect in the production build.
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
