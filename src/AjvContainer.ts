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

import Ajv, {Schema, SchemaObject} from "ajv";
import AjvErrors from "ajv-errors";
import {NamespacedValue} from "./NamespacedValue";

export class AjvContainer {
    public static readonly ajv = new Ajv({
        allErrors: true,
    });

    static {
        AjvErrors(AjvContainer.ajv);
    }

    /* istanbul ignore next */
    // noinspection JSUnusedLocalSymbols
    private constructor() {}

    /**
     * Creates a JSON Schema representation of the EitherAnd<> TypeScript type.
     * @param ns The namespace to use in the EitherAnd<> type.
     * @param schema The schema to use as a value type for the namespace options.
     * @returns The EitherAnd<> type as a JSON Schema.
     */
    public static eitherAnd<S extends string = string, U extends string = string>(
        ns: NamespacedValue<S, U>,
        schema: Schema,
    ): {anyOf: SchemaObject[]; errorMessage: string} {
        // Dev note: ajv currently doesn't have a useful type for this stuff, but ideally it'd be smart enough to
        // have an "anyOf" type we can return.
        // Also note that we don't use oneOf: we manually construct it through a Type A, or Type B, or Type A+B list.
        if (!ns.altName) {
            throw new Error("Cannot create an EitherAnd<> JSON schema type without both stable and unstable values");
        }
        return {
            errorMessage: `schema does not apply to ${ns.stable} or ${ns.unstable}`,
            anyOf: [
                {
                    type: "object",
                    properties: {
                        [ns.name]: schema,
                    },
                    required: [ns.name],
                    errorMessage: {
                        properties: {
                            [ns.name]: `${ns.name} is required`,
                        },
                    },
                },
                {
                    type: "object",
                    properties: {
                        [ns.altName]: schema,
                    },
                    required: [ns.altName],
                    errorMessage: {
                        properties: {
                            [ns.altName]: `${ns.altName} is required`,
                        },
                    },
                },
                {
                    type: "object",
                    properties: {
                        [ns.name]: schema,
                        [ns.altName]: schema,
                    },
                    required: [ns.name, ns.altName],
                    errorMessage: {
                        properties: {
                            [ns.name]: `${ns.name} is required`,
                            [ns.altName]: `${ns.altName} is required`,
                        },
                    },
                },
            ],
        };
    }
}
