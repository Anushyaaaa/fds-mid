/**
 * map.js - Leaflet.js Map Controller & Spatial Rendering
 * OpenStreetMap Tile Integration, Category Markers, Popups, and Route Drawing
 */

export class MapController {
  constructor(mapContainerId, initialCoords = [12.9344, 77.6062], initialZoom = 15) {
    this.containerId = mapContainerId;
    this.initialCoords = initialCoords;
    this.initialZoom = initialZoom;
    this.map = null;
    this.markersLayer = null;
    this.routeLayer = null;
    this.userMarker = null;
    this.pickMarker = null;
    this.isPickModeActive = false;
    this.onPickCallback = null;
    this.onSpotSelectCallback = null;
  }

  /**
   * Initialize Leaflet Map
   */
  init() {
    if (this.map) return;

    // Create Leaflet map instance
    this.map = L.map(this.containerId, {
      zoomControl: false,
      attributionControl: true
    }).setView(this.initialCoords, this.initialZoom);

    // Zoom control in top right
    L.control.zoom({ position: 'topright' }).addTo(this.map);

    // Add high-resolution OpenStreetMap tile layer
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank">OpenStreetMap</a> contributors'
    }).addTo(this.map);

    // Layer group for spot markers
    this.markersLayer = L.layerGroup().addTo(this.map);

    // Event listener for map clicks (picking coordinates for contribution)
    this.map.on('click', (e) => {
      if (this.isPickModeActive && this.onPickCallback) {
        this.setPickLocation(e.latlng.lat, e.latlng.lng);
        this.onPickCallback(e.latlng.lat, e.latlng.lng);
      }
    });

    // Invalidate size on container resize
    window.addEventListener('resize', () => {
      if (this.map) this.map.invalidateSize();
    });
  }

  /**
   * Get SVG Icon HTML based on category
   * @param {string} category 
   * @param {boolean} isSelected
   * @returns {L.DivIcon}
   */
  getCategoryIcon(category, isSelected = false) {
    const config = {
      cafe: { color: '#f97316', bg: 'bg-orange-500', icon: '☕' },
      library: { color: '#6366f1', bg: 'bg-indigo-600', icon: '📚' },
      printing: { color: '#0284c7', bg: 'bg-sky-600', icon: '🖨️' },
      pharmacy: { color: '#e11d48', bg: 'bg-rose-600', icon: '💊' },
      food: { color: '#059669', bg: 'bg-emerald-600', icon: '🍲' }
    }[category] || { color: '#4f46e5', bg: 'bg-indigo-600', icon: '📍' };

    const selectedClass = isSelected ? 'scale-125 ring-4 ring-white shadow-2xl z-50' : 'hover:scale-110';

    return L.divIcon({
      className: 'custom-map-pin',
      html: `
        <div class="relative flex items-center justify-center transition-transform duration-200 ${selectedClass}">
          <div class="w-9 h-9 rounded-full ${config.bg} text-white flex items-center justify-center text-base shadow-lg border-2 border-white">
            ${config.icon}
          </div>
          <div class="absolute -bottom-1 w-2.5 h-2.5 ${config.bg} rotate-45 border-r border-b border-white"></div>
        </div>
      `,
      iconSize: [36, 42],
      iconAnchor: [18, 42],
      popupAnchor: [0, -38]
    });
  }

  /**
   * Render spot markers onto map
   * @param {Array} spots 
   * @param {string|null} selectedId 
   */
  renderMarkers(spots, selectedId = null) {
    if (!this.markersLayer) return;
    this.markersLayer.clearLayers();

    spots.forEach(spot => {
      const isSelected = spot.id === selectedId;
      const marker = L.marker([spot.lat, spot.lon], {
        icon: this.getCategoryIcon(spot.category, isSelected),
        title: spot.name
      });

      // Rich interactive popup
      const popupContent = `
        <div class="p-3 max-w-[260px] font-sans">
          <div class="flex items-center justify-between gap-2 mb-1">
            <span class="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200">
              ${spot.categoryLabel}
            </span>
            <span class="text-xs font-semibold text-amber-500 flex items-center gap-0.5">
              ★ ${spot.rating}
            </span>
          </div>
          <h4 class="font-bold text-slate-900 text-sm leading-tight mb-1">${spot.name}</h4>
          <p class="text-xs text-slate-500 mb-2 line-clamp-2">${spot.address}</p>
          <div class="flex items-center justify-between text-xs font-medium text-slate-600 mb-3 pt-2 border-t border-slate-100">
            <span>🚶 ${spot.walkTimeMinutes || 5} min walk</span>
            <span class="font-semibold text-indigo-600">${spot.distance} km</span>
          </div>
          <button 
            id="popup-btn-nav-${spot.id}"
            class="w-full py-1.5 px-3 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-lg transition shadow-sm flex items-center justify-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
            Walking Route
          </button>
        </div>
      `;

      marker.bindPopup(popupContent);

      marker.on('popupopen', () => {
        const btn = document.getElementById(`popup-btn-nav-${spot.id}`);
        if (btn && this.onSpotSelectCallback) {
          btn.addEventListener('click', () => {
            this.onSpotSelectCallback(spot, true);
          });
        }
      });

      marker.on('click', () => {
        if (this.onSpotSelectCallback) {
          this.onSpotSelectCallback(spot, false);
        }
      });

      this.markersLayer.addLayer(marker);
    });

    if (spots.length > 0 && !selectedId) {
      const group = new L.featureGroup(this.markersLayer.getLayers());
      this.map.fitBounds(group.getBounds().pad(0.15));
    }
  }

  /**
   * Focus map on specific spot coordinates
   * @param {number} lat 
   * @param {number} lon 
   * @param {number} zoom 
   */
  focusLocation(lat, lon, zoom = 16) {
    if (!this.map) return;
    this.map.flyTo([lat, lon], zoom, {
      animate: true,
      duration: 1.2
    });
  }

  /**
   * Set user GPS location marker with pulse effect
   * @param {number} lat 
   * @param {number} lon 
   */
  setUserLocation(lat, lon) {
    if (this.userMarker) {
      this.map.removeLayer(this.userMarker);
    }

    const userIcon = L.divIcon({
      className: 'user-gps-pulse',
      html: `
        <div class="relative flex items-center justify-center">
          <div class="w-4 h-4 bg-blue-600 rounded-full border-2 border-white shadow-md z-10"></div>
          <div class="absolute w-8 h-8 bg-blue-500 rounded-full animate-ping opacity-75"></div>
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 16]
    });

    this.userMarker = L.marker([lat, lon], { icon: userIcon, zIndexOffset: 1000 }).addTo(this.map);
    this.userMarker.bindPopup('<b>You Are Here</b><br>Christ University Central Hub');
  }

  /**
   * Draw walking route polyline onto map
   * @param {Array<[number, number]>} coordinates LatLng pairs
   */
  drawRoute(coordinates) {
    if (this.routeLayer) {
      this.map.removeLayer(this.routeLayer);
    }

    this.routeLayer = L.polyline(coordinates, {
      color: '#4f46e5',
      weight: 5,
      opacity: 0.85,
      dashArray: '8, 8',
      lineCap: 'round',
      lineJoin: 'round'
    }).addTo(this.map);

    this.map.fitBounds(this.routeLayer.getBounds().pad(0.2));
  }

  /**
   * Clear active route polyline
   */
  clearRoute() {
    if (this.routeLayer) {
      this.map.removeLayer(this.routeLayer);
      this.routeLayer = null;
    }
  }

  /**
   * Enable coordinate picking mode
   * @param {Function} callback 
   */
  enablePickMode(callback) {
    this.isPickModeActive = true;
    this.onPickCallback = callback;
    this.map.getContainer().style.cursor = 'crosshair';
  }

  /**
   * Disable coordinate picking mode
   */
  disablePickMode() {
    this.isPickModeActive = false;
    this.map.getContainer().style.cursor = '';
    if (this.pickMarker) {
      this.map.removeLayer(this.pickMarker);
      this.pickMarker = null;
    }
  }

  /**
   * Set temporary pin for chosen coordinates
   * @param {number} lat 
   * @param {number} lon 
   */
  setPickLocation(lat, lon) {
    if (this.pickMarker) {
      this.map.removeLayer(this.pickMarker);
    }

    const pickIcon = L.divIcon({
      className: 'pick-pin',
      html: `
        <div class="w-8 h-8 rounded-full bg-indigo-700 text-white flex items-center justify-center font-bold border-2 border-white shadow-xl animate-bounce">
          📍
        </div>
      `,
      iconSize: [32, 32],
      iconAnchor: [16, 32]
    });

    this.pickMarker = L.marker([lat, lon], { icon: pickIcon }).addTo(this.map);
  }
}
