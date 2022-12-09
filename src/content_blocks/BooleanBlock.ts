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
import {Schema} from "ajv";
import {AjvContainer} from "../AjvContainer";

/**
 * Represents a boolean-based content block.
 * @module Content Blocks
 */
export abstract class BooleanBlock extends BaseBlock<boolean> {
    public static readonly schema: Schema = {
        type: "boolean",
        errorMessage: "should be a boolean value",
    };

    public static readonly validateFn = AjvContainer.ajv.compile(BooleanBlock.schema);

    /**
     * Creates a new IntegerBlock.
     * @param name The name of the block, for error messages and debugging.
     * @param raw The block's value.
     * @protected
     */
    protected constructor(name: string, raw: boolean) {
        super(name, raw);
        if (!BooleanBlock.validateFn(raw)) {
            throw new InvalidBlockError(name, BooleanBlock.validateFn.errors);
        }
    }
}
