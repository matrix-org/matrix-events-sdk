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

import {RoomEvent} from "../RoomEvent";
import {MarkupBlock, WireMarkupBlock} from "../../content_blocks/m/MarkupBlock";
import {EitherAnd} from "../../types";
import {Schema} from "ajv";
import {AjvContainer} from "../../AjvContainer";
import {UnstableValue} from "../../NamespacedValue";
import {WireEvent} from "../types_wire";
import {InvalidEventError} from "../InvalidEventError";
import {LazyValue} from "../../LazyValue";
import {addInternalKnownEventParser, addInternalUnknownEventParser, InternalOrderCategorization} from "../EventParser";

/**
 * Types for message events over the wire.
 * @module Matrix Events
 * @see MessageEvent
 */
export module WireMessageEvent {
    type PrimaryContent = {[MarkupBlock.type.name]: WireMarkupBlock.Representation[]};
    type SecondaryContent = {[MarkupBlock.type.altName]: WireMarkupBlock.Representation[]};
    export type ContentValue = EitherAnd<PrimaryContent, SecondaryContent>;
}

/**
 * A message event, containing a MarkupBlock for content.
 * @module Matrix Events
 * @see MarkupBlock
 */
export class MessageEvent extends RoomEvent<WireMessageEvent.ContentValue> {
    public static readonly contentSchema: Schema = AjvContainer.eitherAnd(MarkupBlock.type, MarkupBlock.schema);
    public static readonly contentValidateFn = AjvContainer.ajv.compile(MessageEvent.contentSchema);

    public static readonly type = new UnstableValue("m.message", "org.matrix.msc1767.message");

    private lazyMarkup = new LazyValue(() => new MarkupBlock(MarkupBlock.type.findIn(this.content)!));

    static {
        // Register the event type as a default event type
        addInternalKnownEventParser(
            MessageEvent.type,
            (x: WireEvent.RoomEvent<WireMessageEvent.ContentValue>) => new MessageEvent(x),
        );

        // Also register an unknown event parser for handling
        addInternalUnknownEventParser(InternalOrderCategorization.TextOnly, x => {
            if (MarkupBlock.type.findIn(x.content)) {
                return new MessageEvent({
                    ...x,
                    type: MessageEvent.type.name,
                });
            } else {
                return undefined; // not likely to be parsable by us
            }
        });
    }

    public constructor(raw: WireEvent.RoomEvent<WireMessageEvent.ContentValue>) {
        super(MessageEvent.type.stable!, raw, false);
        if (!MessageEvent.contentValidateFn(this.content)) {
            throw new InvalidEventError(this.name, MessageEvent.contentValidateFn.errors);
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
