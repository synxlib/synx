import { Reactive } from "./reactive";

/**
 * Type helper for determining if a type is a Reactive
 */
type IsReactive<T> = T extends Reactive<infer U> ? true : false;

/**
 * Unwrap the type from a Reactive if it is one
 */
type UnwrapReactive<T> = T extends Reactive<infer U> ? U : T;

/**
 * Maps function arguments, replacing Reactive<T> with T
 */
type UnwrapReactiveArgs<T extends any[]> = {
    [K in keyof T]: UnwrapReactive<T[K]>;
};

/**
 * Check if at least one argument is Reactive
 */
type HasReactiveArg<T extends any[]> = {
    [K in keyof T]: IsReactive<T[K]>;
}[number] extends false
    ? false
    : true;

/**
 * Main lift function - lifts any function to work with Reactive values
 */
export function lift<A extends any[], R>(
    fn: (...args: UnwrapReactiveArgs<A>) => R,
): (...args: A) => HasReactiveArg<A> extends true ? Reactive<R> : R {
    return ((...args: A) => {
        // Check if any arguments are Reactive
        const hasReactiveArg = args.some(
            (arg) =>
                arg !== null &&
                typeof arg === "object" &&
                "get" in arg &&
                "subscribe" in arg,
        );

        if (!hasReactiveArg) {
            // If no reactive arguments, just call the function directly
            return fn(...(args as unknown as UnwrapReactiveArgs<A>));
        }

        // Get current values for all arguments
        const currentValues = args.map((arg) =>
            arg !== null && typeof arg === "object" && "get" in arg
                ? (arg as unknown as Reactive<any>).get()
                : arg,
        ) as UnwrapReactiveArgs<A>;

        // Create initial reactive result
        const result = fn(...currentValues);
        const resultReactive = Reactive.of(result);

        // Set up subscriptions for each reactive argument
        const subscriptions = args
            .map((arg, index) => {
                if (
                    arg !== null &&
                    typeof arg === "object" &&
                    "get" in arg &&
                    "subscribe" in arg
                ) {
                    const reactive = arg as unknown as Reactive<any>;

                    return reactive.subscribe((newValue) => {
                        // Create a new array of current values with the updated value
                        const newValues = [...currentValues];
                        newValues[index] = newValue;

                        // Compute new result and update the reactive
                        const newResult = fn(
                            ...(newValues as UnwrapReactiveArgs<A>),
                        );
                        (resultReactive as any).updateValueInternal(newResult);
                    });
                }
                return undefined;
            })
            .filter(Boolean) as Array<() => void>;

        // Add cleanup function to the reactive result
        const originalCleanup = resultReactive.cleanup;
        (resultReactive as any).cleanup = () => {
            subscriptions.forEach((unsub) => unsub());
            originalCleanup.call(resultReactive);
        };

        return resultReactive;
    }) as any;
}

/**
 * Lifts a unary function to work with Reactive values
 */
export function lift1<A, R>(
    fn: (a: A) => R,
): ((a: A) => R) & ((a: Reactive<A>) => Reactive<R>) {
    return ((a: A | Reactive<A>) => {
        if (
            a !== null &&
            typeof a === "object" &&
            "get" in a &&
            "subscribe" in a
        ) {
            return (a as Reactive<A>).map(fn);
        }
        return fn(a as A);
    }) as any;
}

/**
 * Lifts a binary function to work with Reactive values
 */
export function liftBinary<A, B, R>(
    fn: (a: UnwrapReactive<A>, b: UnwrapReactive<B>) => R,
): {
    (
        a: A extends Reactive<infer U> ? U : A,
        b: B extends Reactive<infer V> ? V : B,
    ): R;
    (
        a: Reactive<UnwrapReactive<A>>,
        b: B extends Reactive<infer V> ? V : B,
    ): Reactive<R>;
    (
        a: A extends Reactive<infer U> ? U : A,
        b: Reactive<UnwrapReactive<B>>,
    ): Reactive<R>;
    (
        a: Reactive<UnwrapReactive<A>>,
        b: Reactive<UnwrapReactive<B>>,
    ): Reactive<R>;
} {
    return lift(fn) as any;
}

export const lift2 = liftBinary;

/**
 * Creates an object with lifted versions of every function in an object
 */
export function liftAll<T extends Record<string, (...args: any[]) => any>>(
    obj: T,
): {
    [K in keyof T]: ReturnType<typeof lift<Parameters<T[K]>, ReturnType<T[K]>>>;
} {
    const result: any = {};

    for (const key in obj) {
        if (typeof obj[key] === "function") {
            result[key] = lift(obj[key]);
        }
    }

    return result;
}

