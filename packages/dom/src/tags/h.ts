import type { JSX } from "solid-js";
import type { Event } from "@synx/frp/event";
import { isReactive, type Reactive, subscribe, get } from "@synx/frp/reactive";
import { ComponentFactory } from "../component";
import { text } from "./index";
import { bindClass } from "../bind/class";
import { bind } from "../bind/attribute";
import { RefObject } from "../component/ref";

export type Child =
    | Node
    | string
    | number
    | boolean
    | null
    | undefined
    | Reactive<string>
    | ReturnType<ComponentFactory>
    | ((parent: HTMLElement) => void | (() => void));

export type Children = Child | Child[];

export type ClassValue =
    | string
    | Reactive<string>
    | Record<string, boolean | Reactive<boolean>>;

type ElementType<K extends keyof JSX.IntrinsicElements> =
    K extends keyof HTMLElementTagNameMap ? HTMLElementTagNameMap[K] : never;

export type SynxProps<K extends keyof JSX.IntrinsicElements> = {
    [P in keyof Omit<
        JSX.IntrinsicElements[K],
        "class" | "className" | "ref" | "style" | "on"
    >]?: JSX.IntrinsicElements[K][P] | Reactive<JSX.IntrinsicElements[K][P]>;
} & {
    ref?: ((el: ElementType<K>) => void) | RefObject<ElementType<K>>;
    on?: {
        [E in keyof HTMLElementEventMap]?: (e: HTMLElementEventMap[E]) => void;
    };
    class?: ClassValue;
    className?: ClassValue;
    style?: JSX.CSSProperties | Reactive<JSX.CSSProperties>;
};

export function h<K extends keyof HTMLElementTagNameMap>(
    tag: K,
    props: SynxProps<K> = {},
    ...children: Children[]
): HTMLElementTagNameMap[K] {
    const el = document.createElement(tag);

    if (props) {
        for (const [key, value] of Object.entries(props)) {
            if (key === "ref" && value != null) {
                if (typeof value === "function") {
                    value(el);
                } else if (value && typeof value === "object" && "set" in value) {
                    value.set(el);
                }
            } else if (key === "style" && value && typeof value === "object") {
                Object.assign(el.style, value);
            } else if (key === "on" && value && typeof value === "object") {
                for (const [eventName, emit] of Object.entries(value)) {
                    if (typeof emit === "function") {
                        el.addEventListener(eventName, emit as unknown as EventListener);
                    }
                }
            } else if (key === "class" || key === "className") {
                // Handle various class formats
                if (value == null || value === false) {
                    // Do nothing for null/undefined/false values
                } else if (typeof value === "string") {
                    // Simple string class
                    el.className = value;
                } else if (isReactive(value)) {
                    const val = value as Reactive<string>;
                    el.className = get(val);
                    subscribe(val, (newClass) => {
                        el.className = newClass;
                    });
                } else if (typeof value === "object") {
                    // Object with conditional classes
                    // Handle initial classes
                    for (const [className, condition] of Object.entries(
                        value,
                    )) {
                        if (typeof condition === "boolean") {
                            if (condition) {
                                const classNames = className.split(/\s+/);
                                classNames.forEach((name) => {
                                    if (name) el.classList.add(name);
                                });
                            }
                        } else if (isReactive(condition)) {
                            bindClass(el, className, condition);
                        }
                    }
                }
            } else if (key.startsWith("data-") || key.startsWith("aria-")) {
                el.setAttribute(key, String(value));
            } else if (value != null && value !== false) {
                // el.setAttribute(key, String(value));
                if (isReactive(value)) {
                    bind(el, key as any, value);
                } else {
                    if (typeof value === "boolean") {
                        if (value) el.setAttribute(key, "");
                        else el.removeAttribute(key);
                    } else {
                        el.setAttribute(key, String(value));
                    }
                }
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
    } else if (typeof child === "function") {
        const dispose = child(parent);
        // TODO Store disposer if needed
    }
}

