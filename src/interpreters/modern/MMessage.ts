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

import { IPartialEvent } from "../../IPartialEvent";
import { Optional } from "../../types";
import { MessageEvent } from "../../events/MessageEvent";
import { M_EMOTE, M_MESSAGE_EVENT_CONTENT, M_NOTICE } from "../../events/message_types";
import { EmoteEvent } from "../../events/EmoteEvent";
import { NoticeEvent } from "../../events/NoticeEvent";

export function parseMMessage(wireEvent: IPartialEvent<M_MESSAGE_EVENT_CONTENT>): Optional<MessageEvent> {
    if (M_EMOTE.matches(wireEvent.type)) {
        return new EmoteEvent(wireEvent);
    } else if (M_NOTICE.matches(wireEvent.type)) {
        return new NoticeEvent(wireEvent);
    }

    // default: return a generic message
    return new MessageEvent(wireEvent);
}
