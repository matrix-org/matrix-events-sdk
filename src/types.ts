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

/**
 * Represents an optional type: can either be T or a falsy value.
 */
export type Optional<T> = T | null | undefined;

/**
 * Determines if the given optional string is a defined string.
 * @param {Optional<string>} s The input string.
 * @returns {boolean} True if the input is a defined string.
 */
export function isOptionalAString(s: Optional<string>): boolean {
    return isProvided(s) && (typeof s) === 'string';
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
 * Represents either just T1, just T2, or T1 and T2 mixed.
 */
export type EitherAnd<T1, T2> = (T1 & T2) | T1 | T2;
