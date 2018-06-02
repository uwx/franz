(() => {
  const log = require('debug')('hansen:cssInjection');
  const { ipcRenderer } = require('electron');

  let uniqueId = 0;

  /* eslint prefer-template: "off", arrow-parens: "off", global-require: "off", no-continue: "off", no-await-in-loop: "off", no-plusplus: "off", no-useless-concat: "off" */

  function hansenExecute(func) {
    const fn = func.name || '<unnamed function>';
    log('hansenExecute executing ' + fn);

    const result = func();
    if (result instanceof Promise) {
      result.then((...args) => {
        log('hansenExecute[' + fn + '] finished successfully;' + args.join(' '));
      }).catch((...errors) => {
        console.error('hansenExecute[' + fn + '] failed');

        console.error('hansenExecute[' + fn + '] error results', ...errors.filter(e => {
          if (e instanceof Error) {
            console.error(e);
            return false;
          }
          return true;
        }));
      });
    } else {
      log('hansenExecute[' + fn + '] finished' + (result || '<no result>'));
    }
  }

  hansenExecute(async () => {
    const path = require('path');
    const { promisify } = require('util');
    const fs = require('fs');
    const readFile = promisify(fs.readFile);
    const readdir = promisify(fs.readdir);

    // queue a less compilation on the main process
    function queueRender(css) {
      return new Promise(resolve => {
        const id = 'mainwindow-' + (uniqueId++);

        function callback(event, outCss, outId) {
          if (outId !== id) return;

          ipcRenderer.removeListener('HANSEN_LESS_COMPILE_REPLY', callback);
          resolve(outCss);
        }

        ipcRenderer.on('HANSEN_LESS_COMPILE_REPLY', callback);
        ipcRenderer.send('HANSEN_LESS_COMPILE', css, id);
      });
    }

    async function render(css, name) {
      try {
        const startTime = new Date().getTime();
        const result = await queueRender(css);
        const endTime = new Date().getTime();
        console.info('[cssInjection][render] rendered', name, 'in', endTime - startTime, 'ms');
        return result;
      } catch (e) {
        console.error('[cssInjection] failed with', e);
        return '';
      }
    }

    async function applyAndWatchCSS(cssPath, name, ext, useLess = false) {
      let cssText = await readFile(cssPath, 'utf-8');
      if (useLess) cssText = await render(cssText, name);

      const styleTag = document.createElement('style');
      styleTag.id = 'hansen-css-' + name + '-' + ext;
      const cssNode = document.createTextNode(cssText);
      styleTag.appendChild(cssNode);

      document.head.appendChild(styleTag);

      console.info('[cssInjection] loaded', name, '(' + ext + ')');

      fs.watch(cssPath, { encoding: 'utf-8' }, async eventType => {
        if (eventType !== 'change') return;

        const changed = await readFile(cssPath, 'utf-8'); // should this be sync?
        if (useLess) cssNode.nodeValue = await render(changed, name);
        else cssNode.nodeValue = changed;

        console.info('[cssInjection] refreshed', name, '(' + ext + ')');
      });
    }

    for (const file of await readdir('$$$ROOT$$$')) {
      const cssPath = '$$$ROOT$$$' + '/' + file;
      const parsed = path.parse(cssPath);
      if (parsed.ext !== '.css' && parsed.ext !== '.less') continue;
      await applyAndWatchCSS(cssPath, parsed.name, parsed.ext.slice(1), parsed.ext === '.less');
    }
  });
})();
