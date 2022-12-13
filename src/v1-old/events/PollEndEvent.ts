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

import {M_POLL_END, M_POLL_END_EVENT_CONTENT} from "./poll_types";
import {IPartialEvent} from "../IPartialEvent";
import {InvalidEventError} from "../../events/InvalidEventError";
import {REFERENCE_RELATION} from "./relationship_types";
import {MessageEvent} from "./MessageEvent";
import {M_TEXT} from "./message_types";
import {EventType, isEventTypeSame} from "../utility/events";
import {ExtensibleEvent} from "./ExtensibleEvent";

/**
 * Represents a poll end/closure event.
 */
export class PollEndEvent extends ExtensibleEvent<M_POLL_END_EVENT_CONTENT> {
    /**
     * The poll start event ID referenced by the response.
     */
    public readonly pollEventId: string;

    /**
     * The closing message for the event.
     */
    public readonly closingMessage: MessageEvent;

    /**
     * Creates a new PollEndEvent from a pure format. Note that the event is *not*
     * parsed here: it will be treated as a literal m.poll.response primary typed event.
     * @param {IPartialEvent<M_POLL_END_EVENT_CONTENT>} wireFormat The event.
     */
    public constructor(wireFormat: IPartialEvent<M_POLL_END_EVENT_CONTENT>) {
        super(wireFormat);

        const rel = this.wireContent["m.relates_to"];
        // noinspection SuspiciousTypeOfGuard
        if (!REFERENCE_RELATION.matches(rel?.rel_type) || typeof rel.event_id !== "string") {
            throw new InvalidEventError("PollEndEventLegacy", "Relationship must be a reference to an event");
        }

        this.pollEventId = rel.event_id;
        this.closingMessage = new MessageEvent(this.wireFormat);
    }

    public isEquivalentTo(primaryEventType: EventType): boolean {
        return isEventTypeSame(primaryEventType, M_POLL_END);
    }

    public serialize(): IPartialEvent<object> {
        return {
            type: M_POLL_END.name,
            content: {
                "m.relates_to": {
                    rel_type: REFERENCE_RELATION.name,
                    event_id: this.pollEventId,
                },
                [M_POLL_END.name]: {},
                ...this.closingMessage.serialize().content,
            },
        };
    }

    /**
     * Creates a new PollEndEvent from a poll event ID.
     * @param {string} pollEventId The poll start event ID.
     * @param {string} message A closing message, typically revealing the top answer.
     * @returns {PollStartEvent} The representative poll closure event.
     */
    public static from(pollEventId: string, message: string): PollEndEvent {
        return new PollEndEvent({
            type: M_POLL_END.name,
            content: {
                "m.relates_to": {
                    rel_type: REFERENCE_RELATION.name,
                    event_id: pollEventId,
                },
                [M_POLL_END.name]: {},
                [M_TEXT.name]: message,
            },
        });
    }
}
