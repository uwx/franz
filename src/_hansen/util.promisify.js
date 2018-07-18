const kCustomPromisifiedSymbol = Symbol('util.promisify.custom');
const kCustomPromisifyArgsSymbol = Symbol('customPromisifyArgs');

const slice = Function.call.bind(Array.prototype.slice);
const concat = Function.call.bind(Array.prototype.concat);
const forEach = Function.call.bind(Array.prototype.forEach);

module.exports = require('util').promisify || (orig => {
  if (typeof orig !== 'function') {
    var error = new TypeError('The "original" argument must be of type function');
    error.name = 'TypeError [ERR_INVALID_ARG_TYPE]';
    error.code = 'ERR_INVALID_ARG_TYPE';
    throw error;
  }

  if (orig[kCustomPromisifiedSymbol]) {
    var customFunction = orig[kCustomPromisifiedSymbol];
    if (typeof customFunction !== 'function') {
      throw new TypeError('The [util.promisify.custom] property must be a function');
    }
    Object.defineProperty(customFunction, kCustomPromisifiedSymbol, {
      configurable: true,
      enumerable: false,
      value: customFunction,
      writable: false
    });
    return customFunction;
  }

  // Names to create an object from in case the callback receives multiple
  // arguments, e.g. ['stdout', 'stderr'] for child_process.exec.
  var argumentNames = orig[kCustomPromisifyArgsSymbol];

  var promisified = function fn() {
    var args = slice(arguments);
    var self = this; // eslint-disable-line no-invalid-this
    return new Promise(function (resolve, reject) {
      orig.apply(self, concat(args, function (err) {
        var values = arguments.length > 1 ? slice(arguments, 1) : [];
        if (err) {
          reject(err);
        } else if (typeof argumentNames !== 'undefined' && values.length > 1) {
          var obj = {};
          forEach(argumentNames, function (name, index) {
            obj[name] = values[index];
          });
          resolve(obj);
        } else {
          resolve(values[0]);
        }
      }));
    });
  };

  Object.setPrototypeOf(promisified, Object.getPrototypeOf(orig));

  Object.defineProperty(promisified, kCustomPromisifiedSymbol, {
    configurable: true,
    enumerable: false,
    value: promisified,
    writable: false
  });
  return Object.defineProperties(promisified, Object.getOwnPropertyDescriptors(orig));
});