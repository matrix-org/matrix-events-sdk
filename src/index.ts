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

// Package-level stuff
export * from "./ExtensibleEvents";
export * from "./IPartialEvent";
export * from "./InvalidEventError";
export * from "./NamespacedValue";
export * from "./NamespacedMap"; // utility
export * from "./types";

// Utilities
export * from "./utility/MessageMatchers";

// Legacy interpreters
export * from "./interpreters/legacy/MRoomMessage";

// Modern (or not-legacy) interpreters
export * from "./interpreters/modern/MMessage";
export * from "./interpreters/modern/MPoll";

// Event objects
export * from "./events/relationship_types";
export * from "./events/ExtensibleEvent";
export * from "./events/message_types";
export * from "./events/MessageEvent";
export * from "./events/EmoteEvent";
export * from "./events/NoticeEvent";
export * from "./events/poll_types";
export * from "./events/PollStartEvent";
export * from "./events/PollResponseEvent";
export * from "./events/PollEndEvent";
