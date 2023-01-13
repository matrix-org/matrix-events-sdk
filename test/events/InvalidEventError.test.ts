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

import {InvalidEventError} from "../../src";

describe("InvalidEventError", () => {
    it("should use the block name in the error", () => {
        const err = new InvalidEventError("org.example.test", "my message");
        expect(err.message).toEqual("org.example.test: my message");
    });

    it("should use error objects if given", () => {
        const err = new InvalidEventError("org.example.test", [
            {
                message: "test message",
                keyword: "test",
                params: [],
                instancePath: "#/unused",
                schemaPath: "#/unused",
            },
            {
                // message: "test message", // this one has no message
                keyword: "test",
                params: [],
                instancePath: "#/unused",
                schemaPath: "#/unused",
            },
        ]);
        expect(err.message).toEqual(
            'org.example.test: test message, {"keyword":"test","params":[],"instancePath":"#/unused","schemaPath":"#/unused"}',
        );
    });

    it.each([null, undefined])("should use a default message when none is provided: '%s'", val => {
        const err = new InvalidEventError("org.example.test", val);
        expect(err.message).toEqual("org.example.test: Validation failed");
    });
});
