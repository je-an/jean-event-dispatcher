// jscs:disable
// jshint ignore:start
define([
    "EventDispatcher",
    "TestModule"
], function (EventDispatcher, TestModule) {
    describe('EventDispatcher.spec.js', function () {
        beforeEach(function () {
            EventDispatcher._callbacks._list = [];
        });
        describe("EventDispatcher Constructor", function () {
            it("All necessary members are available", function () {
                var numberOfMembers = 5;
                expect(Object.keys(EventDispatcher).length).toEqual(numberOfMembers);
                expect(EventDispatcher._callbacks).not.toBeUndefined();
                expect(EventDispatcher.subscribeEvent).not.toBeUndefined();
                expect(EventDispatcher.unsubscribeEvent).not.toBeUndefined();
                expect(EventDispatcher.publishEvent).not.toBeUndefined();
            });
            it("All necessary methods are available", function () {
                var numberOfMethods = 0;
                var methodCount = Object.keys(Object.getPrototypeOf(EventDispatcher)).length;
                expect(methodCount).toEqual(numberOfMethods);
            });
        });
        describe('EventDispatcher.subscribeEvent', function () {
            it("Registers a function for a given event", function () {
                expect(EventDispatcher.subscribeEvent("newEvent", function () { })).toBe(true);
            });
            it("Registers a function for a already defined event", function () {
                expect(EventDispatcher.subscribeEvent("newEvent", function () { })).toBe(true);
                expect(EventDispatcher.subscribeEvent("newEvent", function () { })).toBe(true);
                expect(EventDispatcher._callbacks._list.length).toEqual(1);
            });
            it("Registers multiple different events", function () {
                EventDispatcher.subscribeEvent("event1", function () { });
                EventDispatcher.subscribeEvent("event2", function () { });
                EventDispatcher.subscribeEvent("event1", function () { });
                EventDispatcher.subscribeEvent("event4", function () { });
                EventDispatcher.subscribeEvent("event2", function () { });
                EventDispatcher.subscribeEvent("event4", function () { });
                EventDispatcher.subscribeEvent("event5", function () { });
                EventDispatcher.subscribeEvent("event2", function () { });
                EventDispatcher.subscribeEvent("event3", function () { });
                expect(EventDispatcher._callbacks._list.length).toEqual(5);
                expect(EventDispatcher._callbacks.getElement("event1")._callbacks.length).toEqual(2);
                expect(EventDispatcher._callbacks.getElement("event2")._callbacks.length).toEqual(3);
                expect(EventDispatcher._callbacks.getElement("event3")._callbacks.length).toEqual(1);
                expect(EventDispatcher._callbacks.getElement("event4")._callbacks.length).toEqual(2);
                expect(EventDispatcher._callbacks.getElement("event5")._callbacks.length).toEqual(1);
            });
            it("Throws exception, if not a string is passed as an event", function () {
                try {
                    EventDispatcher.subscribeEvent(1, function () { });
                } catch (e) {
                    expect(e instanceof TypeError).toBe(true);
                }
                try {
                    EventDispatcher.subscribeEvent({}, function () { });
                } catch (e) {
                    expect(e instanceof TypeError).toBe(true);
                }
                try {
                    EventDispatcher.subscribeEvent(true, function () { });
                } catch (e) {
                    expect(e instanceof TypeError).toBe(true);
                }
                try {
                    EventDispatcher.subscribeEvent(function () { }, function () { });
                } catch (e) {
                    expect(e instanceof TypeError).toBe(true);
                }
            });
            it("Throws exception, if something else shall be registered as callback", function () {
                try {
                    EventDispatcher.subscribeEvent("event", true);
                } catch (e) {
                    expect(e instanceof TypeError).toBe(true);
                }
                try {
                    EventDispatcher.subscribeEvent("event", {});
                } catch (e) {
                    expect(e instanceof TypeError).toBe(true);
                }
                try {
                    EventDispatcher.subscribeEvent("event", "function(){}");
                } catch (e) {
                    expect(e instanceof TypeError).toBe(true);
                }
                try {
                    EventDispatcher.subscribeEvent("event", 1);
                } catch (e) {
                    expect(e instanceof TypeError).toBe(true);
                }
            });
        });
        describe('EventDispatcher.unsubscribeEvent', function () {
            it("Unsubscribes an event", function () {
                var fn = function () { };
                EventDispatcher.subscribeEvent("event1", fn);
                expect(EventDispatcher.unsubscribeEvent("event1", fn)).toBe(true);
                expect(EventDispatcher._callbacks._list.length).toEqual(1);
            });
            it("Does nothing, if a function, which is registered for event1, shall be removed for event2", function () {
                var fn = function () { };
                EventDispatcher.subscribeEvent("event1", fn);
                expect(EventDispatcher.unsubscribeEvent("event2", fn)).toBe(false);
            });
            it("Unsubscribes an event, after the event is fired", function () {
                var param = { name: "ok" };
                var fn = function (params) {
                    expect(params.name).toEqual(param.name);
                };
                EventDispatcher.subscribeEvent("event1", fn);
                EventDispatcher.publishEvent("event1", param);
                expect(EventDispatcher.unsubscribeEvent("event1", fn)).toBe(true);
            });
        });
        describe("EventDispatcher.publishEvent", function () {
            it("Publishs values to subscribed function", function (done) {
                EventDispatcher.subscribeEvent("event1", function (param) {
                    expect(param).toBe(true);
                    done();
                });
                expect(EventDispatcher.publishEvent("event1", true)).toBe(true);
            });
            it("Publishs values to multiple subscribed functions", function (done) {
                var counter = 0;
                EventDispatcher.subscribeEvent("event1", function (param) {
                    expect(param).toBe(true);
                    counter++;
                });
                EventDispatcher.subscribeEvent("event1", function (param) {
                    expect(param).toBe(true);
                    counter++;
                });
                EventDispatcher.subscribeEvent("event1", function (param) {
                    expect(param).toBe(true);
                    expect(counter).toEqual(2);
                    done();
                });
                expect(EventDispatcher.publishEvent("event1", true)).toBe(true);
            });
            it("Publishs undefined values", function (done) {
                EventDispatcher.subscribeEvent("event1", function (param) {
                    expect(param).toBeUndefined();
                    done();
                });
                expect(EventDispatcher.publishEvent("event1", undefined)).toBe(true);
            });
            it("Publishs null values", function (done) {
                EventDispatcher.subscribeEvent("event1", function (param) {
                    expect(param).toBeNull();
                    done();
                });
                expect(EventDispatcher.publishEvent("event1", null)).toBe(true);
            });
            it("Publishs to a module which is located in another file", function () {
                var param = "arrived";
                TestModule.registerEvent();
                EventDispatcher.publishEvent("event1", param);
                expect(TestModule.getResult()).toEqual(param);
            });
            it("Doesnt publish, if there are no subscribers for the event", function () {
                expect(EventDispatcher.publishEvent("event1", true)).toBe(false);
            });
            it("Doesnt publish, if there is a subscriber for event1, but event2 is fired", function () {
                EventDispatcher.subscribeEvent("event1", function (param) { });
                expect(EventDispatcher.publishEvent("event2", true)).toBe(false);
            });
        });
    });
});

