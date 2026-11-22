import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Navbar from './Navbar'
import Sidebar from './Sidebar'
import AIJobMonitor from './AIJobMonitor'

export default function DashboardLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="h-screen bg-[#080B14] flex flex-col overflow-hidden">
      <Navbar onMenuClick={() => setSidebarOpen(o => !o)} showMenuButton />
      <div className="flex flex-1 overflow-hidden relative">
        {/* Sidebar */}
        <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        {/* Main content */}
        <main className="flex-1 overflow-y-auto bg-[#080B14]">
          <div className="p-4 sm:p-6 max-w-screen-2xl mx-auto">
            <Outlet />
          </div>
        </main>
      </div>
      <AIJobMonitor />
    </div>
  )
}
