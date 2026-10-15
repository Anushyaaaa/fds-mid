/**
 * validation.js - Form Validation and User Feedback Service
 * Handles input sanitization, schema verification, and interactive feedback
 */

export const FormValidator = {
  // Validation Rules Schema
  rules: {
    spotName: {
      required: true,
      minLength: 3,
      maxLength: 60,
      pattern: /^[a-zA-Z0-9\s&'.,()-]+$/,
      message: 'Spot name must be between 3 and 60 characters and contain valid characters.'
    },
    category: {
      required: true,
      allowed: ['cafe', 'library', 'printing', 'pharmacy', 'food'],
      message: 'Please choose a valid category for this spot.'
    },
    address: {
      required: true,
      minLength: 5,
      maxLength: 120,
      message: 'Please enter a detailed street address (at least 5 characters).'
    },
    lat: {
      required: true,
      isNumber: true,
      min: -90,
      max: 90,
      message: 'Latitude must be a valid coordinate between -90.0 and 90.0'
    },
    lon: {
      required: true,
      isNumber: true,
      min: -180,
      max: 180,
      message: 'Longitude must be a valid coordinate between -180.0 and 180.0'
    },
    budget: {
      required: true,
      allowed: ['Free', '₹', '₹₹', '₹₹₹'],
      message: 'Select a student budget tier.'
    },
    description: {
      required: true,
      minLength: 10,
      maxLength: 350,
      message: 'Description must be between 10 and 350 characters.'
    }
  },

  /**
   * Validate a single input field
   * @param {string} fieldName 
   * @param {any} value 
   * @returns {{ isValid: boolean, message: string }}
   */
  validateField(fieldName, value) {
    const rule = this.rules[fieldName];
    if (!rule) return { isValid: true, message: '' };

    const strValue = typeof value === 'string' ? value.trim() : (value !== null && value !== undefined ? String(value) : '');

    // Required check
    if (rule.required && !strValue) {
      return { isValid: false, message: 'This field is required.' };
    }

    // Min Length
    if (rule.minLength && strValue.length < rule.minLength) {
      return { isValid: false, message: `Minimum ${rule.minLength} characters required (current: ${strValue.length}).` };
    }

    // Max Length
    if (rule.maxLength && strValue.length > rule.maxLength) {
      return { isValid: false, message: `Maximum ${rule.maxLength} characters allowed.` };
    }

    // Numeric check
    if (rule.isNumber) {
      const num = parseFloat(strValue);
      if (isNaN(num)) {
        return { isValid: false, message: 'Must be a valid numeric coordinate.' };
      }
      if (rule.min !== undefined && num < rule.min) {
        return { isValid: false, message: `Must be >= ${rule.min}` };
      }
      if (rule.max !== undefined && num > rule.max) {
        return { isValid: false, message: `Must be <= ${rule.max}` };
      }
    }

    // Allowed values
    if (rule.allowed && !rule.allowed.includes(strValue)) {
      return { isValid: false, message: rule.message };
    }

    // Regex Pattern
    if (rule.pattern && !rule.pattern.test(strValue)) {
      return { isValid: false, message: rule.message };
    }

    return { isValid: true, message: '' };
  },

  /**
   * Validate entire form data
   * @param {Object} data 
   * @returns {{ isValid: boolean, errors: Object }}
   */
  validateForm(data) {
    const errors = {};
    let isValid = true;

    for (const key of Object.keys(this.rules)) {
      const check = this.validateField(key, data[key]);
      if (!check.isValid) {
        errors[key] = check.message;
        isValid = false;
      }
    }

    return { isValid, errors };
  },

  /**
   * Display inline feedback in the DOM
   * @param {HTMLFormElement} formElement 
   * @param {Object} errors 
   */
  displayErrors(formElement, errors) {
    // Clear previous errors
    formElement.querySelectorAll('.field-error-msg').forEach(el => el.remove());
    formElement.querySelectorAll('.input-error').forEach(el => {
      el.classList.remove('input-error', 'border-red-500', 'focus:ring-red-500');
      el.classList.add('border-slate-300', 'dark:border-slate-700');
    });

    // Apply new errors
    for (const [fieldName, message] of Object.entries(errors)) {
      const input = formElement.querySelector(`[name="${fieldName}"]`);
      if (input) {
        input.classList.remove('border-slate-300', 'dark:border-slate-700');
        input.classList.add('input-error', 'border-red-500', 'focus:ring-red-500');

        const errorP = document.createElement('p');
        errorP.className = 'field-error-msg text-xs text-red-500 mt-1 flex items-center gap-1 font-medium';
        errorP.innerHTML = `<svg class="w-3.5 h-3.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path></svg>${message}`;
        input.parentNode.appendChild(errorP);
      }
    }
  },

  /**
   * Trigger a modern floating toast notification
   * @param {string} title 
   * @param {string} message 
   * @param {'success'|'error'|'info'} type 
   */
  showToast(title, message, type = 'info') {
    const container = document.getElementById('toast-container');
    if (!container) return;

    const toast = document.createElement('div');
    const bgColors = {
      success: 'bg-emerald-500 text-white',
      error: 'bg-red-500 text-white',
      info: 'bg-indigo-600 text-white'
    };
    const icons = {
      success: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />`,
      error: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />`,
      info: `<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`
    };

    toast.className = `flex items-start gap-3 p-4 rounded-xl shadow-2xl transition-all duration-300 transform translate-y-4 opacity-0 ${bgColors[type] || bgColors.info} max-w-sm pointer-events-auto`;
    toast.innerHTML = `
      <div class="flex-shrink-0 mt-0.5">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">${icons[type]}</svg>
      </div>
      <div class="flex-1 text-sm">
        <h4 class="font-semibold">${title}</h4>
        <p class="text-xs opacity-90 mt-0.5">${message}</p>
      </div>
      <button class="text-white hover:opacity-75 transition" aria-label="Close Toast">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" /></button>
      </button>
    `;

    toast.querySelector('button').addEventListener('click', () => {
      toast.classList.add('opacity-0', 'translate-y-4');
      setTimeout(() => toast.remove(), 300);
    });

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-4', 'opacity-0');
    });

    // Auto dismiss after 4 seconds
    setTimeout(() => {
      if (toast.parentNode) {
        toast.classList.add('opacity-0', 'translate-y-4');
        setTimeout(() => toast.remove(), 300);
      }
    }, 4000);
  }
};
