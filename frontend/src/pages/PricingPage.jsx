import React, { useState } from 'react';
import { Check, Zap, Shield, Users, Star, ArrowRight } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';

export const PricingPage = () => {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [billing, setBilling] = useState('monthly');

  const plans = [
    {
      id: 'free',
      name: 'Starter',
      price: { monthly: 0, annual: 0 },
      description: 'Perfect for personal file sharing and experimenting.',
      storage: '5 GB',
      collections: 'Up to 10',
      filesPerCollection: '50 files',
      qrCodes: 'Unlimited',
      highlights: [
        'Drag & drop universal uploader',
        'Dynamic QR codes for all collections',
        'Public & password-protected sharing',
        'WhatsApp & Telegram QR sharing',
        'Basic file preview (images, PDFs)',
        'ZIP bulk download engine',
        'AI file categorization',
        'SHA-256 duplicate detection',
      ],
      cta: 'Get Started Free',
      ctaAction: () => navigate('/register'),
      popular: false,
      color: 'border-white/10',
      badgeColor: '',
    },
    {
      id: 'pro',
      name: 'Pro Vault',
      price: { monthly: 12, annual: 9 },
      description: 'For creators, freelancers, and power users.',
      storage: '250 GB',
      collections: 'Unlimited',
      filesPerCollection: 'Unlimited',
      qrCodes: 'Unlimited + Custom branding',
      highlights: [
        'All Starter features included',
        'Custom QR logo branding overlay',
        'Password & expiry-controlled collections',
        'Collaborative multi-user uploads',
        'Video & audio in-browser preview',
        'PDF, DOCX, PPTX rich previews',
        'Collection analytics & scan tracking',
        'Custom branding on public pages',
        'Priority cloud storage (zero throttle)',
        '24/7 Pro support',
      ],
      cta: 'Start Pro Trial',
      ctaAction: () => navigate(isAuthenticated ? '/dashboard' : '/register'),
      popular: true,
      color: 'border-purple-500',
      badgeColor: 'bg-purple-600 text-white',
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: { monthly: 49, annual: 39 },
      description: 'For agencies, studios, and corporate teams.',
      storage: '5 TB',
      collections: 'Unlimited',
      filesPerCollection: 'Unlimited (up to 50GB single file)',
      qrCodes: 'White-label QR + Custom domain',
      highlights: [
        'All Pro features included',
        'Dedicated encrypted S3/R2 bucket',
        'Team management & role-based access',
        'SSO/SAML authentication support',
        'API access for integrations',
        'Advanced admin reporting dashboard',
        'SLA-backed uptime guarantee (99.99%)',
        'Dedicated Account Manager',
        'Invoice & purchase order billing',
        'On-premise deployment option',
      ],
      cta: 'Contact Sales',
      ctaAction: () => window.open('mailto:enterprise@snapshare.io', '_blank'),
      popular: false,
      color: 'border-cyan-500/50',
      badgeColor: '',
    },
  ];

  return (
    <div className="min-h-screen bg-[#080B14] text-slate-100 pb-20">
      {/* Background Orb */}
      <div className="absolute top-20 left-1/2 -translate-x-1/2 w-[700px] h-[500px] bg-gradient-to-tr from-purple-700/15 to-cyan-500/5 rounded-full blur-[140px] pointer-events-none" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 space-y-16">
        {/* Header */}
        <div className="text-center space-y-5">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs font-bold">
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            Transparent, No-Surprise Pricing
          </div>
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
            Power Your{' '}
            <span className="gradient-text-purple">File Sharing</span>
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mx-auto leading-relaxed">
            Start for free and scale as you grow. All plans include dynamic QR codes, end-to-end secure storage, and instant bulk ZIP download streaming.
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-2 p-1 rounded-2xl bg-white/5 border border-white/10">
            <button
              onClick={() => setBilling('monthly')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${billing === 'monthly' ? 'bg-purple-600 text-white shadow-glow-primary' : 'text-slate-400 hover:text-white'}`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling('annual')}
              className={`px-5 py-2 rounded-xl text-xs font-bold transition-all ${billing === 'annual' ? 'bg-purple-600 text-white shadow-glow-primary' : 'text-slate-400 hover:text-white'}`}
            >
              Annual
              <span className="ml-2 text-[10px] text-emerald-400 font-bold">Save 25%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`glass-panel rounded-3xl border p-8 space-y-6 relative transition-all ${plan.color} ${plan.popular ? 'shadow-glow-primary scale-[1.02]' : ''}`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                  <span className="px-4 py-1.5 rounded-full bg-purple-600 text-white text-[11px] font-extrabold uppercase tracking-wider shadow-glow-primary">
                    Most Popular
                  </span>
                </div>
              )}

              {/* Plan Name & Price */}
              <div className="space-y-2">
                <h3 className="text-lg font-extrabold text-white">{plan.name}</h3>
                <p className="text-xs text-slate-400">{plan.description}</p>
                <div className="flex items-end gap-2 pt-2">
                  <span className="text-4xl font-black text-white">
                    {plan.price[billing] === 0 ? 'Free' : `$${plan.price[billing]}`}
                  </span>
                  {plan.price[billing] > 0 && (
                    <span className="text-sm text-slate-400 pb-1">/mo</span>
                  )}
                </div>
                {billing === 'annual' && plan.price.annual > 0 && (
                  <p className="text-[11px] text-emerald-400 font-semibold">
                    Billed ${plan.price.annual * 12}/year
                  </p>
                )}
              </div>

              {/* Limits Summary */}
              <div className="space-y-2 p-4 rounded-2xl bg-white/5 border border-white/5 text-xs text-slate-300">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Storage</span>
                  <span className="font-bold text-white">{plan.storage}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Collections</span>
                  <span className="font-bold text-white">{plan.collections}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Files per Collection</span>
                  <span className="font-bold text-white">{plan.filesPerCollection}</span>
                </div>
              </div>

              {/* Features List */}
              <ul className="space-y-2.5">
                {plan.highlights.map((feature, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 text-xs text-slate-300">
                    <Check className="w-4 h-4 text-emerald-400 mt-0.5 shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>

              {/* CTA */}
              <button
                onClick={plan.ctaAction}
                className={`w-full py-3.5 rounded-2xl text-sm font-bold transition-all flex items-center justify-center gap-2 ${
                  plan.popular
                    ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-glow-primary'
                    : 'glass-card hover:border-purple-500/40 text-slate-200'
                }`}
              >
                {plan.cta} <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Features Comparison Callout */}
        <div className="p-8 rounded-3xl glass-panel border border-white/10 text-center space-y-4">
          <Shield className="w-10 h-10 text-emerald-400 mx-auto" />
          <h3 className="text-xl font-extrabold text-white">All Plans Include Core Security</h3>
          <div className="flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-400">
            {[
              'SHA-256 file integrity validation',
              'Magic byte signature verification',
              'Never executed uploaded files',
              'Signed-URL secure file access',
              'JWT-based session management',
              'XSS + CSRF protection',
              'Privacy-compliant analytics',
            ].map((f, i) => (
              <span key={i} className="flex items-center gap-1.5">
                <Check className="w-4 h-4 text-emerald-400" /> {f}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
