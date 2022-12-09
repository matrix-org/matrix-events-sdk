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

import {MarkupBlock, MarkupRepresentation} from "./MarkupBlock";
import {ObjectBlock} from "../ObjectBlock";
import {EitherAnd} from "../../types";
import {Schema} from "ajv";
import {AjvContainer} from "../../AjvContainer";
import {UnstableValue} from "../../NamespacedValue";
import {InvalidBlockError} from "../InvalidBlockError";

type Primary = {[MarkupBlock.type.name]: MarkupRepresentation[]};
type Secondary = {[MarkupBlock.type.altName]: MarkupRepresentation[]};
type Value = EitherAnd<Primary, Secondary>;

/**
 * A "notice" block, or a block meant to represent that the surrounding event can
 * be rendered as a notice. Contains a MarkupBlock internally.
 * @module Matrix Content Blocks
 * @see MarkupBlock
 */
export class NoticeBlock extends ObjectBlock<Value> {
    public static readonly schema: Schema = AjvContainer.eitherAnd(MarkupBlock.type, MarkupBlock.schema);

    public static readonly validateFn = AjvContainer.ajv.compile(NoticeBlock.schema);

    public static readonly type = new UnstableValue("m.notice", "org.matrix.msc1767.notice");

    public constructor(raw: Value) {
        super(NoticeBlock.type.stable!, raw);
        if (!NoticeBlock.validateFn(raw)) {
            throw new InvalidBlockError(this.name, NoticeBlock.validateFn.errors);
        }
    }

    public get markup(): MarkupBlock {
        return new MarkupBlock(MarkupBlock.type.findIn(this.raw)!);
    }
}
