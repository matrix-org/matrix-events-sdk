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

import { UnstableValue } from "../NamespacedValue";
import { EitherAnd } from "../types";
import { M_MESSAGE_EVENT_CONTENT } from "./message_types";

/**
 * Location event types
 * From the spec at:
 * https://github.com/matrix-org/matrix-doc/blob/matthew/location/proposals/3488-location.md
{
    "type": "m.room.message",
    "content": {
        "body": "Matthew was at geo:51.5008,0.1247;u=35 as of Sat Nov 13 18:50:58 2021",
        "msgtype": "m.location",
        "geo_uri": "geo:51.5008,0.1247;u=35",
        "m.location": {
            "uri": "geo:51.5008,0.1247;u=35",
            "description": "Matthew's whereabouts",
        },
        "m.asset": {
            "type": "m.self"
        },
        "m.text": "Matthew was at geo:51.5008,0.1247;u=35 as of Sat Nov 13 18:50:58 2021",
        "m.ts": 1636829458432,
    }
}
*/

export enum LocationAssetType {
    Self = "m.self",
    Live = "m.self.live",
    Default = "m.location",
}

export const M_ASSET = new UnstableValue("m.asset", "org.matrix.msc3488.asset");
export type M_ASSET_CONTENT = { type: LocationAssetType };
/**
 * The event definition for an m.asset event (in content)
 */
export type M_ASSET_EVENT = EitherAnd<{ [M_ASSET.name]: M_ASSET_CONTENT }, { [M_ASSET.altName]: M_ASSET_CONTENT }>;

export const M_TIMESTAMP = new UnstableValue("m.ts", "org.matrix.msc3488.ts");
/**
 * The event definition for an m.ts event (in content)
 */
export type M_TIMESTAMP_EVENT = EitherAnd<{ [M_TIMESTAMP.name]: number }, { [M_TIMESTAMP.altName]: number }>;

export const M_LOCATION = new UnstableValue(
    "m.location", "org.matrix.msc3488.location");

export type M_LOCATION_CONTENT = {
    uri: string;
    description?: string;
};

/**
 * The event definition for an m.location event (in content)
 */
export type M_LOCATION_EVENT = EitherAnd<{ [M_LOCATION.name]: M_LOCATION_CONTENT }, { [M_LOCATION.altName]: M_LOCATION_CONTENT }>;

/**
 * The content for an m.location event
*/
export type M_LOCATION_EVENT_CONTENT = { geo_uri: string } &
    M_TIMESTAMP_EVENT &
    M_LOCATION_CONTENT &
    M_ASSET_CONTENT &
    M_MESSAGE_EVENT_CONTENT;
