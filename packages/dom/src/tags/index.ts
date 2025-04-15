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
        console.log("Setting text content", v);
        el.textContent = String(v);
    });
};

type SynxTag<K extends keyof HTMLElementTagNameMap> = (
    props?: SynxProps<K>,
    ...children: Children[]
) => HTMLElementTagNameMap[K];

export const div: SynxTag<"div"> = (props, ...children) => h("div", props, ...children);
export const input: SynxTag<"input"> = (props, ...children) => h("input", props, ...children);
export const h1: SynxTag<"h1"> = (props, ...children) => h("h1", props = {}, ...children);

