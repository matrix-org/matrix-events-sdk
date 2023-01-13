# matrix-events-sdk

JS/TS SDK for handling (extensible) events in Matrix

## 🚨🚨 Project is a work in progress

The architecture and approach of this repo is still being considered and is subject to breaking
changes. Use at your own risk.

As a general guide, functionality which is foundational to events (such as text, images, etc)
should be incorporated in this repo before the more complex types. This is to ensure that the
architecture is up to the task of handling proper extensible events.

## Usage: Parsing events

```typescript
const parser = new EventParser();
const parsed = parser.parse({
    type: "org.matrix.msc1767.message",
    content: {
        "org.matrix.msc1767.markup": [
            { "body": "this is my message text" },
        ],
    },
    // and other required fields
});

if (parsed instanceof MessageEvent) {
    console.log(parsed.text);
}
```

It is recommended to cache your `EventParser` instance for performance reasons, and for ease of use
when adding custom events.

Registering your own events is easy, and we recommend creating your own block objects for handling the
contents of events:

```typescript
// There are a number of built-in block types for simple primitives
// BooleanBlock, IntegerBlock, StringBlock

// For object-based blocks, the following can be used:
type MyObjectBlockWireType = {
    my_property: string; // or whatever your block's properties are on the wire
};

class MyObjectBlock extends ObjectBlock<MyObjectBlockWireType> {
    public static readonly schema: Schema = {
        // This is a JSON Schema
        type: "object",
        properties: {
            my_property: {
                type: "string",
                nullable: false,
            },
        },
        required: ["my_property"],
        errorMessage: {
            properties: {
                my_property: "my_property should be a non-null string and is required",
            },
        },
    };

    public static readonly validateFn = AjvContainer.ajv.compile(MyObjectBlock.schema);

    public static readonly type = new UnstableValue(null, "org.example.my_custom_block");

    public constructor(raw: MyObjectBlockWireType) {
        super(MyObjectBlock.type.name, raw);
        if (!MyObjectBlock.validateFn(raw)) {
            throw new InvalidBlockError(this.name, MyObjectBlock.validateFn.errors);
        }
    }
}

// For array-based blocks, we define the contents (items) slightly differently:
type MyArrayItemWireType = {
    my_property: string; // or whatever
}; // your item type can also be a primitive, like integers, booleans, and strings.

class MyArrayBlock extends ArrayBlock<MyArrayItemWireType> {
    public static readonly schema = ArrayBlock.schema;
    public static readonly validateFn = ArrayBlock.validateFn;

    public static readonly itemSchema: Schema = {
        // This is a JSON Schema
        type: "object",
        properties: {
            my_property: {
                type: "string",
                nullable: false,
            },
        },
        required: ["my_property"],
        errorMessage: {
            properties: {
                my_property: "my_property should be a non-null string and is required",
            },
        },
    };
    public static readonly itemValidateFn = AjvContainer.ajv.compile(MyArrayBlock.itemSchema);

    public static readonly type = new UnstableValue(null, "org.example.my_custom_block");

    public constructor(raw: MyArrayItemWireType[]) {
        super(MyArrayBlock.type.name, raw);
        this.raw = raw.filter(x => {
            const bool = MyArrayBlock.itemValidateFn(x);
            if (!bool) {
                // Do something with the error. It might be valid to throw, as we do here, or
                // use `.filter()`'s ability to exclude items from the final array.
                throw new InvalidBlockError(this.name, MyArrayBlock.itemValidateFn.errors);
            }
            return bool;
        });
    }
}
```

Then, we can define a custom event:

```typescript
type MyWireContent = EitherAnd<
    { [MyObjectBlock.type.name]: MyObjectBlockWireType },
    { [MyObjectBlock.type.altName]: MyObjectBlockWireType }
>;

class MyCustomEvent extends RoomEvent<MyWireContent> {
    public static readonly contentSchema: Schema = AjvContainer.eitherAnd(MyObjectBlock.type, MyObjectBlock.schema);
    public static readonly contentValidateFn = AjvContainer.ajv.compile(MyCustomEvent.contentSchema);

    public static readonly type = new UnstableValue(null, "org.example.my_custom_event");
    
    public constructor(raw: WireEvent.RoomEvent<MyWireContent>) {
        super(MyCustomEvent.type.name, raw, false); // see docs
        if (!MyCustomEvent.contentValidateFn(this.content)) {
            throw new InvalidEventError(this.name, MyCustomEvent.contentValidateFn.errors);
        }
    }
}
```

and finally we can register it in a parser instance:

```typescript
const parser = new EventParser();
parser.addKnownType(MyCustomEvent.type, x => new MyCustomEvent(x));
```

If you'd also like to register an "unknown event type" handler, that can be done like so:

```typescript
const myParser: UnknownEventParser<MyWireContent> = x => {
    const possibleBlock = MyObjectBlock.type.findIn(x.content);
    if (!!possibleBlock) {
        const block = new MyObjectBlock(possibleBlock as MyObjectBlockWireType);
        return new MyCustomEvent({
            ...x,
            type: MyCustomEvent.type.name, // required - override the event type
            content: {
                [MyObjectBlock.name]: block.raw,
            }, // technically optional, but good practice: clean up the event's content for handling.
        });
    }
    return undefined; // else, we don't care about it
};
parser.setUnknownParsers([myParser, ...parser.defaultUnknownEventParsers]);
```

Putting your parser at the start of the array will ensure it gets called first. Including the default parsers
is also optional, though recommended.

## Usage: Making events

<!-- ------------------------- -->
***TODO: This needs refactoring***
<!-- ------------------------- -->

Most event objects have a `from` static function which takes common details of an event
and returns an instance of that event for later serialization.

```typescript
const userInput = "**hello**";
const htmlInput = "<b>hello</b>"; // might be after running through a markdown processor

const message = MessageEvent.from(userInput, htmlInput).serialize();

// Finally, assuming your client instance is called `client`:
client.sendEvent(message.type, message.content);
```
