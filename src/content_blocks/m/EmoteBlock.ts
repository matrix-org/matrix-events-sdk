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

import {MarkupBlock, WireMarkupBlock} from "./MarkupBlock";
import {ObjectBlock} from "../ObjectBlock";
import {EitherAnd} from "../../types";
import {Schema} from "ajv";
import {AjvContainer} from "../../AjvContainer";
import {UnstableValue} from "../../NamespacedValue";
import {InvalidBlockError} from "../InvalidBlockError";
import {LazyValue} from "../../LazyValue";

/**
 * Types for emote blocks over the wire.
 * @module Matrix Content Blocks
 * @see EmoteBlock
 */
export module WireEmoteBlock {
    type Primary = {[MarkupBlock.type.name]: WireMarkupBlock.Representation[]};
    type Secondary = {[MarkupBlock.type.altName]: WireMarkupBlock.Representation[]};
    export type Value = EitherAnd<Primary, Secondary>;
}

/**
 * An "emote" block, or a block meant to represent that the surrounding event can
 * be rendered as an emote. Contains a MarkupBlock internally.
 * @module Matrix Content Blocks
 * @see MarkupBlock
 */
export class EmoteBlock extends ObjectBlock<WireEmoteBlock.Value> {
    public static readonly schema: Schema = AjvContainer.eitherAnd(MarkupBlock.type, MarkupBlock.schema);

    public static readonly validateFn = AjvContainer.ajv.compile(EmoteBlock.schema);

    public static readonly type = new UnstableValue("m.emote", "org.matrix.msc1767.emote");

    private lazyMarkup = new LazyValue(() => new MarkupBlock(MarkupBlock.type.findIn(this.raw)!));

    public constructor(raw: WireEmoteBlock.Value) {
        super(EmoteBlock.type.stable!, raw);
        if (!EmoteBlock.validateFn(raw)) {
            throw new InvalidBlockError(this.name, EmoteBlock.validateFn.errors);
        }
    }

    public get markup(): MarkupBlock {
        return this.lazyMarkup.value;
    }
}
