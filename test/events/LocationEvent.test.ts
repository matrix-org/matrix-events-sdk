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

import { IPartialEvent, M_TEXT } from "../../src";
import { LocationEvent } from "../../src/events/LocationEvent";
import {
    M_LOCATION,
    M_ASSET,
    M_TIMESTAMP,
    LocationAssetType,
    LocationEventWireContent,
} from "../../src/events/location_types";

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

    const makeWireEvent = (content: LocationEventWireContent = {}) => ({
        type: "m.room.message",
        sender: '@user:server.org',
        content: {
            ...defaultContent,
            ...content,
        },
    }) as IPartialEvent<LocationEventWireContent>;

    const backwardsCompatibleEvent = makeWireEvent();

    const modernEvent = makeWireEvent();
    // delete backwards compat properties from event
    delete modernEvent.content.body;
    delete modernEvent.content.geo_uri;
    delete modernEvent.content.msgtype;

    const legacyEvent = {
        type: "m.room.message",
        origin_server_ts: 1234,
        content: {
            msgtype: "m.location",
            body: 'Ernie was at geo:51.5008,0.1247;u=35',
            geo_uri: 'geo:51.5008,0.1247;u=35',
        } as LocationEventWireContent,
    };

    it('parses backwards compatible event correctly', () => {
        const event = new LocationEvent(backwardsCompatibleEvent);

        expect(event).toEqual(expect.objectContaining({
            text: defaultContent[M_TEXT.name],
            geoUri: defaultContent[M_LOCATION.name].uri,
            description: defaultContent[M_LOCATION.name].description,
            timestamp: defaultContent[M_TIMESTAMP.name],
            assetType: defaultContent[M_ASSET.name].type,
        }));
    });

    it('parses modern m.location event correctly', () => {
        const event = new LocationEvent(modernEvent);

        expect(event).toEqual(expect.objectContaining({
            text: defaultContent[M_TEXT.name],
            geoUri: defaultContent[M_LOCATION.name].uri,
            description: defaultContent[M_LOCATION.name].description,
            timestamp: defaultContent[M_TIMESTAMP.name],
            assetType: defaultContent[M_ASSET.name].type,
        }));
    });

    it('parses legacy event correctly', () => {
        const event = new LocationEvent(legacyEvent);

        expect(event.text).toEqual(legacyEvent.content.body);
        expect(event.geoUri).toEqual(legacyEvent.content.geo_uri);
        // defaults to self
        expect(event.assetType).toEqual(LocationAssetType.Self);
        expect(event.timestamp).toEqual(undefined);
    });

    it('serializes backwards compatible event correctly', () => {
        const event = new LocationEvent(backwardsCompatibleEvent);

        const serializedEvent = event.serialize();

        expect(serializedEvent).toEqual({
            type: 'm.room.message',
            content: defaultContent,
        });
    });

    it('serializes modern event correctly', () => {
        const event = new LocationEvent(modernEvent);

        const serializedEvent = event.serialize();

        expect(serializedEvent).toEqual({
            type: 'm.room.message',
            content: defaultContent,
        });
    });

    it('serializes legacy event correctly', () => {
        const event = new LocationEvent(legacyEvent);

        const serializedEvent = event.serialize();

        expect(serializedEvent).toEqual({
            type: 'm.room.message',
            content: {
                msgtype: M_LOCATION.name,
                body: legacyEvent.content.body,
                geo_uri: legacyEvent.content.geo_uri,
                [M_LOCATION.name]: {
                    description: undefined,
                    uri: legacyEvent.content.geo_uri,
                },
                [M_ASSET.name]: {
                    type: LocationAssetType.Self,
                },
                [M_TEXT.name]: legacyEvent.content.body,
            },
        });
    });

    it('from() creates correct event', () => {
        const event = LocationEvent.from(
            'geo:-36.24484561954707,175.46884959563613;u=10',
            123,
            'test description',
            LocationAssetType.Pin,
        );

        expect(event).toEqual(expect.objectContaining({
            text: 'Location "test description" geo:-36.24484561954707,175.46884959563613;u=10 at 1970-01-01T00:00:00.123Z',
            geoUri: 'geo:-36.24484561954707,175.46884959563613;u=10',
            description: 'test description',
            timestamp: 123,
            assetType: LocationAssetType.Pin,
        }));
    });

    it('sets event text without description', () => {
        const event = LocationEvent.from(
            'geo:-36.24484561954707,175.46884959563613;u=10',
            123,
            undefined,
            LocationAssetType.Pin,
        );

        expect(event.text).toEqual(
            'Location geo:-36.24484561954707,175.46884959563613;u=10 at 1970-01-01T00:00:00.123Z',
        );
    });

    it('sets event text without asset type', () => {
        const event = LocationEvent.from(
            'geo:-36.24484561954707,175.46884959563613;u=10',
            123,
        );

        expect(event.text).toEqual(
            'User Location geo:-36.24484561954707,175.46884959563613;u=10 at 1970-01-01T00:00:00.123Z',
        );
    });
});
