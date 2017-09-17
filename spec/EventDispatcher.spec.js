// jscs:disable
// jshint ignore:start
define([
    "EventDispatcher",
    "List",
    "TestModule"
], function (EventDispatcher, List, TestModule) {
    describe('EventDispatcher.spec.js', function () {
        beforeEach(function () {
            EventDispatcher._callbacks = new List({ idProperty: "id" });
        });
        describe("EventDispatcher", function () {
            it("TODO: Check if all members are available | EXPECTATION: EventDispatcher has all necessary members", function () {
                var numberOfMembers = 4;
                expect(Object.keys(EventDispatcher).length).toEqual(numberOfMembers);
            });
            it("TODO: Check if all methods are available | EXPECTATION: EventDispatcher has all necessary methods", function () {
                var numberOfMethods = 0;
                var methodCount = Object.keys(Object.getPrototypeOf(EventDispatcher)).length;
                expect(methodCount).toEqual(numberOfMethods);
            });
        });
        describe('EventDispatcher.subscribeEvent', function () {
            it("TODO: Register function for an event | EXPECTATION: Function registered successfully for event", function () {
                expect(EventDispatcher.subscribeEvent("newEvent", function () { })).toBe(true);
            });
            it("TODO: Register function, pass something else as event | EXPECTATION: Throws type error", function () {
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
            it("TODO: Pass event, try to register something else | EXPECTATION: Function registered successfully for event", function () {
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
            it("TODO: Register function for an event that is already defined | EXPECTATION: Function registered successfully for the same event", function () {
                expect(EventDispatcher.subscribeEvent("newEvent", function () { })).toBe(true);
                expect(EventDispatcher.subscribeEvent("newEvent", function () { })).toBe(true);
                expect(EventDispatcher._callbacks._list.length).toEqual(1);
            });
            it("TODO: Register multiple events | EXPECTATION: Functions registered successfully for the events", function () {
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
        });
        describe('EventDispatcher.unsubscribeEvent', function () {
            it("TODO: Unsubscribe an event | EXPECTATION: Unsubscription is successful", function () {
                var fn = function () { };
                EventDispatcher.subscribeEvent("event1", fn);
                expect(EventDispatcher.unsubscribeEvent("event1", fn)).toBe(true);
                expect(EventDispatcher._callbacks._list.length).toEqual(1);
            });
            it("TODO: Unsubscribe an event which nothing is registered to | EXPECTATION: Nothing happens", function () {
                var fn = function () { };
                EventDispatcher.subscribeEvent("event1", fn);
                expect(EventDispatcher.unsubscribeEvent("event2", fn)).toBe(false);
            });
            it("TODO: Unsubscribe an event after event is fired | EXPECTATION: After event is fired and arrived successfully, the event is unsubscribed", function () {
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
            it("TODO: Publish parameters for a given event | EXPECTATION: Subscribed function get notified, when the event is fired", function (done) {
                EventDispatcher.subscribeEvent("event1", function (param) {
                    expect(param).toBe(true);
                    done();
                });
                expect(EventDispatcher.publishEvent("event1", true)).toBe(true);
            });
            it("TODO: Publish parameters for a given event to multiple subscribers| EXPECTATION: Subscribed functions get notified, when the event is fired", function (done) {
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
            it("TODO: Publish parameters for non existing event | EXPECTATION: Nothing get notified", function () {
                expect(EventDispatcher.publishEvent("event1", true)).toBe(false);
            });
            it("TODO: Register event and publish to non existing event | EXPECTATION: Nothing get notified", function () {
                EventDispatcher.subscribeEvent("event1", function (param) { });
                expect(EventDispatcher.publishEvent("event2", true)).toBe(false);
            });
            it("TODO: Publish undefined | EXPECTATION: undefined get published", function (done) {
                EventDispatcher.subscribeEvent("event1", function (param) {
                    expect(param).toBeUndefined();
                    done();
                });
                expect(EventDispatcher.publishEvent("event1", undefined)).toBe(true);
            });
            it("TODO: Publish null | EXPECTATION: null get published", function (done) {
                EventDispatcher.subscribeEvent("event1", function (param) {
                    expect(param).toBeNull();
                    done();
                });
                expect(EventDispatcher.publishEvent("event1", null)).toBe(true);
            });
            it("TODO: Subscribe in a module and publish in another one | EXPECTATION: Subscriber get notified", function(){
                var param = "arrived";
                TestModule.registerEvent();
                EventDispatcher.publishEvent("event1", param);
                expect(TestModule.getResult()).toEqual(param);
            });
        });
    });
});

