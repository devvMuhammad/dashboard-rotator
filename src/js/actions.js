// This file is no longer used since actions are now handled directly in popup.js
// Keeping it for backward compatibility in case background.js still references it

import { stopSwitching } from './messages.js';

const closePopupWindow = () => {
  window.close();
}

// Legacy function - kept for compatibility
const initActions = ({ stopButton, startButton }) => {
  // Actions are now handled in popup.js
  console.log('Legacy initActions called - actions are now handled in popup.js');
};

export { initActions, closePopupWindow };
