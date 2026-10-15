/**
 * api.js - OpenStreetMap & OSRM API Integration Service
 * Uses standard Fetch API for asynchronous JSON data handling
 */

import { Storage } from './storage.js';

// OpenStreetMap & OSRM Endpoints
const NOMINATIM_BASE_URL = 'https://nominatim.openstreetmap.org';
const OSRM_ROUTING_URL = 'https://router.project-osrm.org/route/v1/walking';

/**
 * Haversine formula to compute distance in kilometers between two GPS coordinates
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} Distance in kilometers
 */
export function calculateHaversineDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

/**
 * Calculate walking time in minutes based on 4.8 km/h average student pace
 * @param {number} distanceKm 
 * @returns {number} Estimated minutes
 */
export function estimateWalkMinutes(distanceKm) {
  const walkingSpeedKmH = 4.8;
  return Math.max(1, Math.round((distanceKm / walkingSpeedKmH) * 60));
}

export const ApiService = {
  /**
   * Fetch campus spots from local JSON dataset and merge with user-saved spots
   * @param {Object} [userCoords] Optional user location for live distance recalculation
   * @returns {Promise<Array>}
   */
  async getSpots(userCoords = null) {
    try {
      const response = await fetch('./data/spots.json');
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const defaultSpots = await response.json();
      const userCustomSpots = Storage.getUserSpots();
      const bookmarks = Storage.getBookmarks();

      // Combine both lists
      const combined = [...userCustomSpots, ...defaultSpots];

      // Update distance if user location is available and update bookmark flags
      return combined.map(spot => {
        let dist = spot.distance;
        let walkTime = spot.walkTimeMinutes || estimateWalkMinutes(spot.distance || 0.5);

        if (userCoords && userCoords.lat && userCoords.lon) {
          dist = calculateHaversineDistance(userCoords.lat, userCoords.lon, spot.lat, spot.lon);
          walkTime = estimateWalkMinutes(dist);
        }

        return {
          ...spot,
          distance: dist,
          walkTimeMinutes: walkTime,
          isBookmarked: bookmarks.includes(spot.id)
        };
      });
    } catch (error) {
      console.warn('Network issue fetching spots.json, using fallback data:', error);
      // Fallback in case of local file protocol issue
      const userCustomSpots = Storage.getUserSpots();
      const bookmarks = Storage.getBookmarks();
      return [...userCustomSpots].map(s => ({
        ...s,
        isBookmarked: bookmarks.includes(s.id)
      }));
    }
  },

  /**
   * Search locations using OpenStreetMap Nominatim API
   * @param {string} query Search string
   * @returns {Promise<Array>} Geocoded results
   */
  async searchNominatim(query) {
    if (!query || query.trim().length < 2) return [];

    const url = `${NOMINATIM_BASE_URL}/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1`;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 6000); // 6s timeout

    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CampusPulse-ChristUniversity-StudentApp/1.0'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`Nominatim API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.map(item => ({
        displayName: item.display_name,
        name: item.name || item.display_name.split(',')[0],
        lat: parseFloat(item.lat),
        lon: parseFloat(item.lon),
        type: item.type,
        category: item.class
      }));
    } catch (err) {
      if (err.name === 'AbortError') {
        throw new Error('Search request timed out. Please check your internet connection.');
      }
      console.error('Nominatim search failed:', err);
      throw err;
    }
  },

  /**
   * Reverse geocode coordinates using OpenStreetMap Nominatim
   * @param {number} lat 
   * @param {number} lon 
   * @returns {Promise<string>} Human readable address
   */
  async reverseGeocode(lat, lon) {
    const url = `${NOMINATIM_BASE_URL}/reverse?format=json&lat=${lat}&lon=${lon}`;
    
    try {
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'CampusPulse-ChristUniversity-StudentApp/1.0'
        }
      });
      if (!response.ok) throw new Error('Reverse geocode failed');
      const data = await response.json();
      return data.display_name || `${lat.toFixed(4)}, ${lon.toFixed(4)}`;
    } catch (e) {
      console.warn('Reverse geocoding error:', e);
      return `Lat: ${lat.toFixed(4)}, Lon: ${lon.toFixed(4)}`;
    }
  },

  /**
   * Fetch walking directions and polyline route using OSRM
   * @param {number} startLat 
   * @param {number} startLon 
   * @param {number} endLat 
   * @param {number} endLon 
   * @returns {Promise<Object>} Distance, duration, and GeoJSON geometry
   */
  async getWalkingRoute(startLat, startLon, endLat, endLon) {
    const url = `${OSRM_ROUTING_URL}/${startLon},${startLat};${endLon},${endLat}?overview=full&geometries=geojson`;

    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Routing service unavailable');
      const data = await response.json();
      
      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        return {
          distanceKm: parseFloat((route.distance / 1000).toFixed(2)),
          durationMinutes: Math.round(route.duration / 60),
          coordinates: route.geometry.coordinates.map(coord => [coord[1], coord[0]]) // Convert [lon, lat] to Leaflet [lat, lon]
        };
      }
      throw new Error('No route found');
    } catch (e) {
      console.warn('OSRM routing failed, falling back to direct line estimation:', e);
      // Fallback: straight line with Haversine
      const distance = calculateHaversineDistance(startLat, startLon, endLat, endLon);
      return {
        distanceKm: distance,
        durationMinutes: estimateWalkMinutes(distance),
        coordinates: [
          [startLat, startLon],
          [endLat, endLon]
        ]
      };
    }
  }
};
