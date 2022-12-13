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

import {WireContentBlock} from "../content_blocks/types_wire";

/**
 * The wire types for Matrix events.
 * @module Events
 */
export module WireEvent {
    /**
     * A Matrix event. Also called a ClientEvent by the Matrix Specification.
     * @module Events
     */
    interface RoomEvent<Content extends object = object> {
        room_id: string;
        event_id: string;
        type: string;
        state_key?: string;
        sender: string;
        content: Content;
        origin_server_ts: number;
        unsigned?: object;
    }

    /**
     * A simple `content` schema for content block-supporting events.
     * @module Events
     */
    type BlockBasedContent = {
        [k: string]: WireContentBlock.Value;
    };

    /**
     * An event's specific `content`, preventing unexplained extensibility at the
     * type system level.
     * @module Events
     */
    type BlockSpecificContent<Blocks extends BlockBasedContent> = Blocks & {[k: string]: never};
}
