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

import {ArrayBlock} from "../ArrayBlock";
import {Schema} from "ajv";
import {AjvContainer} from "../../AjvContainer";
import {InvalidBlockError} from "../InvalidBlockError";
import {UnstableValue} from "../../NamespacedValue";

/**
 * Types for markup blocks over the wire.
 * @module Matrix Content Blocks
 * @see MarkupBlock
 */
export module WireMarkupBlock {
    /**
     * A representation of text within a markup block.
     * @module Matrix Content Blocks
     */
    export type Representation = {
        body: string;
        mimetype?: string;
    };
}

/**
 * A "markup" block, or a block meant to communicate human-readable and human-rendered
 * text, with optional mimetype.
 * @module Matrix Content Blocks
 */
export class MarkupBlock extends ArrayBlock<WireMarkupBlock.Representation> {
    public static readonly schema = ArrayBlock.schema;
    public static readonly validateFn = ArrayBlock.validateFn;

    public static readonly type = new UnstableValue("m.markup", "org.matrix.msc1767.markup");

    /**
     * Schema definition for the markup representation (list item) specifically.
     *
     * Note: Schema for the whole markup value type is handled by the ArrayBlock class.
     */
    public static readonly representationSchema: Schema = {
        type: "object",
        properties: {
            body: {
                type: "string",
                nullable: false,
            },
            mimetype: {
                type: "string",
                nullable: false,
            },
        },
        required: ["body"],
        errorMessage: {
            properties: {
                body: "body should be a non-null string and is required",
                mimetype: "mimetype should be a non-null string, or undefined (field not required)",
            },
        },
    };

    /**
     * Validation function for markup representations (list items) specifically.
     *
     * Note: Validation for the whole markup value type is handled by the ArrayBlock class.
     */
    public static readonly representationValidateFn = AjvContainer.ajv.compile(MarkupBlock.representationSchema);

    /**
     * Parse errors for representations. Representations described here are *removed* from the
     * block's `raw` type, thus not being considered for rendering.
     */
    public readonly representationErrors = new Map<
        {index: number; representation: WireMarkupBlock.Representation | unknown},
        InvalidBlockError
    >();

    /**
     * Creates a new MarkupBlock
     *
     * Invalid representations will be removed from the `raw` value, excluding them from rendering.
     * Errors can be found from representationErrors after creating the object.
     * @param raw The block's value.
     */
    public constructor(raw: WireMarkupBlock.Representation[]) {
        super(MarkupBlock.type.stable!, raw);
        this.raw = raw.filter((r, i) => {
            const bool = MarkupBlock.representationValidateFn(r);
            if (!bool) {
                this.representationErrors.set(
                    {
                        index: i,
                        representation: r,
                    },
                    new InvalidBlockError(`m.markup[${i}]`, MarkupBlock.representationValidateFn.errors),
                );
            }
            return bool;
        });
    }

    /**
     * The text representation of the block, if one is present.
     */
    public get text(): string | undefined {
        return this.raw.find(m => m.mimetype === undefined || m.mimetype === "text/plain")?.body;
    }

    /**
     * The HTML representation of the block, if one is present.
     */
    public get html(): string | undefined {
        return this.raw.find(m => m.mimetype === "text/html")?.body;
    }

    /**
     * The ordered representations for this markup block.
     */
    public get representations(): WireMarkupBlock.Representation[] {
        return this.raw;
    }
}
