# ASTRA-GRID: Municipal Triage & Causal Infrastructure Workbench
> **PromptWars x ASTRA Hackathon Submission** — *From Complaints to Action*

---

## 🚀 Live Demo URL

**Localhost URL:** [http://localhost:3000](http://localhost:3000)

*(Dev server is running live on port 3000)*

---

## 🏆 Project Overview

While 90% of hackathon submissions present generic dark-slate/purple dashboards with superficial Bengaluru Indiranagar mocks, **ASTRA-GRID** is engineered as a **Palantir/Linear-grade Municipal Triage & Causal Infrastructure Workbench** with:

1. **Architectural Swiss Gov-Tech / Tactical Cartography Visual Identity**
   - Palette: Warm Alabaster (`#F4F3EF`), Deep Carbon Ink (`#111315`), High-Visibility Safety Orange (`#FF4F00`), Emergency Crimson (`#D92D20`), Amber Warning (`#D97706`), Verified Emerald (`#059669`).
   - Monospace telemetry pairing (Inter + JetBrains Mono) for distances, coordinates, cosine similarities, and priority equations.
2. **Interactive Policy Mode & Dynamic Re-Ranking Sliders**
   - Live policy switching (*Standard Civic*, *Monsoon Flood Emergency*, *School/Hospital Zone Protection*) with real-time recalculation of all 42 reports.
3. **Directed Root-Cause "Domino Graph" & Crew ROI Calculator**
   - DAG causal solver detecting multi-category complaint cascades within 250m:
     $$\text{Solid Waste (48h)} \rightarrow \text{Choked Culvert (24h)} \rightarrow \text{Underpass Flooding (6h)} \rightarrow \text{Road Crater \& Sparking Feeder (Now)}$$
   - Computes return on municipal investment and single-ticket dispatch failure costs.
4. **Pairwise "Why #A Outranks #B" Shapley Waterfall Comparator**
   - Factor-by-factor delta waterfall showing exact points for Life Safety, Landmark Proximity, Volume, and Cascade, with plain-language English verdicts.
5. **Adversarial Hyperbole & Spam Guard (Cross-Modal Plausibility)**
   - Flags exaggerated claims (e.g., *"100 feet deep sinkhole trapping 500 cars"*) with $0.75\times$ damping, while boosting multi-witness corroborated reports ($1.15\times$).
6. **Multilingual / Hinglish / Kannada Voice-Dictated Citizen Capture**
   - Local coastal urban realism (Pumpwell Circle, KMC Hospital, Jyothi Circle, Hampankatta).
   - In-browser Web Speech API mic dictation and 4 one-click Judge Demo Presets.

---

## 📐 Mathematical Formulation

### 1. Geodesic Haversine Distance ($d$)
$$a = \sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)$$
$$d = 2 R \cdot \operatorname{atan2}\left(\sqrt{a}, \sqrt{1 - a}\right) \quad (R = 6,371,000\,\text{m})$$

### 2. Spatio-Temporal Duplicate Probability
$$\text{DuplicateScore} = 0.55 \cdot \text{CosineSim}_{\text{TF-IDF}} + 0.30 \cdot \left(1 - \frac{d}{150}\right) + 0.15 \cdot \left(1 - \frac{\Delta t}{72\,\text{h}}\right)$$
*Merged if $\text{DuplicateScore} \ge 0.60$ and hazard domains match.*

### 3. Dynamic Priority Equation
$$\text{RawPriority} = w_{\text{safety}} S_{\text{safety}} + w_{\text{vuln}} S_{\text{landmark}} + w_{\text{vol}} S_{\text{volume}} + w_{\text{cascade}} S_{\text{cascade}}$$
$$\text{FinalPriority} = \operatorname{clamp}\left(\operatorname{round}(\text{RawPriority} \cdot \mu_{\text{trust}}), 0, 100\right)$$
Where $\mu_{\text{trust}} \in \{1.15 \text{ (Verified)}, 1.05 \text{ (Corroborated)}, 1.00 \text{ (Standard)}, 0.75 \text{ (Unverified)}\}$.

---

## 🎙️ 5-Minute Judge Pitch Script

1. **Minute 1: The Problem with Legacy Civic Tech (Stage 01 Capture)**
   - *"Every civic app collects complaints as isolated tickets. Citizens report the same issue 10 times in English, Kannada, and Hinglish. Municipalities send 4 separate crews to patch asphalt while a clogged drain 80m away causes the next flood."*
   - Demo: Click **Preset A** (School wire multilingual 7th duplicate) $\rightarrow$ Watch instantaneous semantic merging into `AST-1010` with $87\%$ cosine similarity.
2. **Minute 2: Dynamic Policy Simulation (Stage 02 Understand)**
   - *"Governments cannot run on static weights. When the monsoon hits, drainage cascades matter more than raw volume."*
   - Demo: Switch from **Standard Civic** to **Monsoon Emergency** $\rightarrow$ Watch the priority queue instantly re-rank live.
   - Demo: Click `AST-1016` (open manhole 55m from hospital) and `AST-1017` (park litter) $\rightarrow$ Show the **Pairwise Shapley Waterfall Comparator**.
3. **Minute 3: Tactical Hotspot Map & Domino Graph (Stage 03 Reveal)**
   - Demo: Click the **Pumpwell Monsoon Cluster** $\rightarrow$ Show the 5-node vertical causal graph from market waste to sparking feeder box.
   - Highlight the **Crew ROI Metric**: *"Clearing Root Node #1 prevents ₹1.8L in repeat road resurfacing."*
4. **Minute 4: Action & Citizen Accountability (Stage 04 Act & Track)**
   - Demo: Advance status on master ticket `AST-1005` $\rightarrow$ Watch status cascade to all merged citizen reports.
   - Demo: In the Citizen Transparency Portal, look up child ticket `AST-1007` $\rightarrow$ Show clear explanation of duplicate merge, SLA countdown, and *"Verify Fix"* accountability button.
5. **Minute 5: Honesty & Architecture (Top Bar Modal)**
   - Click **⚖️ Honesty & Limits** to show judges full transparency on what is real vs. simulated, and where AI has limitations.

---

## 🛠️ Tech Stack & Zero-Crash Architecture

- **Framework**: Next.js 16 (App Router, Turbopack, TypeScript)
- **Styling**: Tailwind CSS v4 + Swiss Cartography Palette
- **Mapping**: Leaflet + OpenStreetMap (SSR-safe via `next/dynamic` client isolation)
- **Icons**: Lucide React
- **Speech**: HTML5 Web Speech API
- **AI/Math**: Pure deterministic mathematical algorithms with fallback-safe Google Gemini multimodal engine.
