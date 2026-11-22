import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

const docsDir = path.resolve('../docs');
if (!fs.existsSync(docsDir)) {
  fs.mkdirSync(docsDir, { recursive: true });
}

// =========================================================================
// 1. FLOW DIAGRAM (Face Organization & Deterministic Rule Engine)
// =========================================================================
const flowSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 980" width="1440" height="980" style="background:#090D1A; font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,sans-serif;">
  <defs>
    <!-- Background Gradients -->
    <linearGradient id="bgGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080C18"/>
      <stop offset="50%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#080C18"/>
    </linearGradient>

    <!-- Card Gradients -->
    <linearGradient id="purpleCard" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1E1438"/>
      <stop offset="100%" stop-color="#140E26"/>
    </linearGradient>
    <linearGradient id="blueCard" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E243A"/>
      <stop offset="100%" stop-color="#081827"/>
    </linearGradient>
    <linearGradient id="emeraldCard" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0B2B24"/>
      <stop offset="100%" stop-color="#061A16"/>
    </linearGradient>
    <linearGradient id="amberCard" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#302008"/>
      <stop offset="100%" stop-color="#1E1405"/>
    </linearGradient>
    <linearGradient id="roseCard" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#330E20"/>
      <stop offset="100%" stop-color="#200814"/>
    </linearGradient>
    <linearGradient id="cyanCard" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A2A38"/>
      <stop offset="100%" stop-color="#061A24"/>
    </linearGradient>

    <!-- Arrow Markers -->
    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#8B5CF6"/>
    </marker>
    <marker id="arrowCyan" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#06B6D4"/>
    </marker>
    <marker id="arrowGreen" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#10B981"/>
    </marker>

    <!-- Glow Filter -->
    <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="6" result="blur"/>
      <feComposite in="SourceGraphic" in2="blur" operator="over"/>
    </filter>
  </defs>

  <!-- Background Base -->
  <rect width="1440" height="980" fill="url(#bgGrad)"/>

  <!-- Decorative ambient glows -->
  <circle cx="200" cy="150" r="180" fill="#8B5CF6" opacity="0.08" filter="url(#glow)"/>
  <circle cx="1200" cy="500" r="220" fill="#06B6D4" opacity="0.06" filter="url(#glow)"/>
  <circle cx="700" cy="850" r="200" fill="#EC4899" opacity="0.05" filter="url(#glow)"/>

  <!-- Title & Subtitle -->
  <text x="720" y="55" text-anchor="middle" font-size="28" font-weight="800" fill="#FFFFFF" letter-spacing="0.5">
    SNAPSHARE AI 2.0 — END-TO-END SMART PHOTO ORGANIZATION
  </text>
  <text x="720" y="85" text-anchor="middle" font-size="14" font-weight="500" fill="#94A3B8">
    Neural Face Detection &#8226; EXIF Normalization &#8226; Deterministic Rules A–G &#8226; Privacy-Consented Biometrics
  </text>

  <!-- ========================================================================= -->
  <!-- STEP 1: UPLOAD & INTAKE -->
  <!-- ========================================================================= -->
  <g transform="translate(60, 120)">
    <rect width="360" height="150" rx="16" fill="url(#purpleCard)" stroke="#8B5CF6" stroke-width="1.5"/>
    <rect x="16" y="16" width="34" height="34" rx="8" fill="#8B5CF6" opacity="0.2"/>
    <text x="33" y="38" text-anchor="middle" font-size="16" fill="#A78BFA">&#x2601;</text>
    <text x="62" y="38" font-size="16" font-weight="700" fill="#FFFFFF">1. Media Intake &amp; Streaming</text>
    
    <text x="20" y="75" font-size="12.5" fill="#CBD5E1">&#8226; User uploads photo via Web UI or Visitor QR</text>
    <text x="20" y="98" font-size="12.5" fill="#CBD5E1">&#8226; Direct stream to Cloudinary CDN (Zero local disk bloat)</text>
    <text x="20" y="121" font-size="12.5" fill="#CBD5E1">&#8226; Asynchronous job enqueued to Node.js / BullMQ</text>
  </g>

  <!-- Arrow 1 -> 2 -->
  <path d="M 420 195 L 530 195" stroke="#8B5CF6" stroke-width="2.5" marker-end="url(#arrow)" stroke-dasharray="6,4"/>

  <!-- ========================================================================= -->
  <!-- STEP 2: CV & NEURAL DETECTION -->
  <!-- ========================================================================= -->
  <g transform="translate(540, 120)">
    <rect width="400" height="150" rx="16" fill="url(#cyanCard)" stroke="#06B6D4" stroke-width="1.5"/>
    <rect x="16" y="16" width="34" height="34" rx="8" fill="#06B6D4" opacity="0.2"/>
    <text x="33" y="39" text-anchor="middle" font-size="16" fill="#22D3EE">&#x2699;</text>
    <text x="62" y="38" font-size="16" font-weight="700" fill="#FFFFFF">2. Computer Vision Pipeline (FastAPI)</text>
    
    <text x="20" y="75" font-size="12.5" fill="#CBD5E1">&#8226; <tspan font-weight="700" fill="#22D3EE">EXIF Transpose:</tspan> Auto-corrects portrait/phone rotation</text>
    <text x="20" y="98" font-size="12.5" fill="#CBD5E1">&#8226; <tspan font-weight="700" fill="#22D3EE">YuNet ONNX:</tspan> Multi-face detection, boxes &amp; 5 landmarks</text>
    <text x="20" y="121" font-size="12.5" fill="#CBD5E1">&#8226; <tspan font-weight="700" fill="#22D3EE">Bystander Filter:</tspan> Removes tiny/distant background faces</text>
  </g>

  <!-- Arrow 2 -> Decision Center -->
  <path d="M 940 195 L 1050 195" stroke="#06B6D4" stroke-width="2.5" marker-end="url(#arrowCyan)"/>

  <!-- ========================================================================= -->
  <!-- STEP 3: FACE COUNT DECISION CENTER -->
  <!-- ========================================================================= -->
  <g transform="translate(1060, 130)">
    <!-- Diamond/Hexagon Decision Box -->
    <polygon points="160,0 320,65 160,130 0,65" fill="#1E1B4B" stroke="#A78BFA" stroke-width="2"/>
    <text x="160" y="58" text-anchor="middle" font-size="15" font-weight="800" fill="#FFFFFF">VERIFIED FACE COUNT</text>
    <text x="160" y="78" text-anchor="middle" font-size="12" font-weight="600" fill="#C4B5FD">faceCount &#8712; [0, 1, 2, 3, 4, >4]</text>
  </g>

  <!-- Connectors from Decision Center to Rule Tiers -->
  <path d="M 1220 260 L 1220 330 L 140 330 L 140 380" stroke="#8B5CF6" stroke-width="2" fill="none"/>
  <path d="M 330 330 L 330 380" stroke="#8B5CF6" stroke-width="2" fill="none"/>
  <path d="M 520 330 L 520 380" stroke="#8B5CF6" stroke-width="2" fill="none"/>
  <path d="M 710 330 L 710 380" stroke="#8B5CF6" stroke-width="2" fill="none"/>
  <path d="M 900 330 L 900 380" stroke="#8B5CF6" stroke-width="2" fill="none"/>
  <path d="M 1090 330 L 1090 380" stroke="#8B5CF6" stroke-width="2" fill="none"/>
  <path d="M 1280 330 L 1280 380" stroke="#8B5CF6" stroke-width="2" fill="none"/>

  <!-- ========================================================================= -->
  <!-- STEP 4: THE 6 FOLDER TIERS (Rules A through F) -->
  <!-- ========================================================================= -->

  <!-- Tier 1: Group Photos (> 4 people) -->
  <g transform="translate(50, 390)">
    <rect width="180" height="210" rx="14" fill="url(#purpleCard)" stroke="#6366F1" stroke-width="1.8"/>
    <rect x="14" y="14" width="28" height="28" rx="6" fill="#6366F1" opacity="0.3"/>
    <text x="28" y="33" text-anchor="middle" font-size="14" fill="#A5B4FC">&#x1F465;</text>
    <text x="48" y="32" font-size="13" font-weight="800" fill="#FFFFFF">Group Photos</text>
    
    <rect x="12" y="52" width="156" height="22" rx="4" fill="#6366F1" opacity="0.2"/>
    <text x="90" y="67" text-anchor="middle" font-size="10.5" font-weight="700" fill="#818CF8">RULE A: count > 4</text>
    
    <text x="14" y="98" font-size="11" fill="#CBD5E1">&#8226; Large group photos</text>
    <text x="14" y="118" font-size="11" fill="#CBD5E1">&#8226; Weddings &amp; parties</text>
    <text x="14" y="138" font-size="11" fill="#CBD5E1">&#8226; 5 to 50+ people</text>
    <text x="14" y="158" font-size="11" fill="#CBD5E1">&#8226; Preserves tags</text>
    
    <rect x="14" y="172" width="152" height="24" rx="6" fill="#0F172A" stroke="#6366F1" stroke-width="1"/>
    <text x="90" y="188" text-anchor="middle" font-size="10.5" font-weight="700" fill="#A5B4FC">&#x1F4C1; /Group Photos</text>
  </g>

  <!-- Tier 2: Four Member Groups (4 people) -->
  <g transform="translate(240, 390)">
    <rect width="180" height="210" rx="14" fill="url(#amberCard)" stroke="#F59E0B" stroke-width="1.8"/>
    <rect x="14" y="14" width="28" height="28" rx="6" fill="#F59E0B" opacity="0.3"/>
    <text x="28" y="33" text-anchor="middle" font-size="14" fill="#FCD34D">&#x1F46A;</text>
    <text x="48" y="32" font-size="13" font-weight="800" fill="#FFFFFF">Four Member</text>
    
    <rect x="12" y="52" width="156" height="22" rx="4" fill="#F59E0B" opacity="0.2"/>
    <text x="90" y="67" text-anchor="middle" font-size="10.5" font-weight="700" fill="#FBBF24">RULE B: count === 4</text>
    
    <text x="14" y="98" font-size="11" fill="#CBD5E1">&#8226; Exactly 4 members</text>
    <text x="14" y="118" font-size="11" fill="#CBD5E1">&#8226; Quartets &amp; families</text>
    <text x="14" y="138" font-size="11" fill="#CBD5E1">&#8226; Confirmed 4-match</text>
    <text x="14" y="158" font-size="11" fill="#CBD5E1">&#8226; Combination folder</text>
    
    <rect x="14" y="172" width="152" height="24" rx="6" fill="#0F172A" stroke="#F59E0B" stroke-width="1"/>
    <text x="90" y="188" text-anchor="middle" font-size="10.5" font-weight="700" fill="#FCD34D">&#x1F4C1; /Four Member...</text>
  </g>

  <!-- Tier 3: Three People (3 people) -->
  <g transform="translate(430, 390)">
    <rect width="180" height="210" rx="14" fill="url(#emeraldCard)" stroke="#10B981" stroke-width="1.8"/>
    <rect x="14" y="14" width="28" height="28" rx="6" fill="#10B981" opacity="0.3"/>
    <text x="28" y="33" text-anchor="middle" font-size="14" fill="#6EE7B7">&#x1F465;</text>
    <text x="48" y="32" font-size="13" font-weight="800" fill="#FFFFFF">Three People</text>
    
    <rect x="12" y="52" width="156" height="22" rx="4" fill="#10B981" opacity="0.2"/>
    <text x="90" y="67" text-anchor="middle" font-size="10.5" font-weight="700" fill="#34D399">RULE C: count === 3</text>
    
    <text x="14" y="98" font-size="11" fill="#CBD5E1">&#8226; Exactly 3 members</text>
    <text x="14" y="118" font-size="11" fill="#CBD5E1">&#8226; Trios &amp; small groups</text>
    <text x="14" y="138" font-size="11" fill="#CBD5E1">&#8226; Confirmed 3-match</text>
    <text x="14" y="158" font-size="11" fill="#CBD5E1">&#8226; Combination folder</text>
    
    <rect x="14" y="172" width="152" height="24" rx="6" fill="#0F172A" stroke="#10B981" stroke-width="1"/>
    <text x="90" y="188" text-anchor="middle" font-size="10.5" font-weight="700" fill="#6EE7B7">&#x1F4C1; /Three People</text>
  </g>

  <!-- Tier 4: Two People (2 people) -->
  <g transform="translate(620, 390)">
    <rect width="180" height="210" rx="14" fill="url(#blueCard)" stroke="#3B82F6" stroke-width="1.8"/>
    <rect x="14" y="14" width="28" height="28" rx="6" fill="#3B82F6" opacity="0.3"/>
    <text x="28" y="33" text-anchor="middle" font-size="14" fill="#93C5FD">&#x1F46B;</text>
    <text x="48" y="32" font-size="13" font-weight="800" fill="#FFFFFF">Two People</text>
    
    <rect x="12" y="52" width="156" height="22" rx="4" fill="#3B82F6" opacity="0.2"/>
    <text x="90" y="67" text-anchor="middle" font-size="10.5" font-weight="700" fill="#60A5FA">RULE D: count === 2</text>
    
    <text x="14" y="98" font-size="11" fill="#CBD5E1">&#8226; Exactly 2 members</text>
    <text x="14" y="118" font-size="11" fill="#CBD5E1">&#8226; Couples, duos, pairs</text>
    <text x="14" y="138" font-size="11" fill="#CBD5E1">&#8226; Confirmed 2-match</text>
    <text x="14" y="158" font-size="11" fill="#CBD5E1">&#8226; Pair subfolders</text>
    
    <rect x="14" y="172" width="152" height="24" rx="6" fill="#0F172A" stroke="#3B82F6" stroke-width="1"/>
    <text x="90" y="188" text-anchor="middle" font-size="10.5" font-weight="700" fill="#93C5FD">&#x1F4C1; /Two People</text>
  </g>

  <!-- Tier 5: Individual Photos (1 person) -->
  <g transform="translate(810, 390)">
    <rect width="180" height="210" rx="14" fill="url(#roseCard)" stroke="#EC4899" stroke-width="1.8"/>
    <rect x="14" y="14" width="28" height="28" rx="6" fill="#EC4899" opacity="0.3"/>
    <text x="28" y="33" text-anchor="middle" font-size="14" fill="#F472B6">&#x1F464;</text>
    <text x="48" y="32" font-size="13" font-weight="800" fill="#FFFFFF">Individual</text>
    
    <rect x="12" y="52" width="156" height="22" rx="4" fill="#EC4899" opacity="0.2"/>
    <text x="90" y="67" text-anchor="middle" font-size="10.5" font-weight="700" fill="#F472B6">RULE E: count === 1</text>
    
    <text x="14" y="98" font-size="11" fill="#CBD5E1">&#8226; Solo portraits</text>
    <text x="14" y="118" font-size="11" fill="#CBD5E1">&#8226; Single person shots</text>
    <text x="14" y="138" font-size="11" fill="#CBD5E1">&#8226; Personal identity</text>
    <text x="14" y="158" font-size="11" fill="#CBD5E1">&#8226; Dedicated profile</text>
    
    <rect x="14" y="172" width="152" height="24" rx="6" fill="#0F172A" stroke="#EC4899" stroke-width="1"/>
    <text x="90" y="188" text-anchor="middle" font-size="10.5" font-weight="700" fill="#F472B6">&#x1F4C1; /Individual...</text>
  </g>

  <!-- Tier 6: Non-Human / Scenery (0 people) -->
  <g transform="translate(1000, 390)">
    <rect width="180" height="210" rx="14" fill="url(#cyanCard)" stroke="#14B8A6" stroke-width="1.8"/>
    <rect x="14" y="14" width="28" height="28" rx="6" fill="#14B8A6" opacity="0.3"/>
    <text x="28" y="33" text-anchor="middle" font-size="14" fill="#5EEAD4">&#x1F3D5;</text>
    <text x="48" y="32" font-size="13" font-weight="800" fill="#FFFFFF">Non-Human</text>
    
    <rect x="12" y="52" width="156" height="22" rx="4" fill="#14B8A6" opacity="0.2"/>
    <text x="90" y="67" text-anchor="middle" font-size="10.5" font-weight="700" fill="#2DD4BF">RULE F: count === 0</text>
    
    <text x="14" y="98" font-size="11" fill="#CBD5E1">&#8226; Nature, landscape</text>
    <text x="14" y="118" font-size="11" fill="#CBD5E1">&#8226; Architecture, food</text>
    <text x="14" y="138" font-size="11" fill="#CBD5E1">&#8226; Code, documents</text>
    <text x="14" y="158" font-size="11" fill="#CBD5E1">&#8226; Zero human overlap</text>
    
    <rect x="14" y="172" width="152" height="24" rx="6" fill="#0F172A" stroke="#14B8A6" stroke-width="1"/>
    <text x="90" y="188" text-anchor="middle" font-size="10.5" font-weight="700" fill="#5EEAD4">&#x1F4C1; /Nature, /Tech...</text>
  </g>

  <!-- Tier 7: Needs Review -->
  <g transform="translate(1190, 390)">
    <rect width="200" height="210" rx="14" fill="#2A0E14" stroke="#EF4444" stroke-width="1.8"/>
    <rect x="14" y="14" width="28" height="28" rx="6" fill="#EF4444" opacity="0.3"/>
    <text x="28" y="33" text-anchor="middle" font-size="14" fill="#FCA5A5">&#x26A0;</text>
    <text x="48" y="32" font-size="13" font-weight="800" fill="#FFFFFF">Needs Review</text>
    
    <rect x="12" y="52" width="176" height="22" rx="4" fill="#EF4444" opacity="0.2"/>
    <text x="100" y="67" text-anchor="middle" font-size="10.5" font-weight="700" fill="#F87171">RULE G: Ambiguous</text>
    
    <text x="14" y="98" font-size="11" fill="#CBD5E1">&#8226; Faces detected</text>
    <text x="14" y="118" font-size="11" fill="#CBD5E1">&#8226; Confidence low</text>
    <text x="14" y="138" font-size="11" fill="#CBD5E1">&#8226; Consent inactive</text>
    <text x="14" y="158" font-size="11" fill="#CBD5E1">&#8226; Human verification</text>
    
    <rect x="14" y="172" width="172" height="24" rx="6" fill="#0F172A" stroke="#EF4444" stroke-width="1"/>
    <text x="100" y="188" text-anchor="middle" font-size="10.5" font-weight="700" fill="#FCA5A5">&#x1F4C1; /Needs Review</text>
  </g>

  <!-- ========================================================================= -->
  <!-- STEP 5: RECURRENT BIOMETRICS & SUBFOLDER CLUSTERING -->
  <!-- ========================================================================= -->
  <g transform="translate(180, 650)">
    <rect width="1080" height="270" rx="18" fill="#0F1424" stroke="#8B5CF6" stroke-width="1.5"/>
    
    <text x="30" y="38" font-size="17" font-weight="800" fill="#FFFFFF">&#x1F511; DETERMINISTIC GROUP MATCHING &amp; SUBFOLDER CLUSTERING (OPT-IN)</text>
    <text x="30" y="60" font-size="12" fill="#94A3B8">Computes order-invariant group keys: userId_collectionId_sorted(memberProfileIds) for atomic, concurrent upsert</text>

    <!-- Sub-Box 1: Consent Gate -->
    <g transform="translate(30, 80)">
      <rect width="230" height="160" rx="12" fill="#18132B" stroke="#A78BFA" stroke-width="1"/>
      <text x="20" y="30" font-size="14" font-weight="700" fill="#C4B5FD">&#x1F512; Privacy Consent Gate</text>
      <text x="20" y="60" font-size="11.5" fill="#CBD5E1">&#8226; Disabled by default (GDPR)</text>
      <text x="20" y="82" font-size="11.5" fill="#CBD5E1">&#8226; Explicit user consent</text>
      <text x="20" y="104" font-size="11.5" fill="#CBD5E1">&#8226; Private unnamed profiles</text>
      <text x="20" y="126" font-size="11.5" fill="#CBD5E1">&#8226; 1-click biometric purge</text>
      <rect x="20" y="136" width="190" height="16" rx="4" fill="#8B5CF6" opacity="0.3"/>
      <text x="115" y="148" text-anchor="middle" font-size="9.5" font-weight="700" fill="#EDE9FE">User Authorization Required</text>
    </g>

    <!-- Arrow Sub 1 -> Sub 2 -->
    <path d="M 270 160 L 310 160" stroke="#8B5CF6" stroke-width="2" marker-end="url(#arrow)"/>

    <!-- Sub-Box 2: SFace Feature Embeddings -->
    <g transform="translate(320, 80)">
      <rect width="230" height="160" rx="12" fill="#0C2034" stroke="#38BDF8" stroke-width="1"/>
      <text x="20" y="30" font-size="14" font-weight="700" fill="#7DD3FC">&#x1F9EC; SFace 128-D Vectors</text>
      <text x="20" y="60" font-size="11.5" fill="#CBD5E1">&#8226; L2-normalized 128-dim</text>
      <text x="20" y="82" font-size="11.5" fill="#CBD5E1">&#8226; Cosine similarity scoring</text>
      <text x="20" y="104" font-size="11.5" fill="#CBD5E1">&#8226; Strict identity threshold</text>
      <text x="20" y="126" font-size="11.5" fill="#CBD5E1">&#8226; Private vector references</text>
      <rect x="20" y="136" width="190" height="16" rx="4" fill="#0284C7" opacity="0.3"/>
      <text x="115" y="148" text-anchor="middle" font-size="9.5" font-weight="700" fill="#BAE6FD">Neural Feature Extraction</text>
    </g>

    <!-- Arrow Sub 2 -> Sub 3 -->
    <path d="M 560 160 L 600 160" stroke="#06B6D4" stroke-width="2" marker-end="url(#arrowCyan)"/>

    <!-- Sub-Box 3: Deterministic Group Key -->
    <g transform="translate(610, 80)">
      <rect width="210" height="160" rx="12" fill="#0B261D" stroke="#34D399" stroke-width="1"/>
      <text x="18" y="30" font-size="13.5" font-weight="700" fill="#6EE7B7">&#x1F500; Deterministic Key</text>
      <text x="18" y="58" font-size="11" fill="#CBD5E1">&#8226; Sorts confirmed member IDs</text>
      <text x="18" y="78" font-size="11" fill="#CBD5E1">&#8226; Ignores face order/position</text>
      <text x="18" y="98" font-size="11" fill="#CBD5E1">&#8226; Scoped to owner &amp; album</text>
      <text x="18" y="118" font-size="11" fill="#CBD5E1">&#8226; Atomic safe upsert</text>
      <rect x="18" y="136" width="174" height="16" rx="4" fill="#059669" opacity="0.3"/>
      <text x="105" y="148" text-anchor="middle" font-size="9.5" font-weight="700" fill="#D1FAE5">Order-Invariant Key</text>
    </g>

    <!-- Arrow Sub 3 -> Sub 4 -->
    <path d="M 830 160 L 870 160" stroke="#10B981" stroke-width="2" marker-end="url(#arrowGreen)"/>

    <!-- Sub-Box 4: Virtual Combination Folder -->
    <g transform="translate(880, 80)">
      <rect width="170" height="160" rx="12" fill="#1C1838" stroke="#C084FC" stroke-width="1"/>
      <text x="16" y="30" font-size="13" font-weight="700" fill="#E9D5FF">&#x1F4C2; Combination Folders</text>
      <text x="16" y="58" font-size="11" fill="#CBD5E1">&#8226; Reuses existing</text>
      <text x="16" y="78" font-size="11" fill="#CBD5E1">&#8226; Auto-creates new</text>
      <text x="16" y="98" font-size="11" fill="#CBD5E1">&#8226; User renaming</text>
      <text x="16" y="118" font-size="11" fill="#CBD5E1">&#8226; Zero physical dupes</text>
      <rect x="16" y="136" width="138" height="16" rx="4" fill="#9333EA" opacity="0.3"/>
      <text x="85" y="148" text-anchor="middle" font-size="9.5" font-weight="700" fill="#F3E8FF">Alex - Maria</text>
    </g>
  </g>
</svg>`;

// =========================================================================
// 2. SYSTEM ARCHITECTURE DIAGRAM (Full Multi-Tier Topology)
// =========================================================================
const archSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 920" width="1440" height="920" style="background:#090D1A; font-family:'Segoe UI',-apple-system,BlinkMacSystemFont,Roboto,Helvetica,sans-serif;">
  <defs>
    <linearGradient id="bgGrad2" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#080C18"/>
      <stop offset="50%" stop-color="#0F172A"/>
      <stop offset="100%" stop-color="#080C18"/>
    </linearGradient>

    <linearGradient id="clientGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#1A153A"/>
      <stop offset="100%" stop-color="#100D28"/>
    </linearGradient>

    <linearGradient id="apiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0E233C"/>
      <stop offset="100%" stop-color="#091728"/>
    </linearGradient>

    <linearGradient id="aiGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0A2C2A"/>
      <stop offset="100%" stop-color="#061A19"/>
    </linearGradient>

    <linearGradient id="cloudGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2D153B"/>
      <stop offset="100%" stop-color="#1B0C24"/>
    </linearGradient>

    <linearGradient id="dbGrad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#2E1C0A"/>
      <stop offset="100%" stop-color="#1A0F05"/>
    </linearGradient>

    <marker id="arrowPurp" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#8B5CF6"/>
    </marker>
    <marker id="arrowCyan2" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#06B6D4"/>
    </marker>
    <marker id="arrowGreen2" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 1 L 10 5 L 0 9 z" fill="#10B981"/>
    </marker>
  </defs>

  <rect width="1440" height="920" fill="url(#bgGrad2)"/>

  <!-- Title -->
  <text x="720" y="55" text-anchor="middle" font-size="28" font-weight="800" fill="#FFFFFF" letter-spacing="0.5">
    SNAPSHARE AI — FULL MULTI-TIER SYSTEM ARCHITECTURE
  </text>
  <text x="720" y="85" text-anchor="middle" font-size="14" font-weight="500" fill="#94A3B8">
    Decoupled Microservice Topology &#8226; Pure Cloud CDN Storage &#8226; Neural CV Engine &#8226; Zero Local Disk Bloat
  </text>

  <!-- ========================================================================= -->
  <!-- TIER 1: CLIENT FRONTEND -->
  <!-- ========================================================================= -->
  <g transform="translate(80, 130)">
    <rect width="1280" height="150" rx="16" fill="url(#clientGrad)" stroke="#8B5CF6" stroke-width="1.8"/>
    <rect x="20" y="20" width="36" height="36" rx="8" fill="#8B5CF6" opacity="0.3"/>
    <text x="38" y="44" text-anchor="middle" font-size="18" fill="#C4B5FD">&#x1F4BB;</text>
    <text x="70" y="44" font-size="18" font-weight="800" fill="#FFFFFF">CLIENT PRESENTATION TIER (React 18 + Vite)</text>

    <!-- Sub components inside Frontend -->
    <g transform="translate(30, 70)">
      <rect width="280" height="60" rx="8" fill="#0D0A1C" stroke="#A78BFA" stroke-width="1"/>
      <text x="15" y="26" font-size="13" font-weight="700" fill="#EDE9FE">&#x2728; AI Smart Organizer</text>
      <text x="15" y="46" font-size="11" fill="#94A3B8">Smart Library, People, NLP Rules, Preview</text>
    </g>

    <g transform="translate(340, 70)">
      <rect width="280" height="60" rx="8" fill="#0D0A1C" stroke="#A78BFA" stroke-width="1"/>
      <text x="15" y="26" font-size="13" font-weight="700" fill="#EDE9FE">&#x1F4F1; QR Code Studio &amp; Share</text>
      <text x="15" y="46" font-size="11" fill="#94A3B8">Dynamic Canvas QR, PDF Flyers, Social Links</text>
    </g>

    <g transform="translate(650, 70)">
      <rect width="280" height="60" rx="8" fill="#0D0A1C" stroke="#A78BFA" stroke-width="1"/>
      <text x="15" y="26" font-size="13" font-weight="700" fill="#EDE9FE">&#x1F310; Public Visitor Portal</text>
      <text x="15" y="46" font-size="11" fill="#94A3B8">Media Streamer, Zoom, Password Gate, ZIP</text>
    </g>

    <g transform="translate(960, 70)">
      <rect width="280" height="60" rx="8" fill="#0D0A1C" stroke="#A78BFA" stroke-width="1"/>
      <text x="15" y="26" font-size="13" font-weight="700" fill="#EDE9FE">&#x1F6E1; Biometric Privacy Controls</text>
      <text x="15" y="46" font-size="11" fill="#94A3B8">Opt-in Consent, Thresholds, Right to Erasure</text>
    </g>
  </g>

  <!-- Connectors: Client -> Backend & Client -> CDN -->
  <path d="M 500 280 L 500 370" stroke="#8B5CF6" stroke-width="2.5" marker-end="url(#arrowPurp)"/>
  <text x="510" y="330" font-size="12" font-weight="600" fill="#A78BFA">REST API / JWT</text>

  <path d="M 1100 280 L 1100 370" stroke="#EC4899" stroke-width="2.5" marker-end="url(#arrowPurp)"/>
  <text x="1110" y="330" font-size="12" font-weight="600" fill="#F472B6">Direct CDN Media Stream</text>

  <!-- ========================================================================= -->
  <!-- TIER 2: NODE.JS API SERVER -->
  <!-- ========================================================================= -->
  <g transform="translate(80, 370)">
    <rect width="840" height="260" rx="16" fill="url(#apiGrad)" stroke="#38BDF8" stroke-width="1.8"/>
    <rect x="20" y="20" width="36" height="36" rx="8" fill="#0284C7" opacity="0.3"/>
    <text x="38" y="44" text-anchor="middle" font-size="18" fill="#7DD3FC">&#x26A1;</text>
    <text x="70" y="44" font-size="18" font-weight="800" fill="#FFFFFF">APPLICATION SERVER TIER (Node.js &#8226; Express &#8226; Port 5000)</text>

    <!-- Services Grid -->
    <g transform="translate(25, 75)">
      <rect width="250" height="75" rx="8" fill="#061524" stroke="#0284C7" stroke-width="1"/>
      <text x="15" y="26" font-size="13" font-weight="700" fill="#BAE6FD">&#x1F4C1; Face Organization Service</text>
      <text x="15" y="46" font-size="11" fill="#94A3B8">Deterministic Rules A–G Execution</text>
      <text x="15" y="62" font-size="11" fill="#94A3B8">Order-invariant group key hashing</text>
    </g>

    <g transform="translate(295, 75)">
      <rect width="250" height="75" rx="8" fill="#061524" stroke="#0284C7" stroke-width="1"/>
      <text x="15" y="26" font-size="13" font-weight="700" fill="#BAE6FD">&#x1F4AC; Natural Language Engine</text>
      <text x="15" y="46" font-size="11" fill="#94A3B8">Plain-English intent parsing into AST</text>
      <text x="15" y="62" font-size="11" fill="#94A3B8">Allowlisted strict schema validation</text>
    </g>

    <g transform="translate(565, 75)">
      <rect width="250" height="75" rx="8" fill="#061524" stroke="#0284C7" stroke-width="1"/>
      <text x="15" y="26" font-size="13" font-weight="700" fill="#BAE6FD">&#x23F3; Async AI Job Queue</text>
      <text x="15" y="46" font-size="11" fill="#94A3B8">Non-blocking background workers</text>
      <text x="15" y="62" font-size="11" fill="#94A3B8">Progress tracking &amp; failure recovery</text>
    </g>

    <g transform="translate(25, 165)">
      <rect width="250" height="75" rx="8" fill="#061524" stroke="#0284C7" stroke-width="1"/>
      <text x="15" y="26" font-size="13" font-weight="700" fill="#BAE6FD">&#x1F5C3; Smart Folder Service</text>
      <text x="15" y="46" font-size="11" fill="#94A3B8">Virtual folder category mapping</text>
      <text x="15" y="62" font-size="11" fill="#94A3B8">Zero physical file duplication</text>
    </g>

    <g transform="translate(295, 165)">
      <rect width="250" height="75" rx="8" fill="#061524" stroke="#0284C7" stroke-width="1"/>
      <text x="15" y="26" font-size="13" font-weight="700" fill="#BAE6FD">&#x1F5DC; Cloud-Native ZIP Service</text>
      <text x="15" y="46" font-size="11" fill="#94A3B8">On-the-fly streaming from Cloudinary</text>
      <text x="15" y="62" font-size="11" fill="#94A3B8">Direct client pipe (No disk buffering)</text>
    </g>

    <g transform="translate(565, 165)">
      <rect width="250" height="75" rx="8" fill="#061524" stroke="#0284C7" stroke-width="1"/>
      <text x="15" y="26" font-size="13" font-weight="700" fill="#BAE6FD">&#x1F510; Auth &amp; Magic-Byte Security</text>
      <text x="15" y="46" font-size="11" fill="#94A3B8">JWT, BCrypt, Binary header checks</text>
      <text x="15" y="62" font-size="11" fill="#94A3B8">Path traversal &amp; spoofing shields</text>
    </g>
  </g>

  <!-- Connectors: Backend -> Cloudinary & Backend -> AI & Backend -> DB -->
  <path d="M 920 440 L 980 440" stroke="#EC4899" stroke-width="2.5" marker-end="url(#arrowPurp)"/>
  <text x="930" y="430" font-size="11.5" font-weight="700" fill="#F472B6">CDN Upload</text>

  <!-- ========================================================================= -->
  <!-- TIER 3: CLOUDINARY CLOUD STORAGE -->
  <!-- ========================================================================= -->
  <g transform="translate(990, 370)">
    <rect width="370" height="260" rx="16" fill="url(#cloudGrad)" stroke="#EC4899" stroke-width="1.8"/>
    <rect x="20" y="20" width="36" height="36" rx="8" fill="#EC4899" opacity="0.3"/>
    <text x="38" y="44" text-anchor="middle" font-size="18" fill="#F472B6">&#x2601;</text>
    <text x="70" y="44" font-size="16" font-weight="800" fill="#FFFFFF">CLOUDINARY UNIVERSAL CDN</text>
    <text x="70" y="62" font-size="11" fill="#FBCFE8">Zero Local Backend Disk Clutter</text>

    <g transform="translate(20, 85)">
      <rect width="330" height="150" rx="8" fill="#170921" stroke="#DB2777" stroke-width="1"/>
      <text x="15" y="26" font-size="12" fill="#F9A8D4">&#8226; <tspan font-weight="700" fill="#FFFFFF">Direct Media Storage:</tspan> Images, videos, docs</text>
      <text x="15" y="50" font-size="12" fill="#F9A8D4">&#8226; <tspan font-weight="700" fill="#FFFFFF">Instant Thumbnails:</tspan> Cloud transforms &amp; WebP</text>
      <text x="15" y="74" font-size="12" fill="#F9A8D4">&#8226; <tspan font-weight="700" fill="#FFFFFF">Edge Delivery:</tspan> High-speed global CDN URLs</text>
      <text x="15" y="98" font-size="12" fill="#F9A8D4">&#8226; <tspan font-weight="700" fill="#FFFFFF">Server Disk Savings:</tspan> backend/uploads is empty</text>
      <text x="15" y="122" font-size="12" fill="#F9A8D4">&#8226; <tspan font-weight="700" fill="#FFFFFF">Direct Streaming:</tspan> Instant client download pipes</text>
    </g>
  </g>

  <!-- Connectors: Backend -> AI Service (Down) & Backend -> MongoDB (Down) -->
  <path d="M 300 630 L 300 700" stroke="#10B981" stroke-width="2.5" marker-end="url(#arrowGreen2)"/>
  <text x="310" y="670" font-size="12" font-weight="700" fill="#34D399">HTTP RPC / Port 8000</text>

  <path d="M 700 630 L 700 700" stroke="#F59E0B" stroke-width="2.5" marker-end="url(#arrowPurp)"/>
  <text x="710" y="670" font-size="12" font-weight="700" fill="#FBBF24">MongoDB Wire Protocol</text>

  <!-- ========================================================================= -->
  <!-- TIER 4: PYTHON AI MICROSERVICE -->
  <!-- ========================================================================= -->
  <g transform="translate(80, 700)">
    <rect width="600" height="180" rx="16" fill="url(#aiGrad)" stroke="#10B981" stroke-width="1.8"/>
    <rect x="20" y="18" width="36" height="36" rx="8" fill="#10B981" opacity="0.3"/>
    <text x="38" y="42" text-anchor="middle" font-size="18" fill="#6EE7B7">&#x1F9E0;</text>
    <text x="70" y="42" font-size="16" font-weight="800" fill="#FFFFFF">PYTHON AI MICROSERVICE (FastAPI &#8226; OpenCV 5.0 &#8226; Port 8000)</text>

    <g transform="translate(20, 68)">
      <rect width="265" height="95" rx="8" fill="#041413" stroke="#059669" stroke-width="1"/>
      <text x="12" y="24" font-size="12" font-weight="700" fill="#A7F3D0">&#x1F441; YuNet Neural Face Detector</text>
      <text x="12" y="44" font-size="11" fill="#94A3B8">&#8226; EXIF Orientation Auto-Transpose</text>
      <text x="12" y="62" font-size="11" fill="#94A3B8">&#8226; Real-time multi-face bounding boxes</text>
      <text x="12" y="80" font-size="11" fill="#94A3B8">&#8226; 5-point facial landmark evaluation</text>
    </g>

    <g transform="translate(305, 68)">
      <rect width="275" height="95" rx="8" fill="#041413" stroke="#059669" stroke-width="1"/>
      <text x="12" y="24" font-size="12" font-weight="700" fill="#A7F3D0">&#x1F9EC; SFace Biometric Recognizer</text>
      <text x="12" y="44" font-size="11" fill="#94A3B8">&#8226; 128-dim normalized embeddings</text>
      <text x="12" y="62" font-size="11" fill="#94A3B8">&#8226; Cosine similarity profile clustering</text>
      <text x="12" y="80" font-size="11" fill="#94A3B8">&#8226; Distant bystander area &amp; conf filter</text>
    </g>
  </g>

  <!-- ========================================================================= -->
  <!-- TIER 5: MONGODB DATABASE -->
  <!-- ========================================================================= -->
  <g transform="translate(720, 700)">
    <rect width="640" height="180" rx="16" fill="url(#dbGrad)" stroke="#F59E0B" stroke-width="1.8"/>
    <rect x="20" y="18" width="36" height="36" rx="8" fill="#F59E0B" opacity="0.3"/>
    <text x="38" y="42" text-anchor="middle" font-size="18" fill="#FCD34D">&#x1F5C4;</text>
    <text x="70" y="42" font-size="16" font-weight="800" fill="#FFFFFF">DATA PERSISTENCE TIER (MongoDB 8.0 Community)</text>

    <!-- Schema Entities -->
    <g transform="translate(20, 68)">
      <rect width="185" height="95" rx="8" fill="#140B04" stroke="#D97706" stroke-width="1"/>
      <text x="12" y="24" font-size="11.5" font-weight="700" fill="#FDE68A">&#x1F4C4; Files &amp; SmartFolders</text>
      <text x="12" y="44" font-size="10.5" fill="#94A3B8">&#8226; Virtual folder refs</text>
      <text x="12" y="62" font-size="10.5" fill="#94A3B8">&#8226; Cloudinary URLs</text>
      <text x="12" y="80" font-size="10.5" fill="#94A3B8">&#8226; Verified faceCount</text>
    </g>

    <g transform="translate(225, 68)">
      <rect width="185" height="95" rx="8" fill="#140B04" stroke="#D97706" stroke-width="1"/>
      <text x="12" y="24" font-size="11.5" font-weight="700" fill="#FDE68A">&#x1F464; Profiles &amp; Groups</text>
      <text x="12" y="44" font-size="10.5" fill="#94A3B8">&#8226; PersonProfile (private)</text>
      <text x="12" y="62" font-size="10.5" fill="#94A3B8">&#8226; GroupFolder (atomic)</text>
      <text x="12" y="80" font-size="10.5" fill="#94A3B8">&#8226; Deterministic key index</text>
    </g>

    <g transform="translate(430, 68)">
      <rect width="190" height="95" rx="8" fill="#140B04" stroke="#D97706" stroke-width="1"/>
      <text x="12" y="24" font-size="11.5" font-weight="700" fill="#FDE68A">&#x1F4DC; Rules &amp; Audit Log</text>
      <text x="12" y="44" font-size="10.5" fill="#94A3B8">&#8226; OrganizationRule (AST)</text>
      <text x="12" y="62" font-size="10.5" fill="#94A3B8">&#8226; OrganizationJob</text>
      <text x="12" y="80" font-size="10.5" fill="#94A3B8">&#8226; 1-click rollback history</text>
    </g>
  </g>
</svg>`;

async function buildDiagrams() {
  console.log('Writing SVG vector files to docs/...');
  const flowSvgPath = path.join(docsDir, 'snapshare_flow_diagram.svg');
  const archSvgPath = path.join(docsDir, 'snapshare_system_architecture.svg');
  
  fs.writeFileSync(flowSvgPath, flowSvg, 'utf8');
  fs.writeFileSync(archSvgPath, archSvg, 'utf8');
  console.log('Saved SVG files.');

  console.log('Rendering high-resolution 2x Retina PNGs with Sharp...');
  const flowPngPath = path.join(docsDir, 'snapshare_flow_diagram.png');
  const archPngPath = path.join(docsDir, 'snapshare_system_architecture.png');

  await sharp(Buffer.from(flowSvg))
    .png({ quality: 100 })
    .toFile(flowPngPath);
  console.log('Rendered:', flowPngPath);

  await sharp(Buffer.from(archSvg))
    .png({ quality: 100 })
    .toFile(archPngPath);
  console.log('Rendered:', archPngPath);

  console.log('Diagram generation complete!');
  process.exit(0);
}

buildDiagrams().catch(err => {
  console.error('Failed to generate diagrams:', err);
  process.exit(1);
});
