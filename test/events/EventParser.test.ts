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

import {
    EitherAnd,
    EmoteBlock,
    EmoteEvent,
    EventParser,
    InvalidBlockError,
    InvalidEventError,
    MessageEvent,
    NamespacedValue,
    NoticeBlock,
    NoticeEvent,
    ParsedEventFactory,
    RoomEvent,
    UnstableValue,
    WireEmoteBlock,
    WireEvent,
    WireMessageEvent,
    WireNoticeBlock,
} from "../../src";

type TestCustomEventContent = {
    "org.example.custom": {
        hello: string;
        is_test: boolean;
    };
};
class TestCustomEvent extends RoomEvent<TestCustomEventContent> {
    public static readonly type = new UnstableValue(null, "org.example.custom");

    public constructor(raw: WireEvent.RoomEvent<TestCustomEventContent>) {
        super(TestCustomEvent.type.name, raw);
        // DANGER: We do NOT validate content schema like we're supposed to!
    }
}

describe("EventParser", () => {
    it("should have the built-in types defined as known event types", () => {
        const expected = [MessageEvent.type, EmoteEvent.type, NoticeEvent.type]
            .map(ns => [ns.stable, ns.unstable])
            .reduce((p, c) => [...p, ...c], [])
            .filter(x => !!x)
            .sort();
        const parser = new EventParser();
        expect(parser.knownEventTypes.sort()).toStrictEqual(expected);
    });

    it("should have some unknown event parsers for built-in types", () => {
        const parser = new EventParser();
        expect(parser.defaultUnknownEventParsers.length).toBeGreaterThan(0);

        // Unfortunately we can't realistically check to see if the actual parsers
        // have the correct values, but it shows that we registered *something* if
        // there's at least one available.
    });

    describe("known event types", () => {
        it("should parse a known message event as a message", () => {
            const ev: WireEvent.RoomEvent<WireMessageEvent.ContentValue> = {
                room_id: "!room:example.org",
                event_id: "$test",
                type: "m.message",
                state_key: undefined,
                sender: "@user:example.org",
                origin_server_ts: 1671145380506,
                content: {
                    "m.markup": [{body: "test"}],
                },
            };
            const parser = new EventParser();
            const parsed = parser.parse(ev);
            expect(parsed).toBeDefined();
            expect(parsed!.type).toStrictEqual("m.message");
            // noinspection SuspiciousTypeOfGuard
            expect(parsed instanceof MessageEvent).toStrictEqual(true);
            expect((parsed as unknown as MessageEvent).text).toStrictEqual("test");
        });

        it("should parse a known emote event as an emote", () => {
            const ev: WireEvent.RoomEvent<WireMessageEvent.ContentValue> = {
                room_id: "!room:example.org",
                event_id: "$test",
                type: "m.emote",
                state_key: undefined,
                sender: "@user:example.org",
                origin_server_ts: 1671145380506,
                content: {
                    "m.markup": [{body: "test"}],
                },
            };
            const parser = new EventParser();
            const parsed = parser.parse(ev);
            expect(parsed).toBeDefined();
            expect(parsed!.type).toStrictEqual("m.emote");
            // noinspection SuspiciousTypeOfGuard
            expect(parsed instanceof EmoteEvent).toStrictEqual(true);
            expect((parsed as unknown as EmoteEvent).text).toStrictEqual("test");
        });

        it("should parse a known notice event as a notice", () => {
            const ev: WireEvent.RoomEvent<WireMessageEvent.ContentValue> = {
                room_id: "!room:example.org",
                event_id: "$test",
                type: "m.notice",
                state_key: undefined,
                sender: "@user:example.org",
                origin_server_ts: 1671145380506,
                content: {
                    "m.markup": [{body: "test"}],
                },
            };
            const parser = new EventParser();
            const parsed = parser.parse(ev);
            expect(parsed).toBeDefined();
            expect(parsed!.type).toStrictEqual("m.notice");
            // noinspection SuspiciousTypeOfGuard
            expect(parsed instanceof NoticeEvent).toStrictEqual(true);
            expect((parsed as unknown as NoticeEvent).text).toStrictEqual("test");
        });

        describe("custom", () => {
            it("should parse a custom event as that custom event", () => {
                const factory: ParsedEventFactory<TestCustomEventContent, TestCustomEventContent> = x =>
                    new TestCustomEvent(x);
                const parser1 = new EventParser();
                const parser2 = new EventParser();
                parser1.addKnownType(TestCustomEvent.type, factory);

                // check to make sure the known type didn't leak across instances
                expect(parser1.knownEventTypes.includes(TestCustomEvent.type.name)).toStrictEqual(true);
                expect(parser2.knownEventTypes.includes(TestCustomEvent.type.name)).toStrictEqual(false);

                // Try parsing the custom event
                const ev: WireEvent.RoomEvent<TestCustomEventContent> = {
                    room_id: "!room:example.org",
                    event_id: "$test",
                    type: "org.example.custom",
                    state_key: undefined,
                    sender: "@user:example.org",
                    origin_server_ts: 1671145380506,
                    content: {
                        "org.example.custom": {
                            hello: "world",
                            is_test: true,
                        },
                    },
                };
                const parsed = parser1.parse(ev);
                expect(parsed).toBeDefined();
                expect(parsed!.type).toStrictEqual("org.example.custom");
                // noinspection SuspiciousTypeOfGuard
                expect(parsed instanceof TestCustomEvent).toStrictEqual(true);

                // And to be doubly sure, the other parser fails to find anything useful:
                const unknownParsed = parser2.parse(ev);
                expect(unknownParsed).toBeUndefined();
            });
        });
    });

    describe("unknown event types", () => {
        it("should parse an unknown, message-like, event as a message", () => {
            const ev: WireEvent.RoomEvent<WireMessageEvent.ContentValue> = {
                room_id: "!room:example.org",
                event_id: "$test",
                type: "org.example.custom",
                state_key: undefined,
                sender: "@user:example.org",
                origin_server_ts: 1671145380506,
                content: {
                    "m.markup": [{body: "test"}],
                },
            };
            // noinspection DuplicatedCode
            const parser = new EventParser();
            const parsed = parser.parse(ev);
            expect(parsed).toBeDefined();
            expect(parsed!.type).toStrictEqual(MessageEvent.type.name);
            // noinspection SuspiciousTypeOfGuard
            expect(parsed instanceof MessageEvent).toStrictEqual(true);
            expect((parsed as unknown as MessageEvent).text).toStrictEqual("test");
        });

        it("should parse an unknown, emote-like, event as an emote", () => {
            const ev: WireEvent.RoomEvent<
                EitherAnd<
                    {[EmoteBlock.type.name]: WireEmoteBlock.Value},
                    {[EmoteBlock.type.altName]: WireEmoteBlock.Value}
                >
            > = {
                room_id: "!room:example.org",
                event_id: "$test",
                type: "org.example.custom",
                state_key: undefined,
                sender: "@user:example.org",
                origin_server_ts: 1671145380506,
                content: {
                    "m.emote": {
                        "m.markup": [{body: "test"}],
                    },
                },
            };
            // noinspection DuplicatedCode
            const parser = new EventParser();
            const parsed = parser.parse(ev);
            expect(parsed).toBeDefined();
            expect(parsed!.type).toStrictEqual(EmoteEvent.type.name);
            // noinspection SuspiciousTypeOfGuard
            expect(parsed instanceof EmoteEvent).toStrictEqual(true);
            expect((parsed as unknown as EmoteEvent).text).toStrictEqual("test");
        });

        it("should parse an unknown, notice-like, event as a notice", () => {
            const ev: WireEvent.RoomEvent<
                EitherAnd<
                    {[NoticeBlock.type.name]: WireNoticeBlock.Value},
                    {[NoticeBlock.type.altName]: WireNoticeBlock.Value}
                >
            > = {
                room_id: "!room:example.org",
                event_id: "$test",
                type: "org.example.custom",
                state_key: undefined,
                sender: "@user:example.org",
                origin_server_ts: 1671145380506,
                content: {
                    "m.notice": {
                        "m.markup": [{body: "test"}],
                    },
                },
            };
            // noinspection DuplicatedCode
            const parser = new EventParser();
            const parsed = parser.parse(ev);
            expect(parsed).toBeDefined();
            expect(parsed!.type).toStrictEqual(NoticeEvent.type.name);
            // noinspection SuspiciousTypeOfGuard
            expect(parsed instanceof NoticeEvent).toStrictEqual(true);
            expect((parsed as unknown as NoticeEvent).text).toStrictEqual("test");
        });

        describe("custom", () => {
            it("should respect the custom unknown event parser order", () => {
                const customParser = (x: WireEvent.RoomEvent) =>
                    new TestCustomEvent({
                        ...x,
                        type: TestCustomEvent.type.name,
                        content: {
                            "org.example.custom": (x.content as any)["org.example.custom"] ?? {
                                hello: "wrong",
                                is_test: true,
                            },
                        },
                    });
                const ev: WireEvent.RoomEvent<any> = {
                    room_id: "!room:example.org",
                    event_id: "$test",
                    type: "org.example.custom",
                    state_key: undefined,
                    sender: "@user:example.org",
                    origin_server_ts: 1671145380506,
                    content: {
                        "m.notice": {
                            "m.markup": [{body: "parsed as notice"}],
                        },
                        "m.markup": [{body: "parsed as plain"}],
                        "org.example.custom": {
                            hello: "parsed as custom",
                            is_test: true,
                        },
                    },
                };
                const parser = new EventParser();

                // Should parse the event as a notice first
                let parsed = parser.parse(ev);
                expect(parsed).toBeDefined();
                expect(parsed!.type).toStrictEqual(NoticeEvent.type.name);
                // noinspection SuspiciousTypeOfGuard
                expect(parsed instanceof NoticeEvent).toStrictEqual(true);
                expect((parsed as unknown as NoticeEvent).text).toStrictEqual("parsed as notice");

                // If we reverse the order, it should parse as text
                parser.setUnknownParsers(parser.defaultUnknownEventParsers.reverse());
                parsed = parser.parse(ev);
                expect(parsed).toBeDefined();
                expect(parsed!.type).toStrictEqual(MessageEvent.type.name);
                // noinspection SuspiciousTypeOfGuard
                expect(parsed instanceof MessageEvent).toStrictEqual(true);
                expect((parsed as unknown as MessageEvent).text).toStrictEqual("parsed as plain");

                // Similarly, if we add our custom parser to the front then it should parse as that
                parser.setUnknownParsers([customParser, ...parser.defaultUnknownEventParsers]);
                parsed = parser.parse(ev);
                expect(parsed!.type).toStrictEqual(TestCustomEvent.type.name);
                // noinspection SuspiciousTypeOfGuard
                expect(parsed instanceof TestCustomEvent).toStrictEqual(true);
                expect((parsed as unknown as TestCustomEvent).content["org.example.custom"].hello).toStrictEqual(
                    "parsed as custom",
                );

                // also similarly, it should parse it as a notice if we put our custom parser last
                parser.setUnknownParsers([...parser.defaultUnknownEventParsers, customParser]);
                parsed = parser.parse(ev);
                expect(parsed).toBeDefined();
                expect(parsed!.type).toStrictEqual(NoticeEvent.type.name);
                // noinspection SuspiciousTypeOfGuard
                expect(parsed instanceof NoticeEvent).toStrictEqual(true);
                expect((parsed as unknown as NoticeEvent).text).toStrictEqual("parsed as notice");

                // final check: did any of this affect other instances of parsers? (it shouldn't)
                const parser2 = new EventParser();
                expect(parser2.unknownEventParsers).toStrictEqual(parser2.defaultUnknownEventParsers);
            });
        });
    });

    it("should throw if the known event parser throws", () => {
        const ev: WireEvent.RoomEvent<any> = {
            room_id: "!room:example.org",
            event_id: "$test",
            type: TestCustomEvent.type.name,
            state_key: undefined,
            sender: "@user:example.org",
            origin_server_ts: 1671145380506,
            content: {}, // shouldn't matter what the content is: it should explode before we get there
        };

        const parser = new EventParser();

        parser.addKnownType(TestCustomEvent.type, () => {
            throw new InvalidEventError("TestEvent", "Test Case Throw");
        });
        expect(() => parser.parse(ev)).toThrow(new InvalidEventError("TestEvent", "Test Case Throw"));

        parser.addKnownType(TestCustomEvent.type, () => {
            throw new InvalidBlockError("TestEvent", "Test Case Throw");
        });
        expect(() => parser.parse(ev)).toThrow(new InvalidBlockError("TestEvent", "Test Case Throw"));

        parser.addKnownType(TestCustomEvent.type, () => {
            throw new Error("Test Case Throw");
        });
        expect(() => parser.parse(ev)).toThrow(new Error("Test Case Throw"));
    });

    it("should throw when the unknown event parser throws unexpectedly", () => {
        const ev: WireEvent.RoomEvent<any> = {
            room_id: "!room:example.org",
            event_id: "$test",
            type: TestCustomEvent.type.name,
            state_key: undefined,
            sender: "@user:example.org",
            origin_server_ts: 1671145380506,
            content: {}, // shouldn't matter what the content is: it should explode before we get there
        };

        const parser = new EventParser();

        parser.setUnknownParsers([
            () => {
                throw new InvalidEventError("TestEvent", "Test Case Throw");
            },
        ]);
        expect(parser.parse(ev)).toBeUndefined(); // no throw

        parser.setUnknownParsers([
            () => {
                throw new InvalidBlockError("TestEvent", "Test Case Throw");
            },
        ]);
        expect(parser.parse(ev)).toBeUndefined(); // no throw

        parser.setUnknownParsers([
            () => {
                throw new Error("Test Case Throw");
            },
        ]);
        expect(() => parser.parse(ev)).toThrow(new Error("Test Case Throw"));
    });

    it("should not parse events that don't match any criteria", () => {
        const ev: WireEvent.RoomEvent<any> = {
            room_id: "!room:example.org",
            event_id: "$test",
            type: "org.example.custom",
            state_key: undefined,
            sender: "@user:example.org",
            origin_server_ts: 1671145380506,
            content: {},
        };
        const parser = new EventParser();
        expect(parser.parse(ev)).toBeUndefined();
    });

    it("should not return a mutable copy of the default unknown parsers", () => {
        const parser = new EventParser();
        const firstParser = parser.defaultUnknownEventParsers[0];
        parser.defaultUnknownEventParsers.reverse();
        expect(parser.defaultUnknownEventParsers[0]).toStrictEqual(firstParser);
    });

    it("should not return a mutable copy of the known unknown parsers", () => {
        const parser = new EventParser();
        const firstParser = parser.unknownEventParsers[0];
        parser.unknownEventParsers.reverse();
        expect(parser.unknownEventParsers[0]).toStrictEqual(firstParser);
    });

    it.each([
        ["stable", null],
        [null, "unstable"],
        ["stable", "unstable"],
    ])("should register stable and unstable values as known: s='%s', u='%s'", (stable, unstable) => {
        const ns = new NamespacedValue(stable, unstable);
        const parser = new EventParser();
        parser.addKnownType(ns, () => {
            throw new Error("unused");
        });

        if (stable !== null) {
            expect(parser.knownEventTypes).toContain(stable);
        }
        if (unstable !== null) {
            expect(parser.knownEventTypes).toContain(unstable);
        }
    });
});
