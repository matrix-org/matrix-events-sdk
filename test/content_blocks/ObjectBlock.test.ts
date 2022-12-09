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
import {ObjectBlock} from "../../src/content_blocks/ObjectBlock";

class TestObjectBlock extends ObjectBlock<any> {
    public constructor(raw: any) {
        super("TestBlock", raw); // lie to TS
    }
}

describe("ObjectBlock", () => {
    it("should retain the block name", () => {
        const block = new TestObjectBlock({});
        expect(block.name).toStrictEqual("TestBlock");
    });

    it.each([null, undefined])("should reject null and undefined: %s", val => {
        expect(() => new TestObjectBlock(val)).toThrow(
            new InvalidBlockError(
                "TestBlock",
                "Block value must be defined. Use a null-capable parser instead of passing such a value.",
            ),
        );
    });

    it.each([{hello: "world"}, {}])("should accept objects: '%s'", val => {
        const block = new TestObjectBlock(val);
        expect(block.raw).toStrictEqual(val);
    });

    it.each([42, "test", "", [], false])("should reject non-objects: '%s'", val => {
        expect(() => new TestObjectBlock(val)).toThrow(new InvalidBlockError("TestBlock", "should be an object value"));
    });
});
