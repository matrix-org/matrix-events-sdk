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

import {AjvContainer} from "../src/AjvContainer";
import {NamespacedValue} from "../src";

describe("AjvContainer", () => {
    describe("eitherAnd", () => {
        it("should reject a namespaced value missing an altName", () => {
            expect(() => {
                AjvContainer.eitherAnd(new NamespacedValue("stable", null), {type: "object"});
            }).toThrow(
                new Error("Cannot create an EitherAnd<> JSON schema type without both stable and unstable values"),
            );
        });

        it("should generate an appropriate schema type", () => {
            const result = AjvContainer.eitherAnd(new NamespacedValue("stable", "unstable"), {
                type: "object",
                properties: {test: {type: "string"}},
            });
            expect(result).toMatchSnapshot();
        });
    });
});
