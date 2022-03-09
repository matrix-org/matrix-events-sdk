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

import { EventType, isEventTypeSame } from "../utility/events";
import { IPartialEvent } from "../IPartialEvent";
import { M_TEXT } from "./message_types";
import { ExtensibleEvent } from "./ExtensibleEvent";
import {
    M_TIMESTAMP,
    M_ASSET,
    M_LOCATION,
    LocationAssetType,
    LocationEventWireContent,
    MAssetContent,
    MLocationContent,
} from "./location_types";

export const getTextForEvent = (uri: string, assetType: LocationAssetType, timestamp: number, description?: string): string => {
    const date = `at ${new Date(timestamp).toISOString()}`;
    const assetName = assetType === LocationAssetType.Self ? 'User' : undefined;
    const quotedDescription = description ? `"${description}"` : undefined;

    return [
        assetName,
        'Location',
        quotedDescription,
        uri,
        date,
    ].filter(Boolean).join(' ');
};

export class LocationEvent extends ExtensibleEvent<LocationEventWireContent> {
    public readonly geoUri: string;
    public readonly assetType: LocationAssetType;
    public readonly timestamp: number;
    public readonly text: string;
    public readonly description?: string;

    public constructor(wireFormat: IPartialEvent<LocationEventWireContent>) {
        super(wireFormat);

        const location = M_LOCATION.findIn<MLocationContent>(this.wireContent);
        const asset = M_ASSET.findIn<MAssetContent>(this.wireContent);
        const timestamp = M_TIMESTAMP.findIn<number>(this.wireContent);
        const text = M_TEXT.findIn<string>(this.wireContent);

        this.geoUri = location?.uri ?? this.wireContent?.geo_uri;
        this.description = location?.description;
        this.assetType = asset?.type ?? LocationAssetType.Self;
        this.text = text ?? this.wireContent.body;
        this.timestamp = timestamp;
    }

    public isEquivalentTo(primaryEventType: EventType): boolean {
        return isEventTypeSame(primaryEventType, M_LOCATION);
    }

    public serialize(): IPartialEvent<LocationEventWireContent> {
        return {
            type: "m.room.message",
            content: {
                body: this.text,
                msgtype: M_LOCATION.name,
                geo_uri: this.geoUri,
                [M_LOCATION.name]: {
                    description: this.description,
                    uri: this.geoUri,
                },
                [M_ASSET.name]: {
                    type: this.assetType,
                },
                [M_TEXT.name]: this.text,
                ...(this.timestamp ? { [M_TIMESTAMP.name]: this.timestamp } : {}),
            },
        };
    }

    /**
     * Creates a new LocationEvent
     * @param text a text for of our location
     * @param uri a geo:// uri for the location
     * @param ts the timestamp when the location was correct (milliseconds since the UNIX epoch)
     * @param description the (optional) label for this location on the map
     * @param assetType the (optional) asset type of this location e.g. "m.self"
     */
    public static from(
        uri: string,
        timestamp: number,
        description?: string,
        assetType?: LocationAssetType,
    ): LocationEvent {
        const text = getTextForEvent(uri, assetType || LocationAssetType.Self, timestamp, description);
        return new LocationEvent({
            type: M_LOCATION.name,
            content: {
                msgtype: M_LOCATION.name,
                body: text,
                geo_uri: uri,
                [M_LOCATION.name]: {
                    description,
                    uri,
                },
                [M_ASSET.name]: {
                    type: assetType,
                },
                [M_TEXT.name]: text,
                [M_TIMESTAMP.name]: timestamp,
            },
        });
    }
}
