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

export type Optional<T> = T | null | undefined;

export function isOptionalAString(s: Optional<string>): boolean {
    return s === null || s === undefined || (typeof s) === 'string';
}

export function isProvided<T>(s: Optional<T>): boolean {
    return s !== null && s !== undefined;
}

export type EitherAnd<T1, T2> = (T1 & T2) | T1 | T2;
