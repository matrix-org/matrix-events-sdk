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

import {UnstableValue} from "../../NamespacedValue";
import {EitherAnd, OptionalPartial} from "../types";

/**
 * The namespaced value for m.message
 */
export const M_MESSAGE = new UnstableValue("m.message", "org.matrix.msc1767.message");

/**
 * An m.message event rendering
 */
export interface IMessageRendering {
    body: string;
    mimetype?: string;
}

/**
 * The content for an m.message event
 */
export type M_MESSAGE_EVENT = EitherAnd<
    {[M_MESSAGE.name]: IMessageRendering[]},
    {[M_MESSAGE.altName]: IMessageRendering[]}
>;

/**
 * The namespaced value for m.text
 */
export const M_TEXT = new UnstableValue("m.text", "org.matrix.msc1767.text");

/**
 * The content for an m.text event
 */
export type M_TEXT_EVENT = EitherAnd<{[M_TEXT.name]: string}, {[M_TEXT.altName]: string}>;

/**
 * The namespaced value for m.html
 */
export const M_HTML = new UnstableValue("m.html", "org.matrix.msc1767.html");

/**
 * The content for an m.html event
 */
export type M_HTML_EVENT = EitherAnd<{[M_HTML.name]: string}, {[M_HTML.altName]: string}>;

/**
 * The content for an m.message, m.text, or m.html event
 */
export type M_MESSAGE_EVENT_CONTENT = M_MESSAGE_EVENT | M_TEXT_EVENT | OptionalPartial<M_HTML_EVENT>;

/**
 * The namespaced value for m.emote
 */
export const M_EMOTE = new UnstableValue("m.emote", "org.matrix.msc1767.emote");

/**
 * The event definition for an m.emote event (in content)
 */
export type M_EMOTE_EVENT = EitherAnd<{[M_EMOTE.name]?: {}}, {[M_EMOTE.altName]?: {}}>;

/**
 * The content for an m.emote event
 */
export type M_EMOTE_EVENT_CONTENT = M_MESSAGE_EVENT_CONTENT & M_EMOTE_EVENT;

/**
 * The namespaced value for m.notice
 */
export const M_NOTICE = new UnstableValue("m.notice", "org.matrix.msc1767.notice");

/**
 * The event definition for an m.notice event (in content)
 */
export type M_NOTICE_EVENT = EitherAnd<{[M_NOTICE.name]?: {}}, {[M_NOTICE.altName]?: {}}>;

/**
 * The content for an m.notice event
 */
export type M_NOTICE_EVENT_CONTENT = M_MESSAGE_EVENT_CONTENT & M_NOTICE_EVENT;
