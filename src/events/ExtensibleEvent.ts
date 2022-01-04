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

import { IPartialEvent } from "../IPartialEvent";

/**
 * Represents an Extensible Event in Matrix.
 */
export abstract class ExtensibleEvent<TContent extends object = object> {
    protected constructor(public readonly wireFormat: IPartialEvent<TContent>) {
    }

    /**
     * Shortcut to wireFormat.content
     */
    public get wireContent(): TContent {
        return this.wireFormat.content;
    }

    /**
     * Serializes the event into a format which can be used to send the
     * event to the room.
     * @returns {IPartialEvent<object>} The serialized event.
     */
    public abstract serialize(): IPartialEvent<object>;
}
