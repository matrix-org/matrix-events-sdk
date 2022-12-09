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
    InvalidEventError,
    IPartialEvent,
    M_EMOTE,
    M_EMOTE_EVENT_CONTENT,
    M_HTML,
    M_MESSAGE,
    M_MESSAGE_EVENT_CONTENT,
    M_NOTICE,
    M_NOTICE_EVENT_CONTENT,
    M_TEXT,
    MessageEvent,
} from "../../../src";

describe("MessageEvent", () => {
    it("should parse m.text", () => {
        const input: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {
            type: "org.example.message-like",
            content: {
                [M_TEXT.name]: "Text here",
            },
        };
        const message = new MessageEvent(input);
        expect(message.text).toBe("Text here");
        expect(message.html).toBeFalsy();
        expect(message.renderings.length).toBe(1);
        expect(message.renderings.some(r => r.mimetype === "text/plain" && r.body === "Text here")).toBe(true);
    });

    it("should parse m.html", () => {
        const input: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {
            type: "org.example.message-like",
            content: {
                [M_TEXT.name]: "Text here",
                [M_HTML.name]: "HTML here",
            },
        };
        const message = new MessageEvent(input);
        expect(message.text).toBe("Text here");
        expect(message.html).toBe("HTML here");
        expect(message.renderings.length).toBe(2);
        expect(message.renderings.some(r => r.mimetype === "text/plain" && r.body === "Text here")).toBe(true);
        expect(message.renderings.some(r => r.mimetype === "text/html" && r.body === "HTML here")).toBe(true);
    });

    it("should parse m.message", () => {
        const input: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {
            type: "org.example.message-like",
            content: {
                [M_MESSAGE.name]: [
                    {body: "Text here", mimetype: "text/plain"},
                    {body: "HTML here", mimetype: "text/html"},
                    {body: "MD here", mimetype: "text/markdown"},
                ],

                // These should be ignored
                [M_TEXT.name]: "WRONG Text here",
                [M_HTML.name]: "WRONG HTML here",
            },
        };
        const message = new MessageEvent(input);
        expect(message.text).toBe("Text here");
        expect(message.html).toBe("HTML here");
        expect(message.renderings.length).toBe(3);
        expect(message.renderings.some(r => r.mimetype === "text/plain" && r.body === "Text here")).toBe(true);
        expect(message.renderings.some(r => r.mimetype === "text/html" && r.body === "HTML here")).toBe(true);
        expect(message.renderings.some(r => r.mimetype === "text/markdown" && r.body === "MD here")).toBe(true);
    });

    it("should not find HTML if there isn't any", () => {
        const input: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {
            type: "org.example.message-like",
            content: {
                [M_MESSAGE.name]: [
                    {body: "Text here", mimetype: "text/plain"},
                    {body: "MD here", mimetype: "text/markdown"},
                ],

                // These should be ignored
                [M_TEXT.name]: "WRONG Text here",
                [M_HTML.name]: "WRONG HTML here",
            },
        };
        const message = new MessageEvent(input);
        expect(message.text).toBe("Text here");
        expect(message.html).toBeUndefined();
        expect(message.renderings.length).toBe(2);
        expect(message.renderings.some(r => r.mimetype === "text/plain" && r.body === "Text here")).toBe(true);
        expect(message.renderings.some(r => r.mimetype === "text/markdown" && r.body === "MD here")).toBe(true);
    });

    it("should fail to parse missing text", () => {
        const input: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {
            type: "org.example.message-like",
            content: {
                hello: "world",
            } as any, // force invalid type
        };
        expect(() => new MessageEvent(input)).toThrow(
            new InvalidEventError("Missing textual representation for event"),
        );
    });

    it("should fail to parse missing plain text in m.message", () => {
        const input: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {
            type: "org.example.message-like",
            content: {
                [M_MESSAGE.name]: [{body: "HTML here", mimetype: "text/html"}],
            },
        };
        expect(() => new MessageEvent(input)).toThrow(
            new InvalidEventError("m.message is missing a plain text representation"),
        );
    });

    it("should fail to parse non-array m.message", () => {
        const input: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {
            type: "org.example.message-like",
            content: {
                [M_MESSAGE.name]: "invalid",
            } as any, // force invalid type
        };
        expect(() => new MessageEvent(input)).toThrow(new InvalidEventError("m.message contents must be an array"));
    });

    describe("isEmote", () => {
        it("should be false by default", () => {
            const input: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {
                type: "org.example.message-like",
                content: {
                    [M_TEXT.name]: "Text here",
                },
            };
            const message = new MessageEvent(input);
            expect(message.isEmote).toBe(false);
        });

        it("should be true when using an emote subtype", () => {
            const input: IPartialEvent<M_MESSAGE_EVENT_CONTENT & M_EMOTE_EVENT_CONTENT> = {
                type: "org.example.message-like",
                content: {
                    [M_TEXT.name]: "Text here",
                    [M_EMOTE.name]: {},
                },
            };
            const message = new MessageEvent(input);
            expect(message.isEmote).toBe(true);
        });

        it("should be true when using an emote primary type", () => {
            const input: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {
                type: M_EMOTE.name,
                content: {
                    [M_TEXT.name]: "Text here",
                },
            };
            const message = new MessageEvent(input);
            expect(message.isEmote).toBe(true);
        });
    });

    describe("isNotice", () => {
        it("should be false by default", () => {
            const input: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {
                type: "org.example.message-like",
                content: {
                    [M_TEXT.name]: "Text here",
                },
            };
            const message = new MessageEvent(input);
            expect(message.isNotice).toBe(false);
        });

        it("should be true when using a notice subtype", () => {
            const input: IPartialEvent<M_MESSAGE_EVENT_CONTENT & M_NOTICE_EVENT_CONTENT> = {
                type: "org.example.message-like",
                content: {
                    [M_TEXT.name]: "Text here",
                    [M_NOTICE.name]: {},
                },
            };
            const message = new MessageEvent(input);
            expect(message.isNotice).toBe(true);
        });

        it("should be true when using a notice primary type", () => {
            const input: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {
                type: M_NOTICE.name,
                content: {
                    [M_TEXT.name]: "Text here",
                },
            };
            const message = new MessageEvent(input);
            expect(message.isNotice).toBe(true);
        });
    });

    describe("from & serialize", () => {
        it("should serialize to a legacy fallback", () => {
            const message = MessageEvent.from("Text here", "HTML here");
            expect(message.text).toBe("Text here");
            expect(message.html).toBe("HTML here");
            expect(message.renderings.length).toBe(2);
            expect(message.renderings.some(r => r.mimetype === "text/plain" && r.body === "Text here")).toBe(true);
            expect(message.renderings.some(r => r.mimetype === "text/html" && r.body === "HTML here")).toBe(true);

            const serialized = message.serialize();
            expect(serialized.type).toBe("m.room.message");
            expect(serialized.content).toMatchObject({
                [M_MESSAGE.name]: [
                    {body: "Text here", mimetype: "text/plain"},
                    {body: "HTML here", mimetype: "text/html"},
                ],
                body: "Text here",
                msgtype: "m.text",
                format: "org.matrix.custom.html",
                formatted_body: "HTML here",
            });
        });

        it("should serialize non-html content to a legacy fallback", () => {
            const message = MessageEvent.from("Text here");
            expect(message.text).toBe("Text here");
            expect(message.renderings.length).toBe(1);
            expect(message.renderings.some(r => r.mimetype === "text/plain" && r.body === "Text here")).toBe(true);

            const serialized = message.serialize();
            expect(serialized.type).toBe("m.room.message");
            expect(serialized.content).toMatchObject({
                [M_TEXT.name]: "Text here",
                body: "Text here",
                msgtype: "m.text",
                format: undefined,
                formatted_body: undefined,
            });
        });
    });
});
