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
import {RoomEvent} from "./RoomEvent";
import {NamespacedValue} from "../NamespacedValue";
import {InvalidEventError} from "./InvalidEventError";
import {InvalidBlockError} from "../content_blocks/InvalidBlockError";

/**
 * Represents an event factory for purposes of event parsing.
 * @module Event Parsing
 */
export type ParsedEventFactory<T extends object, C extends WireEvent.BlockBasedContent> = (
    x: WireEvent.RoomEvent<T>,
) => RoomEvent<C>;

/**
 * Represents a parser for unknown events, returning undefined if the event does
 * not apply. The parser should modify the `type` and `content` of the event before
 * returning the `RoomEvent<>` object, allowing consumers to see what the event got
 * interpreted as.
 *
 * Throwing InvalidBlockError and InvalidEventError are valid if the supplied event
 * *looks* compatible, but actually isn't. For example, an event containing a markup
 * block, but that markup block being invalid.
 * @module Event Parsing
 */
export type UnknownEventParser<C extends WireEvent.BlockBasedContent> = (
    x: WireEvent.RoomEvent<any>,
) => RoomEvent<C> | undefined;

const internalKnownEvents = new Map<string, ParsedEventFactory<any, any>>();

// For efficiency, we maintain two arrays instead of one with tuples. This allows
// us to return the "default" parsers with ease (and without iterating the array).
// The array isn't terribly large, though it has potential to be a visible performance
// bottleneck over enough time.
//
// Note: We very carefully manage these arrays in addInternalUnknownEventParser()
const internalOrderedUnknownParsers: UnknownEventParser<any>[] = [];
const internalOrderedUnknownCategories: InternalOrderCategorization[] = [];

/**
 * Used internally by the events-sdk to determine how to group an unknown event
 * parser.
 * @internal
 */
export enum InternalOrderCategorization {
    // These are grouped by rough principles, ensuring that any event types
    // categorized at the same level are not conflicting (ie: an unknown event
    // with a file, image, and text block wouldn't get "incorrectly" deemed just
    // a plain file upload).
    //
    // The naming/grouping of these is very much arbitrary. The only consistent
    // piece is smaller numbers being considered first-checked. For example, a
    // parser at "level 10" would be tried before a "level 12" parser.
    OtherMedia = 0, // videos, audio
    ImageMedia = 1,
    RichTextOrFile = 2, // plain files, text with attributes (emotes, notices)
    TextOnly = 3,
}

/**
 * Add an internally-known event type to the parser. This should not be called outside
 * of the SDK itself.
 * @internal
 * @param namespace The namespace for the event.
 * @param factory The event creation factory.
 */
export function addInternalKnownEventParser<
    S extends string,
    U extends string,
    T extends object,
    C extends WireEvent.BlockBasedContent,
>(namespace: NamespacedValue<S, U>, factory: ParsedEventFactory<T, C>): void {
    if (namespace.stable) {
        internalKnownEvents.set(namespace.stable, factory);
    }
    if (namespace.unstable) {
        internalKnownEvents.set(namespace.unstable, factory);
    }
}

/**
 * Add an unknown event parser for a known event type. This should not be called outside
 * of the SDK itself.
 * @param priority The priority of this parser. See InternalOrderCategorization
 * @param parser The parser function.
 * @see InternalOrderCategorization
 */
export function addInternalUnknownEventParser<C extends WireEvent.BlockBasedContent>(
    priority: InternalOrderCategorization,
    parser: UnknownEventParser<C>,
): void {
    // First, find the index we'll want to insert at using a binary search.
    // We use a binary search because it's empirically faster than more traditional
    // approaches for a set size of 10-100 entries.
    // Source: https://stackoverflow.com/a/21822316
    // Validation: https://gist.github.com/turt2live/1f7bdf75a0fb0923fe4bee577471841f
    let lowIdx = 0;
    let highIdx = internalOrderedUnknownCategories.length;
    while (lowIdx < highIdx) {
        const midIdx = (lowIdx + highIdx) >>> 1; // integer division by 2
        if (internalOrderedUnknownCategories[midIdx] < priority) {
            lowIdx = midIdx + 1;
        } else {
            highIdx = midIdx;
        }
    }

    // Splice the new elements into the arrays
    internalOrderedUnknownCategories.splice(lowIdx, 0, priority);
    internalOrderedUnknownParsers.splice(lowIdx, 0, parser);
}

/**
 * Parses known and unknown events to determine their validity. The SDK's internally
 * known events will always be included in the parser: there is no need to add them
 * explicitly.
 *
 * Consumers may wish to adjust the "unknown interpret order" to customize functionality
 * for when the parser encounters an event type it does not have a factory for.
 * @module Event Parsing
 */
export class EventParser {
    private typeMap = new Map<string, ParsedEventFactory<any, any>>(internalKnownEvents);
    private unknownInterpretOrder: UnknownEventParser<any>[] = [...internalOrderedUnknownParsers];

    /**
     * All the known event types for this parser.
     */
    public get knownEventTypes(): string[] {
        return Array.from(this.typeMap.keys());
    }

    /**
     * The default unknown event type parse order. Custom events would normally
     * get prepended to this array to ensure they get checked first.
     */
    public get defaultUnknownEventParsers(): UnknownEventParser<any>[] {
        return [...internalOrderedUnknownParsers];
    }

    /**
     * The unknown event type parsers currently known to this instance.
     */
    public get unknownEventParsers(): UnknownEventParser<any>[] {
        return [...this.unknownInterpretOrder];
    }

    /**
     * Adds or overwrites a known type in the event parser. Does not affect the
     * "unknown event" parse order.
     * @param namespace The namespace for the event type.
     * @param factory The factory used to create the event object.
     */
    public addKnownType<S extends string, U extends string, T extends object, C extends WireEvent.BlockBasedContent>(
        namespace: NamespacedValue<S, U>,
        factory: ParsedEventFactory<T, C>,
    ): void {
        if (namespace.stable) {
            this.typeMap.set(namespace.stable, factory);
        }
        if (namespace.unstable) {
            this.typeMap.set(namespace.unstable, factory);
        }
    }

    /**
     * Sets the "unknown event type" parser order, where the first element of the
     * provided array will be tried first. The first matching parser will be used.
     *
     * Note that this overwrites the parsers rather than appends/prepends: callers
     * should use the defaultUnknownEventParsers property to prepend their custom
     * events prior to calling this set function.
     * @param ordered The parsers, ordered by which parser should be tried first.
     * @see defaultUnknownEventParsers
     */
    public setUnknownParsers<C extends WireEvent.BlockBasedContent = WireEvent.BlockBasedContent>(
        ordered: UnknownEventParser<C>[],
    ): void {
        this.unknownInterpretOrder = ordered;
    }

    /**
     * Parses an event. If the event type is known to the parser, it will be parsed
     * as that type. If the event type is unknown, the "unknown event" parsers will
     * be used to return an appropriate type. If no parser applies after both sets
     * are checked, undefined is returned.
     *
     * An event returned by this function might have different attributes (event type,
     * content, etc) than the event supplied in the function: this is to allow callers
     * to check what type of event the parser is treating given type as. For example,
     * if an `org.example.sample` event type was given here, the function might return
     * an event type which matches `m.message`.
     *
     * Note that this function can throw InvalidBlockError and InvalidEventError, or
     * other errors, if the given event is unforgivably unable to be parsed.
     * @param event The event to try parsing.
     * @returns The parsed event, or undefined if unable.
     */
    public parse(event: WireEvent.RoomEvent): RoomEvent | undefined {
        if (this.typeMap.has(event.type)) {
            return this.typeMap.get(event.type)!(event);
        }
        for (const parser of this.unknownInterpretOrder) {
            try {
                const ev = parser(event);
                if (ev !== undefined) return ev;
            } catch (e) {
                if (e instanceof InvalidEventError || e instanceof InvalidBlockError) {
                    // consume these errors - we'll just try the next parser
                } else {
                    throw e; // definitely re-throw everything else though
                }
            }
        }
        return undefined; // unknown event
    }
}
