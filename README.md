## Description

Provides functionality for an event-based communication system for use as an AMD module

## Code Example

```js
require(["path/to/EventDispatcher"], function(EventDispatcher){
    // Register functions for "event1"
    EventDispatcher.subscribeEvent("event1", function (param) {
        // Work with param
    });
    EventDispatcher.subscribeEvent("event1", function (param) {
        // Work with param
    });
    //Publish parameters for "event1"
    EventDispatcher.publishEvent("event1", { id: "123" });
});
```

## Installation

`npm install jean-event-dispatcher --save --legacy-bundling`

## API Reference

### EventDispatcher.subscribeEvent(name, fn) 

Subscribes to an event

**Parameters**
- **name**: `String` - Name of the event
- **fn**: `function` - Function which will be notified, if the event fires

**Returns**
- `Boolean` - True if subscription is successful, false otherwise

### EventDispatcher.unsubscribeEvent(name, fn) 

Unsubscribes from an event

**Parameters**
- **name**: `String` - Name of the event
- **fn**: `function` - Function which will be unsubscribed

**Returns**
- `Boolean` - True if unsubscription is successful, false otherwise


### EventDispatcher.publishEvent(name, params) 

Publish to all event subscribers

**Parameters**
- **name**: `String` - Name of the event which will be published
- **params**: `Any` - Params to be published to all subscribers

**Returns**
- `Boolean` - True if parameters are published, false otherwise

## Tests

- Open spec/spec-runner.html in browser to see the test cases.

## License

MIT