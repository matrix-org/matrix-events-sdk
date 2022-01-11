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

import { MessageEvent } from "./MessageEvent";
import { IPartialEvent } from "../IPartialEvent";
import { M_HTML, M_NOTICE, M_NOTICE_EVENT_CONTENT, M_TEXT } from "./message_types";

// Notice events are just decorated message events

/**
 * Represents a notice. This is essentially a MessageEvent with
 * notice characteristics considered.
 */
export class NoticeEvent extends MessageEvent {
    public constructor(wireFormat: IPartialEvent<M_NOTICE_EVENT_CONTENT>) {
        super(wireFormat);
    }

    public get isNotice(): boolean {
        return true; // override
    }

    public serialize(): IPartialEvent<object> {
        const message = super.serialize();
        (<any>message.content)['msgtype'] = "m.notice";
        return message;
    }

    /**
     * Creates a new NoticeEvent from text and HTML.
     * @param {string} text The text.
     * @param {string} html Optional HTML.
     * @returns {MessageEvent} The representative message event.
     */
    public static from(text: string, html?: string): NoticeEvent {
        return new NoticeEvent({
            type: M_NOTICE.name,
            content: {
                [M_TEXT.name]: text,
                [M_HTML.name]: html,
            },
        });
    }
}
