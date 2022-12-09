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
    EmoteEvent,
    EventType,
    ExtensibleEvent,
    ExtensibleEvents,
    InvalidEventError,
    IPartialEvent,
    IPartialLegacyContent,
    M_EMOTE,
    M_MESSAGE,
    M_MESSAGE_EVENT_CONTENT,
    M_NOTICE,
    M_POLL_END,
    M_POLL_END_EVENT_CONTENT,
    M_POLL_KIND_DISCLOSED,
    M_POLL_RESPONSE,
    M_POLL_RESPONSE_EVENT_CONTENT,
    M_POLL_START,
    M_POLL_START_EVENT_CONTENT,
    M_TEXT,
    MessageEvent,
    NoticeEvent,
    Optional,
    PollEndEvent,
    PollResponseEvent,
    PollStartEvent,
    REFERENCE_RELATION,
    UnstableValue,
} from "../../src/v1-old";

describe("ExtensibleEvents", () => {
    afterEach(() => {
        // gutwrench the default instance into something safe/new to "reset" it
        (<any>ExtensibleEvents)._defaultInstance = new ExtensibleEvents();
    });

    describe("static api", () => {
        it("should return an instance by default", () => {
            expect(ExtensibleEvents.defaultInstance).toBeDefined();
        });
    });

    describe("unknown events", () => {
        it("should parse unknown event types with a fallback to m.message", () => {
            const input: IPartialEvent<any> = {
                type: "org.example.message-like",
                content: {
                    isThisATopLevelProp: true,
                    "org.example.message-like": {
                        hello: "world",
                    },
                    [M_TEXT.name]: "Hello World",
                },
            };
            const event: Optional<ExtensibleEvent> = new ExtensibleEvents().parse(input);
            expect(event).toBeDefined();
            expect(event instanceof MessageEvent).toBe(true);
            expect(event!.isEquivalentTo(M_MESSAGE)).toBe(true);
            const messageEvent = event as MessageEvent;
            expect(messageEvent.text).toBe("Hello World");
        });

        it("should return falsy for entirely unknown types", () => {
            const input: IPartialEvent<any> = {
                type: "org.example.message-like",
                content: {
                    // Note lack of fallback opportunities
                    isThisATopLevelProp: true,
                    "org.example.message-like": {
                        hello: "world",
                    },
                },
            };
            const event = new ExtensibleEvents().parse(input);
            expect(event).toBeFalsy();
        });

        describe("static api", () => {
            afterEach(() => {
                ExtensibleEvents.unknownInterpretOrder = new ExtensibleEvents().unknownInterpretOrder;
            });

            it("should persist the unknown interpret order", () => {
                expect(ExtensibleEvents.unknownInterpretOrder.length).toBeGreaterThan(0);

                const testValue1 = new UnstableValue(null, "org.matrix.example.feature1");
                const testValue2 = new UnstableValue(null, "org.matrix.example.feature2");
                const array = [testValue1, testValue2];
                ExtensibleEvents.unknownInterpretOrder = array;

                expect(ExtensibleEvents.unknownInterpretOrder).toBe(array);
            });
        });
    });

    describe("custom events", () => {
        class MyCustomEvent extends ExtensibleEvent<any> {
            public constructor(wireEvent: IPartialEvent<any>) {
                super(wireEvent);
                expect(wireEvent?.content.hello).toEqual("world");
            }

            public serialize(): IPartialEvent<object> {
                throw new Error("Not implemented for tests");
            }

            public isEquivalentTo(primaryEventType: EventType): boolean {
                throw new Error("Not implemented for tests");
            }
        }

        function myInterpreter(wireEvent: IPartialEvent<any>): MyCustomEvent {
            return new MyCustomEvent(wireEvent);
        }

        const myNamespace = new UnstableValue(null, "org.example.custom.event");

        it("should support custom interpreters", () => {
            const input: IPartialEvent<any> = {
                type: myNamespace.name,
                content: {
                    hello: "world",
                },
            };

            const extev = new ExtensibleEvents();

            let event = extev.parse(input);
            expect(event).toBeFalsy();

            extev.registerInterpreter(myNamespace, myInterpreter);
            event = extev.parse(input);
            expect(event).toBeDefined();
            expect(event instanceof MyCustomEvent).toBe(true);
        });

        it("should support changing unknown parse order", () => {
            const input: IPartialEvent<any> = {
                type: "org.example.custom.not.under.namespace",
                content: {
                    hello: "world",
                },
            };

            const extev = new ExtensibleEvents();

            let event = extev.parse(input);
            expect(event).toBeFalsy();

            extev.registerInterpreter(myNamespace, myInterpreter);
            event = extev.parse(input);
            expect(event).toBeFalsy();

            extev.unknownInterpretOrder = [myNamespace, M_MESSAGE];
            event = extev.parse(input);
            expect(event).toBeDefined();
            expect(event instanceof MyCustomEvent).toBe(true);
        });

        describe("static api", () => {
            it("should support custom interpreters", () => {
                const input: IPartialEvent<any> = {
                    type: myNamespace.name,
                    content: {
                        hello: "world",
                    },
                };

                let event = ExtensibleEvents.parse(input);
                expect(event).toBeFalsy();

                ExtensibleEvents.registerInterpreter(myNamespace, myInterpreter);
                event = ExtensibleEvents.parse(input);
                expect(event).toBeDefined();
                expect(event instanceof MyCustomEvent).toBe(true);
            });
        });
    });

    describe("known events", () => {
        // Dev note: The "should parse X type" cases are not meant to be exhaustive. Just
        // a quick check to make sure the event comes out on the other end as the correct
        // type.

        it("should parse legacy m.text room message events", () => {
            const input: IPartialEvent<IPartialLegacyContent> = {
                type: "m.room.message",
                content: {
                    msgtype: "m.text",
                    body: "Text here",
                },
            };
            const message = new ExtensibleEvents().parse(input);
            expect(message).toBeDefined();
            expect(message instanceof MessageEvent).toBe(true);
            expect(message!.isEquivalentTo(M_MESSAGE)).toBe(true);
            const messageEvent = message as MessageEvent;
            expect(messageEvent.text).toEqual("Text here");
        });

        it("should parse modern m.message events", () => {
            const input: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {
                type: M_MESSAGE.name,
                content: {
                    [M_TEXT.name]: "Text here",
                },
            };
            const message = new ExtensibleEvents().parse(input);
            expect(message).toBeDefined();
            expect(message instanceof MessageEvent).toBe(true);
            expect(message!.isEquivalentTo(M_MESSAGE)).toBe(true);
            const messageEvent = message as MessageEvent;
            expect(messageEvent.text).toEqual("Text here");
        });

        it("should parse modern m.emote events", () => {
            const input: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {
                type: M_EMOTE.name,
                content: {
                    [M_TEXT.name]: "Text here",
                },
            };
            const message = new ExtensibleEvents().parse(input);
            expect(message).toBeDefined();
            expect(message instanceof EmoteEvent).toBe(true);
            expect(message!.isEquivalentTo(M_EMOTE)).toBe(true);
            expect(message!.isEquivalentTo(M_MESSAGE)).toBe(true);
            const messageEvent = message as EmoteEvent;
            expect(messageEvent.text).toEqual("Text here");
        });

        it("should parse modern m.notice events", () => {
            const input: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {
                type: M_NOTICE.name,
                content: {
                    [M_TEXT.name]: "Text here",
                },
            };
            const message = new ExtensibleEvents().parse(input);
            expect(message).toBeDefined();
            expect(message instanceof NoticeEvent).toBe(true);
            expect(message!.isEquivalentTo(M_NOTICE)).toBe(true);
            expect(message!.isEquivalentTo(M_MESSAGE)).toBe(true);
            const messageEvent = message as NoticeEvent;
            expect(messageEvent.text).toEqual("Text here");
        });

        it("should parse m.poll.start events", () => {
            const input: IPartialEvent<M_POLL_START_EVENT_CONTENT> = {
                type: M_POLL_START.name,
                content: {
                    [M_TEXT.name]: "FALLBACK Question here",
                    [M_POLL_START.name]: {
                        question: {[M_TEXT.name]: "Question here"},
                        kind: M_POLL_KIND_DISCLOSED.name,
                        max_selections: 1,
                        answers: [
                            {id: "one", [M_TEXT.name]: "ONE"},
                            {id: "two", [M_TEXT.name]: "TWO"},
                            {id: "thr", [M_TEXT.name]: "THR"},
                        ],
                    },
                },
            };
            const poll = new ExtensibleEvents().parse(input);
            expect(poll).toBeDefined();
            expect(poll instanceof PollStartEvent).toBe(true);
            expect(poll!.isEquivalentTo(M_POLL_START)).toBe(true);
        });

        it("should parse m.poll.response events", () => {
            const input: IPartialEvent<M_POLL_RESPONSE_EVENT_CONTENT> = {
                type: M_POLL_RESPONSE.name,
                content: {
                    "m.relates_to": {
                        rel_type: REFERENCE_RELATION.name,
                        event_id: "$poll",
                    },
                    [M_POLL_RESPONSE.name]: {
                        answers: ["one"],
                    },
                },
            };
            const response = new ExtensibleEvents().parse(input);
            expect(response).toBeDefined();
            expect(response instanceof PollResponseEvent).toBe(true);
            expect(response!.isEquivalentTo(M_POLL_RESPONSE)).toBe(true);
        });

        it("should parse m.poll.end events", () => {
            const input: IPartialEvent<M_POLL_END_EVENT_CONTENT> = {
                type: M_POLL_END.name,
                content: {
                    "m.relates_to": {
                        rel_type: REFERENCE_RELATION.name,
                        event_id: "$poll",
                    },
                    [M_TEXT.name]: "FALLBACK Closure notice here",
                    [M_POLL_END.name]: {},
                },
            };
            const poll = new ExtensibleEvents().parse(input);
            expect(poll).toBeDefined();
            expect(poll instanceof PollEndEvent).toBe(true);
        });
    });

    describe("parse errors", () => {
        function myForcedInvalidInterpreter(wireEvent: IPartialEvent<any>): ExtensibleEvent {
            throw new InvalidEventError("deliberate throw of invalid type");
        }

        function myExplodingInterpreter(wireEvent: IPartialEvent<any>): ExtensibleEvent {
            throw new Error("deliberate throw");
        }

        it("should return null when InvalidEventError is raised", () => {
            const extev = new ExtensibleEvents();
            const namespace = new UnstableValue(null, "org.matrix.example");
            extev.registerInterpreter(namespace, myForcedInvalidInterpreter);
            const result = extev.parse({type: namespace.name, content: {unused: true}});
            expect(result).toBeNull();
        });

        it("should return null when no known parser is found", () => {
            const extev = new ExtensibleEvents();
            const namespace = new UnstableValue(null, "org.matrix.example");
            const result = extev.parse({type: namespace.name, content: {unused: true}});
            expect(result).toBeNull();
        });

        it("should throw if the parser throws an unknown error", () => {
            const extev = new ExtensibleEvents();
            const namespace = new UnstableValue(null, "org.matrix.example");
            extev.registerInterpreter(namespace, myExplodingInterpreter);
            expect(() => extev.parse({type: namespace.name, content: {unused: true}})).toThrow("deliberate throw");
        });

        it("should throw if the parser throws an unknown error during unknown interpret order", () => {
            const extev = new ExtensibleEvents();
            const namespace = new UnstableValue(null, "org.matrix.example");
            const namespace2 = new UnstableValue(null, "org.matrix.example2");
            extev.registerInterpreter(namespace, myExplodingInterpreter);
            extev.unknownInterpretOrder = [namespace];
            expect(() => extev.parse({type: namespace2.name, content: {unused: true}})).toThrow("deliberate throw");
        });

        describe("static api", () => {
            it("should return null when InvalidEventError is raised", () => {
                const namespace = new UnstableValue(null, "org.matrix.example");
                ExtensibleEvents.registerInterpreter(namespace, myForcedInvalidInterpreter);
                const result = ExtensibleEvents.parse({type: namespace.name, content: {unused: true}});
                expect(result).toBeNull();
            });
        });
    });
});
