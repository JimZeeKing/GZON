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
     * @version 0.9.1
     * @todo Allow user to specify single key not to be touched or used during compression
     */
    function GZON() {

        //public api
        let api = {};

        /**
         * @alias GZON.compress
         * @type {Function}
         * @description Stringify to JSON and compress an object to a final Base64 string
         * @param {Object} obj Object to compress
         * @returns {String} The final Base64 string of the JSON data
         */
        api.compress = (obj) => {
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
         * @type {Function}
         * @description Recreates an object from a previously compressed one
         * @param {String} b64gzippedJSON The Base64 string of the compressed JSON data
         * @returns {Object} The original object use at compression time
         */
        api.decompress = (b64gzippedJSON) => {
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
            return JSON.parse(objStr);
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
        let _objs = [];

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
         * @type {Function}
         * @description Grab and store all keys to be replaced in the input object. This call will be recusrsive if needed too.
         * @param {Object} object The input object to compress
         * @returns {undefined} 
         */
        let _grabKeys = (object) => {
            let entries = Object.entries(object);
            for (let index = 0; index < entries.length; index++) {
                let key = entries[index][0];
                let value = entries[index][1];
                if (_keys.indexOf(key) == -1) {
                    _keys.push(key);
                    let tmp = [key, _addReplacementKeys(Math.ceil(_keys.length / _replacementsKeys.length))];
                    _replacedKeys.push(tmp);
                    if (typeof value == "object" && !Array.isArray(value)) {
                        //we have an object
                        _grabKeys(value);
                    } else if (Array.isArray(entries[index][1])) {
                        for (let j = 0; j < entries[index][1].length; j++) {
                            _grabKeys(entries[index][1][j]);
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
            let _keys = "";
            for (let i = 0; i < totalToAdd; i++) {
                _keys += _replacementsKeys.charAt(_replacedKeys.length % _replacementsKeys.length);
            }
            return _keys;
        }

        //only public api will be exposed
        return api;

    }
    module.exports = GZON();
})(window);