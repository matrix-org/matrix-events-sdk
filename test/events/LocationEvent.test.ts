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

import { ExtendedWireContent, IPartialEvent, M_TEXT } from "../../src";
import { LocationEvent } from "../../src/events/LocationEvent";
import { MLocationEventContent, M_LOCATION, M_ASSET, M_TIMESTAMP, LocationAssetType } from "../../src/events/location_types";

describe('LocationEvent', () => {
    const defaultContent = {
        "body": "Location geo:-36.24484561954707,175.46884959563613;u=10 at 2022-03-09T11:01:52.443Z",
        "msgtype": M_LOCATION.name,
        "geo_uri": "geo:-36.24484561954707,175.46884959563613;u=10",
        [M_LOCATION.name]: { "uri": "geo:-36.24484561954707,175.46884959563613;u=10", "description": null },
        [M_ASSET.name]: { "type": "m.self" },
        [M_TEXT.name]: "Location geo:-36.24484561954707,175.46884959563613;u=10 at 2022-03-09T11:01:52.443Z",
        [M_TIMESTAMP.name]: 1646823712443,
    } as any;

    const makeWireEvent = (content: Partial<ExtendedWireContent<MLocationEventContent>> = {}) => ({
        type: "m.room.message",
        sender: '@user:server.org',
        content: {
            ...defaultContent,
            ...content,
        },
    }) as IPartialEvent<ExtendedWireContent<MLocationEventContent>>;

    it('constructs event correctly', () => {
        const wireEvent = makeWireEvent();

        const event = new LocationEvent(wireEvent);

        expect(event).toEqual(expect.objectContaining({
            text: defaultContent[M_TEXT.name],
            geoUri: defaultContent[M_LOCATION.name].uri,
            description: defaultContent[M_LOCATION.name].description,
            timestamp: defaultContent[M_TIMESTAMP.name],
            assetType: defaultContent[M_ASSET.name].type,
        }));
    });

    it('defaults asset type to self when no asset event in content', () => {
        const wireEvent = makeWireEvent({
            [M_ASSET.name]: null,
        });

        const event = new LocationEvent(wireEvent);

        expect(event.assetType).toEqual(LocationAssetType.Self);
    });

    it('serializes event correctly', () => {
        const wireEvent = makeWireEvent();

        const event = new LocationEvent(wireEvent);

        const serializedEvent = event.serialize();

        expect(serializedEvent).toEqual({
            type: 'm.room.message',
            content: defaultContent,
        });
    });

    it('from() creates correct event', () => {
        const event = LocationEvent.from(
            'test text',
            'geo:-36.24484561954707,175.46884959563613;u=10',
            123,
            'test description',
            LocationAssetType.Pin,
        );

        expect(event).toEqual(expect.objectContaining({
            text: 'test text',
            geoUri: 'geo:-36.24484561954707,175.46884959563613;u=10',
            description: 'test description',
            timestamp: 123,
            assetType: LocationAssetType.Pin,
        }));
    });
});
