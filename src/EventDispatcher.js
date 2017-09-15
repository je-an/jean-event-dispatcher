define(["List", "TypeCheck", "Callback"], function (List, TypeCheck, Callback) {
    /**
     * Provides functionality for an event system 
     * @alias EventDispatcher 
     */
    return {
        _callbacks: new List({ idProperty: "name" }),
        /**
         * Subscribes to an event
         * @throws {TypeError} If name or fn have wrong type
         * @param {String} name - Name of the event
         * @param {Function} fn - Function which will be notified, if the event fires
         * @returns {Boolean} - True if subscription is successful, false otherwise
         */
        subscribeEvent: function (name, fn) {
            var isSubscribed = false, isAdded = true, newCb;
            if (TypeCheck.isString(name) && TypeCheck.isFunction(fn)) {
                var element = this._callbacks.getElement(name);
                if (TypeCheck.isDefined(element)) {
                    isSubscribed = element.callback.registerFunction(fn);
                } else {
                    newCb = new Callback();
                    isSubscribed = newCb.registerFunction(fn);
                    isAdded = this._callbacks.addElement({ name: name, callback: newCb });
                }
            } else {
                throw new TypeError("name or fn have wrong type");
            }
            return (isSubscribed && isAdded);
        },
        /**
         * Publish to all event subscribers
         * @throws {TypeError} If name is not a string
         * @param {String} name - Name of the event which will be published
         * @param {Any} params - Params to be published to all subscribers
         * @returns {Boolean} - True if event is published, false otherwise
         */
        publishEvent: function (name, params) {
            var isPublished = false, element = this._callbacks.getElement(name);
            if(TypeCheck.isDefined(element)){
                isPublished = element.callback.broadcastToFunctions(params);
            } 
            return isPublished;
        }
    };
});

