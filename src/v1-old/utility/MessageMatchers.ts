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

import {IPartialEvent} from "../IPartialEvent";
import {IPartialLegacyContent} from "../interpreters/legacy/MRoomMessage";
import {EitherAnd} from "../../types";
import {M_EMOTE, M_MESSAGE, M_MESSAGE_EVENT_CONTENT, M_NOTICE} from "../events/message_types";

/**
 * Represents a legacy m.room.message msgtype
 */
export enum LegacyMsgType {
    Text = "m.text",
    Notice = "m.notice",
    Emote = "m.emote",
    // TODO: The others
}

/**
 * Determines if the given partial event looks similar enough to the given legacy msgtype
 * to count as that message type.
 * @param {IPartialEvent<EitherAnd<IPartialLegacyContent, M_MESSAGE_EVENT_CONTENT>>} event The event.
 * @param {LegacyMsgType} msgtype The message type to compare for.
 * @returns {boolean} True if the event appears to look similar enough to the msgtype.
 */
export function isEventLike(
    event: IPartialEvent<EitherAnd<IPartialLegacyContent, M_MESSAGE_EVENT_CONTENT>>,
    msgtype: LegacyMsgType,
): boolean {
    const content = <any>event.content;
    if (msgtype === LegacyMsgType.Text) {
        return M_MESSAGE.matches(event.type) || (event.type === "m.room.message" && content?.["msgtype"] === "m.text");
    } else if (msgtype === LegacyMsgType.Emote) {
        return M_EMOTE.matches(event.type) || (event.type === "m.room.message" && content?.["msgtype"] === "m.emote");
    } else if (msgtype === LegacyMsgType.Notice) {
        return M_NOTICE.matches(event.type) || (event.type === "m.room.message" && content?.["msgtype"] === "m.notice");
    }
    return false;
}
