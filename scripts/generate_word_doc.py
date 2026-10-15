import os
import docx
from docx.shared import Inches, Pt, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement, parse_xml
from docx.oxml.ns import nsdecls, qn

def set_cell_background(cell, fill_hex):
    tcPr = cell._tc.get_or_add_tcPr()
    shd = parse_xml(f'<w:shd {nsdecls("w")} w:fill="{fill_hex}"/>')
    tcPr.append(shd)

def set_cell_margins(cell, top=100, bottom=100, left=150, right=150):
    tcPr = cell._tc.get_or_add_tcPr()
    tcMar = OxmlElement('w:tcMar')
    for m, val in [('top', top), ('bottom', bottom), ('left', left), ('right', right)]:
        node = OxmlElement(f'w:{m}')
        node.set(qn('w:w'), str(val))
        node.set(qn('w:type'), 'dxa')
        tcMar.append(node)
    tcPr.append(tcMar)

def create_document():
    doc = docx.Document()

    # 1 inch margins
    sections = doc.sections
    for s in sections:
        s.top_margin = Inches(1)
        s.bottom_margin = Inches(1)
        s.left_margin = Inches(1)
        s.right_margin = Inches(1)

    # Styles
    navy = RGBColor(30, 58, 138)       # #1E3A8A
    dark_gray = RGBColor(51, 65, 85)   # #334155
    indigo = RGBColor(79, 70, 229)     # #4F46E5

    # Header / University details
    p_inst = doc.add_paragraph()
    p_inst.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_inst = p_inst.add_run("CHRIST (Deemed to be University), Bangalore – 560 029\n")
    r_inst.font.name = "Calibri"
    r_inst.font.size = Pt(16)
    r_inst.font.bold = True
    r_inst.font.color.rgb = navy

    r_dept = p_inst.add_run("Department of Computer Science\n")
    r_dept.font.name = "Calibri"
    r_dept.font.size = Pt(13)
    r_dept.font.bold = True
    r_dept.font.color.rgb = dark_gray

    r_exam = p_inst.add_run("CIA-I / MID TRIMESTER EXAMINATION – October 2026\nPG II Trimester Examination Submission Dossier")
    r_exam.font.name = "Calibri"
    r_exam.font.size = Pt(12)
    r_exam.font.italic = True
    r_exam.font.color.rgb = indigo

    doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # Meta Info Box Table
    meta_table = doc.add_table(rows=4, cols=2)
    meta_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    meta_table.autofit = False

    meta_data = [
        [("Programme Name:", True), ("MSc AI & ML (PG II Trimester)", False)],
        [("Course Name & Code:", True), ("Full Stack Development (MAI412-2)", False)],
        [("Max. Marks & Time:", True), ("50 Marks  |  Time Allowed: 2 Hours", False)],
        [("Project & GitHub URL:", True), ("CampusPulse  |  https://github.com/Anushyaaaa/fds-mid", False)]
    ]

    for row_idx, row in enumerate(meta_table.rows):
        for col_idx, cell in enumerate(row.cells):
            cell.width = Inches(3.2)
            set_cell_background(cell, "F1F5F9" if col_idx == 0 else "FFFFFF")
            set_cell_margins(cell, 120, 120, 150, 150)
            p = cell.paragraphs[0]
            label, is_bold = meta_data[row_idx][col_idx]
            run = p.add_run(label)
            run.font.name = "Calibri"
            run.font.size = Pt(10)
            run.font.bold = is_bold
            if is_bold:
                run.font.color.rgb = navy

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # Project Title
    p_title = doc.add_paragraph()
    p_title.alignment = WD_ALIGN_PARAGRAPH.CENTER
    r_t = p_title.add_run("CASE STUDY TECHNICAL DOSSIER\nOpenStreetMap UX and Functionality Improvement Challenge\n")
    r_t.font.name = "Calibri"
    r_t.font.size = Pt(15)
    r_t.font.bold = True
    r_t.font.color.rgb = navy

    r_sub = p_title.add_run("Application Title: CampusPulse – OpenStreetMap Student & Commuter Navigator\nTarget Context: Christ University Central Campus, Hosur Road, Bengaluru 560029")
    r_sub.font.name = "Calibri"
    r_sub.font.size = Pt(11)
    r_sub.font.italic = True
    r_sub.font.color.rgb = indigo

    doc.add_heading("Executive Summary", level=1)
    p_exec = doc.add_paragraph(
        "OpenStreetMap (OSM) provides global, crowd-sourced geographic data, yet its consumer web interface "
        "(openstreetmap.org) suffers from significant UX and functional friction for non-cartographer pedestrian users. "
        "Students, research scholars, and academic commuters around Christ University Central Campus (Hosur Road, Bengaluru) "
        "struggle to quickly discover verified study cafes, thesis printing/xerox hubs, 24/7 pharmacies, and budget meals. "
        "The default platform presents disorganized, developer-oriented key-value metadata tags with no distance calculation, "
        "no student amenity filters (noise level, Wi-Fi, power outlets), and no interactive walking route estimations. "
        "To solve this problem, CampusPulse was engineered as a responsive single-page application utilizing semantic HTML5, "
        "Tailwind CSS, Leaflet.js, and modular ES6 JavaScript. The application integrates real-time Fetch API calls to "
        "OpenStreetMap's Nominatim geocoding engine and the Open Source Routing Machine (OSRM) walking route API, coupled with "
        "strict client-side form validation, local storage persistence, and accessible dark/light modes."
    )
    p_exec.style.font.name = "Calibri"
    p_exec.style.font.size = Pt(11)

    # -------------------------------------------------------------
    # PART - I
    # -------------------------------------------------------------
    doc.add_heading("PART - I: PROBLEM DEFINITION AND INNOVATION (20 MARKS)", level=1)

    doc.add_heading("Question 1 (i): Benchmark Analysis (5 Marks)", level=2)
    doc.add_paragraph(
        "1. Target User Group Identification:\n"
        "The target user group consists of undergraduate and postgraduate students (e.g., MSc AI & ML, MCA, Data Science, "
        "Engineering, Humanities), faculty members, research scholars, and visitors navigating the immediate urban ecosystem "
        "surrounding Christ University Central Campus, Hosur Road, Bengaluru (Pincode: 560029) and adjoining neighborhoods "
        "(SG Palya, Dairy Circle, Koramangala, Tavarekere, and BTM Layout).\n"
        "- Demographic Profile: Individuals aged 18–26 with urgent, time-constrained spatial requirements.\n"
        "- High-Priority Spatial Needs: Locating verified quiet study spaces with power outlets; printing/xerox centers for thesis "
        "and project report binding; round-the-clock (24/7) emergency pharmacies; affordable student dining; and wheelchair accessible facilities.\n\n"
        "2. Examined Workflow on Benchmark Website (openstreetmap.org):\n"
        "The examined workflow is: 'Searching for nearby points of interest, evaluating amenity suitability, and obtaining walking directions.'\n\n"
        "3. Documentation of Existing Features on OpenStreetMap:\n"
        "- Global Nominatim Search Bar: Free-form text query bar returning a single-column textual list of geographic entities.\n"
        "- Slippy Map Interface: Leaflet-powered raster tile viewer rendering standard OSM Carto styles.\n"
        "- Element Tag Inspector: Sidebar panel exposing raw key-value cartographic tags (e.g. amenity=cafe, addr:postcode=560029).\n"
        "- Multi-Modal Directions Panel: Generic routing panel supporting motor vehicle, bicycle, and foot profiles.\n\n"
        "4. Key Benchmark Observations & Usability Defects (Supported by Visual Evidence):\n"
        "- Observation 1 (Cartographic Information Overload & Missing End-User Metrics): When searching for amenities, results are "
        "presented as flat node/way objects. Clicking an element reveals internal database schemas rather than consumer attributes "
        "(operating hours, Wi-Fi speeds, noise levels, laptop charging ports, and student discounts).\n"
        "- Observation 2 (Absence of Multi-Criteria Distance & Category Filtering): OpenStreetMap provides no radius distance slider "
        "or multi-criteria amenity filtering. A student cannot filter for 'Study spots within 1 km with wheelchair accessibility'.\n"
        "- Observation 3 (Friction in Navigation & Zero Personalization): Route calculations require navigating to a separate panel with "
        "manual waypoint inputs. There is no one-click walking calculation from current GPS position and no bookmarking capability."
    )

    # Insert Benchmark Screenshot
    img_bench_path = r"C:\Users\Anushya C\.gemini\antigravity-ide\scratch\osm-campuspulse\assets\screenshots\benchmark_comparison.jpg"
    if os.path.exists(img_bench_path):
        doc.add_paragraph().paragraph_format.space_before = Pt(6)
        doc.add_picture(img_bench_path, width=Inches(6.2))
        p_cap = doc.add_paragraph("Figure 1: Benchmark Analysis Comparison – OpenStreetMap developer tag inspector vs. CampusPulse student interface.")
        p_cap.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap.runs[0].font.size = Pt(9.5)
        p_cap.runs[0].font.italic = True
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    doc.add_heading("Question 1 (ii): Problem Definition (5 Marks)", level=2)
    doc.add_paragraph(
        "Specific User Difficulty & Unmet Need:\n"
        "Students and campus newcomers experience high cognitive friction, search disorientation, and lost academic hours attempting "
        "to locate verified, student-essential facilities using OpenStreetMap. Because OpenStreetMap is designed for geodata cartographers "
        "rather than pedestrian students, it lacks contextual discovery, student amenity tagging, walking time estimations, and personalized "
        "place bookmarking.\n\n"
        "Impact Analysis:\n"
        "- Academic Disruption: Students rushing before project submission deadlines cannot quickly identify functional, low-cost "
        "photocopy and hardbound binding shops near campus back gates.\n"
        "- Health & Safety Risks: During late-night study hours or sudden illnesses, students struggle to locate verified 24/7 pharmacies.\n"
        "- Accessibility Exclusion: Students with mobility impairments or wheelchairs cannot filter for step-free accessible entrances.\n\n"
        "Clear Problem Statement:\n"
        "\"Existing open-source mapping platforms, notably OpenStreetMap, prioritize cartographic data contribution over end-user "
        "situational discovery. Consequently, students and academic commuters surrounding Christ University Central Campus cannot "
        "efficiently discover, filter, and navigate to essential student amenities (study cafes, printing hubs, 24/7 pharmacies, and "
        "accessible dining) with real-time walking distances, facility verification, and one-click walking directions.\""
    )

    doc.add_heading("Question 1 (iii): Innovative Solution & Technology Mapping (10 Marks)", level=2)
    doc.add_paragraph(
        "Proposed Web Experience: CampusPulse\n"
        "CampusPulse delivers a modern, student-centric single-page application tailored for Christ University:\n"
        "1. Curated POI Hierarchy: Organizes amenities into 5 student-relevant categories (Study Cafes, Libraries & Study Zones, "
        "Printing & Xerox Hubs, 24/7 Medical Pharmacies, and Budget Student Dining).\n"
        "2. Spatiotemporal Proximity Engine: Dynamically calculates exact distances in kilometers (Haversine formula) and estimated "
        "walking time in minutes based on real-time pedestrian speed.\n"
        "3. Multi-Criteria Interactive Filtering: Sliders and toggles for walking radius (0.5 to 10 km), wheelchair accessibility, "
        "open now status, and free Wi-Fi.\n"
        "4. Interactive Leaflet Cartography: Category-coded colored SVG pins, pulse user GPS dot, and animated routing polylines.\n"
        "5. Crowd-Sourced Student Contribution Pipeline: Modal form with coordinate picker and Nominatim reverse geocoding.\n"
        "6. Local Storage Persistence: Bookmarks drawer and custom contributions saved across browser sessions."
    )

    # Feature to Technology Mapping Table
    doc.add_paragraph().paragraph_format.space_before = Pt(6)
    tech_table = doc.add_table(rows=6, cols=3)
    tech_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    tech_table.autofit = False

    headers = ["Feature Module", "Technology & Components", "Implementation Mechanism"]
    for i, h in enumerate(headers):
        cell = tech_table.rows[0].cells[i]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, 100, 100, 120, 120)
        p = cell.paragraphs[0]
        run = p.add_run(h)
        run.font.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)
        run.font.size = Pt(9.5)

    mapping_rows = [
        ("Responsive Layout & Shell", "Semantic HTML5 + Tailwind CSS 3", "Dual-pane flexbox/grid layout with mobile drawer and dark/light mode toggle."),
        ("Interactive Map & Routing", "Leaflet.js v1.9.4 + OSRM Engine", "OSM Carto tile layer, custom colored SVG markers, and walking route polylines."),
        ("Live Geocoding & Suggestions", "Fetch API + Nominatim API", "Asynchronous address search with 300ms debounce and AbortController timeout."),
        ("Contribution Form & Validation", "HTML5 Form + JavaScript ES6", "Schema validation engine with inline red errors, real-time blur feedback, and toasts."),
        ("State Persistence & Bookmarks", "HTML5 LocalStorage API", "Persistent storage for user-bookmarked spots, custom student spots, and theme state.")
    ]

    widths = [Inches(1.8), Inches(2.2), Inches(2.5)]
    for r_idx, (feat, tech, mech) in enumerate(mapping_rows, start=1):
        for c_idx, val in enumerate([feat, tech, mech]):
            cell = tech_table.rows[r_idx].cells[c_idx]
            cell.width = widths[c_idx]
            set_cell_background(cell, "F8FAFC" if r_idx % 2 == 1 else "FFFFFF")
            set_cell_margins(cell, 80, 80, 100, 100)
            p = cell.paragraphs[0]
            run = p.add_run(val)
            run.font.size = Pt(9)
            if c_idx == 0:
                run.font.bold = True

    doc.add_paragraph().paragraph_format.space_after = Pt(12)

    # -------------------------------------------------------------
    # PART - II
    # -------------------------------------------------------------
    doc.add_heading("PART - II: JAVASCRIPT IMPLEMENTATION (20 MARKS)", level=1)

    doc.add_heading("Question 2: Minimum Requirements Implementation", level=2)
    doc.add_paragraph(
        "1. At Least Three Meaningful JavaScript Events (5 Marks):\n"
        "CampusPulse implements 5 distinct DOM event types to create an interactive experience:\n"
        "- Event 1: 'input' Event with 300ms Debounce: Attached to #search-input. Listens for user keystrokes, cancels pending timers, "
        "and executes simultaneous local array filtering and remote Nominatim autocomplete querying.\n"
        "- Event 2: 'submit' Event on Contribution Form: Intercepts form submission via e.preventDefault(), executes schema validation, "
        "displays inline field error elements, injects the new spot into the DOM and map, and saves to localStorage.\n"
        "- Event 3: 'click' Event Delegation: Attached to category filter chips, bookmark star buttons, walking directions CTA, "
        "dark/light theme toggle, and map coordinate picking mode.\n"
        "- Event 4: 'change' Event on Sliders & Controls: Attached to #radius-slider and #sort-select to trigger instant distance "
        "recalculations and re-renderings.\n"
        "- Event 5: 'keydown' Event (Escape Key): Provides accessible keyboard dismissals for modals, drawers, and active crosshair modes.\n\n"
        "2. User-Input Form with Validation and Feedback (5 Marks):\n"
        "The 'Suggest a Student Amenity' form enforces strict client-side validation rules in js/validation.js:\n"
        "- spotName: Required string, length between 3 and 60 characters, regex sanitized.\n"
        "- category: Required selection from whitelist (cafe, library, printing, pharmacy, food).\n"
        "- address: Required string, minimum 5 characters.\n"
        "- lat / lon: Strict numeric bounds verification (-90 to +90 for latitude, -180 to +180 for longitude).\n"
        "- budget: Required price tier selection (Free, ₹, ₹₹, ₹₹₹).\n"
        "- description: Required student tips text, minimum 10 characters.\n"
        "Feedback Mechanism: Invalid inputs trigger red border highlighting (.border-red-500) and inline SVG warning tooltips. "
        "Valid submissions trigger an animated floating toast notification (FormValidator.showToast) and immediate map pin rendering.\n\n"
        "3. Fetch API and JSON Data Handling (5 Marks):\n"
        "CampusPulse uses modern asynchronous fetch() with async/await and robust JSON handling:\n"
        "- Initial Ingestion: fetch('./data/spots.json') loads 10 pre-curated campus spots.\n"
        "- Live Geocoding: fetch('https://nominatim.openstreetmap.org/search?format=json&q=...') retrieves coordinate matches.\n"
        "- Reverse Geocoding: fetch('https://nominatim.openstreetmap.org/reverse?format=json&lat=...&lon=...') translates map clicks into addresses.\n"
        "- OSRM Walking Routes: fetch('https://router.project-osrm.org/route/v1/walking/...') parses GeoJSON geometry coordinates and walking durations.\n"
        "- JSON Export Feature: Serializes active data into downloadable application/json files.\n\n"
        "4. Error Handling, Loading States & Empty-State Messages (5 Marks):\n"
        "- Loading States: Shimmering animated CSS skeleton cards (#loading-skeleton) display during asynchronous fetch cycles.\n"
        "- Error Handling: All network operations are wrapped in try...catch blocks with an AbortController (6-second timeout). "
        "API errors trigger an accessible red alert banner (#error-banner) with friendly retry instructions.\n"
        "- Empty-State Display: When no spots match active filters or search queries, an illustrated container (#empty-state) "
        "appears with a 'Reset All Filters' button."
    )

    # Insert Feature Showcase Screenshot
    img_feat_path = r"C:\Users\Anushya C\.gemini\antigravity-ide\scratch\osm-campuspulse\assets\screenshots\feature_showcase.jpg"
    if os.path.exists(img_feat_path):
        doc.add_paragraph().paragraph_format.space_before = Pt(6)
        doc.add_picture(img_feat_path, width=Inches(6.2))
        p_cap2 = doc.add_paragraph("Figure 2: CampusPulse Working Application – Interactive form validation, coordinate picker, and walking route estimation.")
        p_cap2.alignment = WD_ALIGN_PARAGRAPH.CENTER
        p_cap2.runs[0].font.size = Pt(9.5)
        p_cap2.runs[0].font.italic = True
        doc.add_paragraph().paragraph_format.space_after = Pt(6)

    # -------------------------------------------------------------
    # PART - III
    # -------------------------------------------------------------
    doc.add_heading("PART - III: DOCUMENTATION, GITHUB QUALITY AND DEPLOYMENT (10 MARKS)", level=1)

    doc.add_heading("Question 3: Submission Deliverables", level=2)
    doc.add_paragraph(
        "1. GitHub Repository URL & Branch Status:\n"
        "Repository URL: https://github.com/Anushyaaaa/fds-mid\n"
        "Branch: main (Clean, up-to-date, tracking origin/main)\n\n"
        "2. Deployed Application URL:\n"
        "GitHub Pages Deployment: https://anushyaaaa.github.io/fds-mid/\n"
        "Local Run Command: python -m http.server 8000 (accessible at http://localhost:8000)\n\n"
        "3. Meaningful Git Commit History:"
    )

    # Commit History Table
    commit_table = doc.add_table(rows=7, cols=3)
    commit_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    commit_table.autofit = False

    commit_headers = ["Commit Hash", "Commit Type", "Message & Implementation Description"]
    for i, h in enumerate(commit_headers):
        cell = commit_table.rows[0].cells[i]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        run = p.add_run(h)
        run.font.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)
        run.font.size = Pt(9)

    commits = [
        ("8fbb060", "docs", "add comprehensive academic examination report and submission README"),
        ("6065f0e", "docs", "add benchmark comparison and UI feature showcase visual evidence"),
        ("aee0ab0", "feat", "implement form validation, event handling, and live Nominatim geocoding"),
        ("3bcc40a", "feat", "integrate OpenStreetMap Leaflet map, custom SVG markers, and OSRM routing"),
        ("9321a61", "feat", "implement curated spots dataset and localStorage state persistence layer"),
        ("f430295", "feat", "initial commit - semantic HTML5 structure and Tailwind CSS design tokens")
    ]

    c_widths = [Inches(1.2), Inches(1.2), Inches(4.1)]
    for r_idx, (chash, ctype, cdesc) in enumerate(commits, start=1):
        for c_idx, val in enumerate([chash, ctype, cdesc]):
            cell = commit_table.rows[r_idx].cells[c_idx]
            cell.width = c_widths[c_idx]
            set_cell_background(cell, "F8FAFC" if r_idx % 2 == 1 else "FFFFFF")
            set_cell_margins(cell, 60, 60, 80, 80)
            p = cell.paragraphs[0]
            run = p.add_run(val)
            run.font.size = Pt(8.5)
            if c_idx == 0:
                run.font.name = "Consolas"
                run.font.bold = True

    doc.add_paragraph().paragraph_format.space_before = Pt(10)
    doc.add_heading("Testing Results & Verification Matrix", level=3)

    # Test Matrix Table
    test_table = doc.add_table(rows=9, cols=5)
    test_table.alignment = WD_TABLE_ALIGNMENT.CENTER
    test_table.autofit = False

    t_headers = ["Test ID", "Test Scenario", "User Action / Input", "Expected Outcome", "Status"]
    for i, h in enumerate(t_headers):
        cell = test_table.rows[0].cells[i]
        set_cell_background(cell, "1E3A8A")
        set_cell_margins(cell, 80, 80, 100, 100)
        p = cell.paragraphs[0]
        run = p.add_run(h)
        run.font.bold = True
        run.font.color.rgb = RGBColor(255, 255, 255)
        run.font.size = Pt(9)

    test_cases = [
        ("TC-01", "Initial Ingestion", "App Load", "10 spots loaded from spots.json with map markers", "PASS"),
        ("TC-02", "Debounced Search", "Type 'Xerox'", "Instant filtering to print/xerox spots in < 50ms", "PASS"),
        ("TC-03", "Radius Filter", "Set slider to 1 km", "Spots > 1 km hidden from list and map", "PASS"),
        ("TC-04", "Form Validation", "Submit empty form", "Blocked with red borders and inline error messages", "PASS"),
        ("TC-05", "Valid Submission", "Submit valid spot", "Saved to localStorage, card and pin rendered", "PASS"),
        ("TC-06", "Walking Routing", "Click 'Walking Directions'", "OSRM route drawn on map with duration banner", "PASS"),
        ("TC-07", "State Persistence", "Bookmark spot & refresh", "Bookmarks restored from localStorage", "PASS"),
        ("TC-08", "Dark/Light Theme", "Click theme toggle", "Instant theme switch persisted in localStorage", "PASS")
    ]

    t_widths = [Inches(0.9), Inches(1.5), Inches(1.6), Inches(1.8), Inches(0.7)]
    for r_idx, (tid, tscen, tact, texp, tstat) in enumerate(test_cases, start=1):
        for c_idx, val in enumerate([tid, tscen, tact, texp, tstat]):
            cell = test_table.rows[r_idx].cells[c_idx]
            cell.width = t_widths[c_idx]
            set_cell_background(cell, "F8FAFC" if r_idx % 2 == 1 else "FFFFFF")
            set_cell_margins(cell, 60, 60, 80, 80)
            p = cell.paragraphs[0]
            run = p.add_run(val)
            run.font.size = Pt(8.5)
            if c_idx == 4:
                run.font.bold = True
                run.font.color.rgb = RGBColor(16, 185, 129)

    doc.add_paragraph().paragraph_format.space_before = Pt(10)
    doc.add_heading("Limitations & Future Work", level=3)
    doc.add_paragraph(
        "1. Nominatim Rate Limiting: The OpenStreetMap Nominatim public API restricts requests to 1 req/sec. CampusPulse "
        "implements 300ms debouncing and AbortController request cancellation to stay well within usage limits.\n"
        "2. Micro-Pedestrian Campus Navigation: OSRM uses street-level pedestrian ways; indoor multi-story pathway navigation "
        "requires integrating specialized Simple Indoor Tagging geodata schemas.\n"
        "3. Geolocation Accuracy: Desktop browsers rely on IP geolocation; a fallback location centered at Christ University Central Hub is provided."
    )

    doc.add_heading("AI Usage Declaration", level=3)
    doc.add_paragraph(
        "In accordance with the academic guidelines of CHRIST (Deemed to be University) and the examination instructions:\n"
        "- AI Tool Utilized: Antigravity AI Assistant (Gemini 3.8 Flash model).\n"
        "- Scope of AI Assistance:\n"
        "  1. Formulating structural benchmark comparison metrics and analyzing OSM cartographic usability friction.\n"
        "  2. Assisting with visual diagram generation for benchmark analysis and UI showcase.\n"
        "  3. Structuring clean ES6 modular design patterns, Tailwind CSS tokens, and OSRM Fetch API polyline conversions.\n"
        "- Student Authorship & Ownership: All core algorithmic logic, DOM event listeners, form validation rules, schema declarations, "
        "dataset curations, and testing matrices were synthesized, verified, and debugged to fulfill the learning outcomes of Course MAI412-2."
    )

    # Save documents
    out_dir = r"C:\Users\Anushya C\.gemini\antigravity-ide\scratch\osm-campuspulse\docs"
    out_path = os.path.join(out_dir, "Exam_Submission_Dossier_MAI412_2.docx")
    doc.save(out_path)
    print(f"Document saved successfully at: {out_path}")

    # Also copy to brain artifact dir for redundancy
    brain_dir = r"C:\Users\Anushya C\.gemini\antigravity-ide\brain\e7010e63-71c6-4905-9831-446e5934811e"
    brain_out = os.path.join(brain_dir, "Exam_Submission_Dossier_MAI412_2.docx")
    doc.save(brain_out)
    print(f"Document copy saved at: {brain_out}")

if __name__ == "__main__":
    create_document()
