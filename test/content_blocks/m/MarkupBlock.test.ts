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

import {MarkupBlock} from "../../../src";
import {testSharedContentBlockInputs} from "../BaseBlock.test";

describe("MarkupBlock", () => {
    testSharedContentBlockInputs("m.markup", [{body: "test"}], x => new MarkupBlock(x));

    it("should be able to identify the text and HTML representations", () => {
        const block = new MarkupBlock([
            {body: "neither", mimetype: "text/fail"},
            {body: "text here", mimetype: "text/plain"},
            {body: "html here", mimetype: "text/html"},
        ]);
        // noinspection DuplicatedCode
        expect(block.text).toStrictEqual("text here");
        expect(block.html).toStrictEqual("html here");
        expect(block.representationErrors).toBeDefined();
        expect(block.representationErrors.size).toStrictEqual(0);
        expect(block.representations).toBeDefined();
        expect(block.representations.length).toStrictEqual(3);
        expect(block.representations).toStrictEqual(block.raw);
    });

    it("should detect plain text as representations without mimetypes", () => {
        const block = new MarkupBlock([
            {body: "fail", mimetype: "text/fail"},
            {body: "text here"},
            {body: "html here", mimetype: "text/html"},
        ]);
        // noinspection DuplicatedCode
        expect(block.text).toStrictEqual("text here");
        expect(block.html).toStrictEqual("html here");
        expect(block.representationErrors).toBeDefined();
        expect(block.representationErrors.size).toStrictEqual(0);
        expect(block.representations).toBeDefined();
        expect(block.representations.length).toStrictEqual(3);
        expect(block.representations).toStrictEqual(block.raw);
    });

    it("should be able to handle missing text", () => {
        const block = new MarkupBlock([
            {body: "fail", mimetype: "text/fail"},
            {body: "html here", mimetype: "text/html"},
        ]);
        expect(block.text).toBeUndefined();
        expect(block.html).toStrictEqual("html here");
        expect(block.representationErrors).toBeDefined();
        expect(block.representationErrors.size).toStrictEqual(0);
        expect(block.representations).toBeDefined();
        expect(block.representations.length).toStrictEqual(2);
        expect(block.representations).toStrictEqual(block.raw);
    });

    it("should be able to handle missing HTML", () => {
        const block = new MarkupBlock([
            {body: "fail", mimetype: "text/fail"},
            {body: "text here", mimetype: "text/plain"},
        ]);
        expect(block.text).toStrictEqual("text here");
        expect(block.html).toBeUndefined();
        expect(block.representationErrors).toBeDefined();
        expect(block.representationErrors.size).toStrictEqual(0);
        expect(block.representations).toBeDefined();
        expect(block.representations.length).toStrictEqual(2);
        expect(block.representations).toStrictEqual(block.raw);
    });

    it("should be able to handle neither text or HTML", () => {
        const block = new MarkupBlock([{body: "nothing of use", mimetype: "text/fail"}]);
        expect(block.text).toBeUndefined();
        expect(block.html).toBeUndefined();
        expect(block.representationErrors).toBeDefined();
        expect(block.representationErrors.size).toStrictEqual(0);
        expect(block.representations).toBeDefined();
        expect(block.representations.length).toStrictEqual(1);
        expect(block.representations).toStrictEqual(block.raw);
    });

    it("should use the first text representation", () => {
        let block = new MarkupBlock([{body: "text here"}, {body: "not this text", mimetype: "text/plain"}]);
        // noinspection DuplicatedCode
        expect(block.text).toStrictEqual("text here");
        expect(block.representationErrors).toBeDefined();
        expect(block.representationErrors.size).toStrictEqual(0);
        expect(block.representations).toBeDefined();
        expect(block.representations.length).toStrictEqual(2);
        expect(block.representations).toStrictEqual(block.raw);

        // The same test, but inverting the undefined mimetype for safety
        block = new MarkupBlock([{body: "text here", mimetype: "text/plain"}, {body: "not this text"}]);
        // noinspection DuplicatedCode
        expect(block.text).toStrictEqual("text here");
        expect(block.representationErrors).toBeDefined();
        expect(block.representationErrors.size).toStrictEqual(0);
        expect(block.representations).toBeDefined();
        expect(block.representations.length).toStrictEqual(2);
        expect(block.representations).toStrictEqual(block.raw);
    });

    it("should handle having no representations provided", () => {
        const block = new MarkupBlock([]);
        expect(block.text).toBeUndefined();
        expect(block.html).toBeUndefined();
        expect(block.representationErrors).toBeDefined();
        expect(block.representationErrors.size).toStrictEqual(0);
        expect(block.representations).toBeDefined();
        expect(block.representations.length).toStrictEqual(0);
        expect(block.representations).toStrictEqual(block.raw);
    });

    it("should validate each representation has a defined body", () => {
        const block = new MarkupBlock([{mimetype: "text/plain"} as any]);
        // noinspection DuplicatedCode
        expect(block.text).toBeUndefined();
        expect(block.html).toBeUndefined();
        expect(block.representationErrors).toBeDefined();
        expect(block.representationErrors.size).toStrictEqual(1);
        expect(Array.from(block.representationErrors.entries())[0]).toMatchSnapshot();
        expect(block.representations).toBeDefined();
        expect(block.representations.length).toStrictEqual(0);
        expect(block.representations).toStrictEqual(block.raw);
    });

    it("should validate each representation has a valid body", () => {
        const block = new MarkupBlock([{body: true as any, mimetype: "text/plain"}]);
        // noinspection DuplicatedCode
        expect(block.text).toBeUndefined();
        expect(block.html).toBeUndefined();
        expect(block.representationErrors).toBeDefined();
        expect(block.representationErrors.size).toStrictEqual(1);
        expect(Array.from(block.representationErrors.entries())[0]).toMatchSnapshot();
        expect(block.representations).toBeDefined();
        expect(block.representations.length).toStrictEqual(0);
        expect(block.representations).toStrictEqual(block.raw);
    });

    it("should validate each representation has a valid mimetype", () => {
        const block = new MarkupBlock([{body: "text here", mimetype: true as any}]);
        // noinspection DuplicatedCode
        expect(block.text).toBeUndefined();
        expect(block.html).toBeUndefined();
        expect(block.representationErrors).toBeDefined();
        expect(block.representationErrors.size).toStrictEqual(1);
        expect(Array.from(block.representationErrors.entries())[0]).toMatchSnapshot();
        expect(block.representations).toBeDefined();
        expect(block.representations.length).toStrictEqual(0);
        expect(block.representations).toStrictEqual(block.raw);
    });

    it("should validate each representation is an object", () => {
        const block = new MarkupBlock([true as any]);
        // noinspection DuplicatedCode
        expect(block.text).toBeUndefined();
        expect(block.html).toBeUndefined();
        expect(block.representationErrors).toBeDefined();
        expect(block.representationErrors.size).toStrictEqual(1);
        expect(Array.from(block.representationErrors.entries())[0]).toMatchSnapshot();
        expect(block.representations).toBeDefined();
        expect(block.representations.length).toStrictEqual(0);
        expect(block.representations).toStrictEqual(block.raw);
    });

    it("should remove representations mid-array if they are invalid", () => {
        const block = new MarkupBlock([
            {body: "valid text"},
            {body: "more valid text", mimetype: "text/html"},
            {body: "text here", mimetype: true as any},
            {body: "even more text", mimetype: "text/plain"},
        ]);
        expect(block.text).toStrictEqual("valid text");
        expect(block.html).toStrictEqual("more valid text");
        expect(block.representationErrors).toBeDefined();
        expect(block.representationErrors.size).toStrictEqual(1);
        expect(Array.from(block.representationErrors.entries())[0]).toMatchSnapshot();
        expect(block.representations).toBeDefined();
        expect(block.representations.length).toStrictEqual(3);
        expect(block.representations).toStrictEqual(block.raw);
    });
});
