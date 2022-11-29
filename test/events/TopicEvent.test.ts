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
    M_TOPIC,
    M_TOPIC_EVENT_CONTENT,
    TopicEvent,
} from "../../src";

describe('TopicEvent', () => {
    it('should parse m.topic', () => {
        const input: IPartialEvent<M_TOPIC_EVENT_CONTENT> = {
            type: "org.example.topic-like",
            content: {
                [M_TOPIC.name]: [
                    {body: "Text here", mimetype: "text/plain"},
                    {body: "HTML here", mimetype: "text/html"},
                    {body: "MD here", mimetype: "text/markdown"},
                ],
            },
        };
        const topic = new TopicEvent(input);
        expect(topic.text).toBe("Text here");
        expect(topic.html).toBe("HTML here");
        expect(topic.renderings.length).toBe(3);
        expect(topic.renderings.some(r => r.mimetype === "text/plain" && r.body === "Text here")).toBe(true);
        expect(topic.renderings.some(r => r.mimetype === "text/html" && r.body === "HTML here")).toBe(true);
        expect(topic.renderings.some(r => r.mimetype === "text/markdown" && r.body === "MD here")).toBe(true);
    });

    it('should fail to parse missing text', () => {
        const input: IPartialEvent<M_TOPIC_EVENT_CONTENT> = {
            type: "org.example.topic-like",
            content: {
                hello: "world",
            } as any, // force invalid type
        };
        expect(() => new TopicEvent(input))
            .toThrow(new InvalidEventError("Missing textual representation for event"));
    });

    it('should fail to parse missing plain text in m.topic', () => {
        const input: IPartialEvent<M_TOPIC_EVENT_CONTENT> = {
            type: "org.example.topic-like",
            content: {
                [M_TOPIC.name]: [
                    {body: "HTML here", mimetype: "text/html"},
                ],
            },
        };
        expect(() => new TopicEvent(input))
            .toThrow(new InvalidEventError("m.topic is missing a plain text representation"));
    });

    it('should fail to parse non-array m.topic', () => {
        const input: IPartialEvent<M_TOPIC_EVENT_CONTENT> = {
            type: "org.example.topic-like",
            content: {
                [M_TOPIC.name]: "invalid",
            } as any, // force invalid type
        };
        expect(() => new TopicEvent(input))
            .toThrow(new InvalidEventError("m.topic contents must be an array"));
    });

    describe('from & serialize', () => {
        it('should serialize to a legacy fallback', () => {
            const topic = TopicEvent.from("Text here", "HTML here");
            expect(topic.text).toBe("Text here");
            expect(topic.html).toBe("HTML here");
            expect(topic.renderings.length).toBe(2);
            expect(topic.renderings.some(r => r.mimetype === "text/plain" && r.body === "Text here")).toBe(true);
            expect(topic.renderings.some(r => r.mimetype === "text/html" && r.body === "HTML here")).toBe(true);

            const serialized = topic.serialize();
            expect(serialized.type).toBe("m.room.topic");
            expect(serialized.content).toMatchObject({
                [M_TOPIC.name]: [
                    {body: "Text here", mimetype: "text/plain"},
                    {body: "HTML here", mimetype: "text/html"},
                ],
                topic: "Text here",
            });
        });
    });
});
