import { Reactive, subscribe, get, isReactive, of } from "@synx/frp/reactive";

export function bindClass(
    el: HTMLElement,
    className: string,
    reactive: Reactive<boolean>,
): () => void {
    el.classList.toggle(className, get(reactive));

    return subscribe(reactive, (value) => {
        console.log("Toggling class", value);
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

export function classes(
    classMap: Record<string, boolean | Reactive<boolean>>,
): Reactive<string> {
    // Get all static class keys first and split any that contain spaces
    const staticClasses = Object.entries(classMap)
        .filter(([_, value]) => typeof value === "boolean")
        .flatMap(([key, value]) => {
            if (!value) return [];
            // Split each class key that might contain spaces
            return key.split(/\s+/).filter(Boolean);
        });

    // Find reactive conditions
    const reactiveEntries = Object.entries(classMap)
        .filter(([_, value]) => isReactive(value))
        .map(([className, condition]) => ({
            className,
            condition: condition as Reactive<boolean>,
        }));

    // If no reactive conditions, return a simple reactive with just the static classes
    if (reactiveEntries.length === 0) {
        return of(staticClasses.join(" "));
    }

    // Initial value calculation
    const initialClasses = [...staticClasses];
    for (const { className, condition } of reactiveEntries) {
        if (get(condition)) {
            initialClasses.push(className);
        }
    }

    // Create the reactive result
    const result = of(initialClasses.join(" "));

    // Subscribe to each reactive condition
    for (const { className, condition } of reactiveEntries) {
        // Split the className into individual tokens
        const classNames = className.split(/\s+/).filter(Boolean);

        subscribe(condition, (isActive) => {
            // Get current classes as a set for easy manipulation
            const classSet = new Set(
                get(result).split(/\s+/).filter(Boolean),
            );

            if (isActive) {
                // Add all class names when condition is true
                classNames.forEach((name) => classSet.add(name));
            } else {
                // Remove all class names when condition is false
                classNames.forEach((name) => classSet.delete(name));
            }

            // Update the result
            (result as any).updateValueInternal(Array.from(classSet).join(" "));
        });
    }

    return result;
}
