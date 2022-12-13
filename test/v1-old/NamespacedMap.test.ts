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

import {NamespacedMap, NamespacedValue, UnstableValue} from "../../src";
import {STABLE_VALUE, UNSTABLE_VALUE} from "../NamespacedValue.test";

type TestableNamespacedMap<V> = {internalMap: Map<string, V>} & NamespacedMap<V>;
function asTestableMap<V>(map: NamespacedMap<V>): TestableNamespacedMap<V> {
    return map as TestableNamespacedMap<V>;
}

const STABLE_UNSTABLE_NS = new NamespacedValue(`${STABLE_VALUE}.st_ust`, `${UNSTABLE_VALUE}.st_ust`);
const STABLE_ONLY_NS = new NamespacedValue(`${STABLE_VALUE}.st_only`, null);
const UNSTABLE_ONLY_NS = new UnstableValue(null, `${UNSTABLE_VALUE}.ust_only`);

describe("NamespacedMap", () => {
    it("should support no initial entries", () => {
        const map = asTestableMap(new NamespacedMap<string>());
        expect(map.internalMap.size).toBe(0);
    });

    it("should support initial entries", () => {
        const map = asTestableMap(
            new NamespacedMap<string>([
                [STABLE_UNSTABLE_NS, "val1"],
                [STABLE_ONLY_NS, "val2"],
                [UNSTABLE_ONLY_NS, "val3"],
            ]),
        );
        expect(map.internalMap.size).toBe(4);
        expect(map.internalMap.get(STABLE_UNSTABLE_NS.name)).toBe("val1");
        expect(map.internalMap.get(STABLE_UNSTABLE_NS.altName ?? "TEST_FAIL")).toBe("val1");
        expect(map.internalMap.get(STABLE_ONLY_NS.name)).toBe("val2");
        expect(map.internalMap.get(STABLE_ONLY_NS.altName ?? "TEST_FAIL")).toBeFalsy();
        expect(map.internalMap.get(UNSTABLE_ONLY_NS.name)).toBe("val3");
        expect(map.internalMap.get(UNSTABLE_ONLY_NS.altName)).toBeFalsy();
    });

    it("should set both stable and unstable", () => {
        const map = asTestableMap(new NamespacedMap<string>());
        map.set(STABLE_UNSTABLE_NS, "val1");
        expect(map.internalMap.size).toBe(2);
        expect(map.internalMap.get(STABLE_UNSTABLE_NS.name)).toBe("val1");
        expect(map.internalMap.get(STABLE_UNSTABLE_NS.altName ?? "TEST_FAIL")).toBe("val1");
        expect(map.hasNamespaced(STABLE_UNSTABLE_NS.name)).toBe(true);
        expect(map.hasNamespaced(STABLE_UNSTABLE_NS.altName ?? "TEST_FAIL")).toBe(true);
        expect(map.getNamespaced(STABLE_UNSTABLE_NS.name)).toBe("val1");
        expect(map.getNamespaced(STABLE_UNSTABLE_NS.altName ?? "TEST_FAIL")).toBe("val1");
        expect(map.has(STABLE_UNSTABLE_NS)).toBe(true);
        expect(map.get(STABLE_UNSTABLE_NS)).toBe("val1");
    });

    it("should lookup by altName (unstable) if it is the only option", () => {
        const map = asTestableMap(new NamespacedMap<string>());
        map.set(STABLE_UNSTABLE_NS, "val1");
        const tempNs = new NamespacedValue("wrong_stable", STABLE_UNSTABLE_NS.unstable);
        expect(map.internalMap.size).toBe(2);
        expect(map.internalMap.get(tempNs.name ?? "TEST_FAIL")).toBeUndefined();
        expect(map.internalMap.get(tempNs.altName ?? "TEST_FAIL")).toBe("val1");
        expect(map.hasNamespaced(tempNs.name ?? "TEST_FAIL")).toBe(false);
        expect(map.hasNamespaced(tempNs.altName ?? "TEST_FAIL")).toBe(true);
        expect(map.getNamespaced(tempNs.name ?? "TEST_FAIL")).toBeUndefined();
        expect(map.getNamespaced(tempNs.altName ?? "TEST_FAIL")).toBe("val1");
        expect(map.has(tempNs)).toBe(true);
        expect(map.get(tempNs)).toBe("val1");
    });

    describe("get", () => {
        it("should return null if no valid keys are found", () => {
            const map = asTestableMap(new NamespacedMap<string>());
            expect(map.internalMap.size).toBe(0);
            expect(map.get(STABLE_UNSTABLE_NS)).toBeNull();
        });
    });

    it("should only set stable if available", () => {
        const map = asTestableMap(new NamespacedMap<string>());
        map.set(STABLE_ONLY_NS, "val1");
        expect(map.internalMap.size).toBe(1);
        expect(map.internalMap.get(STABLE_ONLY_NS.name)).toBe("val1");
        expect(map.internalMap.get(STABLE_ONLY_NS.altName ?? "TEST_FAIL")).toBeFalsy();
        expect(map.hasNamespaced(STABLE_ONLY_NS.name)).toBe(true);
        expect(map.hasNamespaced(STABLE_ONLY_NS.altName ?? "TEST_FAIL")).toBe(false);
        expect(map.getNamespaced(STABLE_ONLY_NS.name)).toBe("val1");
        expect(map.getNamespaced(STABLE_ONLY_NS.altName ?? "TEST_FAIL")).toBeFalsy();
        expect(map.has(STABLE_ONLY_NS)).toBe(true);
        expect(map.get(STABLE_ONLY_NS)).toBe("val1");
    });

    it("should only set unstable if available", () => {
        const map = asTestableMap(new NamespacedMap<string>());
        map.set(UNSTABLE_ONLY_NS, "val1");
        expect(map.internalMap.size).toBe(1);
        expect(map.internalMap.get(UNSTABLE_ONLY_NS.name)).toBe("val1");
        expect(map.internalMap.get(UNSTABLE_ONLY_NS.altName)).toBeFalsy();
        expect(map.hasNamespaced(UNSTABLE_ONLY_NS.name)).toBe(true);
        expect(map.hasNamespaced(UNSTABLE_ONLY_NS.altName)).toBe(false);
        expect(map.getNamespaced(UNSTABLE_ONLY_NS.name)).toBe("val1");
        expect(map.getNamespaced(UNSTABLE_ONLY_NS.altName)).toBeFalsy();
        expect(map.has(UNSTABLE_ONLY_NS)).toBe(true);
        expect(map.get(UNSTABLE_ONLY_NS)).toBe("val1");
    });

    it("should delete both keys when requested", () => {
        const map = asTestableMap(new NamespacedMap<string>());
        map.set(STABLE_UNSTABLE_NS, "val1");
        expect(map.internalMap.size).toBe(2);
        map.delete(STABLE_UNSTABLE_NS);
        expect(map.internalMap.size).toBe(0);
    });

    it("should delete just stable when requested", () => {
        const map = asTestableMap(new NamespacedMap<string>());
        map.set(STABLE_ONLY_NS, "val1");
        expect(map.internalMap.size).toBe(1);
        map.delete(STABLE_ONLY_NS);
        expect(map.internalMap.size).toBe(0);
    });

    it("should delete just unstable when requested", () => {
        const map = asTestableMap(new NamespacedMap<string>());
        map.set(UNSTABLE_ONLY_NS, "val1");
        expect(map.internalMap.size).toBe(1);
        map.delete(UNSTABLE_ONLY_NS);
        expect(map.internalMap.size).toBe(0);
    });
});
