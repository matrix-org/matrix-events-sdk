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

import { NamespacedValue } from "../NamespacedValue";

/**
 * Represents a potentially namespaced event type.
 */
export type EventType = NamespacedValue<string, string> | string;

/**
 * Determines if two event types are the same, including namespaces.
 * @param {EventType} given The given event type. This will be compared
 * against the expected type.
 * @param {EventType} expected The expected event type.
 * @returns {boolean} True if the given type matches the expected type.
 */
export function isEventTypeSame(given: EventType, expected: EventType): boolean {
    if ((typeof given) === "string") {
        if ((typeof expected) === "string") {
            return expected === given;
        } else {
            return (expected as NamespacedValue<string, string>).matches(given as string);
        }
    } else {
        if ((typeof expected) === "string") {
            return (given as NamespacedValue<string, string>).matches(expected as string);
        } else {
            const expectedNs = expected as NamespacedValue<string, string>;
            const givenNs = given as NamespacedValue<string, string>;
            return expectedNs.matches(givenNs.name) || expectedNs.matches(givenNs.altName);
        }
    }
}
