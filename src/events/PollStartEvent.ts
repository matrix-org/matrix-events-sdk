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
    KNOWN_POLL_KIND,
    M_POLL_KIND_DISCLOSED,
    M_POLL_KIND_UNDISCLOSED,
    M_POLL_START,
    M_POLL_START_EVENT_CONTENT,
    M_POLL_START_SUBTYPE,
    POLL_ANSWER,
} from "./poll_types";
import { IPartialEvent } from "../IPartialEvent";
import { MessageEvent } from "./MessageEvent";
import { M_TEXT } from "./message_types";
import { InvalidEventError } from "../InvalidEventError";
import { NamespacedValue } from "../NamespacedValue";
import { EventType, isEventTypeSame } from "../utility/events";
import { ExtensibleEvent } from "./ExtensibleEvent";

/**
 * Represents a poll answer. Note that this is represented as a subtype and is
 * not registered as a parsable event - it is implied for usage exclusively
 * within the PollStartEvent parsing.
 */
export class PollAnswerSubevent extends MessageEvent {
    /**
     * The answer ID.
     */
    public readonly id: string;

    public constructor(wireFormat: IPartialEvent<POLL_ANSWER>) {
        super(wireFormat);

        const id = wireFormat.content.id;
        if (!id || (typeof id) !== "string") {
            throw new InvalidEventError("Answer ID must be a non-empty string");
        }
        this.id = id;
    }

    public serialize(): IPartialEvent<object> {
        return {
            type: "org.matrix.sdk.poll.answer",
            content: {
                id: this.id,
                ...this.serializeMMessageOnly(),
            },
        };
    }

    /**
     * Creates a new PollAnswerSubevent from ID and text.
     * @param {string} id The answer ID (unique within the poll).
     * @param {string} text The text.
     * @returns {PollAnswerSubevent} The representative answer.
     */
    public static from(id: string, text: string): PollAnswerSubevent {
        return new PollAnswerSubevent({
            type: "org.matrix.sdk.poll.answer",
            content: {
                id: id,
                [M_TEXT.name]: text,
            },
        });
    }
}

/**
 * Represents a poll start event.
 */
export class PollStartEvent extends ExtensibleEvent<M_POLL_START_EVENT_CONTENT> {
    /**
     * The question being asked, as a MessageEvent node.
     */
    public readonly question: MessageEvent;

    /**
     * The interpreted kind of poll. Note that this will infer a value that is known to the
     * SDK rather than verbatim - this means unknown types will be represented as undisclosed
     * polls.
     *
     * To get the raw kind, use rawKind.
     */
    public readonly kind: KNOWN_POLL_KIND;

    /**
     * The true kind as provided by the event sender. Might not be valid.
     */
    public readonly rawKind: string;

    /**
     * The maximum number of selections a user is allowed to make.
     */
    public readonly maxSelections: number;

    /**
     * The possible answers for the poll.
     */
    public readonly answers: PollAnswerSubevent[];

    /**
     * Creates a new PollStartEvent from a pure format. Note that the event is *not*
     * parsed here: it will be treated as a literal m.poll.start primary typed event.
     * @param {IPartialEvent<M_POLL_START_EVENT_CONTENT>} wireFormat The event.
     */
    public constructor(wireFormat: IPartialEvent<M_POLL_START_EVENT_CONTENT>) {
        super(wireFormat);

        const poll = M_POLL_START.findIn<M_POLL_START_SUBTYPE>(this.wireContent);

        if (!poll.question) {
            throw new InvalidEventError("A question is required");
        }

        this.question = new MessageEvent({type: "org.matrix.sdk.poll.question", content: poll.question});

        this.rawKind = poll.kind;
        if (M_POLL_KIND_DISCLOSED.matches(this.rawKind)) {
            this.kind = M_POLL_KIND_DISCLOSED;
        } else {
            this.kind = M_POLL_KIND_UNDISCLOSED; // default & assumed value
        }

        this.maxSelections = (Number.isFinite(poll.max_selections) && poll.max_selections > 0)
            ? poll.max_selections
            : 1;

        if (!Array.isArray(poll.answers)) {
            throw new InvalidEventError("Poll answers must be an array");
        }
        const answers = poll.answers.slice(0, 20).map(a => new PollAnswerSubevent({
            type: "org.matrix.sdk.poll.answer",
            content: a,
        }));
        if (answers.length <= 0) {
            throw new InvalidEventError("No answers available");
        }
        this.answers = answers;
    }

    public isEquivalentTo(primaryEventType: EventType): boolean {
        return isEventTypeSame(primaryEventType, M_POLL_START);
    }

    public serialize(): IPartialEvent<object> {
        return {
            type: M_POLL_START.name,
            content: {
                [M_POLL_START.name]: {
                    question: this.question.serialize().content,
                    kind: this.rawKind,
                    max_selections: this.maxSelections,
                    answers: this.answers.map(a => a.serialize().content),
                },
                [M_TEXT.name]: `${this.question.text}\n${this.answers.map((a, i) => `${i + 1}. ${a.text}`).join("\n")}`,
            },
        };
    }

    /**
     * Creates a new PollStartEvent from question, answers, and metadata.
     * @param {string} question The question to ask.
     * @param {string} answers The answers. Should be unique within each other.
     * @param {KNOWN_POLL_KIND|string} kind The kind of poll.
     * @param {number} maxSelections The maximum number of selections. Must be 1 or higher.
     * @returns {PollStartEvent} The representative poll start event.
     */
    public static from(question: string, answers: string[], kind: KNOWN_POLL_KIND | string, maxSelections = 1): PollStartEvent {
        return new PollStartEvent({
            type: M_POLL_START.name,
            content: {
                [M_TEXT.name]: question, // unused by parsing
                [M_POLL_START.name]: {
                    question: {[M_TEXT.name]: question},
                    kind: (kind instanceof NamespacedValue) ? kind.name : kind,
                    max_selections: maxSelections,
                    answers: answers.map(a => ({id: makeId(), [M_TEXT.name]: a})),
                },
            },
        });
    }
}

const LETTERS = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
function makeId() {
    return [...Array(16)].map(
        () => LETTERS.charAt(Math.floor(Math.random() * LETTERS.length)),
    ).join('');
}
