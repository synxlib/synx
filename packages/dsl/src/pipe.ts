export const $ = Symbol("placeholder");

type ArgList<T, A extends any[]> = {
    [K in keyof A]: A[K] extends typeof $ ? T : A[K];
};

type Pipeable<T> = {
    next: <R, A extends any[]>(
        fn: (...args: ArgList<T, A>) => R,
        ...args: A
    ) => Pipeable<R>;
    tap: (sideEffect: (val: T) => void) => Pipeable<T>;
    value: () => T;
};

export function pipe<T>(v: T): Pipeable<T> {
    return {
        next(fn, ...args) {
            const resolved = args.map((a) => (a === $ ? v : a)) as any;
            return pipe(fn(...resolved));
        },
        tap(fn) {
            fn(v); // perform side-effect
            return pipe(v); // chain continues with same value
        },
        value: () => v,
    };
}

