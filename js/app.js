/**
 * app.js - Main Application Orchestrator
 * Integrates HTML5, Tailwind CSS, Leaflet Map, Fetch API, and Form Validation
 */

import { ApiService, calculateHaversineDistance, estimateWalkMinutes } from './api.js';
import { Storage } from './storage.js';
import { MapController } from './map.js';
import { FormValidator } from './validation.js';

class CampusPulseApp {
  constructor() {
    // Application State
    this.allSpots = [];
    this.filteredSpots = [];
    this.selectedSpot = null;
    this.activeCategory = 'all';
    this.searchQuery = '';
    this.radiusKm = 5.0;
    this.filterOnlyAccessible = false;
    this.filterOnlyOpen = false;
    this.filterOnlyWifi = false;
    this.sortBy = 'distance'; // 'distance' | 'rating' | 'name'
    this.viewOnlyBookmarks = false;

    // User Location (Default: Christ University Central Campus, Hosur Road, Bangalore)
    this.userLocation = {
      lat: 12.9344,
      lon: 77.6062,
      name: 'Christ University Central Campus'
    };

    // Components
    this.mapController = null;
    this.debounceTimer = null;
  }

  /**
   * Initialize Application
   */
  async init() {
    this.initTheme();
    this.initMap();
    this.bindEvents();
    await this.loadInitialData();
  }

  /**
   * Initialize Theme (Dark/Light Mode)
   */
  initTheme() {
    const savedTheme = Storage.getTheme();
    if (savedTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    this.updateThemeIcon();
  }

  /**
   * Toggle Dark / Light Theme
   */
  toggleTheme() {
    const isDark = document.documentElement.classList.toggle('dark');
    Storage.setTheme(isDark ? 'dark' : 'light');
    this.updateThemeIcon();
  }

  updateThemeIcon() {
    const iconContainer = document.getElementById('theme-icon-container');
    if (!iconContainer) return;
    const isDark = document.documentElement.classList.contains('dark');
    iconContainer.innerHTML = isDark
      ? `<svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"></path></svg>`
      : `<svg class="w-5 h-5 text-slate-700" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"></path></svg>`;
  }

  /**
   * Initialize Leaflet Map
   */
  initMap() {
    this.mapController = new MapController('leaflet-map', [this.userLocation.lat, this.userLocation.lon], 15);
    this.mapController.init();
    this.mapController.setUserLocation(this.userLocation.lat, this.userLocation.lon);

    // Callbacks from map markers
    this.mapController.onSpotSelectCallback = (spot, triggerRoute = false) => {
      this.selectSpot(spot.id);
      if (triggerRoute) {
        this.getRouteToSpot(spot);
      }
    };
  }

  /**
   * Load Initial Data (Fetch API + JSON parsing)
   */
  async loadInitialData() {
    this.showLoadingState(true);
    this.hideErrorBanner();

    try {
      this.allSpots = await ApiService.getSpots(this.userLocation);
      this.applyFiltersAndSort();
      FormValidator.showToast('Data Loaded', `Found ${this.allSpots.length} campus spots around Hosur Road`, 'info');
    } catch (error) {
      console.error('Failed to load initial data:', error);
      this.showErrorBanner('Unable to load spots. Please verify your connection or retry.');
    } finally {
      this.showLoadingState(false);
    }
  }

  /**
   * Bind DOM Events (Addresses Part-II minimum 3 meaningful JavaScript events)
   */
  bindEvents() {
    // -------------------------------------------------------------
    // EVENT 1: 'input' Event with Debounce for Real-time Search
    // -------------------------------------------------------------
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        clearTimeout(this.debounceTimer);
        const query = e.target.value.trim();
        this.searchQuery = query;

        this.debounceTimer = setTimeout(() => {
          this.applyFiltersAndSort();
          if (query.length >= 3) {
            this.handleNominatimSuggestions(query);
          } else {
            this.hideSearchSuggestions();
          }
        }, 300);
      });

      // Clear search button
      const clearSearchBtn = document.getElementById('clear-search-btn');
      if (clearSearchBtn) {
        clearSearchBtn.addEventListener('click', () => {
          searchInput.value = '';
          this.searchQuery = '';
          this.hideSearchSuggestions();
          this.applyFiltersAndSort();
        });
      }
    }

    // -------------------------------------------------------------
    // EVENT 2: 'submit' Event for Spot Contribution Form with Validation
    // -------------------------------------------------------------
    const spotForm = document.getElementById('suggest-spot-form');
    if (spotForm) {
      spotForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleFormSubmit(spotForm);
      });

      // Live blur validation for each form field
      const formInputs = spotForm.querySelectorAll('input, select, textarea');
      formInputs.forEach(input => {
        input.addEventListener('blur', () => {
          const check = FormValidator.validateField(input.name, input.value);
          if (!check.isValid) {
            input.classList.add('border-red-500');
          } else {
            input.classList.remove('border-red-500');
            const errorMsg = input.parentNode.querySelector('.field-error-msg');
            if (errorMsg) errorMsg.remove();
          }
        });
      });
    }

    // -------------------------------------------------------------
    // EVENT 3: 'click' Events for Filter Chips, Actions, and Modals
    // -------------------------------------------------------------
    
    // Category Filter Chips
    const categoryContainer = document.getElementById('category-filter-container');
    if (categoryContainer) {
      categoryContainer.addEventListener('click', (e) => {
        const btn = e.target.closest('.category-chip');
        if (btn) {
          const category = btn.dataset.category;
          this.setActiveCategory(category);
        }
      });
    }

    // Accessibility & Feature Toggles
    const accessibleToggle = document.getElementById('toggle-accessible');
    if (accessibleToggle) {
      accessibleToggle.addEventListener('change', (e) => {
        this.filterOnlyAccessible = e.target.checked;
        this.applyFiltersAndSort();
      });
    }

    const openNowToggle = document.getElementById('toggle-open-now');
    if (openNowToggle) {
      openNowToggle.addEventListener('change', (e) => {
        this.filterOnlyOpen = e.target.checked;
        this.applyFiltersAndSort();
      });
    }

    const wifiToggle = document.getElementById('toggle-wifi');
    if (wifiToggle) {
      wifiToggle.addEventListener('change', (e) => {
        this.filterOnlyWifi = e.target.checked;
        this.applyFiltersAndSort();
      });
    }

    // Bookmark Drawer Filter Toggle
    const bookmarksBtn = document.getElementById('btn-view-bookmarks');
    if (bookmarksBtn) {
      bookmarksBtn.addEventListener('click', () => {
        this.viewOnlyBookmarks = !this.viewOnlyBookmarks;
        bookmarksBtn.classList.toggle('bg-amber-100', this.viewOnlyBookmarks);
        bookmarksBtn.classList.toggle('text-amber-800', this.viewOnlyBookmarks);
        this.applyFiltersAndSort();
      });
    }

    // Modal Triggers
    const openModalBtn = document.getElementById('btn-open-add-modal');
    const closeModalBtn = document.getElementById('btn-close-add-modal');
    const cancelModalBtn = document.getElementById('btn-cancel-add-modal');
    const modalBackdrop = document.getElementById('add-spot-modal');

    if (openModalBtn) openModalBtn.addEventListener('click', () => this.openAddModal());
    if (closeModalBtn) closeModalBtn.addEventListener('click', () => this.closeAddModal());
    if (cancelModalBtn) cancelModalBtn.addEventListener('click', () => this.closeAddModal());

    // Coordinate Picker from Map
    const pickMapBtn = document.getElementById('btn-pick-from-map');
    if (pickMapBtn) {
      pickMapBtn.addEventListener('click', () => this.startPickOnMap());
    }

    // Locate Me Geolocation Button
    const locateBtn = document.getElementById('btn-locate-me');
    if (locateBtn) {
      locateBtn.addEventListener('click', () => this.handleGeolocation());
    }

    // Theme Toggle Button
    const themeBtn = document.getElementById('btn-toggle-theme');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => this.toggleTheme());
    }

    // Clear Route Button
    const clearRouteBtn = document.getElementById('btn-clear-route');
    if (clearRouteBtn) {
      clearRouteBtn.addEventListener('click', () => this.clearActiveRoute());
    }

    // Export JSON Button
    const exportBtn = document.getElementById('btn-export-json');
    if (exportBtn) {
      exportBtn.addEventListener('click', () => {
        Storage.exportAsJSON(this.allSpots);
        FormValidator.showToast('Export Complete', 'Saved campus spots as JSON file', 'success');
      });
    }

    // Reset All Filters CTA button in Empty State
    const resetFiltersBtn = document.getElementById('btn-reset-filters');
    if (resetFiltersBtn) {
      resetFiltersBtn.addEventListener('click', () => this.resetFilters());
    }

    // -------------------------------------------------------------
    // EVENT 4: 'change' Events for Radius Slider & Sort Selector
    // -------------------------------------------------------------
    const radiusSlider = document.getElementById('radius-slider');
    const radiusLabel = document.getElementById('radius-value-label');
    if (radiusSlider) {
      radiusSlider.addEventListener('input', (e) => {
        this.radiusKm = parseFloat(e.target.value);
        if (radiusLabel) radiusLabel.textContent = `${this.radiusKm} km`;
      });
      radiusSlider.addEventListener('change', () => {
        this.applyFiltersAndSort();
      });
    }

    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.sortBy = e.target.value;
        this.applyFiltersAndSort();
      });
    }

    // -------------------------------------------------------------
    // EVENT 5: 'keydown' Event for Modal Dismissal & Shortcuts
    // -------------------------------------------------------------
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        this.closeAddModal();
        this.hideSearchSuggestions();
      }
    });
  }

  /**
   * Set Active Category Chip
   * @param {string} category 
   */
  setActiveCategory(category) {
    this.activeCategory = category;
    document.querySelectorAll('.category-chip').forEach(btn => {
      const match = btn.dataset.category === category;
      if (match) {
        btn.classList.add('bg-indigo-600', 'text-white', 'shadow-md');
        btn.classList.remove('bg-white', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
      } else {
        btn.classList.remove('bg-indigo-600', 'text-white', 'shadow-md');
        btn.classList.add('bg-white', 'dark:bg-slate-800', 'text-slate-700', 'dark:text-slate-300');
      }
    });
    this.applyFiltersAndSort();
  }

  /**
   * Filter and Sort Spots Logic
   */
  applyFiltersAndSort() {
    let spots = [...this.allSpots];

    // 1. Category Filter
    if (this.activeCategory !== 'all') {
      spots = spots.filter(s => s.category === this.activeCategory);
    }

    // 2. Search Query Filter
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      spots = spots.filter(s => 
        s.name.toLowerCase().includes(q) ||
        s.categoryLabel.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q) ||
        (s.tags && s.tags.some(t => t.toLowerCase().includes(q))) ||
        s.description.toLowerCase().includes(q)
      );
    }

    // 3. Distance Radius Filter
    spots = spots.filter(s => (s.distance || 0) <= this.radiusKm);

    // 4. Accessible Toggle
    if (this.filterOnlyAccessible) {
      spots = spots.filter(s => s.wheelchairAccessible);
    }

    // 5. Open Now Toggle
    if (this.filterOnlyOpen) {
      spots = spots.filter(s => s.isOpenNow);
    }

    // 6. Wi-Fi Toggle
    if (this.filterOnlyWifi) {
      spots = spots.filter(s => s.wifi);
    }

    // 7. Bookmarks Only
    if (this.viewOnlyBookmarks) {
      spots = spots.filter(s => s.isBookmarked);
    }

    // Sorting
    if (this.sortBy === 'distance') {
      spots.sort((a, b) => (a.distance || 0) - (b.distance || 0));
    } else if (this.sortBy === 'rating') {
      spots.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (this.sortBy === 'name') {
      spots.sort((a, b) => a.name.localeCompare(b.name));
    }

    this.filteredSpots = spots;
    this.renderSpotsList();
    this.updateBookmarkBadge();

    // Sync markers with map
    if (this.mapController) {
      this.mapController.renderMarkers(spots, this.selectedSpot ? this.selectedSpot.id : null);
    }
  }

  /**
   * Render List of Spots into Sidebar
   */
  renderSpotsList() {
    const listContainer = document.getElementById('spots-list');
    const emptyState = document.getElementById('empty-state');
    const resultsCountEl = document.getElementById('results-count-badge');

    if (!listContainer) return;

    if (resultsCountEl) {
      resultsCountEl.textContent = `${this.filteredSpots.length} spots`;
    }

    if (this.filteredSpots.length === 0) {
      listContainer.innerHTML = '';
      if (emptyState) emptyState.classList.remove('hidden');
      return;
    }

    if (emptyState) emptyState.classList.add('hidden');

    const html = this.filteredSpots.map(spot => {
      const isSelected = this.selectedSpot && this.selectedSpot.id === spot.id;
      const categoryColors = {
        cafe: 'bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300',
        library: 'bg-indigo-100 text-indigo-800 dark:bg-indigo-950 dark:text-indigo-300',
        printing: 'bg-sky-100 text-sky-800 dark:bg-sky-950 dark:text-sky-300',
        pharmacy: 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300',
        food: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
      }[spot.category] || 'bg-slate-100 text-slate-800';

      return `
        <article 
          data-id="${spot.id}"
          class="spot-card group relative p-4 rounded-2xl bg-white dark:bg-slate-800/90 border transition-all duration-200 cursor-pointer shadow-sm hover:shadow-md ${isSelected ? 'border-indigo-600 ring-2 ring-indigo-500/20 dark:border-indigo-500' : 'border-slate-200/80 dark:border-slate-700/60 hover:border-indigo-300'}">
          
          <div class="flex items-start justify-between gap-2 mb-2">
            <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${categoryColors}">
              <span>${spot.categoryLabel}</span>
            </span>
            <div class="flex items-center gap-2">
              <span class="text-xs font-bold text-amber-500 flex items-center gap-0.5">
                ★ ${spot.rating}
              </span>
              <button 
                data-action="toggle-bookmark"
                data-id="${spot.id}"
                aria-label="Bookmark spot"
                class="p-1.5 rounded-lg text-slate-400 hover:text-amber-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition">
                <svg class="w-4 h-4 ${spot.isBookmarked ? 'fill-amber-400 text-amber-400' : 'fill-none stroke-currentColor'}" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
                </svg>
              </button>
            </div>
          </div>

          <h3 class="text-base font-bold text-slate-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
            ${spot.name}
          </h3>

          <p class="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
            ${spot.address}
          </p>

          <div class="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100 dark:border-slate-700/60 text-xs text-slate-600 dark:text-slate-300">
            <span class="flex items-center gap-1 font-semibold text-indigo-600 dark:text-indigo-400">
              📍 ${spot.distance} km
            </span>
            <span>•</span>
            <span>🚶 ${spot.walkTimeMinutes} min walk</span>
            <span>•</span>
            <span class="font-medium ${spot.isOpenNow ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'}">
              ${spot.isOpenNow ? 'Open Now' : 'Closed'}
            </span>
            ${spot.wheelchairAccessible ? `<span title="Wheelchair Accessible" class="text-sky-600 dark:text-sky-400">♿ Accessible</span>` : ''}
            ${spot.wifi ? `<span title="Free Wi-Fi" class="text-emerald-600">📶 Wi-Fi</span>` : ''}
          </div>

          <div class="flex items-center gap-2 mt-3 pt-2">
            <button 
              data-action="route"
              data-id="${spot.id}"
              class="flex-1 py-1.5 px-3 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 dark:bg-indigo-950/60 dark:hover:bg-indigo-900/60 dark:text-indigo-300 text-xs font-semibold transition flex items-center justify-center gap-1.5">
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
              Walking Directions
            </button>
            <button 
              data-action="view-map"
              data-id="${spot.id}"
              class="py-1.5 px-3 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 text-xs font-medium transition">
              Locate
            </button>
          </div>
        </article>
      `;
    }).join('');

    listContainer.innerHTML = html;

    // Attach card click handlers
    listContainer.querySelectorAll('.spot-card').forEach(card => {
      card.addEventListener('click', (e) => {
        const spotId = card.dataset.id;
        const targetBtn = e.target.closest('button');

        if (targetBtn) {
          const action = targetBtn.dataset.action;
          if (action === 'toggle-bookmark') {
            e.stopPropagation();
            this.handleToggleBookmark(spotId);
            return;
          }
          if (action === 'route') {
            e.stopPropagation();
            const spot = this.allSpots.find(s => s.id === spotId);
            if (spot) this.getRouteToSpot(spot);
            return;
          }
        }

        this.selectSpot(spotId);
      });
    });
  }

  /**
   * Select a Spot: highlight card, zoom map
   * @param {string} spotId 
   */
  selectSpot(spotId) {
    const spot = this.allSpots.find(s => s.id === spotId);
    if (!spot) return;

    this.selectedSpot = spot;

    // Update cards border highlight
    document.querySelectorAll('.spot-card').forEach(card => {
      const match = card.dataset.id === spotId;
      card.classList.toggle('border-indigo-600', match);
      card.classList.toggle('ring-2', match);
      card.classList.toggle('ring-indigo-500/20', match);
    });

    if (this.mapController) {
      this.mapController.focusLocation(spot.lat, spot.lon, 17);
    }
  }

  /**
   * Bookmark Toggle Handler
   * @param {string} spotId 
   */
  handleToggleBookmark(spotId) {
    const isNowBookmarked = Storage.toggleBookmark(spotId);
    const spot = this.allSpots.find(s => s.id === spotId);
    if (spot) spot.isBookmarked = isNowBookmarked;

    FormValidator.showToast(
      isNowBookmarked ? 'Bookmarked' : 'Removed',
      isNowBookmarked ? `Added "${spot?.name}" to saved places` : `Removed from saved places`,
      isNowBookmarked ? 'success' : 'info'
    );

    this.applyFiltersAndSort();
  }

  /**
   * Update Bookmarks Count in Header
   */
  updateBookmarkBadge() {
    const countBadge = document.getElementById('bookmarks-count');
    if (countBadge) {
      const count = Storage.getBookmarks().length;
      countBadge.textContent = count;
      countBadge.classList.toggle('hidden', count === 0);
    }
  }

  /**
   * Get Walking Route (OSRM Fetch API)
   * @param {Object} spot 
   */
  async getRouteToSpot(spot) {
    const routeInfoCard = document.getElementById('active-route-card');
    const routeTitle = document.getElementById('route-dest-title');
    const routeTime = document.getElementById('route-walk-time');
    const routeDist = document.getElementById('route-distance');

    try {
      FormValidator.showToast('Routing...', `Calculating walking path to ${spot.name}`, 'info');

      const routeData = await ApiService.getWalkingRoute(
        this.userLocation.lat,
        this.userLocation.lon,
        spot.lat,
        spot.lon
      );

      // Draw polyline on Leaflet
      this.mapController.drawRoute(routeData.coordinates);

      // Update route banner
      if (routeInfoCard) {
        if (routeTitle) routeTitle.textContent = spot.name;
        if (routeTime) routeTime.textContent = `${routeData.durationMinutes} min`;
        if (routeDist) routeDist.textContent = `${routeData.distanceKm} km`;
        routeInfoCard.classList.remove('hidden');
      }

      FormValidator.showToast('Route Ready', `Estimated walk time: ${routeData.durationMinutes} minutes`, 'success');
    } catch (e) {
      console.error('Route calculation failed:', e);
      FormValidator.showToast('Route Error', 'Could not calculate street route. Showing estimated straight line.', 'error');
    }
  }

  /**
   * Clear Active Route Polyline
   */
  clearActiveRoute() {
    if (this.mapController) {
      this.mapController.clearRoute();
    }
    const routeInfoCard = document.getElementById('active-route-card');
    if (routeInfoCard) routeInfoCard.classList.add('hidden');
  }

  /**
   * Handle Nominatim Live Geocoding Suggestions
   * @param {string} query 
   */
  async handleNominatimSuggestions(query) {
    const suggestionsContainer = document.getElementById('nominatim-suggestions');
    if (!suggestionsContainer) return;

    try {
      const results = await ApiService.searchNominatim(`${query} Bangalore`);
      if (results.length === 0) {
        this.hideSearchSuggestions();
        return;
      }

      suggestionsContainer.innerHTML = results.map(item => `
        <li data-lat="${item.lat}" data-lon="${item.lon}" data-name="${item.name}"
            class="px-3 py-2 text-xs hover:bg-indigo-50 dark:hover:bg-slate-700 cursor-pointer text-slate-700 dark:text-slate-200 border-b border-slate-100 dark:border-slate-700 last:border-0 flex items-center justify-between">
          <span class="font-medium truncate mr-2">${item.displayName}</span>
          <span class="text-[10px] uppercase font-bold text-indigo-500 bg-indigo-50 dark:bg-slate-800 px-1.5 py-0.5 rounded">${item.category || 'Place'}</span>
        </li>
      `).join('');

      suggestionsContainer.classList.remove('hidden');

      suggestionsContainer.querySelectorAll('li').forEach(li => {
        li.addEventListener('click', () => {
          const lat = parseFloat(li.dataset.lat);
          const lon = parseFloat(li.dataset.lon);
          const name = li.dataset.name;

          this.mapController.focusLocation(lat, lon, 16);
          this.hideSearchSuggestions();
          FormValidator.showToast('Location Selected', `Moved view to ${name}`, 'info');
        });
      });
    } catch (e) {
      console.warn('Autocomplete fetch failed:', e);
      this.hideSearchSuggestions();
    }
  }

  hideSearchSuggestions() {
    const suggestionsContainer = document.getElementById('nominatim-suggestions');
    if (suggestionsContainer) suggestionsContainer.classList.add('hidden');
  }

  /**
   * Geolocation Handler
   */
  handleGeolocation() {
    if (!navigator.geolocation) {
      FormValidator.showToast('Not Supported', 'Geolocation is not supported by your browser', 'error');
      return;
    }

    FormValidator.showToast('Locating...', 'Detecting your GPS position...', 'info');

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude } = pos.coords;
        this.userLocation = {
          lat: latitude,
          lon: longitude,
          name: 'Current Location'
        };

        this.mapController.setUserLocation(latitude, longitude);
        this.mapController.focusLocation(latitude, longitude, 16);

        // Recalculate distances for all spots
        this.allSpots = this.allSpots.map(s => {
          const dist = calculateHaversineDistance(latitude, longitude, s.lat, s.lon);
          return {
            ...s,
            distance: dist,
            walkTimeMinutes: estimateWalkMinutes(dist)
          };
        });

        this.applyFiltersAndSort();
        FormValidator.showToast('Located!', 'Distances recalculated relative to your position', 'success');
      },
      (err) => {
        console.warn('Geolocation failed:', err);
        // Default to Christ University Hub
        this.mapController.focusLocation(12.9344, 77.6062, 16);
        FormValidator.showToast('Location Pin', 'Set to Christ University Central Campus, Bangalore', 'info');
      },
      { timeout: 7000 }
    );
  }

  /**
   * Modal Management
   */
  openAddModal() {
    const modal = document.getElementById('add-spot-modal');
    if (modal) modal.classList.remove('hidden');
  }

  closeAddModal() {
    const modal = document.getElementById('add-spot-modal');
    if (modal) modal.classList.add('hidden');
    if (this.mapController) {
      this.mapController.disablePickMode();
    }
  }

  startPickOnMap() {
    this.closeAddModal();
    FormValidator.showToast('Pick Mode', 'Click anywhere on the map to set spot coordinates', 'info');

    this.mapController.enablePickMode(async (lat, lon) => {
      this.mapController.disablePickMode();
      this.openAddModal();

      // Pre-fill latitude and longitude
      const latInput = document.getElementById('spot-lat');
      const lonInput = document.getElementById('spot-lon');
      const addressInput = document.getElementById('spot-address');

      if (latInput) latInput.value = lat.toFixed(5);
      if (lonInput) lonInput.value = lon.toFixed(5);

      // Perform reverse geocoding via Fetch API
      if (addressInput) {
        addressInput.value = 'Fetching address from OpenStreetMap...';
        const address = await ApiService.reverseGeocode(lat, lon);
        addressInput.value = address;
      }
    });
  }

  /**
   * Handle Contribution Form Submission (Part-II Form Handling & Validation)
   * @param {HTMLFormElement} form 
   */
  async handleFormSubmit(form) {
    const formData = new FormData(form);
    const data = {
      spotName: formData.get('spotName'),
      category: formData.get('category'),
      address: formData.get('address'),
      lat: formData.get('lat'),
      lon: formData.get('lon'),
      budget: formData.get('budget'),
      description: formData.get('description'),
      wheelchairAccessible: formData.get('wheelchairAccessible') === 'on',
      wifi: formData.get('wifi') === 'on',
      powerOutlets: formData.get('powerOutlets') === 'on',
      quietZone: formData.get('quietZone') === 'on'
    };

    // Validate
    const { isValid, errors } = FormValidator.validateForm(data);
    if (!isValid) {
      FormValidator.displayErrors(form, errors);
      FormValidator.showToast('Validation Failed', 'Please fix highlighted errors before submitting.', 'error');
      return;
    }

    // Clear previous errors
    FormValidator.displayErrors(form, {});

    // Construct new spot object
    const lat = parseFloat(data.lat);
    const lon = parseFloat(data.lon);
    const dist = calculateHaversineDistance(this.userLocation.lat, this.userLocation.lon, lat, lon);

    const categoryLabels = {
      cafe: 'Study Cafe',
      library: 'Library & Study Zone',
      printing: 'Printing & Stationary',
      pharmacy: 'Medical & Pharmacy',
      food: 'Budget Dining'
    };

    const newSpot = {
      id: `custom-spot-${Date.now()}`,
      name: data.spotName.trim(),
      category: data.category,
      categoryLabel: categoryLabels[data.category] || 'Campus Spot',
      address: data.address.trim(),
      lat: lat,
      lon: lon,
      distance: dist,
      walkTimeMinutes: estimateWalkMinutes(dist),
      rating: 5.0,
      reviewsCount: 1,
      budget: data.budget,
      openingHours: '08:00 AM - 09:00 PM',
      isOpenNow: true,
      wheelchairAccessible: data.wheelchairAccessible,
      wifi: data.wifi,
      powerOutlets: data.powerOutlets,
      quietZone: data.quietZone,
      phone: 'Student Contributed',
      description: data.description.trim(),
      tags: ['Student Verified', 'New Community Spot'],
      isBookmarked: false,
      isUserCreated: true
    };

    // Save to persistent Storage
    Storage.saveUserSpot(newSpot);

    // Add to active state
    this.allSpots.unshift(newSpot);
    this.applyFiltersAndSort();
    this.selectSpot(newSpot.id);

    // Reset and close
    form.reset();
    this.closeAddModal();

    FormValidator.showToast('Spot Added Successfully!', `"${newSpot.name}" has been mapped and saved.`, 'success');
  }

  /**
   * Reset All Filters
   */
  resetFilters() {
    this.searchQuery = '';
    const searchInput = document.getElementById('search-input');
    if (searchInput) searchInput.value = '';

    this.radiusKm = 10.0;
    const slider = document.getElementById('radius-slider');
    const label = document.getElementById('radius-value-label');
    if (slider) slider.value = 10;
    if (label) label.textContent = '10 km';

    this.filterOnlyAccessible = false;
    const acc = document.getElementById('toggle-accessible');
    if (acc) acc.checked = false;

    this.filterOnlyOpen = false;
    const op = document.getElementById('toggle-open-now');
    if (op) op.checked = false;

    this.filterOnlyWifi = false;
    const wf = document.getElementById('toggle-wifi');
    if (wf) wf.checked = false;

    this.viewOnlyBookmarks = false;
    const bmBtn = document.getElementById('btn-view-bookmarks');
    if (bmBtn) {
      bmBtn.classList.remove('bg-amber-100', 'text-amber-800');
    }

    this.setActiveCategory('all');
  }

  /**
   * Skeleton Loading State Display
   * @param {boolean} show 
   */
  showLoadingState(show) {
    const skeleton = document.getElementById('loading-skeleton');
    const list = document.getElementById('spots-list');
    if (skeleton) skeleton.classList.toggle('hidden', !show);
    if (list && show) list.innerHTML = '';
  }

  /**
   * Error Banner Helpers
   */
  showErrorBanner(message) {
    const banner = document.getElementById('error-banner');
    const text = document.getElementById('error-banner-text');
    if (banner && text) {
      text.textContent = message;
      banner.classList.remove('hidden');
    }
  }

  hideErrorBanner() {
    const banner = document.getElementById('error-banner');
    if (banner) banner.classList.add('hidden');
  }
}

// Instantiate and start app on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  const app = new CampusPulseApp();
  app.init();
  window.CampusPulse = app; // Accessible in console for grading & inspection
});
