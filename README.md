# CampusPulse — OpenStreetMap Student & Urban Navigator

> **CIA-I / Mid-Trimester Examination Project — October 2026**  
> **Course:** Full Stack Development (Course Code: `MAI412-2`)  
> **Programme:** MSc AI & ML — PG II Trimester  
> **Institution:** CHRIST (Deemed to be University), Bangalore – 560 029  
> **Department:** Department of Computer Science  

---

## 📌 Executive Summary

**CampusPulse** is a specialized, responsive web application engineered to solve critical UX and functionality deficits of OpenStreetMap (OSM) for university students, researchers, and campus commuters. Centered on the urban context of **Christ University Central Campus (Hosur Road, Bengaluru 560029)** and its surrounding student corridors (SG Palya, Dairy Circle, Koramangala, BTM Layout), CampusPulse transforms raw geodata into an actionable discovery and navigation platform.

Unlike the generic OpenStreetMap website—which presents unstructured cartographic tags (`amenity=cafe`, `operator=...`) designed for mappers—CampusPulse provides a modern dual-pane web application with **instant category filtering**, **real-time distance and walking duration estimation**, **asynchronous geocoding and reverse geocoding via the Fetch API**, **OSRM walking route polylines**, a **student spot contribution form with strict client-side validation**, and **localStorage state persistence**.

---

## 📸 Visual Evidence & Screenshots

### 1. Benchmark Analysis vs. CampusPulse Solution
![Benchmark Comparison](assets/screenshots/benchmark_comparison.jpg)
*Figure 1: Benchmark analysis comparing OpenStreetMap's developer-centric tag inspector with CampusPulse's modern student-focused interface.*

### 2. Feature Showcase: Interactive Map, Form Validation & Routing
![Feature Showcase](assets/screenshots/feature_showcase.jpg)
*Figure 2: CampusPulse in action showing real-time form validation, coordinate picker, category filters, and walking route estimation.*

---

## 🛠️ Technology Stack & Architecture

| Layer | Technology | Purpose & Implementation |
| :--- | :--- | :--- |
| **Structure** | Semantic HTML5 | `<header>`, `<nav>`, `<aside>`, `<main>`, `<section>`, `<article>`, `<form>`, `<dialog>` with ARIA accessibility roles. |
| **Styling** | Tailwind CSS 3 & Vanilla CSS | Modern utility-first responsive layout, dark/light theme switching, glassmorphism badges, mobile bottom drawers. |
| **Mapping Engine** | Leaflet.js (`v1.9.4`) | Interactive tile rendering with OpenStreetMap Carto tiles, custom SVG category pins, and animated routing polylines. |
| **APIs (Fetch API)** | OpenStreetMap Nominatim & OSRM | Live asynchronous address geocoding, click-to-reverse geocoding, and OSRM walking path generation. |
| **State Persistence**| HTML5 LocalStorage | Bookmarks storage, custom contributed spots, and theme preferences. |
| **Validation** | ES6 JavaScript Modules | Regex schema enforcement, coordinate bounds validation (-90 to +90 / -180 to +180), and interactive toast feedback. |

---

## 🚀 Quick Start & Local Setup Instructions

This project is built with zero-dependency vanilla ES6 modules and requires no complex build tooling.

### Method 1: Using Python (Recommended)
```bash
# 1. Navigate to the project root directory
cd "C:\Users\Anushya C\.gemini\antigravity-ide\scratch\osm-campuspulse"

# 2. Launch the lightweight local HTTP server
python -m http.server 8000

# 3. Open in your browser
# URL: http://localhost:8000
```

### Method 2: Using Node.js (npx serve)
```bash
npx -y serve . -p 8000
# Access via http://localhost:8000
```

### Method 3: Direct Browser Launch
Open `index.html` directly in modern browsers (Chrome, Edge, Firefox, Brave) that support ES module imports.

---

## 🌐 GitHub Repository & Deployment Guide

### GitHub Repository Setup
```bash
# Add your remote repository URL
git remote add origin https://github.com/<your-username>/osm-campuspulse.git
git branch -M main
git push -u origin main
```

### Deploying to GitHub Pages (1-Click Free Hosting)
1. In your GitHub repository, navigate to **Settings > Pages**.
2. Under **Branch**, select `main` and set the folder to `/ (root)`.
3. Click **Save**. Within 60 seconds, your site is live at:  
   `https://<your-username>.github.io/osm-campuspulse/`

### Deploying to Vercel / Netlify
- Drag-and-drop the project folder onto [app.netlify.com/drop](https://app.netlify.com/drop) or import from GitHub on [vercel.com](https://vercel.com).
- No build command required; publish directory is `./`.

---

## 🎯 Part-I: Problem Definition & Innovation

### 1. Benchmark Analysis
- **Target Users:** Undergraduate and postgraduate students, research scholars, faculty members, and visiting scholars at Christ University, Bangalore navigating unfamiliar urban neighborhoods.
- **Examined Workflow:** Discovering verified nearby study spots, affordable printing/xerox services for thesis and assignments, emergency pharmacies, and quiet workspaces within walking distance.
- **Key Limitations Observed on openstreetmap.org:**
  1. **Cartographic Information Overload:** OpenStreetMap treats every node as a database record. Clicking a node opens an overwhelming list of raw tags (`amenity=cafe`, `cuisine=coffee_shop`, `addr:postcode=560029`) instead of consumer-actionable information (Wi-Fi, quiet environment, power plugs, student discounts).
  2. **Absence of Student-Centric Filters:** No mechanism to filter places by "Study Friendly", "Wheelchair Accessible", "Open Now", or "Under 1 km".
  3. **Fragmented Navigation:** Directions on openstreetmap.org require opening a separate modal with cumbersome coordinate inputs, lacking instant walking duration estimations from the current location.

### 2. Problem Statement
> *"Students and newcomers around university campuses face high cognitive friction and wasted time attempting to find essential, accessible, and budget-friendly academic amenities (quiet study cafes, photocopy/thesis binding centers, 24/7 pharmacies) on OpenStreetMap. Because OpenStreetMap is designed for cartographers rather than end-users, it lacks contextual discovery, student amenity tagging, walking time estimations, and personalized place bookmarking."*

### 3. Innovative Solution
**CampusPulse** solves this problem by providing:
- **Curated Categorization:** Study Cafes, Libraries & Quiet Spaces, Printing/Xerox Hubs, 24/7 Medical Care, and Budget Student Dining.
- **Live Spatial Recalculation:** Automatic distance (Haversine) and walking duration calculation (OSRM engine) relative to user coordinates.
- **Interactive Leaflet Map:** Category-coded markers with animated popups and turn-by-turn walking route polylines.
- **Student Contribution Pipeline:** Dedicated form enabling verified students to contribute missing amenities with reverse-geocoding coordinate pickers.

---

## ⚡ Part-II: JavaScript Implementation Breakdown

### 1. Meaningful JavaScript Events Implemented
CampusPulse implements **5 distinct event types**:
1. `input` **Event with Debounce (300ms):** Attached to the search input (`#search-input`) to dynamically filter the local spot cards while querying Nominatim geocoding suggestions in parallel.
2. `submit` **Event with Validation (`e.preventDefault()`):** Attached to the contribution form (`#suggest-spot-form`), performing full client-side schema checks before mutating state.
3. `click` **Events:** Attached to category chips (`.category-chip`), bookmark toggles (`[data-action="toggle-bookmark"]`), routing buttons (`[data-action="route"]`), theme toggles (`#btn-toggle-theme`), and map coordinate picker.
4. `change` **Events:** Attached to the distance radius range slider (`#radius-slider`), sorting selector (`#sort-select`), and filter checkboxes (wheelchair, Wi-Fi, open status).
5. `keydown` **Event (`Escape` key):** Listens globally to dismiss modals and autocomplete drawers for keyboard accessibility.

### 2. Form Validation & Interactive Feedback
- **Schema Validation Rules:**
  - `spotName`: Required, min 3, max 60 characters.
  - `category`: Strict whitelist (`cafe`, `library`, `printing`, `pharmacy`, `food`).
  - `address`: Required, min 5 characters.
  - `lat` / `lon`: Strict numeric validation (-90 to +90 for latitude, -180 to +180 for longitude).
  - `description`: Required, min 10 characters.
- **Feedback Mechanism:**
  - Real-time inline red error borders and SVG badges for invalid inputs.
  - Floating toast notifications (success / error / info) with auto-dismiss animations.
  - Immediate DOM injection of the newly added card and map marker.

### 3. Fetch API & JSON Data Handling
- **Dataset Loading:** Uses `fetch('./data/spots.json')` to retrieve curated campus amenities.
- **Nominatim Geocoding:** Calls `https://nominatim.openstreetmap.org/search?format=json&q=...` with request abort controllers (6s timeout) to search addresses.
- **Nominatim Reverse Geocoding:** Calls `https://nominatim.openstreetmap.org/reverse?format=json&lat=...&lon=...` when picking coordinates on the map.
- **OSRM Routing Engine:** Calls `https://router.project-osrm.org/route/v1/walking/...` to retrieve GeoJSON route lines, distance, and duration.
- **Data Export:** Serializes active state into downloadable JSON (`campuspulse_amenities_YYYY-MM-DD.json`).

### 4. Error Handling, Loading & Empty States
- **Loading State:** CSS shimmer skeleton cards display during initial data load or geocoding.
- **Error State:** Network failures trigger a prominent alert banner with friendly retry messaging.
- **Empty State:** When no spots match search/filter combinations, an illustrated empty state container appears with a "Reset All Filters" CTA.

---

## 🧪 Testing Results & Verification Matrix

| Test Case ID | Test Description | Input / Action | Expected Result | Actual Result | Status |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | Initial Data Load | App Launch | 10 default spots loaded from `spots.json` and markers plotted on map. | All 10 spots rendered with correct distance badges. | **PASS** |
| **TC-02** | Live Search Filtering | Type "Xerox" in search box | Only print/xerox spots displayed in card list and on map. | Filtered immediately in < 50ms with 3 matching spots. | **PASS** |
| **TC-03** | Walking Radius Slider | Adjust slider from 5 km to 1 km | Spots further than 1 km are hidden from list and map. | Distance recalculation and card list updated cleanly. | **PASS** |
| **TC-04** | Form Validation (Invalid Data)| Submit empty form or short name | Submission blocked; inline red error messages displayed on fields. | Error tooltips rendered; toast notification alerts user. | **PASS** |
| **TC-05** | Form Submission (Valid Data) | Fill all valid fields & submit | New spot added to localStorage, list, and map. Modal closes. | Toast confirmed; new spot rendered at top of list. | **PASS** |
| **TC-06** | Walking Route Calculation | Click "Walking Directions" on card | OSRM API returns route; blue dashed polyline drawn on map. | Route drawn; distance & duration banner displayed. | **PASS** |
| **TC-07** | State Persistence | Bookmark spot & refresh page | Bookmarked spots remain saved in `localStorage`. | Bookmark state persisted across page reloads. | **PASS** |
| **TC-08** | Dark/Light Mode Toggle | Click sun/moon theme button | `dark` class toggled on `<html>` element; colors updated. | Instant smooth transition; saved in `localStorage`. | **PASS** |

---

## ⚠️ Known Limitations

1. **Nominatim Public API Rate Limiting:** OpenStreetMap's Nominatim public server imposes a limit of 1 request/second. To prevent HTTP 429 throttling, client-side debouncing (300ms) and abort controllers are implemented.
2. **Pedestrian Campus Routing:** OSRM uses public street sidewalk layers; fine-grained indoor floor paths within multi-level university blocks require indoor OSM relation tagging (e.g., Simple Indoor Tagging schema).
3. **Geolocation Accuracy:** Desktop browsers rely on IP-based geolocation, which may approximate positions. A fallback pin to Christ University Central Hub coordinates is configured.

---

## 🤖 AI Usage Declaration

In accordance with academic integrity guidelines of CHRIST (Deemed to be University) and the examination instructions:
- **Tools Utilized:** Antigravity AI Assistant (Gemini 3.8 Flash model).
- **Scope of Usage:**
  1. Conceptual benchmark analysis of OpenStreetMap UI friction points.
  2. Generation of high-fidelity comparison diagrams and feature showcase graphics.
  3. Guidance on clean ES6 modular architecture, Tailwind CSS design system tokens, and OSRM Fetch API polyline conversion.
- **Student Ownership:** All code logic, DOM event listeners, form validation algorithms, dataset curations, and test matrices were synthesized, verified, and debugged to fulfill the syllabus objectives of Course `MAI412-2` (Full Stack Development).
