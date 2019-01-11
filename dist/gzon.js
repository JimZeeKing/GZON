(function(){function r(e,n,t){function o(i,f){if(!n[i]){if(!e[i]){var c="function"==typeof require&&require;if(!f&&c)return c(i,!0);if(u)return u(i,!0);var a=new Error("Cannot find module '"+i+"'");throw a.code="MODULE_NOT_FOUND",a}var p=n[i]={exports:{}};e[i][0].call(p.exports,function(r){var n=e[i][1][r];return o(n||r)},p,p.exports,r,e,n,t)}return n[i].exports}for(var u="function"==typeof require&&require,i=0;i<t.length;i++)o(t[i]);return o}return r})()({1:[function(require,module,exports){
"use strict";

function _typeof(obj) { if (typeof Symbol === "function" && typeof Symbol.iterator === "symbol") { _typeof = function _typeof(obj) { return typeof obj; }; } else { _typeof = function _typeof(obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; }; } return _typeof(obj); }

/**
 * 
 * Copyright (C) 2018 by JimZeeKing
 * 
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation
 * files (the "Software"), to deal in the Software without
 * restriction, including without limitation the rights to use,
 * copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the
 * Software is furnished to do so, subject to the following
 * conditions:

 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial portions of the Software.

 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES
 * OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT
 * HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY,
 * WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING
 * FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR
 * OTHER DEALINGS IN THE SOFTWARE.
 */
//import pako from 'pako';
(function () {
  'use strict';
  /**
   * @namespace
   * @alias GZON
   * @description A simple JavaScript lib to compress, decompress and optimize json data exchange with GZIP and Base64. Inspired by https://github.com/tcorral/JSONC
   * @author JimZeeKing
   * @version 0.9.9
   * @todo Allow user to specify single key not to be touched or used during compression
   */

  function GZON() {
    //public api
    var api = {};
    /**
     * @alias GZON.compress
     * @type {function}
     * @description Compress data with GZIP to a final Base64 string
     * @param {(Object|string)} obj Input data to compress
     * @param {boolean} [safe = false] Should GZON protect existing keys from beign replaced if they can collide with replacement ones? Use this if you have keys to protect from replacement.
     * @returns {string} The final Base64 string of the JSON data
     */

    api.compress = function (obj) {
      var safe = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;

      if (typeof obj === "string") {
        obj = JSON.parse(obj);
      }

      if (safe) {
        _protectKeys(obj);
      }

      _grabKeys(obj);

      obj.GZONKeys = _replacedKeys;
      var objStr = JSON.stringify(obj);
      delete obj.GZONKeys;

      for (var index = 0; index < _replacedKeys.length; index++) {
        var key = _replacedKeys[index][0];
        var newKey = _replacedKeys[index][1];
        objStr = objStr.replace(new RegExp('(?:"' + _escapeRegExp(key) + '"):', 'g'), '"' + newKey + '":');
      }

      return window.btoa(String.fromCharCode.apply(String, pako.gzip(objStr, {
        level: 9
      })));
    };
    /**
     * @alias GZON.decompress
     * @type {function}
     * @description Decompress gzipped data
     * @param {string} b64gzippedJSON The Base64 string of the gzipped JSON data
     * @param {boolean} [returnJSONString = false] Should the returned value be a JSON string or a fully parsed object
     * @returns {(Object|string)} The original input use at compression time
     */


    api.decompress = function (b64gzippedJSON) {
      var returnJSONString = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : false;
      var gzippedJSON = window.atob(b64gzippedJSON);
      var json = String.fromCharCode.apply(String, pako.ungzip(gzippedJSON, {
        level: 9
      }));
      console.log(json);
      var obj = JSON.parse(json);
      var objKeys = obj.GZONKeys;
      delete obj.GZONKeys;
      var objStr = JSON.stringify(obj);

      for (var index = 0; index < objKeys.length; index++) {
        var oldKey = objKeys[index][0];
        var key = objKeys[index][1];
        objStr = objStr.replace(new RegExp('(?:"' + _escapeRegExp(key) + '"):', 'g'), '"' + oldKey + '":');
      }

      return returnJSONString ? objStr : JSON.parse(objStr);
    }; //private

    /**
     * @private
     * @type {Array}
     */


    var _keys = [];
    /**
     * @private
     * @type {Array}
     */

    var _values = [];
    /**
     * @private
     * @type {Array}
     */

    var _alreadyUsedKeys = [];
    /**
     * @private
     * @type {String}
     */

    var _replacementsKeys = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-!@#$%?&*()+';
    /**
     * @private
     * @type {Array}
     */

    var _replacedKeys = [];
    /**
     * @private
     * @type {Array}
     */

    var _allKeys = [];
    /**
     * @private
     * @type {Number}
     */

    var _keysTested = 0;
    /**
     * @private
     * @type {Function}
     * @description Grab and store all keys to be replaced in the input object, allowing next step to protect keys from replacement if they collides with replacement ones. This call will be recursive if needed too.
     * @param {Object} object The input object to compress
     * @returns {undefined} 
     */

    var _protectKeys = function _protectKeys(object) {
      var entries = Object.entries(object);
      _allKeys = _allKeys.concat(Object.keys(object));
      _allKeys = _uniq(_allKeys);
      console.log("PROTECT");

      for (var index = 0; index < entries.length; index++) {
        var key = entries[index][0];
        var value = entries[index][1];

        if (_keys.indexOf(key) == -1) {
          _keys.push(key);

          if (_typeof(value) == "object" && !Array.isArray(value)) {
            //we have an object
            _protectKeys(value);
          } else if (Array.isArray(value)) {
            for (var j = 0; j < value.length; j++) {
              _protectKeys(value[j]);
            }
          }

          ;
        }
      } //reset keys for next step


      _keys = [];
    };
    /**
     * @private
     * @type {Function}
     * @description Makes sure there is only unique values in the array
     * @param {Array} array The input array to check
     * @returns {Array} The array free of duplicate values
     */


    var _uniq = function _uniq(array) {
      var ua = array.filter(function (elem, index, self) {
        return index == self.indexOf(elem);
      });
      return ua;
    };
    /**
     * @private
     * @type {Function}
     * @description Grab and store all keys to be replaced in the input object. This also choose wich replacement key to use. This call will be recursive if needed too.
     * @param {Object} object The input object to compress
     * @returns {undefined} 
     */


    var _grabKeys = function _grabKeys(object) {
      var entries = Object.entries(object);
      console.log(_allKeys);

      for (var index = 0; index < entries.length; index++) {
        var key = entries[index][0];
        var value = entries[index][1];

        if (_keys.indexOf(key) == -1) {
          _keys.push(key);

          var rkey = _addReplacementKeys(Math.ceil((_keysTested == 0 ? 1 : _keysTested) / _replacementsKeys.length));

          console.log(key, rkey, _allKeys.indexOf(rkey), _allKeys);

          while (_allKeys.indexOf(rkey) != -1) {
            console.log("FOUJND", rkey);
            rkey = _addReplacementKeys(Math.ceil((_keysTested == 0 ? 1 : _keysTested) / _replacementsKeys.length));
          }

          var tmp = [key, rkey];

          if (_replacementsKeys.indexOf(key) == -1) {
            _replacedKeys.push(tmp);
          }

          if (_typeof(value) == "object" && !Array.isArray(value)) {
            //we have an object
            _grabKeys(value);
          } else if (Array.isArray(value)) {
            for (var j = 0; j < value.length; j++) {
              _grabKeys(value[j]);
            }
          }

          ;
        }
      }
    };
    /**
     * @private
     * @type {Function}
     * @description Escapes actual regExp char to be used as a match
     * @param {String} str The string to escape
     * @author https://github.com/tcorral/JSONC
     * @returns {String} The escaped string
     */


    var _escapeRegExp = function _escapeRegExp(str) {
      return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
    };
    /**
     * @private
     * @type {Function}
     * @description Add a new key for replacement and make sure that each key will always be unique. Also takes into account the fact that all keys have been used
     * @param {Number} totalToAdd The number of time this key is used as "one" key. Ex: aa,***,QQQQ
     * @returns {String} The replacement key
     */


    var _addReplacementKeys = function _addReplacementKeys() {
      var totalToAdd = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : 1;
      var keys = "";

      for (var i = 0; i < totalToAdd; i++) {
        keys += _replacementsKeys.charAt(_keysTested % _replacementsKeys.length);
      }

      _keysTested++;
      return keys;
    }; //only public api will be exposed


    return api;
  }

  module.exports = GZON();
})(window);

},{}],2:[function(require,module,exports){
"use strict";

window.GZON = require('./GZON.js');

},{"./GZON.js":1}]},{},[2]);
