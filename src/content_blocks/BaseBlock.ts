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

import {ContentBlockWire} from "./types_wire";
import {InvalidBlockError} from "./InvalidBlockError";

/**
 * The simplest form of a content block in its parsed form.
 * @module Content Blocks
 */
export abstract class BaseBlock<T extends ContentBlockWire.Value> {
    private _raw: T | undefined = undefined;

    public get raw(): T {
        return this._raw!;
    }

    protected set raw(val: T) {
        if (val === undefined || val === null) {
            throw new InvalidBlockError(
                this.name,
                "Block value must be defined. Use a null-capable parser instead of passing such a value.",
            );
        }

        this._raw = val;
    }

    /**
     * Creates a new BaseBlock.
     * @param name The name of the block, for error messages and debugging.
     * @param raw The block's value.
     * @protected
     */
    protected constructor(public readonly name: string, raw: T) {
        this.raw = raw; // reuse validation logic
    }
}
