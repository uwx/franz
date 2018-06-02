/* eslint prefer-template: "off", arrow-parens: "off", arrow-body-style: "off", global-require: "off", no-alert: "off" */

// okay, so don't think i need to worry about less doing weird stuff when i require it through nodejs even though it's electron, see https://github.com/less/less.js/tree/3.x/lib/less-browser
const less = require('less');
const { ipcMain } = require('electron');

const { promisify } = require('util');
const path = require('path');
const readFile = promisify(require('fs').readFile);

less.logger.addListener({
  debug: msg => console.debug('[cssInjection][less][debug]', msg),
  info: msg => console.info('[cssInjection][less][info]', msg),
  warn: msg => console.warn('[cssInjection][less][warn]', msg),
  error: msg => console.error('[cssInjection][less][error]', msg),
});

module.exports = mainWindow => {
  ipcMain.on('HANSEN_LESS_COMPILE', (event, css, id) => {
    console.log('[less]compilin ' + id);
    less.render(css).then(({ css: outCss }) => {
      console.log('[less]compiled ' + id);
      event.sender.send('HANSEN_LESS_COMPILE_REPLY', outCss, id);
    });
  });

  mainWindow.webContents.on('dom-ready', async () => {
    const cssInject = await readFile(path.join(__dirname, 'cssInjection.js'), 'utf8');
    mainWindow.webContents.executeJavaScript(cssInject.replace(/'\$\$\$ROOT\$\$\$'/g, JSON.stringify(path.resolve(process.cwd(), '_hansen_css'))));
  });
};
