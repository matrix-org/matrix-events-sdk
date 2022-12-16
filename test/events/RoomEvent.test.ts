/*
Copyright 2022 The Matrix.org Foundation C.I.C.

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
*/

import {InvalidEventError, RoomEvent, WireEvent} from "../../src";

class TestEvent extends RoomEvent<any> {
    public constructor(raw: any) {
        super("TestEvent", raw); // lie to TS
    }
}

describe("RoomEvent", () => {
    testSharedRoomEventInputs("TestEvent", x => new TestEvent(x), {hello: "world"});
});

/**
 * Runs all the validation tests which can be shared across all event type classes.
 * @param eventName The event name, for error matching.
 * @param factory The factory to create a RoomEvent.
 * @param safeContentInput The content to supply on an event during a non-throwing
 * test. This should be the minimum to construct the event, not ideal conditions.
 */
export function testSharedRoomEventInputs<W extends object = any, I extends WireEvent.BlockBasedContent = any>(
    eventName: string,
    factory: (raw: WireEvent.RoomEvent<W>) => RoomEvent<I>,
    safeContentInput: W,
) {
    describe("internal", () => {
        it("should have valid inputs", () => {
            expect(eventName).toBeDefined();
            expect(typeof eventName).toStrictEqual("string");
            expect(eventName.length).toBeGreaterThan(0);

            expect(factory).toBeDefined();
            expect(typeof factory).toStrictEqual("function");

            expect(safeContentInput).toBeDefined();
            expect(typeof safeContentInput).toStrictEqual("object");
        });

        it("should have a passing factory", () => {
            const ev = factory({
                room_id: "!test:example.org",
                event_id: "$event",
                type: "org.example.test_event",
                sender: "@user:example.org",
                content: safeContentInput,
                origin_server_ts: 1670894499800,
            });
            expect(ev).toBeDefined();
            // noinspection SuspiciousTypeOfGuard
            expect(ev instanceof RoomEvent).toStrictEqual(true);
        });
    });

    it.each([null, undefined])("should throw if given null or undefined: '%s'", val => {
        expect(() => factory(val as any)).toThrow(
            new InvalidEventError(
                eventName,
                "Event object must be defined. Use a null-capable parser instead of passing such a value.",
            ),
        );
    });

    it.each([undefined, "", "with content"])("should handle valid event structures with state key of '%s'", skey => {
        const raw: WireEvent.RoomEvent<W> = {
            room_id: "!test:example.org",
            event_id: "$event",
            type: "org.example.test_event",
            state_key: skey,
            sender: "@user:example.org",
            content: safeContentInput,
            origin_server_ts: 1670894499800,
        };
        const ev = factory(raw);
        expect(ev).toBeDefined();
        expect(ev.raw).toStrictEqual(raw);
        expect(ev.roomId).toStrictEqual(raw.room_id);
        expect(ev.eventId).toStrictEqual(raw.event_id);
        expect(ev.type).toStrictEqual(raw.type);
        expect(ev.stateKey).toStrictEqual(raw.state_key);
        expect(ev.sender).toStrictEqual(raw.sender);
        expect(ev.timestamp).toStrictEqual(raw.origin_server_ts);
        expect(ev.content).toStrictEqual(raw.content);
    });

    it("should retain the event name", () => {
        const raw: WireEvent.RoomEvent<W> = {
            room_id: "!test:example.org",
            event_id: "$event",
            type: "org.example.test_event",
            sender: "@user:example.org",
            content: safeContentInput,
            origin_server_ts: 1670894499800,
        };
        const ev = factory(raw);
        expect(ev.name).toStrictEqual(eventName);
    });

    it.each([
        "",
        "!wrong",
        ":wrong!example",
        "!:example",
        "!:",
        "!wrong:",
        "$wrong",
        "$wrong:example",
        "#wrong",
        "#wrong:example",
        "@wrong",
        "@wrong:example",
        true,
        null,
        42,
        {hello: "world"},
        [1, 2, 3],
    ])("should reject invalid room IDs: '%s'", val => {
        expect(() =>
            factory({
                room_id: val as any,
                event_id: "$event",
                type: "org.example.test_event",
                sender: "@user:example.org",
                content: safeContentInput,
                origin_server_ts: 1670894499800,
            }),
        ).toThrow(
            new InvalidEventError(
                eventName,
                "The room ID should be a string prefixed with `!` and contain a `:`, and is required",
            ),
        );
    });

    it.each([
        "",
        "wrong$",
        "!wrong",
        "!wrong:example",
        "#wrong",
        "#wrong:example",
        "@wrong",
        "@wrong:example",
        true,
        null,
        42,
        {hello: "world"},
        [1, 2, 3],
    ])("should reject invalid event IDs: '%s'", val => {
        expect(() =>
            factory({
                room_id: "!room:example.org",
                event_id: val as any,
                type: "org.example.test_event",
                sender: "@user:example.org",
                content: safeContentInput,
                origin_server_ts: 1670894499800,
            }),
        ).toThrow(
            new InvalidEventError(eventName, "The event ID should be a string prefixed with `$`, and is required"),
        );
    });

    it.each([true, null, 42, {hello: "world"}, [1, 2, 3]])("should reject invalid event types: '%s'", val => {
        expect(() =>
            factory({
                room_id: "!room:example.org",
                event_id: "$event",
                type: val as any,
                sender: "@user:example.org",
                content: safeContentInput,
                origin_server_ts: 1670894499800,
            }),
        ).toThrow(
            new InvalidEventError(
                eventName,
                "The event type should be a string of zero or more characters, and is required",
            ),
        );
    });

    it.each([true, null, 42, {hello: "world"}, [1, 2, 3]])("should reject invalid state keys: '%s'", val => {
        expect(() =>
            factory({
                room_id: "!room:example.org",
                event_id: "$event",
                type: "org.example.test_event",
                state_key: val as any,
                sender: "@user:example.org",
                content: safeContentInput,
                origin_server_ts: 1670894499800,
            }),
        ).toThrow(new InvalidEventError(eventName, "The state key should be a string of zero or more characters"));
    });

    it.each([
        "",
        "@wrong",
        ":wrong@example",
        "@:example",
        "@:",
        "@wrong:",
        "$wrong",
        "$wrong:example",
        "#wrong",
        "#wrong:example",
        "!wrong",
        "!wrong:example",
        true,
        null,
        42,
        {hello: "world"},
        [1, 2, 3],
    ])("should reject invalid senders (user IDs): '%s'", val => {
        expect(() =>
            factory({
                room_id: "!room:example.org",
                event_id: "$event",
                type: "org.example.test_event",
                sender: val as any,
                content: safeContentInput,
                origin_server_ts: 1670894499800,
            }),
        ).toThrow(
            new InvalidEventError(
                eventName,
                "The sender should be a string prefixed with `@` and contain a `:`, and is required",
            ),
        );
    });

    it.each([true, null, "test", 42.3, {hello: "world"}, [1, 2, 3]])("should reject invalid timestamps: '%s'", val => {
        expect(() =>
            factory({
                room_id: "!room:example.org",
                event_id: "$event",
                type: "org.example.test_event",
                sender: "@user:example.org",
                content: safeContentInput,
                origin_server_ts: val as any,
            }),
        ).toThrow(new InvalidEventError(eventName, "The event timestamp should be a number, and is required"));
    });

    it.each([true, null, "test", 42, [1, 2, 3]])("should reject invalid unsigned content: '%s'", val => {
        expect(() =>
            factory({
                room_id: "!room:example.org",
                event_id: "$event",
                type: "org.example.test_event",
                sender: "@user:example.org",
                content: safeContentInput,
                origin_server_ts: 1670894499800,
                unsigned: val as any,
            }),
        ).toThrow(new InvalidEventError(eventName, "The event's unsigned content should be a defined object"));
    });

    it.each([true, null, "test", 42, [1, 2, 3]])("should reject invalid regular content: '%s'", val => {
        expect(() =>
            factory({
                room_id: "!room:example.org",
                event_id: "$event",
                type: "org.example.test_event",
                sender: "@user:example.org",
                content: val as any,
                origin_server_ts: 1670894499800,
            }),
        ).toThrow(
            new InvalidEventError(eventName, "The event content should at least be a defined object, and is required"),
        );
    });

    it.each([-1670894499800, -1, 0])("should return a zero timestamp for negative timestamps: '%s'", val => {
        const raw: WireEvent.RoomEvent<W> = {
            room_id: "!test:example.org",
            event_id: "$event",
            type: "org.example.test_event",
            sender: "@user:example.org",
            content: safeContentInput,
            origin_server_ts: val,
        };
        const ev = factory(raw);
        expect(ev).toBeDefined();
        expect(ev.timestamp).toStrictEqual(0);
    });

    it("should support events with more information than requested", () => {
        const raw: WireEvent.RoomEvent<W> = {
            room_id: "!test:example.org",
            event_id: "$event",
            type: "org.example.test_event",
            sender: "@user:example.org",
            content: {
                ...safeContentInput,
                "org.matrix.sdk.events.test_value": 42,
            },
            origin_server_ts: 1670894499800,
        };
        const ev = factory(raw);
        expect(ev).toBeDefined();
        expect(ev.raw).toStrictEqual(raw);
    });
}
