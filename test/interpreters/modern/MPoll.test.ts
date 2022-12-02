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
    IPartialEvent,
    M_POLL_END,
    M_POLL_END_EVENT_CONTENT,
    M_POLL_KIND_DISCLOSED,
    M_POLL_RESPONSE,
    M_POLL_RESPONSE_EVENT_CONTENT,
    M_POLL_START,
    M_POLL_START_EVENT_CONTENT,
    M_TEXT,
    parseMPoll,
    PollEndEvent,
    PollResponseEvent,
    PollStartEvent,
    REFERENCE_RELATION,
} from "../../../src";

describe("parseMPoll", () => {
    it("should return an unmodified PollStartEvent", () => {
        const input: IPartialEvent<M_POLL_START_EVENT_CONTENT> = {
            type: M_POLL_START.name,
            content: {
                [M_TEXT.name]: "FALLBACK Question here",
                [M_POLL_START.name]: {
                    question: {[M_TEXT.name]: "Question here"},
                    kind: M_POLL_KIND_DISCLOSED.name,
                    max_selections: 2,
                    answers: [
                        {id: "one", [M_TEXT.name]: "ONE"},
                        {id: "two", [M_TEXT.name]: "TWO"},
                        {id: "thr", [M_TEXT.name]: "THR"},
                    ],
                },
            },
        };
        const poll = parseMPoll(input) as PollStartEvent;
        // noinspection SuspiciousTypeOfGuard
        expect(poll instanceof PollStartEvent).toBe(true);
        expect(poll.isEquivalentTo(M_POLL_START)).toBe(true);
        expect(poll.question).toBeDefined();
        expect(poll.question.text).toBe("Question here");
        expect(poll.kind).toBe(M_POLL_KIND_DISCLOSED);
        expect(M_POLL_KIND_DISCLOSED.matches(poll.rawKind)).toBe(true);
        expect(poll.maxSelections).toBe(2);
        expect(poll.answers.length).toBe(3);
        expect(poll.answers.some(a => a.id === "one" && a.text === "ONE")).toBe(true);
        expect(poll.answers.some(a => a.id === "two" && a.text === "TWO")).toBe(true);
        expect(poll.answers.some(a => a.id === "thr" && a.text === "THR")).toBe(true);
    });

    it("should return an unmodified PollResponseEvent", () => {
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
        const response = parseMPoll(input) as PollResponseEvent;
        // noinspection SuspiciousTypeOfGuard
        expect(response instanceof PollResponseEvent).toBe(true);
        expect(response.isEquivalentTo(M_POLL_RESPONSE)).toBe(true);
        expect(response.spoiled).toBe(false);
        expect(response.answerIds).toMatchObject(["one"]);
        expect(response.pollEventId).toBe("$poll");
    });

    it("should return an unmodified PollEndEvent", () => {
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
        const event = parseMPoll(input) as PollEndEvent;
        // noinspection SuspiciousTypeOfGuard
        expect(event instanceof PollEndEvent).toBe(true);
        expect(event.pollEventId).toBe("$poll");
        expect(event.closingMessage.text).toBe("Poll closed");
    });

    it("should not attempt to parse non-poll events", () => {
        const input: IPartialEvent<any> = {
            type: "not.a.poll",
            content: {},
        };

        const event = parseMPoll(input);
        expect(event).toBeNull();
    });
});
