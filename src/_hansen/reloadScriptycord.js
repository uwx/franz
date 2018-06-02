/* eslint arrow-parens: "off", arrow-body-style: "off", global-require: "off", no-alert: "off" */
/* global alert */
module.exports = self => {
  return {
    label: 'Reload Scriptycord',
    click: () => {
      if (self.stores.user.isLoggedIn
        && self.stores.services.enabled.length > 0) {
        require('electron').remote.ipcMain.once('HANSEN_WEBVIEW_TIDY_FINISHED', () => {
          console.log('got HANSEN_WEBVIEW_TIDY_FINISHED');
          self.actions.service.reloadActive();
        });
        require('electron').ipcRenderer.send('HANSEN_WEBVIEW_START_TIDY');
      } else {
        alert('select discord recipe first!');
      }
    },
  };
};
