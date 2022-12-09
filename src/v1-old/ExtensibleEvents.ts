/*
Copyright 2021 - 2022 The Matrix.org Foundation C.I.C.

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

import {IPartialEvent} from "./IPartialEvent";
import {ExtensibleEvent} from "./events/ExtensibleEvent";
import {Optional} from "../types";
import {NamespacedValue} from "../NamespacedValue";
import {NamespacedMap} from "./NamespacedMap";
import {InvalidEventError} from "./InvalidEventError";
import {LEGACY_M_ROOM_MESSAGE, parseMRoomMessage} from "./interpreters/legacy/MRoomMessage";
import {parseMMessage} from "./interpreters/modern/MMessage";
import {M_EMOTE, M_MESSAGE, M_NOTICE} from "./events/message_types";
import {M_POLL_END, M_POLL_RESPONSE, M_POLL_START} from "./events/poll_types";
import {parseMPoll} from "./interpreters/modern/MPoll";

export type EventInterpreter<TContentIn extends object = object, TEvent extends ExtensibleEvent = ExtensibleEvent> = (
    wireEvent: IPartialEvent<TContentIn>,
) => Optional<TEvent>;

/**
 * Utility class for parsing and identifying event types in a renderable form. An
 * instance of this class can be created to change rendering preference depending
 * on use-case.
 */
export class ExtensibleEvents {
    // Dev note: this is manually reset by the unit tests - adjust name in both places
    // if changed.
    private static _defaultInstance: ExtensibleEvents = new ExtensibleEvents();

    private interpreters = new NamespacedMap<EventInterpreter<any>>([
        // Remember to add your unit test when adding to this! ("known events" test description)
        [LEGACY_M_ROOM_MESSAGE, parseMRoomMessage],
        [M_MESSAGE, parseMMessage],
        [M_EMOTE, parseMMessage],
        [M_NOTICE, parseMMessage],
        [M_POLL_START, parseMPoll],
        [M_POLL_RESPONSE, parseMPoll],
        [M_POLL_END, parseMPoll],
    ]);

    private _unknownInterpretOrder: NamespacedValue<string, string>[] = [M_MESSAGE];

    public constructor() {}

    /**
     * Gets the default instance for all extensible event parsing.
     */
    public static get defaultInstance(): ExtensibleEvents {
        return ExtensibleEvents._defaultInstance;
    }

    /**
     * Gets the order the internal processor will use for unknown primary
     * event types.
     */
    public get unknownInterpretOrder(): NamespacedValue<string, string>[] {
        return this._unknownInterpretOrder;
    }

    /**
     * Sets the order the internal processor will use for unknown primary
     * event types.
     * @param {NamespacedValue<string, string>[]} val The parsing order.
     */
    public set unknownInterpretOrder(val: NamespacedValue<string, string>[]) {
        this._unknownInterpretOrder = val;
    }

    /**
     * Gets the order the internal processor will use for unknown primary
     * event types.
     */
    public static get unknownInterpretOrder(): NamespacedValue<string, string>[] {
        return ExtensibleEvents.defaultInstance.unknownInterpretOrder;
    }

    /**
     * Sets the order the internal processor will use for unknown primary
     * event types.
     * @param {NamespacedValue<string, string>[]} val The parsing order.
     */
    public static set unknownInterpretOrder(val: NamespacedValue<string, string>[]) {
        ExtensibleEvents.defaultInstance.unknownInterpretOrder = val;
    }

    /**
     * Registers a primary event type interpreter. Note that the interpreter might be
     * called with non-primary events if the event is being parsed as a fallback.
     * @param {NamespacedValue<string, string>} wireEventType The event type.
     * @param {EventInterpreter} interpreter The interpreter.
     */
    public registerInterpreter(wireEventType: NamespacedValue<string, string>, interpreter: EventInterpreter): void {
        this.interpreters.set(wireEventType, interpreter);
    }

    /**
     * Registers a primary event type interpreter. Note that the interpreter might be
     * called with non-primary events if the event is being parsed as a fallback.
     * @param {NamespacedValue<string, string>} wireEventType The event type.
     * @param {EventInterpreter} interpreter The interpreter.
     */
    public static registerInterpreter(
        wireEventType: NamespacedValue<string, string>,
        interpreter: EventInterpreter,
    ): void {
        ExtensibleEvents.defaultInstance.registerInterpreter(wireEventType, interpreter);
    }

    /**
     * Parses an event, trying the primary event type first. If the primary type is not known
     * then the content will be inspected to find the most suitable fallback.
     *
     * If the parsing failed or was a completely unknown type, this will return falsy.
     * @param {IPartialEvent<object>} wireFormat The event to parse.
     * @returns {Optional<ExtensibleEvent>} The parsed extensible event.
     */
    public parse(wireFormat: IPartialEvent<object>): Optional<ExtensibleEvent> {
        try {
            if (this.interpreters.hasNamespaced(wireFormat.type)) {
                return this.interpreters.getNamespaced(wireFormat.type)!(wireFormat);
            }

            for (const tryType of this.unknownInterpretOrder) {
                if (this.interpreters.has(tryType)) {
                    try {
                        const val = this.interpreters.get(tryType)!(wireFormat);
                        if (val) return val;
                    } catch (e) {
                        if (e instanceof InvalidEventError) {
                            continue; // clearly can't be parsed as the unknown type
                        }
                        // noinspection ExceptionCaughtLocallyJS
                        throw e; // re-throw everything else
                    }
                }
            }

            return null; // cannot be parsed
        } catch (e) {
            if (e instanceof InvalidEventError) {
                return null; // fail parsing and move on
            }
            throw e; // re-throw everything else
        }
    }

    /**
     * Parses an event, trying the primary event type first. If the primary type is not known
     * then the content will be inspected to find the most suitable fallback.
     *
     * If the parsing failed or was a completely unknown type, this will return falsy.
     * @param {IPartialEvent<object>} wireFormat The event to parse.
     * @returns {Optional<ExtensibleEvent>} The parsed extensible event.
     */
    public static parse(wireFormat: IPartialEvent<object>): Optional<ExtensibleEvent> {
        return ExtensibleEvents.defaultInstance.parse(wireFormat);
    }
}
