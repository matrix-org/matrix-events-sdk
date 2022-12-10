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

import {InvalidBlockError} from "../../../src/content_blocks/InvalidBlockError";
import {EmoteBlock} from "../../../src/content_blocks/m/EmoteBlock";

describe("EmoteBlock", () => {
    it("should have a sensible block name", () => {
        const block = new EmoteBlock({"m.markup": [{body: "test"}]});
        expect(block.name).toStrictEqual("m.emote");
    });

    it.each([null, undefined])("should reject null and undefined: %s", val => {
        expect(() => new EmoteBlock(val as any)).toThrow(
            new InvalidBlockError(
                "m.emote",
                "Block value must be defined. Use a null-capable parser instead of passing such a value.",
            ),
        );
    });

    it("should locate a stable markup block", () => {
        const block = new EmoteBlock({"m.markup": [{body: "test"}]});
        expect(block.markup).toBeDefined();
        expect(block.markup.text).toStrictEqual("test");
    });

    it("should locate an unstable markup block", () => {
        const block = new EmoteBlock({"org.matrix.msc1767.markup": [{body: "test"}]});
        expect(block.markup).toBeDefined();
        expect(block.markup.text).toStrictEqual("test");
    });

    it("should prefer the unstable markup block if both are provided", () => {
        // Dev note: this test will need updating when extensible events becomes stable
        const block = new EmoteBlock({
            "m.markup": [{body: "stable text"}],
            "org.matrix.msc1767.markup": [{body: "unstable text"}],
        });
        expect(block.markup).toBeDefined();
        expect(block.markup.text).toStrictEqual("unstable text");
    });

    it("should error if a markup block is not present", () => {
        expect(() => new EmoteBlock({no_block: true} as any)).toThrow(
            new InvalidBlockError("m.emote", "schema does not apply to m.markup or org.matrix.msc1767.markup"),
        );
    });

    it.each([42, true, [], "test"])("should reject non-emotes: '%s'", val => {
        expect(() => new EmoteBlock(val as any)).toThrow(new InvalidBlockError("m.emote", "should be an object value"));
    });
});
