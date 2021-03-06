define(["List", "TypeCheck", "Callback"], function (List, TypeCheck, Callback) {
    /**
     * Provides functionality for an event system 
     * @alias EventDispatcher
     */
    return {
        _callbacks: new List({ idProperty: "id" }),
        /**
         * Subscribes to an event
         * @throws {TypeError} If name or fn have wrong type
         * @param {String} name - Name of the event
         * @param {Function} fn - Function which will be notified, if the event fires
         * @returns {Boolean} - True if subscription is successful, false otherwise
         */
        subscribeEvent: function (name, fn) {
            var isSubscribed = false, isAdded = true, newCb;
            if (this._checkParams(name, fn)) {
                var callback = this._callbacks.getElement(name);
                if (TypeCheck.isDefined(callback)) {
                    isSubscribed = callback.registerFunction(fn);
                } else {
                    newCb = new Callback({ id: name });
                    isSubscribed = newCb.registerFunction(fn);
                    isAdded = this._callbacks.addElement(newCb);
                }
            }
            return (isSubscribed && isAdded);
        },
        /**
         * Unsubscribes from an event
         * @throws {TypeError} If name or fn have wrong type
         * @param {String} name - Name of the event
         * @param {Function} fn - Function which will be unsubsribed
         * @returns {Boolean} - True if unsubscription is successful, false otherwise
         */
        unsubscribeEvent: function (name, fn) {
            var isUnsubscribed = false;
            if (this._checkParams(name, fn)) {
                var callback = this._callbacks.getElement(name);
                if (TypeCheck.isDefined(callback)) {
                    isUnsubscribed = callback.unregisterFunction(fn);
                }
            }
            return isUnsubscribed;
        },
        /**
         * Publish to all event subscribers
         * @throws {TypeError} If name is not a string
         * @param {String} name - Name of the event which will be published
         * @param {Any} params - Params to be published to all subscribers
         * @returns {Boolean} - True if event is published, false otherwise
         */
        publishEvent: function (name, params) {
            var isPublished = false, callback = this._callbacks.getElement(name);
            if (TypeCheck.isDefined(callback)) {
                isPublished = callback.broadcastToFunctions(params);
            }
            return isPublished;
        },
        /**
         * @private
         * @param {String} name - name of the event
         * @param {Function} fn - function which will be subscribed/unsubscribed
         * @returns {Boolean} True if params are valid, otherwise throw type error
         */
        _checkParams: function (name, fn) {
            if (!TypeCheck.isString(name) || !TypeCheck.isFunction(fn)) {
                throw new TypeError("name or fn have wrong type");
            }
            return true;
        }
    };
});

