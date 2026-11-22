import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import {
  QrCode,
  Sparkles,
  Sun,
  Moon,
  Menu,
  X,
  LayoutDashboard,
  UploadCloud,
  FolderOpen,
  LogOut,
  ShieldCheck,
  CreditCard,
  User,
} from 'lucide-react';

export const Navbar = ({ showMenuButton = false, onMenuClick } = {}) => {
  const { user, isAuthenticated, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);

  const isPublicPage = location.pathname.startsWith('/public');
  const isDashboard = location.pathname.startsWith('/dashboard') || showMenuButton;

  return (
    <nav className="sticky top-0 z-40 w-full glass-panel border-b border-white/5 transition-colors">
      <div className={isDashboard ? "w-full px-4 sm:px-6" : "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8"}>
        <div className="flex items-center justify-between h-16">
          {/* Left section: Mobile menu toggle + Logo */}
          <div className="flex items-center gap-3">
            {showMenuButton && (
              <button
                onClick={onMenuClick}
                className="p-2 -ml-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 lg:hidden transition-colors"
                title="Toggle Sidebar"
              >
                <Menu className="w-5 h-5" />
              </button>
            )}
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-cyan-500 p-[1px] shadow-glow-primary transition-transform group-hover:scale-105">
                <div className="w-full h-full bg-[#080B14] rounded-[11px] flex items-center justify-center">
                  <QrCode className="w-5 h-5 text-purple-400 group-hover:text-cyan-400 transition-colors" />
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-xl tracking-tight text-white dark:text-white light:text-slate-900">
                    Snap<span className="text-purple-400">Share</span>
                  </span>
                  <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded-full bg-purple-500/10 text-purple-400 border border-purple-500/20">
                    v2.0
                  </span>
                </div>
              </div>
            </Link>
          </div>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-6">
            {!isPublicPage && (
              <>
                <Link
                  to="/"
                  className={`text-sm font-medium transition-colors hover:text-purple-400 ${
                    location.pathname === '/' ? 'text-purple-400 font-semibold' : 'text-slate-300'
                  }`}
                >
                  Features
                </Link>
                <Link
                  to="/pricing"
                  className={`text-sm font-medium transition-colors hover:text-purple-400 ${
                    location.pathname === '/pricing' ? 'text-purple-400 font-semibold' : 'text-slate-300'
                  }`}
                >
                  Pricing
                </Link>
                <Link
                  to="/help"
                  className={`text-sm font-medium transition-colors hover:text-purple-400 ${
                    location.pathname === '/help' ? 'text-purple-400 font-semibold' : 'text-slate-300'
                  }`}
                >
                  Docs & Help
                </Link>
              </>
            )}

            {/* Theme Toggle Button */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all border border-transparent hover:border-white/10"
              title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>

            {/* Auth Buttons */}
            {isAuthenticated ? (
              <div className="relative">
                <button
                  onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                  className="flex items-center gap-2.5 p-1.5 pr-3 rounded-full glass-card hover:border-purple-500/40 transition-all"
                >
                  <img
                    src={user.avatar || `https://api.dicebear.com/7.x/shapes/svg?seed=${user.name}`}
                    alt={user.name}
                    className="w-7 h-7 rounded-full object-cover border border-purple-500/30"
                  />
                  <span className="text-xs font-semibold text-slate-200 max-w-[100px] truncate">
                    {user.name}
                  </span>
                </button>

                {profileDropdownOpen && (
                  <div
                    className="absolute right-0 mt-2 w-52 rounded-2xl glass-panel shadow-2xl py-2 border border-white/10 z-50 animate-in fade-in zoom-in-95"
                    onClick={() => setProfileDropdownOpen(false)}
                  >
                    <div className="px-4 py-2 border-b border-white/5">
                      <p className="text-xs font-medium text-slate-400">Signed in as</p>
                      <p className="text-sm font-semibold text-white truncate">{user.email}</p>
                    </div>

                    <Link
                      to="/dashboard"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-purple-600/20 hover:text-purple-300 transition-colors"
                    >
                      <LayoutDashboard className="w-4 h-4 text-purple-400" />
                      Dashboard
                    </Link>
                    <Link
                      to="/dashboard/upload"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-purple-600/20 hover:text-purple-300 transition-colors"
                    >
                      <UploadCloud className="w-4 h-4 text-cyan-400" />
                      Quick Upload
                    </Link>
                    <Link
                      to="/dashboard/collections"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-purple-600/20 hover:text-purple-300 transition-colors"
                    >
                      <FolderOpen className="w-4 h-4 text-emerald-400" />
                      My Collections
                    </Link>
                    <Link
                      to="/dashboard/profile"
                      className="flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-slate-200 hover:bg-purple-600/20 hover:text-purple-300 transition-colors"
                    >
                      <User className="w-4 h-4 text-amber-400" />
                      Profile & Branding
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        className="flex items-center gap-2.5 px-4 py-2 text-xs font-semibold text-rose-300 hover:bg-rose-500/20 transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-rose-400" />
                        Admin Console
                      </Link>
                    )}

                    <div className="border-t border-white/5 my-1" />

                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2.5 px-4 py-2 text-xs font-medium text-red-400 hover:bg-red-500/10 transition-colors"
                    >
                      <LogOut className="w-4 h-4" />
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  to="/login"
                  className="px-4 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-all"
                >
                  Log In
                </Link>
                <Link
                  to="/register"
                  className="px-4 py-2 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 shadow-glow-primary hover:shadow-glow-secondary transition-all"
                >
                  Get Started Free
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden glass-panel border-b border-white/10 px-4 pt-2 pb-6 space-y-3">
          <Link
            to="/"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-white/5"
          >
            Home
          </Link>
          <Link
            to="/pricing"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-white/5"
          >
            Pricing
          </Link>
          <Link
            to="/help"
            onClick={() => setMobileMenuOpen(false)}
            className="block px-3 py-2 rounded-lg text-base font-medium text-slate-200 hover:bg-white/5"
          >
            Help & FAQ
          </Link>

          {isAuthenticated ? (
            <div className="pt-3 border-t border-white/10 space-y-2">
              <Link
                to="/dashboard"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2 rounded-lg text-base font-medium text-purple-400 hover:bg-purple-500/10"
              >
                Go to Dashboard
              </Link>
              <button
                onClick={() => {
                  logout();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2 rounded-lg text-base font-medium text-red-400 hover:bg-red-500/10"
              >
                Log Out
              </button>
            </div>
          ) : (
            <div className="pt-3 border-t border-white/10 flex flex-col gap-2">
              <Link
                to="/login"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl border border-white/10 text-slate-200"
              >
                Log In
              </Link>
              <Link
                to="/register"
                onClick={() => setMobileMenuOpen(false)}
                className="w-full text-center py-2.5 rounded-xl bg-purple-600 text-white font-semibold shadow-glow-primary"
              >
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
};

export default Navbar;
