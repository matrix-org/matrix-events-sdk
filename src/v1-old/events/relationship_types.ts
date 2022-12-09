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

import {NamespacedValue} from "../../NamespacedValue";
import {DefaultNever, TSNamespace} from "../types";

/**
 * The namespaced value for an m.reference relation
 */
export const REFERENCE_RELATION = new NamespacedValue("m.reference");

/**
 * Represents any relation type
 */
export type ANY_RELATION = TSNamespace<typeof REFERENCE_RELATION> | string;

/**
 * An m.relates_to relationship
 */
export type RELATES_TO_RELATIONSHIP<R = never, C = never> = {
    "m.relates_to": {
        // See https://github.com/microsoft/TypeScript/issues/23182#issuecomment-379091887 for array syntax
        rel_type: [R] extends [never] ? ANY_RELATION : TSNamespace<R>;
        event_id: string;
    } & DefaultNever<C, {}>;
};
