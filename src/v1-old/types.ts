/*
Copyright 2021 - 2022 The Matrix.org Foundation C.I.C.

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

import {NamespacedValue} from "../NamespacedValue";
import {Optional} from "../types";

/**
 * Applies the same behaviour as `Partial<T>`, but using `Optional<T>` instead.
 */
export type OptionalPartial<T> = {
    [P in keyof T]: Optional<T[P]>;
};

/**
 * Determines if the given optional string is a defined string.
 * @param {Optional<string>} s The input string.
 * @returns {boolean} True if the input is a defined string.
 */
export function isOptionalAString(s: Optional<string>): s is string {
    return isProvided(s) && typeof s === "string";
}

/**
 * Determines if the given optional was provided a value.
 * @param {Optional<T>} s The optional to test.
 * @returns {boolean} True if the value is defined.
 */
export function isProvided<T>(s: Optional<T>): boolean {
    return s !== null && s !== undefined;
}

/**
 * TypeScript wrapper for `Number.isFinite`.
 * @param n The number
 * @returns True if the number is finite.
 * @see Number#isFinite
 */
export function isNumberFinite(n: unknown): n is number {
    return Number.isFinite(n);
}

/**
 * Represents either just T1, just T2, or T1 and T2 mixed.
 */
export type EitherAnd<T1, T2> = (T1 & T2) | T1 | T2;

/**
 * Represents the stable and unstable values of a given namespace.
 */
export type TSNamespace<N> = N extends NamespacedValue<infer S, infer U>
    ? TSNamespaceValue<S> | TSNamespaceValue<U>
    : never;

/**
 * Represents a namespaced value, if the value is a string. Used to extract provided types
 * from a TSNamespace<N> (in cases where only stable *or* unstable is provided).
 */
export type TSNamespaceValue<V> = V extends string ? V : never;

/**
 * Creates a type which is V when T is `never`, otherwise T.
 */
// See https://github.com/microsoft/TypeScript/issues/23182#issuecomment-379091887 for details on the array syntax.
export type DefaultNever<T, V> = [T] extends [never] ? V : T;
