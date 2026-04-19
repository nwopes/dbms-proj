import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import Sidebar from './components/Sidebar'
import Dashboard from './pages/Dashboard'
import Crimes from './pages/Crimes'
import Cases from './pages/Cases'
import FIRs from './pages/FIRs'
import Evidence from './pages/Evidence'
import CourtCases from './pages/CourtCases'
import Officers from './pages/Officers'
import Stations from './pages/Stations'
import Persons from './pages/Persons'
import Locations from './pages/Locations'
import AuditLog from './pages/AuditLog'
import AutoImport from './pages/AutoImport'

export default function App() {
  return (
    <BrowserRouter>
      <div className="flex min-h-screen">
        <Sidebar />
        <main className="flex-1 overflow-auto">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/crimes" element={<Crimes />} />
            <Route path="/cases" element={<Cases />} />
            <Route path="/firs" element={<FIRs />} />
            <Route path="/evidence" element={<Evidence />} />
            <Route path="/court-cases" element={<CourtCases />} />
            <Route path="/officers" element={<Officers />} />
            <Route path="/stations" element={<Stations />} />
            <Route path="/persons" element={<Persons />} />
            <Route path="/locations" element={<Locations />} />
            <Route path="/audit-log" element={<AuditLog />} />
            <Route path="/auto-import" element={<AutoImport />} />
          </Routes>
        </main>
      </div>
      <Toaster
        position="top-right"
        toastOptions={{
          style: { background: '#112240', color: '#e2e8f0', border: '1px solid #1a3460', fontFamily: "'DM Sans', sans-serif", fontSize: '14px' },
          success: { iconTheme: { primary: '#0ea5e9', secondary: '#060d1f' } },
          error: { iconTheme: { primary: '#ef4444', secondary: '#060d1f' } }
        }}
      />
    </BrowserRouter>
  )
}
