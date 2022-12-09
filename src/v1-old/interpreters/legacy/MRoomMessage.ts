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

import {IPartialEvent} from "../../IPartialEvent";
import {Optional} from "../../../types";
import {ExtensibleEvent} from "../../events/ExtensibleEvent";
import {MessageEvent} from "../../events/MessageEvent";
import {NoticeEvent} from "../../events/NoticeEvent";
import {EmoteEvent} from "../../events/EmoteEvent";
import {NamespacedValue} from "../../../NamespacedValue";
import {M_HTML, M_MESSAGE, M_MESSAGE_EVENT_CONTENT, M_TEXT} from "../../events/message_types";

export const LEGACY_M_ROOM_MESSAGE = new NamespacedValue("m.room.message");

export interface IPartialLegacyContent {
    body: string;
    msgtype: string;
    format?: string;
    formatted_body?: string;
}

export function parseMRoomMessage(wireEvent: IPartialEvent<IPartialLegacyContent>): Optional<ExtensibleEvent> {
    if (M_MESSAGE.findIn(wireEvent.content) || M_TEXT.findIn(wireEvent.content)) {
        // We know enough about the event to coerce it into the right type
        return new MessageEvent(wireEvent as unknown as IPartialEvent<M_MESSAGE_EVENT_CONTENT>);
    }

    if (!wireEvent.content) return null;

    const msgtype = wireEvent.content.msgtype;
    const text = wireEvent.content.body;
    const html = wireEvent.content.format === "org.matrix.custom.html" ? wireEvent.content.formatted_body : null;

    if (msgtype === "m.text") {
        return new MessageEvent({
            ...wireEvent,
            content: {
                ...wireEvent.content,
                [M_TEXT.name]: text,
                [M_HTML.name]: html,
            },
        });
    } else if (msgtype === "m.notice") {
        return new NoticeEvent({
            ...wireEvent,
            content: {
                ...wireEvent.content,
                [M_TEXT.name]: text,
                [M_HTML.name]: html,
            },
        });
    } else if (msgtype === "m.emote") {
        return new EmoteEvent({
            ...wireEvent,
            content: {
                ...wireEvent.content,
                [M_TEXT.name]: text,
                [M_HTML.name]: html,
            },
        });
    } else {
        // TODO: Handle other types
        return null;
    }
}
