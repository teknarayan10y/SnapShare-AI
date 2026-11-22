import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate
} from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { ToastProvider } from './context/ToastContext'
import ProtectedRoute from './components/ProtectedRoute'
import DashboardLayout from './components/DashboardLayout'
import Navbar from './components/Navbar'
import Footer from './components/Footer'

// Pages
import { LandingPage } from './pages/LandingPage'
import { LoginPage } from './pages/LoginPage'
import { RegisterPage } from './pages/RegisterPage'
import { ForgotPasswordPage } from './pages/ForgotPasswordPage'
import { DashboardOverview } from './pages/DashboardOverview'
import { FileUploadPage } from './pages/FileUploadPage'
import { CollectionCreatePage } from './pages/CollectionCreatePage'
import { CollectionManagementPage } from './pages/CollectionManagementPage'
import { PublicCollectionPage } from './pages/PublicCollectionPage'
import { AnalyticsDashboard } from './pages/AnalyticsDashboard'
import { AdminDashboard } from './pages/AdminDashboard'
import { UserProfile } from './pages/UserProfile'
import { PricingPage } from './pages/PricingPage'
import { HelpPage } from './pages/HelpPage'
import { PrivacyPage, TermsPage } from './pages/LegalPages'
import AllFilesPage from './pages/AllFilesPage'
import FavoritesPage from './pages/FavoritesPage'
import StorageManagementPage from './pages/StorageManagementPage'
import AISmartOrganizerPage from './pages/AISmartOrganizerPage'

// Public layout wrapper (Navbar + Footer)
function PublicLayout({ children }) {
  return (
    <div className="min-h-screen bg-[#080B14] flex flex-col">
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  )
}

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ToastProvider>
          <Router>
            <Routes>
              {/* Public routes */}
              <Route
                path="/"
                element={
                  <PublicLayout>
                    <LandingPage />
                  </PublicLayout>
                }
              />
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<RegisterPage />} />
              <Route path="/forgot-password" element={<ForgotPasswordPage />} />
              <Route
                path="/pricing"
                element={
                  <PublicLayout>
                    <PricingPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/help"
                element={
                  <PublicLayout>
                    <HelpPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/privacy"
                element={
                  <PublicLayout>
                    <PrivacyPage />
                  </PublicLayout>
                }
              />
              <Route
                path="/terms"
                element={
                  <PublicLayout>
                    <TermsPage />
                  </PublicLayout>
                }
              />

              {/* Public collection page – no navbar/sidebar */}
              <Route path="/public/:shareToken" element={<PublicCollectionPage />} />

              {/* Protected dashboard routes */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <DashboardLayout />
                  </ProtectedRoute>
                }
              >
                <Route index element={<DashboardOverview />} />
                <Route path="collections" element={<CollectionManagementPage />} />
                <Route path="collections/new" element={<CollectionCreatePage />} />
                <Route path="collections/:id" element={<CollectionManagementPage />} />
                <Route path="upload" element={<FileUploadPage />} />
                <Route path="files" element={<AllFilesPage />} />
                <Route path="qr" element={<CollectionManagementPage />} />
                <Route path="favorites" element={<FavoritesPage />} />
                <Route path="analytics" element={<AnalyticsDashboard />} />
                <Route path="storage" element={<StorageManagementPage />} />
                <Route path="ai" element={<AISmartOrganizerPage />} />
                <Route path="profile" element={<UserProfile />} />
                <Route path="settings" element={<Navigate to="/dashboard/profile" replace />} />
              </Route>

              {/* Admin routes */}
              <Route
                path="/admin"
                element={
                  <ProtectedRoute adminOnly>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* 404 fallback */}
              <Route
                path="*"
                element={
                  <div className="min-h-screen bg-[#080B14] flex items-center justify-center text-center px-4">
                    <div>
                      <div className="text-8xl font-black text-purple-500 mb-4">404</div>
                      <h1 className="text-3xl font-bold text-white mb-2">Page Not Found</h1>
                      <p className="text-gray-400 mb-6">
                        The page you're looking for doesn't exist or has been moved.
                      </p>
                      <a
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-semibold rounded-xl transition-colors"
                      >
                        ← Back to Home
                      </a>
                    </div>
                  </div>
                }
              />
            </Routes>
          </Router>
        </ToastProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
