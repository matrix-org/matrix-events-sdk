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

import {InvalidBlockError} from "./InvalidBlockError";
import {BaseBlock} from "./BaseBlock";
import {ContentBlockWire} from "./types_wire";
import {Schema} from "ajv";
import {AjvContainer} from "../AjvContainer";

/**
 * Represents an array-based content block.
 * @module Content Blocks
 */
export abstract class ArrayBlock<TItem extends ContentBlockWire.Value> extends BaseBlock<TItem[]> {
    public static readonly schema: Schema = {
        type: "array",
        errorMessage: "should be an array value",
    };

    public static readonly validateFn = AjvContainer.ajv.compile(ArrayBlock.schema);

    /**
     * Creates a new ArrayBlock.
     * @param name The name of the block, for error messages and debugging.
     * @param raw The block's value.
     * @protected
     */
    protected constructor(name: string, raw: TItem[]) {
        super(name, raw);
        if (!ArrayBlock.validateFn(raw)) {
            throw new InvalidBlockError(name, ArrayBlock.validateFn.errors);
        }
    }
}
