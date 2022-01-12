# matrix-events-sdk
JS/TS SDK for handling (extensible) events in Matrix

**This project is a work in progress and subject to breaking changes.**

## Usage: Parsing events

```typescript
const parsed = ExtensibleEvents.parse({
    type: "m.room.message",
    content: {
        "msgtype": "m.text",
        "body": "Hello world!"
    },
    // and other fields
});
if (parsed) {
    console.log(typeof parsed);
}
```

If you would like to register your own handling of events, use the following:

```typescript
type MyContent = M_MESSAGE_EVENT_CONTENT & {
    field: string;
};

class MyEvent extends MessageEvent {
    public readonly field: string;
    
    constructor(wireFormat: IPartialEvent<MyContent>) {
        // Parse the text bit of the event
        super(wireFormat);
        
        this.field = wireFormat.content?.field;
    }
}

function parseMyEvent(wireEvent: IPartialEvent<MyContent>): Optional<MyEvent> {
    // If you need to convert a legacy format, this is where you'd do it. Your
    // event class should be able to be instatiated outside of this parse function.
    return new MyEvent(wireEvent);
}

ExtensibleEvents.registerInterpreter("org.example.my_event_type", parseMyEvent);
ExtensibleEvents.unknownInterpretOrder.push("org.example.my_event_type");
```

## Usage: Making events

Most event objects have a `from` static function which takes common details of an event
and returns an instance of that event for later serialization.

```typescript
const userInput = "**hello**";
const htmlInput = "<b>hello</b>"; // might be after running through a markdown processor

const message = MessageEvent.from(userInput, htmlInput).serialize();

// Finally, assuming your client instance is called `client`:
client.sendEvent(message.type, message.content);
```
