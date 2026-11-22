import React from 'react';
import { Link } from 'react-router-dom';
import { QrCode, Shield, Zap, Globe, Heart } from 'lucide-react';

export const Footer = () => {
  return (
    <footer className="border-t border-white/5 bg-[#05070D] text-slate-400 text-xs py-12 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 mb-12">
          {/* Brand info */}
          <div className="col-span-2 space-y-4">
            <Link to="/" className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-cyan-500 p-[1px]">
                <div className="w-full h-full bg-[#080B14] rounded-[7px] flex items-center justify-center">
                  <QrCode className="w-4 h-4 text-purple-400" />
                </div>
              </div>
              <span className="font-extrabold text-lg tracking-tight text-white">
                Snap<span className="text-purple-400">Share</span>
              </span>
            </Link>
            <p className="text-slate-400 leading-relaxed max-w-sm">
              Universal QR-based file sharing and encrypted cloud storage platform. Share everything with one single scan.
            </p>
            <div className="flex items-center gap-2 text-[11px] text-slate-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              All Cloud Services Operational
            </div>
          </div>

          {/* Product links */}
          <div className="space-y-3">
            <p className="font-bold uppercase tracking-wider text-white text-[11px]">Product</p>
            <ul className="space-y-2">
              <li><Link to="/#features" className="hover:text-purple-400 transition-colors">Universal Uploader</Link></li>
              <li><Link to="/#qr-engine" className="hover:text-purple-400 transition-colors">Dynamic QR Engine</Link></li>
              <li><Link to="/pricing" className="hover:text-purple-400 transition-colors">Pricing & Plans</Link></li>
              <li><Link to="/dashboard" className="hover:text-purple-400 transition-colors">User Dashboard</Link></li>
            </ul>
          </div>

          {/* Resources */}
          <div className="space-y-3">
            <p className="font-bold uppercase tracking-wider text-white text-[11px]">Resources</p>
            <ul className="space-y-2">
              <li><Link to="/help" className="hover:text-purple-400 transition-colors">Knowledge Base</Link></li>
              <li><Link to="/help" className="hover:text-purple-400 transition-colors">API Documentation</Link></li>
              <li><Link to="/help" className="hover:text-purple-400 transition-colors">Security Center</Link></li>
              <li><Link to="/help" className="hover:text-purple-400 transition-colors">System Status</Link></li>
            </ul>
          </div>

          {/* Legal */}
          <div className="space-y-3">
            <p className="font-bold uppercase tracking-wider text-white text-[11px]">Legal</p>
            <ul className="space-y-2">
              <li><Link to="/terms" className="hover:text-purple-400 transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="hover:text-purple-400 transition-colors">Privacy Policy</Link></li>
              <li><Link to="/terms" className="hover:text-purple-400 transition-colors">Acceptable Use</Link></li>
              <li><Link to="/privacy" className="hover:text-purple-400 transition-colors">Cookie Preferences</Link></li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-500">
          <p>© {new Date().getFullYear()} SnapShare Technologies Inc. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span className="flex items-center gap-1.5 text-slate-400">
              <Shield className="w-3.5 h-3.5 text-emerald-400" /> End-to-End Cryptographic Signatures
            </span>
            <span className="flex items-center gap-1.5 text-slate-400">
              <Zap className="w-3.5 h-3.5 text-purple-400" /> High Velocity Streaming ZIP
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
