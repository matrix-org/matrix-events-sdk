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

import {WireEvent} from "./types_wire";
import {Schema} from "ajv";
import {AjvContainer} from "../AjvContainer";
import {InvalidEventError} from "./InvalidEventError";

/**
 * Minimum representation of a room (timeline or state) event in Matrix, for
 * consumption by a parser.
 * @module Events
 */
export abstract class RoomEvent<Content extends WireEvent.BlockBasedContent = WireEvent.BlockSpecificContent<{}>> {
    public static readonly schema: Schema = {
        type: "object",
        properties: {
            room_id: {
                type: "string",
                minLength: 4, // sigil + colon + characters, in theory
                pattern: "^!.+:.+$",
                nullable: false,
            },
            event_id: {
                type: "string",
                minLength: 2, // sigil + characters, in theory
                pattern: "^\\$.+$", // they are opaque strings
                nullable: false,
            },
            type: {
                type: "string",
                nullable: false,
            },
            state_key: {
                type: "string",
                nullable: false,
            },
            sender: {
                type: "string",
                minLength: 4, // sigil + colon + characters, in theory
                pattern: "^@.+:.+$",
                nullable: false,
            },
            content: {
                type: "object",
                nullable: false,
                additionalProperties: true,
            },
            origin_server_ts: {
                type: "integer",
                // Ideally we'd specify our 2^56 limit here, but it's a bit too
                // weird for JSON Schema.
                nullable: false,
            },
            unsigned: {
                type: "object",
                nullable: false,
                additionalProperties: true,
            },
        },
        required: ["room_id", "event_id", "type", "sender", "content", "origin_server_ts"],
        errorMessage: {
            properties: {
                room_id: "The room ID should be a string prefixed with `!` and contain a `:`, and is required",
                event_id: "The event ID should be a string prefixed with `$`, and is required",
                type: "The event type should be a string of zero or more characters, and is required",
                state_key: "The state key should be a string of zero or more characters",
                sender: "The sender should be a string prefixed with `@` and contain a `:`, and is required",
                content: "The event content should at least be a defined object, and is required",
                origin_server_ts: "The event timestamp should be a number, and is required",
                unsigned: "The event's unsigned content should be a defined object",
            },
        },
    };

    public static readonly validateFn = AjvContainer.ajv.compile(RoomEvent.schema);

    /**
     * Creates a new MatrixEvent, validating the event object itself. Implementations of
     * this abstract class should only need to validate the content object rather than the
     * whole event schema.
     * @param name The name of the event. Used for debugging.
     * @param raw The raw event itself.
     * @param isStateEvent True (default: false) if the event type is expected to be a
     * state event. The event will be strictly checked to ensure compliance with this
     * field.
     * @protected
     */
    protected constructor(
        public readonly name: string,
        public readonly raw: WireEvent.RoomEvent<Content>,
        isStateEvent = false,
    ) {
        if (raw === null || raw === undefined) {
            throw new InvalidEventError(
                this.name,
                "Event object must be defined. Use a null-capable parser instead of passing such a value.",
            );
        }
        if (!RoomEvent.validateFn(raw)) {
            throw new InvalidEventError(this.name, RoomEvent.validateFn.errors);
        }
        if (!isStateEvent && raw.state_key !== undefined) {
            throw new InvalidEventError(
                this.name,
                "This event is not allowed to be a state event and must be converted accordingly.",
            );
        } else if (isStateEvent && raw.state_key === undefined) {
            throw new InvalidEventError(
                this.name,
                "This event is only allowed to be a state event and must be converted accordingly.",
            );
        }
    }

    /**
     * The room ID this event was sent in.
     */
    public get roomId(): string {
        return this.raw.room_id;
    }

    /**
     * The event ID this event was sent as.
     */
    public get eventId(): string {
        return this.raw.event_id;
    }

    /**
     * The raw, unparsed, content of this event. It is recommended to use the getters
     * on the event object instead to retrieve relevant parts of the event, such as
     * message text or image details.
     */
    public get content(): Content {
        return this.raw.content;
    }

    /**
     * The type of this event.
     */
    public get type(): string {
        return this.raw.type;
    }

    /**
     * The sender (user ID) of this event.
     */
    public get sender(): string {
        return this.raw.sender;
    }

    /**
     * The state key for this event, if present. Note that an empty string is a
     * valid state key: check for undefined to determine presence of a state key.
     */
    public get stateKey(): string | undefined {
        return this.raw.state_key;
    }

    /**
     * The reported timestamp this event was sent at. Note that this is supplied
     * by the sender, and will be zero if negative.
     */
    public get timestamp(): number {
        return this.raw.origin_server_ts < 0 ? 0 : this.raw.origin_server_ts;
    }
}
