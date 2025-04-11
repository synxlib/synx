import type { JSX } from "solid-js";
import { Reactive, subscribe, get } from "@synx/frp/reactive";

export function bindStyle(
    el: HTMLElement,
    styleName: keyof JSX.CSSProperties,
    reactive: Reactive<string>,
): () => void {
    const kebab = toKebabCase(styleName);

    el.style.setProperty(kebab, get(reactive));

    return subscribe(reactive, (value) => {
        el.style.setProperty(kebab, value);
    });
}

export function bindStyles(
    el: HTMLElement,
    styles: Partial<Record<keyof JSX.CSSProperties, Reactive<string>>>,
): () => void {
    const unsubscribers: (() => void)[] = [];

    for (const styleName in styles) {
        const reactive = styles[styleName as keyof typeof styles];
        if (!reactive) continue;

        const unsubscribe = bindStyle(
            el,
            styleName as keyof JSX.CSSProperties,
            reactive,
        );
        unsubscribers.push(unsubscribe);
    }

    return () => {
        for (const unsub of unsubscribers) unsub();
    };
}

function toKebabCase(style: string): string {
    return style.replace(/[A-Z]/g, (char) => "-" + char.toLowerCase());
}
