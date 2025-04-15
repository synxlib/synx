import type { JSX } from "solid-js";
import { Children, h, SynxProps } from "./h";
import { Reactive, get, subscribe } from "@synx/frp/reactive";
import { bind } from "../bind/attribute";

export { h } from "./h";

export const text = (text: Reactive<string>) => (parent: HTMLElement) => {
    const value = get(text);
    const el = document.createTextNode(value);
    parent.appendChild(el);
    el.textContent = String(value);
    return subscribe(text, (v) => {
        el.textContent = String(v);
    });
};

type SynxTag<K extends keyof HTMLElementTagNameMap> = (
    props?: SynxProps<K>,
    ...children: Children[]
) => HTMLElementTagNameMap[K];

export const div: SynxTag<"div"> = (props, ...children) => h("div", props, ...children);
export const span: SynxTag<"span"> = (props, ...children) => h("span", props, ...children);
export const button: SynxTag<"button"> = (props, ...children) => h("button", props, ...children);
export const ul: SynxTag<"ul"> = (props, ...children) => h("ul", props, ...children);
export const li: SynxTag<"li"> = (props, ...children) => h("li", props, ...children);
export const a: SynxTag<"a"> = (props, ...children) => h("a", props, ...children);
export const p: SynxTag<"p"> = (props, ...children) => h("p", props, ...children);
export const img: SynxTag<"img"> = (props, ...children) => h("img", props, ...children);
export const input: SynxTag<"input"> = (props, ...children) => h("input", props, ...children);
export const h1: SynxTag<"h1"> = (props, ...children) => h("h1", props = {}, ...children);
export const footer: SynxTag<"footer"> = (props, ...children) => h("footer", props, ...children);

