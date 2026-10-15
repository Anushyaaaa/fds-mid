/**
 * storage.js - LocalStorage & State Persistence Layer
 * OpenStreetMap CampusPulse Web Application
 */

const STORAGE_KEYS = {
  BOOKMARKS: 'osm_campuspulse_bookmarks',
  USER_SPOTS: 'osm_campuspulse_custom_spots',
  THEME: 'osm_campuspulse_theme',
  USER_LOCATION: 'osm_campuspulse_user_location',
  SETTINGS: 'osm_campuspulse_settings'
};

export const Storage = {
  /**
   * Get all bookmarked spot IDs
   * @returns {string[]}
   */
  getBookmarks() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.BOOKMARKS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to read bookmarks from storage:', e);
      return [];
    }
  },

  /**
   * Toggle a bookmark status
   * @param {string} spotId 
   * @returns {boolean} True if now bookmarked, false if removed
   */
  toggleBookmark(spotId) {
    try {
      let bookmarks = this.getBookmarks();
      const index = bookmarks.indexOf(spotId);
      let isBookmarked = false;
      if (index === -1) {
        bookmarks.push(spotId);
        isBookmarked = true;
      } else {
        bookmarks.splice(index, 1);
        isBookmarked = false;
      }
      localStorage.setItem(STORAGE_KEYS.BOOKMARKS, JSON.stringify(bookmarks));
      return isBookmarked;
    } catch (e) {
      console.error('Failed to update bookmark:', e);
      return false;
    }
  },

  /**
   * Check if a spot is bookmarked
   * @param {string} spotId 
   * @returns {boolean}
   */
  isBookmarked(spotId) {
    return this.getBookmarks().includes(spotId);
  },

  /**
   * Get custom spots created by the user via the contribution form
   * @returns {Array}
   */
  getUserSpots() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.USER_SPOTS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to load user spots:', e);
      return [];
    }
  },

  /**
   * Save a newly added spot to localStorage
   * @param {Object} spot 
   */
  saveUserSpot(spot) {
    try {
      const spots = this.getUserSpots();
      spots.unshift(spot);
      localStorage.setItem(STORAGE_KEYS.USER_SPOTS, JSON.stringify(spots));
      return true;
    } catch (e) {
      console.error('Failed to save user spot:', e);
      return false;
    }
  },

  /**
   * Delete a custom spot
   * @param {string} spotId
   */
  deleteUserSpot(spotId) {
    try {
      let spots = this.getUserSpots();
      spots = spots.filter(s => s.id !== spotId);
      localStorage.setItem(STORAGE_KEYS.USER_SPOTS, JSON.stringify(spots));
      return true;
    } catch (e) {
      console.error('Failed to delete custom spot:', e);
      return false;
    }
  },

  /**
   * Get theme preference
   * @returns {'light'|'dark'}
   */
  getTheme() {
    return localStorage.getItem(STORAGE_KEYS.THEME) || 'light';
  },

  /**
   * Set theme preference
   * @param {'light'|'dark'} theme 
   */
  setTheme(theme) {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  },

  /**
   * Export all spots (bundled + user created) to a downloadable JSON file
   * @param {Array} allSpots 
   */
  exportAsJSON(allSpots) {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(allSpots, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `campuspulse_amenities_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }
};
