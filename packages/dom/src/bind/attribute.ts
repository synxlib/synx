import { Reactive, subscribe, get } from "@synx/frp/reactive";
import { ElementAttributeMap } from "../element-attribute-map";
import { show } from "../show";
import { bindClass, bindClasses } from "./class";

const booleanAttrs = new Set([
    "disabled",
    "checked",
    "readonly",
    "required",
    "autofocus",
    "hidden",
    "multiple",
    "selected",
    "open",
    "contenteditable",
]);

function isBooleanAttr(attr: string): boolean {
    return booleanAttrs.has(attr);
}

function isSpecialProp(el: HTMLElement, attr: string): boolean {
    const tag = el.tagName.toLowerCase();
    return (
        (attr === "value" && (tag === "input" || tag === "textarea" || tag === "select")) ||
        (attr === "checked" && tag === "input") ||
        (attr === "selected" && tag === "option") ||
        (attr === "disabled" || attr === "readonly" || attr === "multiple" || attr === "open")
    );
}

export function bind<
    K extends keyof ElementAttributeMap,
    A extends keyof ElementAttributeMap[K],
>(
    el: HTMLElement,
    attr: A | "text",
    reactive: Reactive<NonNullable<ElementAttributeMap[K][A]>>,
): () => void {
    const value = get(reactive);

    // Special case: "text" means textContent
    if (attr === "text") {
        el.textContent = String(value);
        return subscribe(reactive, (v) => {
            console.log("Setting text content", v);
            el.textContent = String(v);
        });
    }

    const attrKey = attr as string;

    if (isSpecialProp(el, attrKey)) {
        (el as any)[attrKey] = value;
        return subscribe(reactive, (v) => {
            (el as any)[attrKey] = v;
        });
    }

    // Boolean attributes
    if (typeof value === "boolean" || isBooleanAttr(attrKey)) {
        if (value) el.setAttribute(attrKey, "");
        else el.removeAttribute(attrKey);

        return subscribe(reactive, (v) => {
            if (v) el.setAttribute(attrKey, "");
            else el.removeAttribute(attrKey);
        });
    }

    // Everything else = string attribute
    el.setAttribute(attrKey, String(value));
    return subscribe(reactive, (v) => {
        el.setAttribute(attrKey, String(v));
    });
}

export function binds<K extends keyof ElementAttributeMap>(
    el: HTMLElement,
    attrs: Partial<{
        [A in keyof ElementAttributeMap[K] | "text" | "show" | "classes"]: any;
    }>,
): () => void {
    const unsubscribers: (() => void)[] = [];

    for (const key in attrs) {
        const value = attrs[key as keyof typeof attrs];
        if (value == null) continue;

        if (key === "text") {
            unsubscribers.push(bind(el, "text", value));
        } else if (key === "show") {
            unsubscribers.push(show(el, value));
        } else if (key === "classes") {
            unsubscribers.push(bindClasses(el, value));
        } else {
            unsubscribers.push(bind(el, key as any, value));
        }
    }

    return () => unsubscribers.forEach((unsub) => unsub());
}
