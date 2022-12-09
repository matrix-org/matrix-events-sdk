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
import {StringBlock} from "../../src/content_blocks/StringBlock";

class TestStringBlock extends StringBlock {
    public constructor(raw: any) {
        super("TestBlock", raw as string); // lie to TS
    }
}

describe("StringBlock", () => {
    it("should retain the block name", () => {
        const block = new TestStringBlock("test");
        expect(block.name).toStrictEqual("TestBlock");
    });

    it.each([null, undefined])("should reject null and undefined: %s", val => {
        expect(() => new TestStringBlock(val)).toThrow(
            new InvalidBlockError(
                "TestBlock",
                "Block value must be defined. Use a null-capable parser instead of passing such a value.",
            ),
        );
    });

    it("should accept strings", () => {
        const block = new TestStringBlock("test");
        expect(block.raw).toStrictEqual("test");
    });

    it("should accept empty strings", () => {
        const block = new TestStringBlock("");
        expect(block.raw).toStrictEqual("");
    });

    it.each([42, true, {}, []])("should reject non-strings: '%s'", val => {
        expect(() => new TestStringBlock(val)).toThrow(new InvalidBlockError("TestBlock", "should be a string value"));
    });
});
