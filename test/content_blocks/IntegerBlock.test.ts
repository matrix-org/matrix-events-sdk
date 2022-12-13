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

import {IntegerBlock} from "../../src/content_blocks/IntegerBlock";
import {InvalidBlockError} from "../../src/content_blocks/InvalidBlockError";
import {testSharedContentBlockInputs} from "./BaseBlock.test";

class TestIntegerBlock extends IntegerBlock {
    public constructor(raw: any) {
        super("TestBlock", raw as number); // lie to TS
    }
}

describe("IntegerBlock", () => {
    testSharedContentBlockInputs("TestBlock", -1, x => new TestIntegerBlock(x));

    it("should accept integers", () => {
        const block = new TestIntegerBlock(42);
        expect(block.raw).toStrictEqual(42);
    });

    it("should decline floats", () => {
        expect(() => new TestIntegerBlock(42.1)).toThrow(
            new InvalidBlockError("TestBlock", "should be an integer value"),
        );
    });
});
