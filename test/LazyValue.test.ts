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

import {InvalidEventError, LazyValue} from "../src";

// @ts-ignore - we know we're exposing private fields as public
class TestableLazyValue<T> extends LazyValue<T> {
    public cached: T | undefined;
    public getter: (() => T) | undefined;
}

describe("LazyValue", () => {
    it("should cache the getter's value on read", () => {
        const val = new TestableLazyValue(() => 42);
        expect(val.cached).toBeUndefined();
        expect(val.getter).toBeDefined();

        const ret = val.value;
        expect(ret).toStrictEqual(42);
        expect(val.cached).toStrictEqual(42);
        expect(val.getter).toBeUndefined();
    });

    it.each([null, undefined])("should handle null and undefined as types: '%s'", x => {
        const val = new TestableLazyValue(() => x);
        expect(val.cached).toBeUndefined();
        expect(val.getter).toBeDefined();

        const ret = val.value;
        expect(ret).toStrictEqual(x);
        expect(val.cached).toStrictEqual(x);
        expect(val.getter).toBeUndefined();
    });

    it("should pass errors up normally", () => {
        expect(() => {
            new TestableLazyValue(() => {
                throw new InvalidEventError("TestEvent", "You should see me");
            });
        }).not.toThrow();
        expect(() => {
            new TestableLazyValue(() => {
                throw new InvalidEventError("TestEvent", "You should see me");
            }).value;
        }).toThrow(new InvalidEventError("TestEvent", "You should see me"));
    });
});
