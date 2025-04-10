import { Reactive } from "@synx/frp";
import { ElementAttributeMap } from "../element-attribute-map";

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

export function bind<
    K extends keyof ElementAttributeMap,
    A extends keyof ElementAttributeMap[K],
>(
    el: HTMLElement,
    attr: A,
    reactive: Reactive<NonNullable<ElementAttributeMap[K][A]>>,
): () => void {
    const value = reactive.get();

    // Special case: "text" means textContent
    if (attr === "text") {
        el.textContent = String(value);
        return reactive.subscribe((v) => {
            el.textContent = String(v);
        });
    }

    const attrKey = attr as string;

    // Boolean attributes
    if (typeof value === "boolean" || isBooleanAttr(attrKey)) {
        if (value) el.setAttribute(attrKey, "");
        else el.removeAttribute(attrKey);

        return reactive.subscribe((v) => {
            if (v) el.setAttribute(attrKey, "");
            else el.removeAttribute(attrKey);
        });
    }

    // Everything else = string attribute
    el.setAttribute(attrKey, String(value));
    return reactive.subscribe((v) => {
        el.setAttribute(attrKey, String(v));
    });
}

export function binds<K extends keyof ElementAttributeMap>(
    el: HTMLElement,
    tag: K,
    attrs: Partial<{
        [A in keyof ElementAttributeMap[K]]: Reactive<
            NonNullable<ElementAttributeMap[K][A]>
        >;
    }>,
): () => void {
    const unsubscribers: (() => void)[] = [];

    for (const key in attrs) {
        const reactive = attrs[key as keyof typeof attrs];
        if (!reactive) continue;

        const unsubscribe = bind(
            el,
            key as keyof ElementAttributeMap[K],
            reactive,
        );
        unsubscribers.push(unsubscribe);
    }

    return () => {
        for (const unsub of unsubscribers) unsub();
    };
}
