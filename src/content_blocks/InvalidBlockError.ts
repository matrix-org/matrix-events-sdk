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

import {ErrorObject} from "ajv";

/**
 * Thrown when a content block is unforgivably unparsable.
 * @module Content Blocks
 */
export class InvalidBlockError extends Error {
    public constructor(blockName: string, message: string | ErrorObject[] | null | undefined) {
        super(
            `${blockName}: ${
                typeof message === "string"
                    ? message
                    : message?.map(m => (m.message ? m.message : JSON.stringify(m))).join(", ") ?? "Validation failed"
            }`,
        );
    }
}
