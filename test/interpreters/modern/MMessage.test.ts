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
    IPartialEvent,
    M_EMOTE,
    M_HTML,
    M_MESSAGE_EVENT_CONTENT,
    M_NOTICE,
    M_TEXT,
    NoticeEvent,
    parseMMessage,
} from "../../../src";

describe('parseMMessage', () => {
    it('should return an unmodified MessageEvent', () => {
        const input: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {
            type: "org.example.message-like",
            content: {
                [M_TEXT.name]: "Text here",
                [M_HTML.name]: "HTML here",
            },
        };
        const message = parseMMessage(input);
        expect(message).toBeDefined();
        expect(message.html).toBe("HTML here");
        expect(message.text).toBe("Text here");
        expect(message.renderings.length).toBe(2);
        expect(message.renderings.some(r => r.mimetype === "text/html" && r.body === "HTML here")).toBe(true);
        expect(message.renderings.some(r => r.mimetype === "text/plain" && r.body === "Text here")).toBe(true);
    });

    it('should return an unmodified EmoteEvent', () => {
        const input: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {
            type: M_EMOTE.name,
            content: {
                [M_TEXT.name]: "Text here",
                [M_HTML.name]: "HTML here",
            },
        };
        const message = parseMMessage(input);
        expect(message).toBeDefined();
        expect(message instanceof EmoteEvent).toBe(true);
        expect(message.html).toBe("HTML here");
        expect(message.text).toBe("Text here");
        expect(message.renderings.length).toBe(2);
        expect(message.renderings.some(r => r.mimetype === "text/html" && r.body === "HTML here")).toBe(true);
        expect(message.renderings.some(r => r.mimetype === "text/plain" && r.body === "Text here")).toBe(true);
    });

    it('should return an unmodified NoticeEvent', () => {
        const input: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {
            type: M_NOTICE.name,
            content: {
                [M_TEXT.name]: "Text here",
                [M_HTML.name]: "HTML here",
            },
        };
        const message = parseMMessage(input);
        expect(message).toBeDefined();
        expect(message instanceof NoticeEvent).toBe(true);
        expect(message.html).toBe("HTML here");
        expect(message.text).toBe("Text here");
        expect(message.renderings.length).toBe(2);
        expect(message.renderings.some(r => r.mimetype === "text/html" && r.body === "HTML here")).toBe(true);
        expect(message.renderings.some(r => r.mimetype === "text/plain" && r.body === "Text here")).toBe(true);
    });
});
