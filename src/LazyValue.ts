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

/**
 * Represents a lazily-loaded value. When accessed for the first time, the
 * value will be cached for the lifetime of the object. The getter function
 * will be released when the value is cached.
 */
export class LazyValue<T> {
    private cached: T | undefined;
    private getter: (() => T) | undefined;

    public constructor(getter: () => T) {
        // manually copy, so we don't expose the `undefined` type option
        this.getter = getter;
    }

    public get value(): T {
        if (this.getter !== undefined) {
            this.cached = this.getter();
            this.getter = undefined;
        }
        // Force a cast rather than assert because it's possible for `T` to
        // be undefined or null (we don't stop people from making bad decisions
        // in this class).
        return this.cached as T;
    }
}
