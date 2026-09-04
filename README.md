# NTRO Forensics — Multi-Vendor DVR/NVR Forensic Analysis Tool
### National Technical Research Organisation (NTRO) • Digital Forensics & Cyber Command

A professional, law-enforcement-grade cyber-forensic console for multi-vendor CCTV DVR/NVR extraction, tamper & discontinuity detection, and blockchain-backed chain of custody compliant with Section 63 Bharatiya Sakshya Adhiniyam (BSA), 2023 / Section 65B Indian Evidence Act.

---

## 🚀 How to View & Test the Frontend Right Now

The development server is already running! Simply open your web browser (Chrome, Edge, Brave, Firefox) and navigate to:

```
http://localhost:5173/
```

*(If the dev server was ever stopped, start it with `npm run dev` in the terminal).*

---

## 🧭 Step-by-Step System Walkthrough

### 1. Dashboard (`http://localhost:5173/dashboard`)
- **Forensic Summary Cards**: Real-time metrics on Active Cases, Evidence Units, Pending SSO Reviews, and Tamper Flags.
- **Analytics Charts**: Multi-vendor demux distribution (Hikvision, Dahua, CP Plus, Honeywell, Unknown RAW) and monthly anomaly detection trends.
- **Recent Cases Table**: Status chips, FIR numbers, and jurisdictions.
- **Quick Action**: Click **"Register New Case"** to spawn a new case and mint a genesis block.

### 2. Case Detail (`http://localhost:5173/cases/CASE-2026-0841`)
- Review FIR No. 412/2026 (Cyber Crime PS, New Delhi) seized hardware items.
- View multi-vendor evidence badges (Hikvision Turbo HD, USB Backups, etc.).
- Switch between **Seized Evidence Items**, **Blockchain Custody Ledger**, and **Section 65B BSA Court Report** tabs.

### 3. Evidence Ingest Wizard (`http://localhost:5173/cases/CASE-2026-0841/ingest`)
- **Step 1**: Drag-and-drop a disk image or click one of the 4 preloaded vendor test images (Hikvision `.dd`, Dahua `.dav`, CP Plus `.bin`, Unknown `.raw`).
- **Step 2**: Watch the automated magic-byte detection animation identify vendor headers, container type, and channels.
- **Step 3**: Progress bar simulating demuxing, frame extraction, and SHA-256 / BLAKE3 hashing.
- **Step 4**: Confirmation screen displaying genesis block creation and instant write to the blockchain ledger.

### 4. Centerpiece: Analysis Workspace (`http://localhost:5173/cases/CASE-2026-0841/evidence/EVD-841-01`)
- **Multi-Camera Player**: Playable video with live CCTV OSD overlay (`CAM-01 [VAULT_ENTRY]`, FPS, frame counter).
- **Forensic Transport**: Play/Pause, step frame-by-frame (`-1f`, `+1f`), jump seconds (`±1s`), and adjust speed (`0.25x` to `4x`).
- **Visual Enhancement Filters**: Switch between *Normal*, *Night-Vision Gain*, *Edge Contrast Boost*, and *High-Dynamic B/W*.
- **Snapshot Hashing**: Click **"Capture Frame"** to capture the canvas frame and generate an instant SHA-256 evidentiary timestamp receipt.
- **Annotated Scrub Timeline**: Click along the timeline track or directly click the red/amber anomaly markers (e.g. at `02:14:07`) to jump directly to the tamper location.
- **Forensic Findings Panel**: Review timestamp jumps, re-encoding artifacts, and frame gaps. Toggle **"Affix to Section 65B Report"** checkboxes.
- **Deep Forensic Scan**: Click **"Run Forensic Scan"** for an animated multi-pass bitstream scan simulation.
- **Raw Metadata Inspector**: Expand the bottom drawer to inspect partition tables, sector maps, and EXIF parameters.

### 5. Blockchain Chain of Custody (`http://localhost:5173/cases/CASE-2026-0841/custody`)
- Inspect the vertically linked immutable ledger where every block references its parent SHA-256 hash.
- Click **"Verify Chain Integrity"** &rarr; Shows **100% Cryptographically Verified** green banner.
- **Interactive Fraud Detection Demo**:
  1. Click **"Simulate Tamper"** on Block #003.
  2. The block immediately turns red with a severed cryptographic link badge.
  3. Click **"Verify Chain Integrity"** &rarr; The audit engine immediately catches the broken parent-child hash link!
  4. Click **"Restore Valid Hash"** and re-verify &rarr; Ledger returns to intact status.

### 6. Court-Ready Legal Report (`http://localhost:5173/cases/CASE-2026-0841/report`)
- Official Government of India / NTRO Section 63 BSA 2023 / Section 65B Indian Evidence Act certificate.
- Dynamically includes all evidence hashes and findings checked in the analysis workspace.
- Enter PIN `8821` and click **"Affix Digital Signature & Stamp"** to digitally certify the report.
- Click **"Export / Print Official Court PDF"** to trigger a clean print/PDF dialog.

### 7. Operational Roles & Admin Panel (`http://localhost:5173/admin`)
- Use the top-right profile dropdown to switch roles: **Investigator** (`Insp. Rajesh Kumar`), **Forensic Reviewer** (`Dr. Sunita Rao`), or **Admin** (`Dr. Arvind Mehra`).
- In Admin role, navigate to `/admin` to inspect the reverse-engineered multi-vendor signature library (Hikvision, Dahua, CP Plus, Honeywell, Uniview, Hanwha, Generic ONVIF, Unknown RAW) and user credentials.

### 8. AI Forensic Object Detection & ByteTrack Multi-Target Tracking (`/cases/:id/analysis/:evidenceId`)
- Powered by the extracted **`AIML_MODULE`** with **YOLO26n** (`yolo26n.pt`) and **ByteTrack** (`bytetrack.yaml`).
- **Interactive Metrics**: Real-time counter cards for Total AI Events, Person Detections, Vehicle Detections (Cars, Motorcycles, Buses, Trucks, Bicycles), and Active Track IDs.
- **Synchronized Video Seeker**: Clicking any AI detection event or ByteTrack trajectory instantly seeks the forensic video player to that exact millisecond.
- **Forensic Object Filter**: Filter detection events in real time by target class or specific ByteTrack track ID.
- **Backend API Endpoints**:
  - `GET http://localhost:8000/ai/status` — Model loading state & supported classes.
  - `POST http://localhost:8000/ai/analyze/{evidence_id}` — Runs YOLO + ByteTrack frame extraction.
  - `GET http://localhost:8000/ai/search?query={class}` — Real-time forensic object query.
- **Start FastAPI Backend**:
  ```bash
  python -m uvicorn backend.main:app --port 8000 --reload
  ```


---

## 🛠 Project Structure & Technology Stack

- **Framework**: React 18 + Vite
- **Styling**: Tailwind CSS with custom forensic dark palette (`#070B10`, `#0C121B`, `#16202F`, `#00E5FF`)
- **Typography**: Inter (UI) + JetBrains Mono (Hashes, Timecodes, OSD)
- **Icons**: Lucide React
- **Analytics**: Recharts
- **Architecture**: Decoupled `services/` (`caseService`, `evidenceService`, `custodyService`, `reportService`, `vendorService`) and `data/` modules for future backend API drop-in replacement.
