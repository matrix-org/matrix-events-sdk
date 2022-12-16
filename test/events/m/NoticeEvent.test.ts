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

import {InvalidEventError, NoticeEvent, WireEvent} from "../../../src";
import {testSharedRoomEventInputs} from "../RoomEvent.test";

describe("NoticeEvent", () => {
    testSharedRoomEventInputs("m.notice", undefined, x => new NoticeEvent(x), {"m.markup": [{body: "test"}]});

    const templateEvent: WireEvent.RoomEvent = {
        room_id: "!test:example.org",
        event_id: "$event",
        type: "m.notice",
        sender: "@user:example.org",
        content: {},
        origin_server_ts: 1670894499800,
    };

    it("should locate a stable markup block", () => {
        const block = new NoticeEvent({...templateEvent, content: {"m.markup": [{body: "test"}]}});
        expect(block.markup).toBeDefined();
        expect(block.markup.text).toStrictEqual("test");
        expect(block.text).toStrictEqual("test");
    });

    it("should locate an unstable markup block", () => {
        const event = new NoticeEvent({...templateEvent, content: {"org.matrix.msc1767.markup": [{body: "test"}]}});
        expect(event.markup).toBeDefined();
        expect(event.markup.text).toStrictEqual("test");
        expect(event.text).toStrictEqual("test");
    });

    it("should prefer the unstable markup block if both are provided", () => {
        // Dev note: this test will need updating when extensible events becomes stable
        const event = new NoticeEvent({
            ...templateEvent,
            content: {
                "m.markup": [{body: "stable text"}],
                "org.matrix.msc1767.markup": [{body: "unstable text"}],
            },
        });
        expect(event.markup).toBeDefined();
        expect(event.markup.text).toStrictEqual("unstable text");
        expect(event.text).toStrictEqual("unstable text");
    });

    it("should proxy the text and html from the markup block", () => {
        const block = new NoticeEvent({
            ...templateEvent,
            content: {
                "m.markup": [
                    {body: "test plain", mimetype: "text/plain"},
                    {body: "test html", mimetype: "text/html"},
                ],
            },
        });
        expect(block.markup).toBeDefined();
        expect(block.markup.text).toStrictEqual("test plain");
        expect(block.text).toStrictEqual("test plain");
        expect(block.markup.html).toStrictEqual("test html");
        expect(block.html).toStrictEqual("test html");
    });

    it("should error if a markup block is not present", () => {
        expect(() => new NoticeEvent({...templateEvent, content: {no_block: true} as any})).toThrow(
            new InvalidEventError("m.notice", "schema does not apply to m.markup or org.matrix.msc1767.markup"),
        );
    });
});
