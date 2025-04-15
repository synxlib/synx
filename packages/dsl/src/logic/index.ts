import { ap, lift1, lift2, map, Reactive } from "@synx/frp/reactive";

const f1 = <A, R>(fn: (a: A) => R) => (a: A): R => fn(a);
const f2 = <A, B, R>(fn: (a: A, b: B) => R) => (a: A, b: B): R => fn(a, b);

// Unary
export const not = <T extends Reactive<boolean>>(r: T) => map(r, (v: boolean) => !v);

// Binary
export const and = lift2(f2((a: boolean, b: boolean) => a && b));
export const or = lift2(f2((a: boolean, b: boolean) => !!(a || b)));
export const xor = lift2(f2((a: boolean, b: boolean) => !!(a !== b)));
export const eq = lift2(f2((a: boolean, b: boolean) => a === b));
export const neq = lift2(f2((a: boolean, b: boolean) => a !== b));
export const gt = lift2(f2((a: number, b: number) => a > b));
export const gte = lift2(f2((a: number, b: number) => a >= b));
export const lt = lift2(f2((a: number, b: number) => a < b));
export const lte = lift2(f2((a: number, b: number) => a <= b));

export const orElse: {
    <T>(a: T, b: T): T;
    <T>(a: Reactive<T>, b: T): Reactive<T>;
    <T>(a: T, b: Reactive<T>): Reactive<T>;
    <T>(a: Reactive<T>, b: Reactive<T>): Reactive<T>;
} = lift2((a: any, b: any) => (Boolean(a) ? a : b));