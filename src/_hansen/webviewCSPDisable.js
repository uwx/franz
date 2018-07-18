/* eslint arrow-parens: "off", arrow-body-style: "off", global-require: "off", no-alert: "off" */

exports.hijackCSP = webContents =>
  webContents.session.webRequest.onHeadersReceived((details, callback) => {
    const outHeaders = Object.assign({}, details.responseHeaders);
    console.log('csp', details.url, delete outHeaders['content-security-policy']);
    callback({ responseHeaders: outHeaders });
  });
