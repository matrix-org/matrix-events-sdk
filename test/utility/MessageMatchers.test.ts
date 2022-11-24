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

import {
    IPartialEvent,
    IPartialLegacyContent,
    isEventLike,
    LegacyMsgType,
    M_EMOTE,
    M_MESSAGE,
    M_MESSAGE_EVENT_CONTENT,
    M_NOTICE,
    M_TEXT,
} from "../../src";

describe("isEventLike", () => {
    it("should match legacy text", () => {
        const input1: IPartialEvent<IPartialLegacyContent> = {
            type: "m.room.message",
            content: {msgtype: "m.text", body: "a"},
        };
        const input2: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {type: M_MESSAGE.name, content: {[M_TEXT.name]: "a"}};
        const input3: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {
            type: "org.example.message-like",
            content: {[M_TEXT.name]: "a"},
        };

        expect(isEventLike(input1, LegacyMsgType.Text)).toBe(true);
        expect(isEventLike(input2, LegacyMsgType.Text)).toBe(true);
        expect(isEventLike(input3, LegacyMsgType.Text)).toBe(false);

        expect(isEventLike(input1, LegacyMsgType.Notice)).toBe(false);
        expect(isEventLike(input2, LegacyMsgType.Notice)).toBe(false);
        expect(isEventLike(input3, LegacyMsgType.Notice)).toBe(false);

        expect(isEventLike(input1, LegacyMsgType.Emote)).toBe(false);
        expect(isEventLike(input2, LegacyMsgType.Emote)).toBe(false);
        expect(isEventLike(input3, LegacyMsgType.Emote)).toBe(false);
    });

    it("should match legacy emotes", () => {
        const input1: IPartialEvent<IPartialLegacyContent> = {
            type: "m.room.message",
            content: {msgtype: "m.emote", body: "a"},
        };
        const input2: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {type: M_EMOTE.name, content: {[M_TEXT.name]: "a"}};
        const input3: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {
            type: "org.example.message-like",
            content: {[M_TEXT.name]: "a"},
        };

        expect(isEventLike(input1, LegacyMsgType.Text)).toBe(false);
        expect(isEventLike(input2, LegacyMsgType.Text)).toBe(false);
        expect(isEventLike(input3, LegacyMsgType.Text)).toBe(false);

        expect(isEventLike(input1, LegacyMsgType.Notice)).toBe(false);
        expect(isEventLike(input2, LegacyMsgType.Notice)).toBe(false);
        expect(isEventLike(input3, LegacyMsgType.Notice)).toBe(false);

        expect(isEventLike(input1, LegacyMsgType.Emote)).toBe(true);
        expect(isEventLike(input2, LegacyMsgType.Emote)).toBe(true);
        expect(isEventLike(input3, LegacyMsgType.Emote)).toBe(false);
    });

    it("should match legacy notices", () => {
        const input1: IPartialEvent<IPartialLegacyContent> = {
            type: "m.room.message",
            content: {msgtype: "m.notice", body: "a"},
        };
        const input2: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {type: M_NOTICE.name, content: {[M_TEXT.name]: "a"}};
        const input3: IPartialEvent<M_MESSAGE_EVENT_CONTENT> = {
            type: "org.example.message-like",
            content: {[M_TEXT.name]: "a"},
        };

        expect(isEventLike(input1, LegacyMsgType.Text)).toBe(false);
        expect(isEventLike(input2, LegacyMsgType.Text)).toBe(false);
        expect(isEventLike(input3, LegacyMsgType.Text)).toBe(false);

        expect(isEventLike(input1, LegacyMsgType.Notice)).toBe(true);
        expect(isEventLike(input2, LegacyMsgType.Notice)).toBe(true);
        expect(isEventLike(input3, LegacyMsgType.Notice)).toBe(false);

        expect(isEventLike(input1, LegacyMsgType.Emote)).toBe(false);
        expect(isEventLike(input2, LegacyMsgType.Emote)).toBe(false);
        expect(isEventLike(input3, LegacyMsgType.Emote)).toBe(false);
    });
});
