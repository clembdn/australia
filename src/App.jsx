import { useState } from 'react'
import { CurrencyProvider } from './context/CurrencyContext.jsx'
import { useAuth } from './context/AuthContext.jsx'
import Header from './components/layout/Header.jsx'
import Sidebar from './components/layout/Sidebar.jsx'
import LoginView from './views/LoginView.jsx'
import AustraliaView from './views/AustraliaView.jsx'
import SettingsView from './views/SettingsView.jsx'
import LoadingScreen from './components/auth/LoadingScreen.jsx'
import AccessDeniedScreen from './components/auth/AccessDeniedScreen.jsx'

function ViewContainer({ active }) {
  switch (active) {
    case 'settings':
      return <SettingsView />
    case 'australia':
    default:
      return <AustraliaView />
  }
}

export default function App() {
  const { isLoading, isAuthenticated, isAuthorized } = useAuth()
  const [active, setActive] = useState('australia')
  const [mobileOpen, setMobileOpen] = useState(false)

  // 1. Loading: show premium splash
  if (isLoading) {
    return <LoadingScreen />
  }

  // 2. Not logged in: show login
  if (!isAuthenticated) {
    return <LoginView />
  }

  // 3. Logged in but not authorized: show access denied
  if (!isAuthorized) {
    return <AccessDeniedScreen />
  }

  // 4. Authorized: show app
  const handleSelect = (id) => {
    setActive(id)
    setMobileOpen(false)
  }

  // When the Australia view is active, it renders its own mobile shell
  const isAustraliaMobile = active === 'australia'

  return (
    <CurrencyProvider>
      <div className="min-h-screen lg:flex">
        {/* Sidebar: hide on mobile when Australia is active (it has its own bottom nav) */}
        <div className={isAustraliaMobile ? 'hidden lg:contents' : 'contents'}>
          <Sidebar
            active={active}
            onSelect={handleSelect}
            mobileOpen={mobileOpen}
            onCloseMobile={() => setMobileOpen(false)}
          />
        </div>
        <div className="flex-1 min-w-0 flex flex-col">
          {/* Header: hide on mobile when Australia is active (it has its own sticky header) */}
          <div className={isAustraliaMobile ? 'hidden lg:block' : ''}>
            <Header
              onOpenMobile={() => setMobileOpen(true)}
            />
          </div>
          <main className={`flex-1 max-w-[1500px] w-full mx-auto ${
            isAustraliaMobile
              ? 'lg:px-4 lg:sm:px-6 lg:py-6'
              : 'px-4 sm:px-6 py-6'
          }`}>
            <ViewContainer active={active} />
          </main>
        </div>
      </div>
    </CurrencyProvider>
  )
}
