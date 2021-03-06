import { ipcRenderer } from 'electron';
import { ContextMenuListener, ContextMenuBuilder } from 'electron-spellchecker';
import path from 'path';

import { isDevMode } from '../environment';
import RecipeWebview from './lib/RecipeWebview';

import Spellchecker from './spellchecker';
import './notifications';

const debug = require('debug')('Plugin');

if (window.location.hash && window.location.hash.startsWith('#preload:')) {
  console.log('hash in preload', window.location.hash);
  require(window.location.hash.slice('#preload:'.length).replace('\\\\', '\\') + path.sep + 'fastpreload.js');
}

ipcRenderer.on('initializeRecipe', (e, data) => {
  const modulePath = path.join(data.recipe.path, 'webview.js');
  // Delete module from cache
  delete require.cache[require.resolve(modulePath)];
  try {
    // eslint-disable-next-line
    require(modulePath)(new RecipeWebview(), data);
    debug('Initialize Recipe');
  } catch (err) {
    debug('Recipe initialization failed', err);
  }
});

const spellchecker = new Spellchecker();
spellchecker.initialize();

const contextMenuBuilder = new ContextMenuBuilder(spellchecker.handler, null, isDevMode);

new ContextMenuListener((info) => { // eslint-disable-line
  contextMenuBuilder.showPopupMenu(info);
});

ipcRenderer.on('settings-update', (e, data) => {
  spellchecker.toggleSpellchecker(data.enableSpellchecking);
  debug('Settings update received', data);
});

// initSpellche

document.addEventListener('DOMContentLoaded', () => {
  ipcRenderer.sendToHost('hello');
}, false);

// Patching window.open
const originalWindowOpen = window.open;

window.open = (url, frameName, features) => {
  // We need to differentiate if the link should be opened in a popup or in the systems default browser 
  if (!frameName && !features) {
    return ipcRenderer.sendToHost('new-window', url);
  }

  return originalWindowOpen(url, frameName, features);
};
