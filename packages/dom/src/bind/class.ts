import { Reactive } from "@synx/frp";

export function bindClass(
    el: HTMLElement,
    className: string,
    reactive: Reactive<boolean>,
): () => void {
    el.classList.toggle(className, reactive.get());

    return reactive.subscribe((value) => {
        el.classList.toggle(className, value);
    });
}

export function bindClasses(
    el: HTMLElement,
    classes: Record<string, Reactive<boolean>>,
): () => void {
    const unsubscribers: (() => void)[] = [];

    for (const className in classes) {
        const reactive = classes[className];
        const unsubscribe = bindClass(el, className, reactive);
        unsubscribers.push(unsubscribe);
    }

    return () => {
        for (const unsub of unsubscribers) unsub();
    };
}

