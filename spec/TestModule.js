define("TestModule", ["EventDispatcher"], function (EventDispatcher) {
    var result;
    return {
        getResult: function () {
            return result;
        },
        registerEvent: function () {
            EventDispatcher.subscribeEvent("event1", function (param) {
                result = param;
            });
        }
    };
});