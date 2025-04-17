import type { Reactive } from "./reactive";
import * as R from "./reactive";

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
            (arg) => arg !== null && R.isReactive(arg),
        );

        if (!hasReactiveArg) {
            // If no reactive arguments, just call the function directly
            return fn(...(args as unknown as UnwrapReactiveArgs<A>));
        }

        // Get current values for all arguments
        const currentValues = args.map((arg) =>
            arg !== null && R.isReactive(arg)
                ? R.get(arg as unknown as Reactive<any>)
                : arg,
        ) as UnwrapReactiveArgs<A>;

        // Create initial reactive result
        const result = fn(...currentValues);
        const resultReactive = R.of(result);

        // Set up subscriptions for each reactive argument
        const subscriptions = args
            .map((arg, index) => {
                if (arg !== null && R.isReactive(arg)) {
                    const reactive = arg as unknown as Reactive<any>;

                    return R.subscribe(reactive, (newValue) => {
                        currentValues[index] = newValue;

                        // Compute new result and update the reactive
                        const newResult = fn(
                            ...(currentValues as UnwrapReactiveArgs<A>),
                        );
                        (resultReactive as any).updateValueInternal(newResult);
                    });
                }
                return undefined;
            })
            .filter(Boolean) as Array<() => void>;

        R.onCleanup(resultReactive, () => {
            subscriptions.forEach((unsub) => unsub());
        });

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
        if (a !== null && R.isReactive(a)) {
            return R.map(a as Reactive<A>, fn);
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
    (
        a: A extends Reactive<infer U> ? U : A,
        b: B extends Reactive<infer V> ? V : B,
    ): R;
} {
    return lift(fn) as any;
}

export const lift2 = liftBinary;

export function lift3<A, B, C, R>(
    fn: (a: UnwrapReactive<A>, b: UnwrapReactive<B>, c: UnwrapReactive<C>) => R,
): {
    (
        a: A extends Reactive<infer UA> ? UA : A,
        b: B extends Reactive<infer UB> ? UB : B,
        c: C extends Reactive<infer UC> ? UC : C,
    ): R;
    (
        a: Reactive<UnwrapReactive<A>>,
        b: B extends Reactive<infer UB> ? UB : B,
        c: C extends Reactive<infer UC> ? UC : C,
    ): Reactive<R>;
    (
        a: A extends Reactive<infer UA> ? UA : A,
        b: Reactive<UnwrapReactive<B>>,
        c: C extends Reactive<infer UC> ? UC : C,
    ): Reactive<R>;
    (
        a: A extends Reactive<infer UA> ? UA : A,
        b: B extends Reactive<infer UB> ? UB : B,
        c: Reactive<UnwrapReactive<C>>,
    ): Reactive<R>;
    (
        a: Reactive<UnwrapReactive<A>>,
        b: Reactive<UnwrapReactive<B>>,
        c: C extends Reactive<infer UC> ? UC : C,
    ): Reactive<R>;
    (
        a: Reactive<UnwrapReactive<A>>,
        b: B extends Reactive<infer UB> ? UB : B,
        c: Reactive<UnwrapReactive<C>>,
    ): Reactive<R>;
    (
        a: A extends Reactive<infer UA> ? UA : A,
        b: Reactive<UnwrapReactive<B>>,
        c: Reactive<UnwrapReactive<C>>,
    ): Reactive<R>;
    (
        a: Reactive<UnwrapReactive<A>>,
        b: Reactive<UnwrapReactive<B>>,
        c: Reactive<UnwrapReactive<C>>,
    ): Reactive<R>;
} {
    return lift(fn) as any;
}

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
