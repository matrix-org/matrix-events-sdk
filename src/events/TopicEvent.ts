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

import { ExtensibleEvent } from "./ExtensibleEvent";
import { IPartialEvent } from "../IPartialEvent";
import { isProvided, Optional } from "../types";
import { InvalidEventError } from "../InvalidEventError";
import { IMessageRendering } from "./message_types";
import { EventType, isEventTypeSame } from "../utility/events";
import { M_TOPIC, M_TOPIC_EVENT_CONTENT } from "./topic_types";

/**
 * Represents a topic event.
 */
export class TopicEvent extends ExtensibleEvent<M_TOPIC_EVENT_CONTENT> {
    /**
     * The default text for the event.
     */
    public readonly text: string;

    /**
     * The default HTML for the event, if provided.
     */
    public readonly html: Optional<string>;

    /**
     * All the different renderings of the topic. Note that this is the same
     * format as an m.topic body but may contain elements not found directly
     * in the event content: this is because this is interpreted based off the
     * other information available in the event.
     */
    public readonly renderings: IMessageRendering[];

    /**
     * Creates a new TopicEvent from a pure format. Note that the event is *not*
     * parsed here: it will be treated as a literal m.topic primary typed event.
     * @param {IPartialEvent<M_TOPIC_EVENT_CONTENT>} wireFormat The event.
     */
    public constructor(wireFormat: IPartialEvent<M_TOPIC_EVENT_CONTENT>) {
        super(wireFormat);

        const mtopic = M_TOPIC.findIn(this.wireContent);
        if (isProvided(mtopic)) {
            if (!Array.isArray(mtopic)) {
                throw new InvalidEventError("m.topic contents must be an array");
            }
            const text = mtopic.find(r => !isProvided(r.mimetype) || r.mimetype === "text/plain");
            const html = mtopic.find(r => r.mimetype === "text/html");

            if (!text) throw new InvalidEventError("m.topic is missing a plain text representation");

            this.text = text.body;
            this.html = html?.body;
            this.renderings = mtopic;
        } else {
            throw new InvalidEventError("Missing textual representation for event");
        }
    }

    public isEquivalentTo(primaryEventType: EventType): boolean {
        return isEventTypeSame(primaryEventType, M_TOPIC);
    }

    public serialize(): IPartialEvent<object> {
        return {
            type: "m.room.topic",
            content: {
                topic: this.text,
                [M_TOPIC.name]: this.renderings,
            },
        };
    }

    /**
     * Creates a new TopicEvent from text and HTML.
     * @param {string} text The text.
     * @param {string} html Optional HTML.
     * @returns {TopicEvent} The representative topic event.
     */
    public static from(text: string, html?: string): TopicEvent {
        return new TopicEvent({
            type: M_TOPIC.name,
            content: {
                [M_TOPIC.name]: [
                    {body: text, mimetype: "text/plain"},
                    {body: html, mimetype: "text/html"},
                ],
            },
        });
    }
}
