(function (root, factory) { 
 	 if (typeof define === 'function' && define.amd) { 
	 	 define([], factory); 
	} else { 
	 	root.EventDispatcher = root.EventDispatcher || {}; 
	 	root.EventDispatcher = factory();
	}
}(this, function() {
/**
 * @license almond 0.3.3 Copyright jQuery Foundation and other contributors.
 * Released under MIT license, http://github.com/requirejs/almond/LICENSE
 */
//Going sloppy to avoid 'use strict' string cost, but strict practices should
//be followed.
/*global setTimeout: false */

var requirejs, require, define;
(function (undef) {
    var main, req, makeMap, handlers,
        defined = {},
        waiting = {},
        config = {},
        defining = {},
        hasOwn = Object.prototype.hasOwnProperty,
        aps = [].slice,
        jsSuffixRegExp = /\.js$/;

    function hasProp(obj, prop) {
        return hasOwn.call(obj, prop);
    }

    /**
     * Given a relative module name, like ./something, normalize it to
     * a real name that can be mapped to a path.
     * @param {String} name the relative name
     * @param {String} baseName a real name that the name arg is relative
     * to.
     * @returns {String} normalized name
     */
    function normalize(name, baseName) {
        var nameParts, nameSegment, mapValue, foundMap, lastIndex,
            foundI, foundStarMap, starI, i, j, part, normalizedBaseParts,
            baseParts = baseName && baseName.split("/"),
            map = config.map,
            starMap = (map && map['*']) || {};

        //Adjust any relative paths.
        if (name) {
            name = name.split('/');
            lastIndex = name.length - 1;

            // If wanting node ID compatibility, strip .js from end
            // of IDs. Have to do this here, and not in nameToUrl
            // because node allows either .js or non .js to map
            // to same file.
            if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
            }

            // Starts with a '.' so need the baseName
            if (name[0].charAt(0) === '.' && baseParts) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that 'directory' and not name of the baseName's
                //module. For instance, baseName of 'one/two/three', maps to
                //'one/two/three.js', but we want the directory, 'one/two' for
                //this normalization.
                normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                name = normalizedBaseParts.concat(name);
            }

            //start trimDots
            for (i = 0; i < name.length; i++) {
                part = name[i];
                if (part === '.') {
                    name.splice(i, 1);
                    i -= 1;
                } else if (part === '..') {
                    // If at the start, or previous value is still ..,
                    // keep them so that when converted to a path it may
                    // still work when converted to a path, even though
                    // as an ID it is less than ideal. In larger point
                    // releases, may be better to just kick out an error.
                    if (i === 0 || (i === 1 && name[2] === '..') || name[i - 1] === '..') {
                        continue;
                    } else if (i > 0) {
                        name.splice(i - 1, 2);
                        i -= 2;
                    }
                }
            }
            //end trimDots

            name = name.join('/');
        }

        //Apply map config if available.
        if ((baseParts || starMap) && map) {
            nameParts = name.split('/');

            for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join("/");

                if (baseParts) {
                    //Find the longest baseName segment match in the config.
                    //So, do joins on the biggest to smallest lengths of baseParts.
                    for (j = baseParts.length; j > 0; j -= 1) {
                        mapValue = map[baseParts.slice(0, j).join('/')];

                        //baseName segment has  config, find if it has one for
                        //this name.
                        if (mapValue) {
                            mapValue = mapValue[nameSegment];
                            if (mapValue) {
                                //Match, update name to the new value.
                                foundMap = mapValue;
                                foundI = i;
                                break;
                            }
                        }
                    }
                }

                if (foundMap) {
                    break;
                }

                //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.
                if (!foundStarMap && starMap && starMap[nameSegment]) {
                    foundStarMap = starMap[nameSegment];
                    starI = i;
                }
            }

            if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
            }

            if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
            }
        }

        return name;
    }

    function makeRequire(relName, forceSync) {
        return function () {
            //A version of a require function that passes a moduleName
            //value for items that may need to
            //look up paths relative to the moduleName
            var args = aps.call(arguments, 0);

            //If first arg is not require('string'), and there is only
            //one arg, it is the array form without a callback. Insert
            //a null so that the following concat is correct.
            if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
            }
            return req.apply(undef, args.concat([relName, forceSync]));
        };
    }

    function makeNormalize(relName) {
        return function (name) {
            return normalize(name, relName);
        };
    }

    function makeLoad(depName) {
        return function (value) {
            defined[depName] = value;
        };
    }

    function callDep(name) {
        if (hasProp(waiting, name)) {
            var args = waiting[name];
            delete waiting[name];
            defining[name] = true;
            main.apply(undef, args);
        }

        if (!hasProp(defined, name) && !hasProp(defining, name)) {
            throw new Error('No ' + name);
        }
        return defined[name];
    }

    //Turns a plugin!resource to [plugin, resource]
    //with the plugin being undefined if the name
    //did not have a plugin prefix.
    function splitPrefix(name) {
        var prefix,
            index = name ? name.indexOf('!') : -1;
        if (index > -1) {
            prefix = name.substring(0, index);
            name = name.substring(index + 1, name.length);
        }
        return [prefix, name];
    }

    //Creates a parts array for a relName where first part is plugin ID,
    //second part is resource ID. Assumes relName has already been normalized.
    function makeRelParts(relName) {
        return relName ? splitPrefix(relName) : [];
    }

    /**
     * Makes a name map, normalizing the name, and using a plugin
     * for normalization if necessary. Grabs a ref to plugin
     * too, as an optimization.
     */
    makeMap = function (name, relParts) {
        var plugin,
            parts = splitPrefix(name),
            prefix = parts[0],
            relResourceName = relParts[1];

        name = parts[1];

        if (prefix) {
            prefix = normalize(prefix, relResourceName);
            plugin = callDep(prefix);
        }

        //Normalize according
        if (prefix) {
            if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relResourceName));
            } else {
                name = normalize(name, relResourceName);
            }
        } else {
            name = normalize(name, relResourceName);
            parts = splitPrefix(name);
            prefix = parts[0];
            name = parts[1];
            if (prefix) {
                plugin = callDep(prefix);
            }
        }

        //Using ridiculous property names for space reasons
        return {
            f: prefix ? prefix + '!' + name : name, //fullName
            n: name,
            pr: prefix,
            p: plugin
        };
    };

    function makeConfig(name) {
        return function () {
            return (config && config.config && config.config[name]) || {};
        };
    }

    handlers = {
        require: function (name) {
            return makeRequire(name);
        },
        exports: function (name) {
            var e = defined[name];
            if (typeof e !== 'undefined') {
                return e;
            } else {
                return (defined[name] = {});
            }
        },
        module: function (name) {
            return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name)
            };
        }
    };

    main = function (name, deps, callback, relName) {
        var cjsModule, depName, ret, map, i, relParts,
            args = [],
            callbackType = typeof callback,
            usingExports;

        //Use name if no relName
        relName = relName || name;
        relParts = makeRelParts(relName);

        //Call the callback to define the module, if necessary.
        if (callbackType === 'undefined' || callbackType === 'function') {
            //Pull out the defined dependencies and pass the ordered
            //values to the callback.
            //Default to [require, exports, module] if no deps
            deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;
            for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relParts);
                depName = map.f;

                //Fast path CommonJS standard dependencies.
                if (depName === "require") {
                    args[i] = handlers.require(name);
                } else if (depName === "exports") {
                    //CommonJS module spec 1.1
                    args[i] = handlers.exports(name);
                    usingExports = true;
                } else if (depName === "module") {
                    //CommonJS module spec 1.1
                    cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) ||
                           hasProp(waiting, depName) ||
                           hasProp(defining, depName)) {
                    args[i] = callDep(depName);
                } else if (map.p) {
                    map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                    args[i] = defined[depName];
                } else {
                    throw new Error(name + ' missing ' + depName);
                }
            }

            ret = callback ? callback.apply(defined[name], args) : undefined;

            if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef &&
                        cjsModule.exports !== defined[name]) {
                    defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                    //Use the return value from the function.
                    defined[name] = ret;
                }
            }
        } else if (name) {
            //May just be an object definition for the module. Only
            //worry about defining if have a module name.
            defined[name] = callback;
        }
    };

    requirejs = require = req = function (deps, callback, relName, forceSync, alt) {
        if (typeof deps === "string") {
            if (handlers[deps]) {
                //callback in this case is really relName
                return handlers[deps](callback);
            }
            //Just return the module wanted. In this scenario, the
            //deps arg is the module name, and second arg (if passed)
            //is just the relName.
            //Normalize module name, if it contains . or ..
            return callDep(makeMap(deps, makeRelParts(callback)).f);
        } else if (!deps.splice) {
            //deps is a config object, not an array.
            config = deps;
            if (config.deps) {
                req(config.deps, config.callback);
            }
            if (!callback) {
                return;
            }

            if (callback.splice) {
                //callback is an array, which means it is a dependency list.
                //Adjust args if there are dependencies
                deps = callback;
                callback = relName;
                relName = null;
            } else {
                deps = undef;
            }
        }

        //Support require(['a'])
        callback = callback || function () {};

        //If relName is a function, it is an errback handler,
        //so remove it.
        if (typeof relName === 'function') {
            relName = forceSync;
            forceSync = alt;
        }

        //Simulate async callback;
        if (forceSync) {
            main(undef, deps, callback, relName);
        } else {
            //Using a non-zero value because of concern for what old browsers
            //do, and latest browsers "upgrade" to 4 if lower value is used:
            //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
            //If want a value immediately, use require('id') instead -- something
            //that works in almond on the global level, but not guaranteed and
            //unlikely to work in other AMD implementations.
            setTimeout(function () {
                main(undef, deps, callback, relName);
            }, 4);
        }

        return req;
    };

    /**
     * Just drops the config on the floor, but returns req in case
     * the config return value is used.
     */
    req.config = function (cfg) {
        return req(cfg);
    };

    /**
     * Expose module registry for debugging and tooling
     */
    requirejs._defined = defined;

    define = function (name, deps, callback) {
        if (typeof name !== 'string') {
            throw new Error('See almond README: incorrect module build, no module name');
        }

        //This module may not have dependencies
        if (!deps.splice) {
            //deps is not an array, so probably means
            //an object literal or factory function for
            //the value. Adjust args.
            callback = deps;
            deps = [];
        }

        if (!hasProp(defined, name) && !hasProp(waiting, name)) {
            waiting[name] = [name, deps, callback];
        }
    };

    define.amd = {
        jQuery: true
    };
}());

define("node_modules/almond/almond", function(){});

define('TypeCheck',[], function () {
    return {
        /**
         * Checks if passed element type is string
         * @public
         * @memberof TypeCheck
         * @param {Any} o - element to be checked
         * @returns {Boolean} True, if element type is string, false otherwise
         */
        isString: function (o) {
            return (typeof o === "string") ? true : false;
        },
        /** 
         * Checks if passed element type is boolean
         * @public
         * @memberof TypeCheck
         * @param {Any} o - element to be checked
         * @returns {Boolean} True, if element type is boolean, false otherwise
         */
        isBoolean: function (o) {
            return (typeof o === "boolean") ? true : false;
        },
        /**
         * Checks if passed element type is boolean
         * @public
         * @memberof TypeCheck
         * @param {Any} o - element to be checked
         * @returns {Boolean} True, if element type is boolean, false otherwise
         */
        isNumber: function (o) {
            return (typeof o === "number") ? true : false;
        },
        /**
         * Checks if passed element is an object
         * @public
         * @memberof TypeCheck
         * @param {Any} o - element to be checked
         * @returns {Boolean} True, if element is empty, false otherwise
         */
        isObject: function (o) {
            var isObject = false;
            if (this.isString(o) || this.isFunction(o)) {
                return false;
            }
            if (this.isEmptyObject(o)) {
                return true;
            }
            for (var k in o) {
                if (o.hasOwnProperty(k)) {
                    isObject = true;
                    break;
                }
            }
            return isObject;
        },
        /**
         * Checks if passed element is an empty object
         * @public
         * @memberof TypeCheck
         * @param {Any} o - element to be checked
         * @returns {Boolean} True, if element is empty, false otherwise
         */
        isEmptyObject: function (o) {
            var isEmpty = true;
            if (!this.isDefined(o) || this.isBoolean(o) || this.isFunction(o) ||
                this.isNumber(o) || this.isString(o) || Array.isArray(o)) {
                return false;
            }
            for (var k in o) {
                if (o.hasOwnProperty(k)) {
                    isEmpty = false;
                    break;
                }
            }
            return isEmpty;
        },
        /**
        * Checks if passed element is a function
        * @public
        * @memberof TypeCheck
        * @param {Any} o - element to be checked
        * @returns {Boolean} True, if element is a function, false otherwise
        */
        isFunction: function (o) {
            return (typeof o === "function") ? true : false;
        },
        /**
         * Checks if passed element is defined
         * @public
         * @memberof TypeCheck
         * @param {Any} o - element to be checked
         * @returns {Boolean} True, if element is defined, false otherwise
         */
        isDefined: function (o) {
            return (o !== undefined && o != null);
        },
        /**
         * Checks if all elements in this array have the same type
         * @public
         * @memberof TypeCheck
         * @throws {TypeError} - If options.type is not a string
         * @throws {TypeError} - If options.array is not a string
         * @param {Any[]} array - Array to be checked
         * @param {String} type - Type of elements in this array. Valid values are all which matches 
         *                        to the typeof operator
         * @returns {Boolean} - true if all elements in the array have the same type, false otherwise
         */
        isArrayTypeOf: function (array, type) {
            var isTypeOf = true;
            if (!this.isString(type)) {
                throw new TypeError("options.type is not a string");
            }
            if (!Array.isArray(array)) {
                throw new TypeError("options.array is not an array");
            }
            if (array.length === 0) {
                isTypeOf = false;
            }
            for (var i = 0, length = array.length; i < length; i++) {
                var o = array[i];
                if (typeof o !== type) {
                    isTypeOf = false;
                    break;
                }
            }
            return isTypeOf;
        }
    };
});
define('List',["TypeCheck"], function (TypeCheck) {
    /**
     * Provides a basic list implementation
     * @alias List
     * @constructor
     * @throws {TypeError} - if passed idProperty is not from type string
     * @param {Object} options - Configuration object
     * @param {String} options.idProperty - Name of the property, which will act as identifier
     * @param {Boolean} [options.checkDuplicates=false] - If true, there will be a check processed, if 
     *                                                    added elements is already in the list. Beware, that
     *                                                    this options could drop the performance.
     * @param {Object[]} [options.list=[]] - Array, which should be maintained 
     */
    var List = function (options) {
        if (TypeCheck.isString(options.idProperty)) {
            this._idProperty = options.idProperty;
        } else {
            throw new TypeError("options.idProperty is not from type 'string'");
        }
        if (options.list) {
            if (Array.isArray(options.list) && TypeCheck.isArrayTypeOf(options.list, "object")) {
                this._list = options.list;
            } else {
                throw new TypeError("options.list is not and array or there are something else than objects within.");
            }
        } else {
            this._list = [];
        }
        this._checkDuplicates = options.checkDuplicates ? options.checkDuplicates : false;
    };
    /**   
     * Add an element to the list
     * @public
     * @memberof List
     * @throws {TypeError} - if element is not an object
     * @param {Object} element - element, which shall be added to the list
     * @returns {Boolean} - True, if the element could be added
     */
    List.prototype.addElement = function (element) {
        if (!TypeCheck.isObject(element)) {
            throw new TypeError("element is not a object");
        }
        var isAdded = false, isDuplicate = false, idProperty = this._idProperty;
        if (element.hasOwnProperty(this._idProperty)) {
            if (this._checkDuplicates) {
                this.forEachElement(function (o, i) {
                    if (element[idProperty] === o[idProperty]) {
                        isDuplicate = true;
                        isAdded = false;
                        return false;
                    }
                });
            }
            if (!isDuplicate) {
                this._list.push(element);
                isAdded = true;
            }
        }
        return isAdded;
    };
    /**
     * Provides an element from the list based on its id
     * @public
     * @memberof List
     * @throws {TypeError} - If id is not from type string
     * @param {String} id - Id of the element
     * @returns {Object|null} - The element or null if it is not in
     */
    List.prototype.getElement = function (id) {
        if (!TypeCheck.isString(id)) {
            throw new TypeError("id ist not from type string");
        }
        var list = this._list, length = list.length, idProperty = this._idProperty;
        for (var i = 0; i < length; i++) {
            var element = list[i];
            if (element[idProperty] === id) {
                return element;
            }
        }
        return null;
    };
    /**
     * Updates the element in the collection with the passed one
     * @public
     * @memberof List
     * @throws {TypeError} - If passes element is not an Object
     * @param {Object} newElement - Updated element
     * @returns {Boolean} - True if element is updated, false otherwise
     */
    List.prototype.updateElement = function (newElement) {
        if (!TypeCheck.isObject(newElement)) {
            throw new TypeError("Passed element is not an object");
        }
        if (newElement.hasOwnProperty(this._idProperty)) {
            var list = this._list, length = list.length, idProperty = this._idProperty;
            for (var i = 0; i < length; i++) {
                var element = list[i];
                if (element[idProperty] === newElement[idProperty]) {
                    list[i] = newElement;
                    return true;
                }
            }
        }
        return false;
    };
    /**
     * Deletes an element from the list based on its id
     * @public
     * @memberof List
     * @throws {TypeError} - If id is not from type string
     * @param {String} id - Id of the element
     * @returns {Boolean} - True if the element is deleted, false otherwise
     */
    List.prototype.deleteElement = function (id) {
        if (!TypeCheck.isString(id)) {
            throw new TypeError("id ist not from type string");
        }
        var list = this._list, length = list.length, idProperty = this._idProperty;
        for (var i = 0; i < length; i++) {
            var element = list[i];
            if (element[idProperty] === id) {
                list[i] = {};
                list.splice(i, 1);
                return true;
            }
        }
        return false;
    };
    /**
     * Removes all elements from the list
     * @public
     * @memberof List
     * @returns {Boolean} - True if list is emptied, false otherwise
     */
    List.prototype.deleteAll = function () {
        var list = this._list;
        if (list.length !== 0) {
            this._list = [];
            return true;
        } else {
            return false;
        }
    };
    /** 
     * Passes every element in the list to the provided callback function
     * Beware, that this functionality is performance intensive
     * @public
     * @memberof List
     * @throws {TypeError} - If callback is not a function
     * @param {Function} callback - Get element an his index within the list as arguments
     * @example
     * var list = new List({
     *   idProperty: "id"
     * });
     * list.addElement({ id: "1" });
     * list.forEachElement(function(element,index){
     *      // Work with element and index
     * });
     */
    List.prototype.forEachElement = function (callback) {
        if (!TypeCheck.isFunction(callback)) {
            throw new TypeError("callback is not a function");
        }
        var list = this._list, length = list.length;
        for (var i = 0; i < length; i++) {
            callback(list[i], i);
        }
    };
    return List;
});
define('src/EventDispatcher',["List", "TypeCheck"], function (List, TypeCheck) {
    var events = new List({ idProperty: "name" });
    /**
     * Provides functionality for an event system 
     * @alias EventDispatcher 
     */
    return {
        /**
         * Subscribe to an Event
         * @throws {TypeError} If name or callback within the event have wrong type
         * @param {Event} event - Pass event object
         * @returns {Boolean} - True if Event is subscribed, false otherwise
         */
        subscribeEvent: function (event) {
            var isSubscribed = false;
            if (TypeCheck.isDefined(event) && TypeCheck.isString(event.name) && TypeCheck.isFunction(event.callback)) {

            } else {
                throw new TypeError("name or callback within the event have wrong type");
            }
            return isSubscribed;
        },
        /**
         * Publish to all event subscribers
         */
        publishEvent: function () {

        },
        /**
         * Checks, if Event is registered already
         */
        isRegistered: function () {

        }
    };
});

/* EventDispatcher.subscribeEvent(new Event()); */

;

 	 return require('src/EventDispatcher'); 
}));
