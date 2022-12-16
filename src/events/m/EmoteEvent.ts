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

import {WireMessageEvent} from "./MessageEvent";
import {WireEvent} from "../types_wire";
import {UnstableValue} from "../../NamespacedValue";
import {MarkupBlock} from "../../content_blocks/m/MarkupBlock";
import {RoomEvent} from "../RoomEvent";
import {Schema} from "ajv";
import {AjvContainer} from "../../AjvContainer";
import {LazyValue} from "../../LazyValue";
import {InvalidEventError} from "../InvalidEventError";
import {addInternalKnownEventParser, addInternalUnknownEventParser, InternalOrderCategorization} from "../EventParser";
import {EmoteBlock, WireEmoteBlock} from "../../content_blocks/m/EmoteBlock";

/**
 * Types for emote events over the wire.
 * @module Matrix Events
 * @see EmoteEvent
 */
export module WireEmoteEvent {
    export type ContentValue = WireMessageEvent.ContentValue;
}

/**
 * An emote event, containing a MarkupBlock for content.
 * @module Matrix Events
 * @see MarkupBlock
 */
export class EmoteEvent extends RoomEvent<WireEmoteEvent.ContentValue> {
    public static readonly contentSchema: Schema = AjvContainer.eitherAnd(MarkupBlock.type, MarkupBlock.schema);
    public static readonly contentValidateFn = AjvContainer.ajv.compile(EmoteEvent.contentSchema);
    public static readonly type = new UnstableValue("m.emote", "org.matrix.msc1767.emote");

    private lazyMarkup = new LazyValue(() => new MarkupBlock(MarkupBlock.type.findIn(this.content)!));

    static {
        // Register the event type as a default event type
        addInternalKnownEventParser(
            EmoteEvent.type,
            (x: WireEvent.RoomEvent<WireEmoteEvent.ContentValue>) => new EmoteEvent(x),
        );

        // Also register an unknown event parser for handling
        addInternalUnknownEventParser(InternalOrderCategorization.RichTextOrFile, x => {
            const possibleBlock = EmoteBlock.type.findIn(x.content);
            if (!!possibleBlock) {
                const block = new EmoteBlock(possibleBlock as WireEmoteBlock.Value);
                return new EmoteEvent({
                    ...x,
                    type: EmoteEvent.type.name,
                    content: block.raw, // extract the `m.markup` block out of the `m.emote` block
                });
            } else {
                return undefined; // not likely to be parsable by us
            }
        });
    }

    public constructor(raw: WireEvent.RoomEvent<WireMessageEvent.ContentValue>) {
        super(EmoteEvent.type.stable!, raw, false);
        if (!EmoteEvent.contentValidateFn(this.content)) {
            throw new InvalidEventError(this.name, EmoteEvent.contentValidateFn.errors);
        }
    }

    /**
     * The markup block for the event.
     */
    public get markup(): MarkupBlock {
        return this.lazyMarkup.value;
    }

    /**
     The text representation of the event, if one is present.
     */
    public get text(): string | undefined {
        return this.markup.text;
    }

    /**
     The HTML representation of the event, if one is present.
     */
    public get html(): string | undefined {
        return this.markup.html;
    }
}
