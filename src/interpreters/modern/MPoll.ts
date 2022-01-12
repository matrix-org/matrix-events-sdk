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
import {
    M_POLL_END,
    M_POLL_END_EVENT_CONTENT,
    M_POLL_RESPONSE,
    M_POLL_RESPONSE_EVENT_CONTENT,
    M_POLL_START,
    M_POLL_START_EVENT_CONTENT,
} from "../../events/poll_types";
import { PollStartEvent } from "../../events/PollStartEvent";
import { PollResponseEvent } from "../../events/PollResponseEvent";
import { PollEndEvent } from "../../events/PollEndEvent";

type PollContent = M_POLL_START_EVENT_CONTENT | M_POLL_RESPONSE_EVENT_CONTENT | M_POLL_END_EVENT_CONTENT;
type PollEvent = PollStartEvent | PollResponseEvent | PollEndEvent;

export function parseMPoll(wireEvent: IPartialEvent<PollContent>): Optional<PollEvent> {
    if (M_POLL_START.matches(wireEvent.type)) {
        return new PollStartEvent(wireEvent as IPartialEvent<M_POLL_START_EVENT_CONTENT>);
    } else if (M_POLL_RESPONSE.matches(wireEvent.type)) {
        return new PollResponseEvent(wireEvent as IPartialEvent<M_POLL_RESPONSE_EVENT_CONTENT>);
    } else if (M_POLL_END.matches(wireEvent.type)) {
        return new PollEndEvent(wireEvent as IPartialEvent<M_POLL_END_EVENT_CONTENT>);
    }

    return null; // not a poll event
}
