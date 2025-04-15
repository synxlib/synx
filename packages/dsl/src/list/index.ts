import type { Reactive } from "@synx/frp/reactive";
import * as R from "@synx/frp/reactive";


const f0 = <U, R>(method: () => R) => (xs: U[]): R => {
    return method.call(xs);
}

const f1 = <U, A, R>(method: (arg: A) => R) => (xs: U[], arg: A): R => {
    return method.call(xs, arg);
}

const f2 = <U, A, B, R>(method: (a: A, b: B) => R) => (xs: U[], a: A, b: B): R => {
    return method.call(xs, a, b);
}

export const at = R.lift2(f1(Array.prototype.at));
export const concat = R.lift2(f1(Array.prototype.concat));
export const copyWithin = R.lift3(f2(Array.prototype.copyWithin));
export const entries = R.lift1(f0(Array.prototype.entries));
export const every = R.lift2(f1(Array.prototype.every));
export const fill = R.lift3(f2(Array.prototype.fill));
export const filter = R.lift2(f1(Array.prototype.filter));
export const find = R.lift2(f1(Array.prototype.find));
export const findIndex = R.lift2(f1(Array.prototype.findIndex));
export const flat = R.lift2(
    (xs: unknown[], depthOrFn: unknown) =>
        (Array.prototype.flat as any).call(xs, depthOrFn),
) as <U, R>(
    xs: U[][] | Reactive<U[][]>,
    depth?: number | Reactive<number>,
) => Reactive<U[]>;
export const flatMap = R.lift2(
    (xs: unknown[], fn: unknown) =>
        (Array.prototype.flatMap as any).call(xs, fn),
) as <U, R>(
    xs: U[] | Reactive<U[]>,
    fn: ((v: U, i: number, arr: U[]) => R[]) | Reactive<(v: U, i: number, arr: U[]) => R[]>,
) => Reactive<R[]>;
export const forEach = R.lift2(f1(Array.prototype.forEach));
export const includes = R.lift2(f1(Array.prototype.includes));
export const indexOf = R.lift2(f1(Array.prototype.indexOf));
export const join = R.lift2(f1(Array.prototype.join));
export const keys = R.lift1(f0(Array.prototype.keys));
export const lastIndexOf = R.lift2(f1(Array.prototype.lastIndexOf));
export const map = R.lift2(
    (xs: unknown[], fn: (v: unknown, i: number, l: unknown[]) => unknown) =>
        xs.map(fn),
) as <U, R>(
    xs: U[] | Reactive<U[]>,
    fn: ((v: U, i: number, l: U[]) => R) | Reactive<(v: U, i: number, l: U[]) => R>,
) => Reactive<R[]>;
export const pop = R.lift1(f0(Array.prototype.pop));
export const push = R.lift2(f1(Array.prototype.push));
export const reduce = R.lift3(f2(Array.prototype.reduce));
export const reduceRight = R.lift3(f2(Array.prototype.reduceRight));
export const reverse = R.lift1(f0(Array.prototype.reverse));
export const shift = R.lift1(f0(Array.prototype.shift));
export const slice = R.lift3(f2(Array.prototype.slice));
export const some = R.lift2(f1(Array.prototype.some));
export const sort = R.lift2(f1(Array.prototype.sort));
export const splice = R.lift3(f2(Array.prototype.splice));
export const unshift = R.lift2(f1(Array.prototype.unshift));
export const values = R.lift1(f0(Array.prototype.values));
export const length = R.lift1((list: any[]) => list.length);
