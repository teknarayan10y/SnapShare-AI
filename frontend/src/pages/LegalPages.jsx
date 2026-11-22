import React from 'react';
import { Shield, Eye, Lock, Server, Trash2, Globe, Mail } from 'lucide-react';

export const PrivacyPage = () => (
  <div className="min-h-screen bg-[#080B14] text-slate-100 pb-20">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 space-y-12">
      <div className="text-center space-y-3">
        <Shield className="w-12 h-12 text-emerald-400 mx-auto" />
        <h1 className="text-4xl font-extrabold text-white">Privacy Policy</h1>
        <p className="text-xs text-slate-400">Effective Date: January 1, 2026 • Last Updated: November 15, 2026</p>
      </div>

      <div className="glass-panel p-8 rounded-3xl border border-white/10 prose prose-invert prose-sm max-w-none space-y-8 text-slate-300 leading-relaxed text-sm">
        {[
          {
            icon: Globe,
            title: '1. Information We Collect',
            content: `When you register for SnapShare, we collect your name, email address, and a hashed password (never stored in plaintext). We do not collect any payment data ourselves — payment is processed by certified third-party PCI-compliant providers.\n\nFor analytics, we capture only: a one-way SHA-256 hash of visitor IP addresses (non-reversible and non-identifiable), device type (desktop/mobile/tablet) inferred from user-agent strings, referrer category (direct/social/email), and event types (scan, view, download). We do not create visitor profiles or track individuals across the web.`,
          },
          {
            icon: Server,
            title: '2. File Storage & Security',
            content: `All uploaded files are stored exclusively in encrypted cloud object storage (Cloudflare R2 or AWS S3). File binaries are never stored in the MongoDB database. Files are accessed only via cryptographically signed, time-limited URLs. Uploaded files undergo magic byte signature validation to prevent disguised executable uploads. All files are quarantined from server execution at all times.`,
          },
          {
            icon: Lock,
            title: '3. How We Use Your Data',
            content: `We use your data solely to provide the SnapShare service: to authenticate your identity, associate collections and files to your account, generate QR codes linked to your collections, and display aggregated (non-personal) analytics on your dashboard. We do not sell, rent, or share your personal data with any third parties for advertising or marketing purposes.`,
          },
          {
            icon: Eye,
            title: '4. Collection Visibility & Sharing',
            content: `Public collections are intentionally accessible to anyone with the unique URL or QR code. Password-protected collections require visitors to enter the configured password. Private collections are only accessible to the authenticated owner. You may revoke access to any collection at any time by revoking or regenerating its share token through the QR management interface.`,
          },
          {
            icon: Trash2,
            title: '5. Data Retention & Deletion',
            content: `You may delete individual files, entire collections, or your entire account at any time. When you delete a file or collection, all associated objects are permanently removed from our storage systems within 24 hours. When you delete your account, all personal data, collections, files, QR codes, and analytics records are permanently purged within 7 days.`,
          },
          {
            icon: Mail,
            title: '6. Contact & Data Requests',
            content: `For data access requests, correction requests, or any privacy concerns, please email privacy@snapshare.io. We will respond within 30 days in accordance with applicable data protection regulations including GDPR, CCPA, and PDPB.`,
          },
        ].map((section, idx) => {
          const Icon = section.icon;
          return (
            <div key={idx} className="space-y-3">
              <div className="flex items-center gap-3">
                <Icon className="w-5 h-5 text-purple-400 shrink-0" />
                <h2 className="text-base font-bold text-white">{section.title}</h2>
              </div>
              <p className="pl-8 text-slate-400 whitespace-pre-line">{section.content}</p>
            </div>
          );
        })}
      </div>
    </div>
  </div>
);

export const TermsPage = () => (
  <div className="min-h-screen bg-[#080B14] text-slate-100 pb-20">
    <div className="max-w-4xl mx-auto px-4 sm:px-6 pt-24 space-y-12">
      <div className="text-center space-y-3">
        <Shield className="w-12 h-12 text-purple-400 mx-auto" />
        <h1 className="text-4xl font-extrabold text-white">Terms of Service</h1>
        <p className="text-xs text-slate-400">Effective Date: January 1, 2026</p>
      </div>

      <div className="glass-panel p-8 rounded-3xl border border-white/10 space-y-8 text-sm text-slate-300 leading-relaxed">
        {[
          { title: '1. Acceptance of Terms', content: 'By creating a SnapShare account or using the SnapShare service, you agree to be bound by these Terms of Service, our Privacy Policy, and our Acceptable Use Policy. If you do not agree, please do not use the service.' },
          { title: '2. Permitted Use', content: 'SnapShare is provided for lawful file sharing and cloud storage use. You may not use the service to upload, share, or distribute illegal, harmful, infringing, or malicious content. You are responsible for all content you upload.' },
          { title: '3. Prohibited Content', content: 'You may not upload or share: executable malware or exploits, child sexual abuse material (CSAM), content that infringes intellectual property rights, personally identifiable information of others without consent, or any content that violates applicable law.' },
          { title: '4. Storage & Account Limits', content: 'Free accounts receive 5 GB of storage and may create up to 10 collections. SnapShare reserves the right to adjust quotas with 30 days notice. Excessive or abusive usage may result in account suspension.' },
          { title: '5. Intellectual Property', content: 'You retain all intellectual property rights to files you upload. By uploading, you grant SnapShare a limited, non-exclusive license to store, transmit, and serve your files solely for the purpose of providing the service to you and your designated recipients.' },
          { title: '6. Termination', content: 'SnapShare may suspend or terminate accounts that violate these terms, upon written notice where possible. You may delete your account at any time through the account settings.' },
          { title: '7. Disclaimers', content: 'THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTY OF ANY KIND. SNAPSHARE IS NOT RESPONSIBLE FOR DATA LOSS DUE TO USER ERROR, FORCE MAJEURE, OR CIRCUMSTANCES BEYOND OUR REASONABLE CONTROL.' },
          { title: '8. Governing Law', content: 'These terms are governed by the laws of the jurisdiction in which SnapShare Technologies Inc. is incorporated, without regard to conflict of law principles.' },
        ].map((section, idx) => (
          <div key={idx} className="space-y-2 pb-6 border-b border-white/5 last:border-0">
            <h2 className="text-base font-bold text-white">{section.title}</h2>
            <p className="text-slate-400">{section.content}</p>
          </div>
        ))}
      </div>
    </div>
  </div>
);
