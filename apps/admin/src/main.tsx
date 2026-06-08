import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { ThemeProvider } from './ThemeProvider.tsx'
import { CookieBanner } from './CookieBanner.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ThemeProvider>
      <App />
      <CookieBanner />
    </ThemeProvider>
  </StrictMode>,
)

requestAnimationFrame(() => {
  document.getElementById('initial-loader')?.classList.add('is-hidden')
})
