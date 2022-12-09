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

import {InvalidBlockError} from "../../src/content_blocks/InvalidBlockError";
import {BooleanBlock} from "../../src/content_blocks/BooleanBlock";

class TestBooleanBlock extends BooleanBlock {
    public constructor(raw: any) {
        super("TestBlock", raw as boolean); // lie to TS
    }
}

describe("BooleanBlock", () => {
    it("should retain the block name", () => {
        const block = new TestBooleanBlock(false);
        expect(block.name).toStrictEqual("TestBlock");
    });

    it.each([null, undefined])("should reject null and undefined: %s", val => {
        expect(() => new TestBooleanBlock(val)).toThrow(
            new InvalidBlockError(
                "TestBlock",
                "Block value must be defined. Use a null-capable parser instead of passing such a value.",
            ),
        );
    });

    it.each([true, false])("should accept booleans: '%s'", val => {
        const block = new TestBooleanBlock(val);
        expect(block.raw).toStrictEqual(val);
    });

    it.each([42, "test", "", {}, []])("should reject non-booleans: '%s'", val => {
        expect(() => new TestBooleanBlock(val)).toThrow(
            new InvalidBlockError("TestBlock", "should be a boolean value"),
        );
    });
});
