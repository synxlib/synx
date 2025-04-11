import type { Reactive } from "@synx/frp/reactive";
import { isReactive, get, of, subscribe, addCleanup } from "@synx/frp/reactive";

/**
 * Combines multiple reactive values into a single reactive object
 */
export function combine<T extends Record<string, any>>(obj: {
    [K in keyof T]: T[K] | Reactive<T[K]>;
}): Reactive<T> {
    // Get initial values
    const initialValues: any = {};

    for (const key in obj) {
        initialValues[key] = isReactive(obj[key]) ? get(obj[key]) : obj[key];
    }

    // Create result reactive
    const result = of(initialValues as T);

    // Set up subscriptions for each reactive property
    const subscriptions: Array<() => void> = [];

    for (const key in obj) {
        if (isReactive(obj[key])) {
            const reactive = obj[key];

            const sub = subscribe(reactive, (newValue) => {
                const currentValues = get(result);
                const newValues = { ...currentValues, [key]: newValue };
                (result as any).updateValueInternal(newValues);
            });

            subscriptions.push(sub);
        }
    }

    addCleanup(result, () => {
        subscriptions.forEach((unsub) => unsub());
    });

    return result;
}

