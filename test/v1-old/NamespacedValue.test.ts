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

import {NamespacedValue, UnstableValue} from "../../src/v1-old";

export const STABLE_VALUE = "org.example.stable";
export const UNSTABLE_VALUE = "org.example.unstable";

describe("NamespacedValue", () => {
    it("should map stable and unstable", () => {
        const ns = new NamespacedValue(STABLE_VALUE, UNSTABLE_VALUE);
        expect(ns.stable).toBe(STABLE_VALUE);
        expect(ns.unstable).toBe(UNSTABLE_VALUE);
        expect(ns.name).toBe(STABLE_VALUE);
        expect(ns.altName).toBe(UNSTABLE_VALUE);
    });

    it("should support optionally stable values", () => {
        const ns = new NamespacedValue(null, UNSTABLE_VALUE);
        expect(ns.stable).toBeNull();
        expect(ns.unstable).toBe(UNSTABLE_VALUE);
        expect(ns.name).toBe(UNSTABLE_VALUE);
        expect(ns.altName).toBeNull();
    });

    it("should support optionally unstable values", () => {
        const ns = new NamespacedValue(STABLE_VALUE, null);
        expect(ns.stable).toBe(STABLE_VALUE);
        expect(ns.unstable).toBeNull();
        expect(ns.name).toBe(STABLE_VALUE);
        expect(ns.altName).toBeNull();
    });

    it("should not support entirely optional values", () => {
        expect(() => new NamespacedValue(null, null)).toThrow("One of stable or unstable values must be supplied");
    });

    describe("matches", () => {
        it("should check both stable and unstable", () => {
            const ns = new NamespacedValue(STABLE_VALUE, UNSTABLE_VALUE);
            expect(ns.matches(STABLE_VALUE)).toBe(true);
            expect(ns.matches(UNSTABLE_VALUE)).toBe(true);
            expect(ns.matches("NEITHER")).toBe(false);
        });

        it("should not try to match null to an optional value", () => {
            const ns = new NamespacedValue(STABLE_VALUE, null);
            expect(ns.matches(STABLE_VALUE)).toBe(true);
            expect(ns.matches(UNSTABLE_VALUE)).toBe(false);
            expect(ns.matches("NEITHER")).toBe(false);
        });
    });

    describe("findIn", () => {
        it("should locate stable values first", () => {
            const obj = {
                [UNSTABLE_VALUE]: 42,
                [STABLE_VALUE]: 41,
                NEITHER: "failed",
            };
            const ns = new NamespacedValue(STABLE_VALUE, UNSTABLE_VALUE);
            expect(ns.findIn(obj)).toBe(41);
        });

        it("should locate stable when required", () => {
            const obj = {
                // [UNSTABLE_VALUE]: 42,
                [STABLE_VALUE]: 41,
                NEITHER: "failed",
            };
            const ns = new NamespacedValue(STABLE_VALUE, UNSTABLE_VALUE);
            expect(ns.findIn(obj)).toBe(41);
        });

        it("should locate unstable when required", () => {
            const obj = {
                [UNSTABLE_VALUE]: 42,
                // [STABLE_VALUE]: 41,
                NEITHER: "failed",
            };
            const ns = new NamespacedValue(STABLE_VALUE, UNSTABLE_VALUE);
            expect(ns.findIn(obj)).toBe(42);
        });

        it("should not locate anything when not present", () => {
            const obj = {
                // [UNSTABLE_VALUE]: 42,
                // [STABLE_VALUE]: 41,
                NEITHER: "failed",
            };
            const ns = new NamespacedValue(STABLE_VALUE, UNSTABLE_VALUE);
            expect(ns.findIn(obj)).toBeFalsy();
        });
    });

    describe("includedIn", () => {
        it("should locate stable when required", () => {
            const arr = [STABLE_VALUE, /*UNSTABLE_VALUE,*/ "NEITHER"];
            const ns = new NamespacedValue(STABLE_VALUE, UNSTABLE_VALUE);
            expect(ns.includedIn(arr)).toBe(true);
        });

        it("should locate unstable when required", () => {
            const arr = [/*STABLE_VALUE,*/ UNSTABLE_VALUE, "NEITHER"];
            const ns = new NamespacedValue(STABLE_VALUE, UNSTABLE_VALUE);
            expect(ns.includedIn(arr)).toBe(true);
        });

        it("should not locate anything when not present", () => {
            const arr = [/*STABLE_VALUE, UNSTABLE_VALUE,*/ "NEITHER"];
            const ns = new NamespacedValue(STABLE_VALUE, UNSTABLE_VALUE);
            expect(ns.includedIn(arr)).toBe(false);
        });
    });
});

describe("UnstableValue", () => {
    it("should map stable and unstable", () => {
        const ns = new UnstableValue(STABLE_VALUE, UNSTABLE_VALUE);
        expect(ns.stable).toBe(STABLE_VALUE);
        expect(ns.unstable).toBe(UNSTABLE_VALUE);
        expect(ns.name).toBe(UNSTABLE_VALUE); // note the swap from NamespacedValue
        expect(ns.altName).toBe(STABLE_VALUE);
    });

    it("should support optionally stable values", () => {
        const ns = new UnstableValue(null, UNSTABLE_VALUE);
        expect(ns.stable).toBeNull();
        expect(ns.unstable).toBe(UNSTABLE_VALUE);
        expect(ns.name).toBe(UNSTABLE_VALUE);
        expect(ns.altName).toBeNull();
    });

    it("should not support optionally unstable values", () => {
        // @ts-ignore
        expect(() => new UnstableValue(STABLE_VALUE, null)).toThrow("Unstable value must be supplied");
    });

    it("should not support entirely optional values", () => {
        // @ts-ignore
        expect(() => new UnstableValue(null, null)).toThrow("One of stable or unstable values must be supplied");
    });

    describe("matches", () => {
        it("should check both stable and unstable", () => {
            const ns = new UnstableValue(STABLE_VALUE, UNSTABLE_VALUE);
            expect(ns.matches(STABLE_VALUE)).toBe(true);
            expect(ns.matches(UNSTABLE_VALUE)).toBe(true);
            expect(ns.matches("NEITHER")).toBe(false);
        });

        it("should not try to match null to an optional value", () => {
            const ns = new UnstableValue(null, UNSTABLE_VALUE);
            expect(ns.matches(STABLE_VALUE)).toBe(false);
            expect(ns.matches(UNSTABLE_VALUE)).toBe(true);
            expect(ns.matches("NEITHER")).toBe(false);
        });
    });

    describe("findIn", () => {
        it("should locate unstable values first", () => {
            const obj = {
                [UNSTABLE_VALUE]: 42,
                [STABLE_VALUE]: 41,
                NEITHER: "failed",
            };
            const ns = new UnstableValue(STABLE_VALUE, UNSTABLE_VALUE);
            expect(ns.findIn(obj)).toBe(42);
        });

        it("should locate stable when required", () => {
            const obj = {
                // [UNSTABLE_VALUE]: 42,
                [STABLE_VALUE]: 41,
                NEITHER: "failed",
            };
            const ns = new UnstableValue(STABLE_VALUE, UNSTABLE_VALUE);
            expect(ns.findIn(obj)).toBe(41);
        });

        it("should locate unstable when required", () => {
            const obj = {
                [UNSTABLE_VALUE]: 42,
                // [STABLE_VALUE]: 41,
                NEITHER: "failed",
            };
            const ns = new UnstableValue(STABLE_VALUE, UNSTABLE_VALUE);
            expect(ns.findIn(obj)).toBe(42);
        });

        it("should not locate anything when not present", () => {
            const obj = {
                // [UNSTABLE_VALUE]: 42,
                // [STABLE_VALUE]: 41,
                NEITHER: "failed",
            };
            const ns = new UnstableValue(STABLE_VALUE, UNSTABLE_VALUE);
            expect(ns.findIn(obj)).toBeFalsy();
        });

        it.each([null, undefined])("shouldn't explode when given a %s object", obj => {
            const ns = new UnstableValue(STABLE_VALUE, UNSTABLE_VALUE);
            expect(ns.findIn(obj)).toBeFalsy();
        });
    });

    describe("includedIn", () => {
        it("should locate stable when required", () => {
            const arr = [STABLE_VALUE, /*UNSTABLE_VALUE,*/ "NEITHER"];
            const ns = new UnstableValue(STABLE_VALUE, UNSTABLE_VALUE);
            expect(ns.includedIn(arr)).toBe(true);
        });

        it("should locate unstable when required", () => {
            const arr = [/*STABLE_VALUE,*/ UNSTABLE_VALUE, "NEITHER"];
            const ns = new UnstableValue(STABLE_VALUE, UNSTABLE_VALUE);
            expect(ns.includedIn(arr)).toBe(true);
        });

        it("should not locate anything when not present", () => {
            const arr = [/*STABLE_VALUE, UNSTABLE_VALUE,*/ "NEITHER"];
            const ns = new UnstableValue(STABLE_VALUE, UNSTABLE_VALUE);
            expect(ns.includedIn(arr)).toBe(false);
        });
    });
});
