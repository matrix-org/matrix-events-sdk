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
    ExtensibleEvent,
    ExtensibleEvents,
    IPartialEvent,
    IPartialLegacyContent,
    M_EMOTE,
    M_MESSAGE,
    M_MESSAGE_EVENT_CONTENT,
    M_NOTICE,
    M_TEXT,
    MessageEvent,
    NoticeEvent,
    UnstableValue,
} from "../src";

describe('ExtensibleEvents', () => {
    // Note: we don't test the other static functions because it should be pretty
    // obvious when they fail. We'll just make sure that the static accessor works.
    it('should return an instance by default', () => {
        expect(ExtensibleEvents.defaultInstance).toBeDefined();
    });

    describe('unknown events', () => {
        it('should parse unknown event types with a fallback to m.message', () => {
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
            const event = (new ExtensibleEvents()).parse(input);
            expect(event).toBeDefined();
            expect(event instanceof MessageEvent).toBe(true);
        });

        it('should return falsy for entirely unknown types', () => {
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
            const event = (new ExtensibleEvents()).parse(input);
            expect(event).toBeFalsy();
        });
    });

    describe('custom events', () => {
        class MyCustomEvent extends ExtensibleEvent<any> {
            public constructor(wireEvent: IPartialEvent<any>) {
                super(wireEvent);
            }

            public serialize(): IPartialEvent<object> {
                throw new Error("Not implemented for tests");
            }
        }

        function myInterpreter(wireEvent: IPartialEvent<any>): MyCustomEvent {
            return new MyCustomEvent(wireEvent);
        }

        const myNamespace = new UnstableValue(null, "org.example.custom.event");

        it('should support custom interpreters', () => {
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

        it('should support changing unknown parse order', () => {
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
    });

    describe('known events', () => {
        // Dev note: The "should parse X type" cases are not meant to be exhaustive. Just
        // a quick check to make sure the event comes out on the other end as the correct
        // type.

        it('should parse legacy m.text room message events', () => {
            const input: IPartialEvent<IPartialLegacyContent> = {
                type: "m.room.message",
                content: {
                    msgtype: "m.text",
                    body: "Text here",
                },
            };
            const message = (new ExtensibleEvents()).parse(input);
            expect(message).toBeDefined();
            expect(message instanceof MessageEvent).toBe(true);
        });

        it('should parse modern m.message events', () => {
            const input: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {
                type: M_MESSAGE.name,
                content: {
                    [M_TEXT.name]: "Text here",
                },
            };
            const message = (new ExtensibleEvents()).parse(input);
            expect(message).toBeDefined();
            expect(message instanceof MessageEvent).toBe(true);
        });

        it('should parse modern m.emote events', () => {
            const input: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {
                type: M_EMOTE.name,
                content: {
                    [M_TEXT.name]: "Text here",
                },
            };
            const message = (new ExtensibleEvents()).parse(input);
            expect(message).toBeDefined();
            expect(message instanceof EmoteEvent).toBe(true);
        });

        it('should parse modern m.notice events', () => {
            const input: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {
                type: M_NOTICE.name,
                content: {
                    [M_TEXT.name]: "Text here",
                },
            };
            const message = (new ExtensibleEvents()).parse(input);
            expect(message).toBeDefined();
            expect(message instanceof NoticeEvent).toBe(true);
        });
    });
});
