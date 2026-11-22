# 📱 SnapShare AI – Cross-Platform Mobile & Desktop App

A native React Native & Expo application connecting seamlessly to the **SnapShare AI Platform**, running across **Android**, **iOS (iPhone/iPad)**, and **Laptops (Web & Desktop)**.

---

## 🚀 Capabilities

- **Universal Event Sharing & QR**: View event galleries, create new collections with access passcodes, and generate visitor QR codes.
- **Native Camera & Gallery Intake**: Capture photos directly from your phone camera or select multiple images from your photo gallery with direct cloud streaming.
- **AI Smart Folders**: Real-time folder clustering by verified neural face count:
  - 👥 **Group Photos** (>4 people)
  - 👥 **Four Member Groups** (4 people)
  - 👥 **Three People** (3 people)
  - 👥 **Two People** (2 people)
  - 👤 **Individual Photos** (1 person)
  - ⚠️ **Needs Review** (ambiguous or unconfirmed identities)
- **Privacy-First People Library**: Consent opt-in toggle, private unnamed profiles (`Person #1`, `Person #2`), rename profiles, and 1-click **GDPR Biometric Purge**.
- **Cross-Device Cloud Sync**: Everything uploaded or organized on the phone syncs in real time with the web platform and MongoDB database.

---

## 📲 How to Run on Devices

Ensure your backend services are running:
- **MongoDB**: `127.0.0.1:27017`
- **FastAPI AI Microservice**: `http://127.0.0.1:8000`
- **Node.js Backend**: `http://localhost:5000`

### 1. Run on Android Phone
1. Install **Expo Go** from the Google Play Store on your phone.
2. In your terminal:
   ```bash
   cd mobile
   npx expo start
   ```
3. Scan the terminal QR code with the **Expo Go** app (or phone camera).
4. *Note for physical phones*: In the app's login or settings screen, set the server IP to your computer's local Wi-Fi IP (e.g., `http://192.168.1.50:5000`).

### 2. Run on iPhone / iOS
1. Install **Expo Go** from the Apple App Store on your iPhone.
2. Run `npx expo start` in `mobile/`.
3. Open your iPhone's default **Camera** app, scan the terminal QR code, and tap the yellow banner to open in Expo Go.

### 3. Run on Laptop (Browser)
To run the responsive app directly on your laptop:
```bash
cd mobile
npm run web
```
The app will open automatically at `http://localhost:8081`.

### 4. Build Standalone Android APK (Production)
To generate an installable `.apk` file:
```bash
cd mobile
npx eas-cli build -p android --profile preview
```

---

## 📂 Project Architecture

```
mobile/
├── assets/                  # Icons, splash screens, and adaptive assets
├── src/
│   ├── components/
│   │   ├── FolderCard.js    # Smart folder cards with neon theme & badges
│   │   └── Header.js        # Universal navigation header
│   ├── context/
│   │   └── AuthContext.js   # JWT authentication & session management
│   ├── screens/
│   │   ├── CollectionsScreen.js   # Event galleries & QR code presentation
│   │   ├── LoginScreen.js         # Sign-in & server host configuration
│   │   ├── PeopleScreen.js        # Biometrics, consent toggle & GDPR purge
│   │   ├── PhotoDetailModal.js    # High-res photo lightbox & AI captions
│   │   ├── QRModal.js             # High-contrast vector QR generator
│   │   ├── RegisterScreen.js      # User registration
│   │   ├── SmartOrganizerScreen.js# Face-count category filters & grid
│   │   └── UploadScreen.js        # Native camera & multi-image picker
│   └── services/
│       └── api.js           # Multi-platform REST API client with auth headers
├── App.js                   # Main navigator & modern bottom tab bar
└── app.json                 # Expo SDK configuration & permissions
```
