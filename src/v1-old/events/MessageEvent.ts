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

import {ExtensibleEvent} from "./ExtensibleEvent";
import {IPartialEvent} from "../IPartialEvent";
import {isOptionalAString, isProvided} from "../types";
import {InvalidEventError} from "../../events/InvalidEventError";
import {
    IMessageRendering,
    M_EMOTE,
    M_HTML,
    M_MESSAGE,
    M_MESSAGE_EVENT_CONTENT,
    M_NOTICE,
    M_TEXT,
} from "./message_types";
import {EventType, isEventTypeSame} from "../utility/events";
import {Optional} from "../../types";

/**
 * Represents a message event. Message events are the simplest form of event with
 * just text (optionally of different mimetypes, like HTML).
 *
 * Message events can additionally be an Emote or Notice, though typically those
 * are represented as EmoteEvent and NoticeEvent respectively.
 */
export class MessageEvent extends ExtensibleEvent<M_MESSAGE_EVENT_CONTENT> {
    /**
     * The default text for the event.
     */
    public readonly text: string;

    /**
     * The default HTML for the event, if provided.
     */
    public readonly html: Optional<string>;

    /**
     * All the different renderings of the message. Note that this is the same
     * format as an m.message body but may contain elements not found directly
     * in the event content: this is because this is interpreted based off the
     * other information available in the event.
     */
    public readonly renderings: IMessageRendering[];

    /**
     * Creates a new MessageEvent from a pure format. Note that the event is
     * *not* parsed here: it will be treated as a literal m.message primary
     * typed event.
     * @param {IPartialEvent<M_MESSAGE_EVENT_CONTENT>} wireFormat The event.
     */
    public constructor(wireFormat: IPartialEvent<M_MESSAGE_EVENT_CONTENT>) {
        super(wireFormat);

        const mmessage = M_MESSAGE.findIn(this.wireContent);
        const mtext = M_TEXT.findIn<string>(this.wireContent);
        const mhtml = M_HTML.findIn<string>(this.wireContent);
        if (isProvided(mmessage)) {
            if (!Array.isArray(mmessage)) {
                throw new InvalidEventError("MessageEventLegacy", "m.message contents must be an array");
            }
            const text = mmessage.find(r => !isProvided(r.mimetype) || r.mimetype === "text/plain");
            const html = mmessage.find(r => r.mimetype === "text/html");

            if (!text)
                throw new InvalidEventError("MessageEventLegacy", "m.message is missing a plain text representation");

            this.text = text.body;
            this.html = html?.body;
            this.renderings = mmessage;
        } else if (isOptionalAString(mtext)) {
            this.text = mtext;
            this.html = mhtml;
            this.renderings = [{body: this.text, mimetype: "text/plain"}];
            if (this.html) {
                this.renderings.push({body: this.html, mimetype: "text/html"});
            }
        } else {
            throw new InvalidEventError("MessageEventLegacy", "Missing textual representation for event");
        }
    }

    /**
     * Gets whether this message is considered an "emote". Note that a message
     * might be an emote and notice at the same time: while technically possible,
     * the event should be interpreted as one or the other.
     */
    public get isEmote(): boolean {
        return M_EMOTE.matches(this.wireFormat.type) || isProvided(M_EMOTE.findIn(this.wireFormat.content));
    }

    /**
     * Gets whether this message is considered a "notice". Note that a message
     * might be an emote and notice at the same time: while technically possible,
     * the event should be interpreted as one or the other.
     */
    public get isNotice(): boolean {
        return M_NOTICE.matches(this.wireFormat.type) || isProvided(M_NOTICE.findIn(this.wireFormat.content));
    }

    public isEquivalentTo(primaryEventType: EventType): boolean {
        return isEventTypeSame(primaryEventType, M_MESSAGE);
    }

    protected serializeMMessageOnly(): M_MESSAGE_EVENT_CONTENT {
        let messageRendering: M_MESSAGE_EVENT_CONTENT = {
            [M_MESSAGE.name]: this.renderings,
        };

        // Use the shorthand if it's just a simple text event
        if (this.renderings.length === 1) {
            const mime = this.renderings[0].mimetype;
            if (mime === undefined || mime === "text/plain") {
                messageRendering = {
                    [M_TEXT.name]: this.renderings[0].body,
                };
            }
        }

        return messageRendering;
    }

    public serialize(): IPartialEvent<object> {
        return {
            type: "m.room.message",
            content: {
                ...this.serializeMMessageOnly(),
                body: this.text,
                msgtype: "m.text",
                format: this.html ? "org.matrix.custom.html" : undefined,
                formatted_body: this.html ?? undefined,
            },
        };
    }

    /**
     * Creates a new MessageEvent from text and HTML.
     * @param {string} text The text.
     * @param {string} html Optional HTML.
     * @returns {MessageEvent} The representative message event.
     */
    public static from(text: string, html?: string): MessageEvent {
        return new MessageEvent({
            type: M_MESSAGE.name,
            content: {
                [M_TEXT.name]: text,
                [M_HTML.name]: html,
            },
        });
    }
}
