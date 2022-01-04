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
import { UnstableValue } from "../NamespacedValue";
import { EitherAnd, isOptionalAString, isProvided, Optional } from "../types";
import { M_EMOTE } from "./EmoteEvent";
import { M_NOTICE } from "./NoticeEvent";
import { InvalidEventError } from "../InvalidEventError";

/**
 * The namespaced value for m.message
 */
export const M_MESSAGE = new UnstableValue("m.message", "org.matrix.msc1767.message");

/**
 * An m.message event rendering
 */
export interface IMessageRendering {
    body: string;
    mimetype?: string;
}

/**
 * The content for an m.message event
 */
export type M_MESSAGE_EVENT = EitherAnd<{ [M_MESSAGE.name]: IMessageRendering[] }, { [M_MESSAGE.altName]: IMessageRendering[] }>;

/**
 * The namespaced value for m.text
 */
export const M_TEXT = new UnstableValue("m.text", "org.matrix.msc1767.text");

/**
 * The content for an m.text event
 */
export type M_TEXT_EVENT = EitherAnd<{ [M_TEXT.name]: string }, { [M_TEXT.altName]: string }>;

/**
 * The namespaced value for m.html
 */
export const M_HTML = new UnstableValue("m.html", "org.matrix.msc1767.html");

/**
 * The content for an m.html event
 */
export type M_HTML_EVENT = EitherAnd<{ [M_HTML.name]: string }, { [M_HTML.altName]: string }>;

/**
 * The content for an m.message, m.text, or m.html event
 */
export type M_MESSAGE_EVENT_CONTENT =
    | M_MESSAGE_EVENT
    | M_TEXT_EVENT
    | M_HTML_EVENT;

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
                throw new InvalidEventError("m.message contents must be an array");
            }
            const text = mmessage.find(r => !isProvided(r.mimetype) || r.mimetype === "text/plain");
            const html = mmessage.find(r => r.mimetype === "text/html");

            if (!text) throw new InvalidEventError("m.message is missing a plain text representation");

            this.text = text.body;
            this.html = html.body;
            this.renderings = mmessage;
        } else if (isOptionalAString(mtext)) {
            this.text = mtext;
            this.html = mhtml;
            this.renderings = [
                {body: mtext, mimetype: "text/plain"},
            ];
            if (this.html) {
                this.renderings.push({body: this.html, mimetype: "text/html"});
            }
        } else {
            throw new InvalidEventError("Missing textual representation for event");
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
}
