import type { JSX } from "solid-js";
import type { Event } from "@synx/frp/event";
import { isReactive, type Reactive } from "@synx/frp/reactive";
import { ComponentFactory } from "../component";
import { text } from "./index";

export type Child =
  | Node
  | string
  | number
  | boolean
  | null
  | undefined
  | Reactive<string>
  | ReturnType<ComponentFactory>;

export type Children = Child | Child[];

export type SynxProps<K extends keyof HTMLElementTagNameMap> = {
    [P in keyof JSX.HTMLAttributes<HTMLElementTagNameMap[K]>]?:
        | JSX.HTMLAttributes<HTMLElementTagNameMap[K]>[P]
        | Reactive<JSX.HTMLAttributes<HTMLElementTagNameMap[K]>[P]>;
} & {
    ref?: (el: HTMLElementTagNameMap[K]) => void;
    on?: Record<string, [Event<any>, (e: globalThis.Event) => void]>;
};

export function h<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    props: SynxProps<K> = {},
    ...children: Children[]
): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);

    if (props) {
        for (const [key, value] of Object.entries(props)) {
            if (key === "ref" && typeof value === "function") {
                value(el);
            } else if (key === "style" && value && typeof value === "object") {
                Object.assign(el.style, value);
            } else if (key === "on" && value && typeof value === "object") {
                console.log("Adding event listeners", value);
                for (const [eventName, ev] of Object.entries(value)) {
                    const [_, emit] = ev as [
                        Event<globalThis.Event>,
                        (e: globalThis.Event) => void,
                    ];
                    el.addEventListener(eventName, emit);
                }
            } else if (key.startsWith("data-") || key.startsWith("aria-")) {
                el.setAttribute(key, String(value));
            } else if (value != null && value !== false) {
                el.setAttribute(key, String(value));
            }
        }
    }

    for (const c of children.flat()) {
        appendChild(el, c);
    }

    return el;
}

function appendChild(parent: HTMLElement, child: Child) {
    if (child == null || child === false) return;
  
    if (typeof child === "string" || typeof child === "number") {
      parent.appendChild(document.createTextNode(String(child)));
    } else if (typeof child === "object" && isReactive(child)) {
      // Reactive<string>
      text(child as Reactive<string>)(parent);
    } else if (typeof child === "object" && "el" in child) {
      // Component instance
      parent.appendChild(child.el);
    } else if (child instanceof Node) {
      parent.appendChild(child);
    }
  }
  