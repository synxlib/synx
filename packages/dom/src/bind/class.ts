import { Reactive, subscribe, get } from "@synx/frp/reactive";

export function bindClass(
    el: HTMLElement,
    className: string,
    reactive: Reactive<boolean>,
): () => void {
    el.classList.toggle(className, get(reactive));

    return subscribe(reactive, (value) => {
        console.log("Toggling class", value)
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

