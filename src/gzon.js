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

import pako from 'pako';

(function () {
    'use strict';

    /**
     * @namespace
     * @alias GZON
     * @description A simple JavaScript lib to compress, decompress and optimize json data exchange with GZIP and Base64. Inspired by https://github.com/tcorral/JSONC
     * @author JimZeeKing
     * @version 1.0.0
     */
    function GZON() {

        //public api
        let api = {};

        /**
         * @alias GZON.compress
         * @type {function}
         * @description Compress data with GZIP to a final Base64 string
         * @param {(Object|string)} obj Input data to compress
         * @param {boolean} [safe = false] Should GZON protect existing keys from beign replaced if they can collide with replacement ones? Use this if you have keys to protect from replacement.
         * @returns {string} The final Base64 string of the JSON data
         */
        api.compress = (obj, safe = false) => {
            _allKeys = [];
            _keys = [];
            _replacedKeys = [];
            _keysTested = 0;

            if (typeof obj === "string") {
                obj = JSON.parse(obj);
            }

            if (safe) {
                _protectKeys(obj);
            }

            _grabKeys(obj);

            obj.GZONKeys = _replacedKeys;
            let objStr = JSON.stringify(obj);
            delete obj.GZONKeys;

            for (let index = 0; index < _replacedKeys.length; index++) {
                let key = _replacedKeys[index][0];
                let newKey = _replacedKeys[index][1];
                objStr = objStr.replace(new RegExp('(?:"' + _escapeRegExp(key) + '"):', 'g'), '"' + newKey + '":');
            }

            return window.btoa(String.fromCharCode.apply(String, pako.gzip(objStr, {
                level: 9
            })));
        }

        /**
         * @alias GZON.decompress
         * @type {function}
         * @description Decompress gzipped data
         * @param {string} b64gzippedJSON The Base64 string of the gzipped JSON data
         * @param {boolean} [returnJSONString = false] Should the returned value be a JSON string or a fully parsed object
         * @returns {(Object|string)} The original input use at compression time
         */
        api.decompress = (b64gzippedJSON, returnJSONString = false) => {
            let gzippedJSON = window.atob(b64gzippedJSON);

            let json = String.fromCharCode.apply(String, pako.ungzip(gzippedJSON, {
                level: 9
            }));

            let obj = JSON.parse(json);
            let objKeys = obj.GZONKeys;
            delete obj.GZONKeys;

            let objStr = JSON.stringify(obj);
            for (let index = 0; index < objKeys.length; index++) {
                let oldKey = objKeys[index][0];

                let key = objKeys[index][1];
                objStr = objStr.replace(new RegExp('(?:"' + _escapeRegExp(key) + '"):', 'g'), '"' + oldKey + '":');
            }

            return returnJSONString ? objStr : JSON.parse(objStr);
        }

        //private

        /**
         * @private
         * @type {Array}
         */
        let _keys = [];

        /**
         * @private
         * @type {Array}
         */
        let _values = [];

        /**
         * @private
         * @type {Array}
         */
        let _alreadyUsedKeys = [];

        /**
         * @private
         * @type {String}
         */
        const _replacementsKeys = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789_-!@#$%?&*()+';

        /**
         * @private
         * @type {Array}
         */
        let _replacedKeys = [];
        /**
         * @private
         * @type {Array}
         */
        let _allKeys = [];
        /**
         * @private
         * @type {Number}
         */
        let _keysTested = 0;


        /**
         * @private
         * @type {Function}
         * @description Grab and store all keys to be replaced in the input object, allowing next step to protect keys from replacement if they collides with replacement ones. This call will be recursive if needed too.
         * @param {Object} object The input object to compress
         * @returns {undefined} 
         */
        let _protectKeys = (object) => {
            let entries = Object.entries(object);
            _allKeys = _allKeys.concat(Object.keys(object));
            _allKeys = _distinct(_allKeys);
            for (let index = 0; index < entries.length; index++) {
                let key = entries[index][0];
                let value = entries[index][1];
                if (_keys.indexOf(key) == -1) {
                    _keys.push(key);
                    if (typeof value == "object" && !Array.isArray(value)) {
                        //we have an object
                        _protectKeys(value);
                    } else if (Array.isArray(value)) {
                        for (let j = 0; j < value.length; j++) {
                            _protectKeys(value[j]);
                        }
                    };
                }
            }
            //reset keys for next step
            _keys = [];
        }

        /**
         * @private
         * @type {Function}
         * @description Makes sure there is only unique values in the array
         * @param {Array} array The input array to check
         * @returns {Array} The array freed of duplicate values
         */
        let _distinct = (array) => {
            let ua = array.filter(function (elem, index, self) {
                return index == self.indexOf(elem);
            });
            return ua
        }

        /**
         * @private
         * @type {Function}
         * @description Grab and store all keys to be replaced in the input object. This also choose wich replacement key to use. This call will be recursive if needed too.
         * @param {Object} object The input object to compress
         * @returns {undefined} 
         */
        let _grabKeys = (object) => {
            let entries = Object.entries(object);
            //console.log(_allKeys);
            for (let index = 0; index < entries.length; index++) {
                let key = entries[index][0];
                let value = entries[index][1];
                if (_keys.indexOf(key) == -1) {
                    _keys.push(key);
                    let rkey = _addReplacementKeys(Math.ceil(((_keysTested == 0) ? 1 : _keysTested) / _replacementsKeys.length));
                    while (_allKeys.indexOf(rkey) != -1) {
                        rkey = _addReplacementKeys(Math.ceil(((_keysTested == 0) ? 1 : _keysTested) / _replacementsKeys.length));
                    }
                    let tmp = [key, rkey];
                    if (_replacementsKeys.indexOf(key) == -1) {
                        _replacedKeys.push(tmp);
                    }

                    if (typeof value == "object" && !Array.isArray(value)) {
                        //we have an object
                        _grabKeys(value);
                    } else if (Array.isArray(value)) {
                        for (let j = 0; j < value.length; j++) {
                            _grabKeys(value[j]);
                        }
                    };
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
        let _escapeRegExp = (str) => {
            return str.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
        }

        /**
         * @private
         * @type {Function}
         * @description Add a new key for replacement and make sure that each key will always be unique. Also takes into account the fact that all keys have been used
         * @param {Number} totalToAdd The number of time this key is used as "one" key. Ex: aa,***,QQQQ
         * @returns {String} The replacement key
         */
        let _addReplacementKeys = (totalToAdd = 1) => {
            let keys = "";
            for (let i = 0; i < totalToAdd; i++) {
                keys += _replacementsKeys.charAt(_keysTested % _replacementsKeys.length);
            }
            _keysTested++;
            return keys;
        }

        //only public api will be exposed
        return api;


    }
    module.exports = GZON();
})(window);