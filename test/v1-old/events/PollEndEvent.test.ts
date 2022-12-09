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
    M_POLL_END,
    M_POLL_END_EVENT_CONTENT,
    M_TEXT,
    PollEndEvent,
    REFERENCE_RELATION,
} from "../../../src/v1-old";

describe("PollEndEvent", () => {
    // Note: throughout these tests we don't really bother testing that
    // MessageEvent is doing its job. It has its own tests to worry about.

    it("should parse a poll closure", () => {
        const input: IPartialEvent<M_POLL_END_EVENT_CONTENT> = {
            type: M_POLL_END.name,
            content: {
                "m.relates_to": {
                    rel_type: REFERENCE_RELATION.name,
                    event_id: "$poll",
                },
                [M_POLL_END.name]: {},
                [M_TEXT.name]: "Poll closed",
            },
        };
        const event = new PollEndEvent(input);
        expect(event.pollEventId).toBe("$poll");
        expect(event.closingMessage.text).toBe("Poll closed");
    });

    it("should fail to parse a missing relationship", () => {
        const input: IPartialEvent<M_POLL_END_EVENT_CONTENT> = {
            type: M_POLL_END.name,
            content: {
                [M_POLL_END.name]: {},
                [M_TEXT.name]: "Poll closed",
            } as any, // force invalid type
        };
        expect(() => new PollEndEvent(input)).toThrow(
            new InvalidEventError("Relationship must be a reference to an event"),
        );
    });

    it("should fail to parse a missing relationship event ID", () => {
        const input: IPartialEvent<M_POLL_END_EVENT_CONTENT> = {
            type: M_POLL_END.name,
            content: {
                "m.relates_to": {
                    rel_type: REFERENCE_RELATION.name,
                },
                [M_POLL_END.name]: {},
                [M_TEXT.name]: "Poll closed",
            } as any, // force invalid type
        };
        expect(() => new PollEndEvent(input)).toThrow(
            new InvalidEventError("Relationship must be a reference to an event"),
        );
    });

    it("should fail to parse an improper relationship", () => {
        const input: IPartialEvent<M_POLL_END_EVENT_CONTENT> = {
            type: M_POLL_END.name,
            content: {
                "m.relates_to": {
                    rel_type: "org.example.not-relationship",
                    event_id: "$poll",
                },
                [M_POLL_END.name]: {},
                [M_TEXT.name]: "Poll closed",
            } as any, // force invalid type
        };
        expect(() => new PollEndEvent(input)).toThrow(
            new InvalidEventError("Relationship must be a reference to an event"),
        );
    });

    describe("from & serialize", () => {
        it("should serialize to a poll end event", () => {
            const event = PollEndEvent.from("$poll", "Poll closed");
            expect(event.pollEventId).toBe("$poll");
            expect(event.closingMessage.text).toBe("Poll closed");

            const serialized = event.serialize();
            expect(M_POLL_END.matches(serialized.type)).toBe(true);
            expect(serialized.content).toMatchObject({
                "m.relates_to": {
                    rel_type: REFERENCE_RELATION.name,
                    event_id: "$poll",
                },
                [M_POLL_END.name]: {},
                [M_TEXT.name]: expect.any(String), // tested by MessageEvent tests
            });
        });
    });

    describe("isEquivalentTo", () => {
        it("should consider itself the same for M_POLL_END types", () => {
            const event = PollEndEvent.from("$poll", "Poll closed");
            expect(event.isEquivalentTo(M_POLL_END.name)).toBe(true);
            expect(event.isEquivalentTo(M_POLL_END.altName)).toBe(true);
            expect(event.isEquivalentTo("org.matrix.random")).toBe(false);
        });
    });
});
