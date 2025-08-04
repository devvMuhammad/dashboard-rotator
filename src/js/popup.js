// popup.js is the entry point of the popup window.
import { storageLocalGet, storageLocalSet } from './storageLocal.js';
import { stopSwitching } from './messages.js';
import { LOCAL_STORAGE_KEYS, DEFAULT_DURATION_TIME } from './constants.js';

const STOP_BUTTON = document.getElementById('stop-button');
const START_BUTTON = document.getElementById('start-button');
const ADD_URL_BUTTON = document.getElementById('add-url-button');
const URL_LIST_CONTAINER = document.getElementById('url-list-container');

// URL validation regex
const urlRegex = new RegExp("^(http[s]?:\\/\\/(www\\.)?|www\\.){0,1}([0-9A-Za-z-\\.@:%_\+~#=]+)+((\\.[a-zA-Z]{2,3})+)(/(.)*)?(\\?(.)*)?");

let urlEntryCounter = 0;

// Create a new URL entry row
const createUrlEntry = (url = '', seconds = DEFAULT_DURATION_TIME) => {
  const entryId = `url-entry-${urlEntryCounter++}`;
  
  const entryDiv = document.createElement('div');
  entryDiv.className = 'url-entry';
  entryDiv.id = entryId;
  
  entryDiv.innerHTML = `
    <div class="url-entry-inputs">
      <div class="url-input">
        <input type="text" value="${url}" placeholder="Enter URL (e.g., https://example.com)" title="URL address">
        <div class="error-message" style="display: none;"></div>
      </div>
      <div class="seconds-input">
        <input type="number" value="${seconds}" min="1" title="Duration in seconds">
        <div class="error-message" style="display: none;"></div>
      </div>
    </div>
    <button type="button" class="remove-btn">×</button>
  `;
  
  // Add event listener for remove button
  const removeBtn = entryDiv.querySelector('.remove-btn');
  removeBtn.addEventListener('click', () => {
    entryDiv.remove();
  });
  
  return entryDiv;
};

// Add a new URL entry
const addUrlEntry = (url = '', seconds = DEFAULT_DURATION_TIME) => {
  const entry = createUrlEntry(url, seconds);
  URL_LIST_CONTAINER.appendChild(entry);
  
  // Add event listeners for validation
  const urlInput = entry.querySelector('.url-input input');
  const secondsInput = entry.querySelector('.seconds-input input');
  
  urlInput.addEventListener('blur', () => validateUrlInput(urlInput));
  urlInput.addEventListener('input', () => clearError(urlInput));
  
  secondsInput.addEventListener('blur', () => validateSecondsInput(secondsInput));
  secondsInput.addEventListener('input', () => clearError(secondsInput));
};

// Remove URL entry function is now handled by event listeners in createUrlEntry

// Validate URL input
const validateUrlInput = (input) => {
  const value = input.value.trim();
  const errorDiv = input.parentElement.querySelector('.error-message');
  
  if (!value) {
    showError(input, errorDiv, 'URL is required');
    return false;
  }
  
  if (!urlRegex.test(value)) {
    showError(input, errorDiv, 'Please enter a valid URL');
    return false;
  }
  
  clearError(input);
  return true;
};

// Validate seconds input
const validateSecondsInput = (input) => {
  const value = parseInt(input.value);
  const errorDiv = input.parentElement.querySelector('.error-message');
  
  if (isNaN(value) || value <= 0) {
    showError(input, errorDiv, 'Seconds must be greater than 0');
    return false;
  }
  
  clearError(input);
  return true;
};

// Show error message
const showError = (input, errorDiv, message) => {
  input.classList.add('error');
  errorDiv.textContent = message;
  errorDiv.style.display = 'block';
};

// Clear error message
const clearError = (input) => {
  input.classList.remove('error');
  const errorDiv = input.parentElement.querySelector('.error-message');
  errorDiv.style.display = 'none';
};

// Get all URL entries with validation
const getUrlList = () => {
  const urlEntries = document.querySelectorAll('.url-entry');
  const urlListItems = [];
  let isValid = true;
  
  urlEntries.forEach(entry => {
    const urlInput = entry.querySelector('.url-input input');
    const secondsInput = entry.querySelector('.seconds-input input');
    
    const isUrlValid = validateUrlInput(urlInput);
    const isSecondsValid = validateSecondsInput(secondsInput);
    
    if (!isUrlValid || !isSecondsValid) {
      isValid = false;
      return;
    }
    
    const url = urlInput.value.trim();
    const seconds = parseInt(secondsInput.value);
    
    if (url && seconds > 0) {
      urlListItems.push({
        url: url,
        durationTime: seconds
      });
    }
  });
  
  return isValid ? urlListItems : null;
};

// Load saved URLs from storage
const loadSavedUrls = async () => {
  const { urlListItems = [] } = await storageLocalGet(LOCAL_STORAGE_KEYS.urlListItems);
  
  if (urlListItems.length > 0) {
    urlListItems.forEach(item => {
      addUrlEntry(item.url, item.durationTime);
    });
  } else {
    // Add one empty entry by default
    addUrlEntry();
  }
};

// Save URLs to storage
const saveUrls = async (urlListItems) => {
  await storageLocalSet(LOCAL_STORAGE_KEYS.urlListItems, urlListItems);
};

// Start button click handler
const handleStartClick = async () => {
  const urlListItems = getUrlList();
  
  if (!urlListItems) {
    return; // Validation failed, errors are already shown
  }
  
  if (urlListItems.length === 0) {
    alert('Please add at least one URL');
    return;
  }
  
  // Save to storage
  await saveUrls(urlListItems);
  
  // Send message to background script
  chrome.runtime.sendMessage({
    message: "start",
    payload: {
      urlListItems
    }
  });
  
  // Close popup
  window.close();
};

// Stop button click handler
const handleStopClick = () => {
  stopSwitching();
};

// Add URL button click handler
const handleAddUrlClick = () => {
  addUrlEntry();
};

// Initialize event listeners
const initEventListeners = () => {
  START_BUTTON.addEventListener('click', handleStartClick);
  STOP_BUTTON.addEventListener('click', handleStopClick);
  ADD_URL_BUTTON.addEventListener('click', handleAddUrlClick);
};

// Initialize the popup
const init = async () => {
  initEventListeners();
  await loadSavedUrls();
};

// Start the application
init();
