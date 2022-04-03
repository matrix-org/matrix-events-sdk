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

import { UnstableValue } from "../NamespacedValue";
import { EitherAnd } from "../types";
import { IMessageRendering } from "./message_types";

/**
 * The namespaced value for m.topic
 */
export const M_TOPIC = new UnstableValue("m.topic", "org.matrix.msc3765.topic");

/**
 * The event definition for an m.topic event (in content)
 */
export type M_TOPIC_EVENT = EitherAnd<{ [M_TOPIC.name]: IMessageRendering[] }, { [M_TOPIC.altName]: IMessageRendering[] }>;

/**
 * The content for an m.topic event
 */
export type M_TOPIC_EVENT_CONTENT = M_TOPIC_EVENT;
