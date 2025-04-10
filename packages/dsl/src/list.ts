import { Reactive } from "@synx/frp";


const f0 = <U, R>(method: () => R) => (xs: U[]): R => {
    return method.call(xs);
}

const f1 = <U, A, R>(method: (arg: A) => R) => (xs: U[], arg: A): R => {
    return method.call(xs, arg);
}

const f2 = <U, A, B, R>(method: (a: A, b: B) => R) => (xs: U[], a: A, b: B): R => {
    return method.call(xs, a, b);
}

export const at = Reactive.lift2(f1(Array.prototype.at));
export const concat = Reactive.lift2(f1(Array.prototype.concat));
export const copyWithin = Reactive.lift3(f2(Array.prototype.copyWithin));
export const entries = Reactive.lift1(f0(Array.prototype.entries));
export const every = Reactive.lift2(f1(Array.prototype.every));
export const fill = Reactive.lift3(f2(Array.prototype.fill));
export const filter = Reactive.lift2(f1(Array.prototype.filter));
export const find = Reactive.lift2(f1(Array.prototype.find));
export const findIndex = Reactive.lift2(f1(Array.prototype.findIndex));
export const flat = Reactive.lift2(
    (xs: unknown[], depthOrFn: unknown) =>
        (Array.prototype.flat as any).call(xs, depthOrFn),
) as <U, R>(
    xs: U[][] | Reactive<U[][]>,
    depth?: number | Reactive<number>,
) => Reactive<U[]>;
export const flatMap = Reactive.lift2(
    (xs: unknown[], fn: unknown) =>
        (Array.prototype.flatMap as any).call(xs, fn),
) as <U, R>(
    xs: U[] | Reactive<U[]>,
    fn: ((v: U, i: number, arr: U[]) => R[]) | Reactive<(v: U, i: number, arr: U[]) => R[]>,
) => Reactive<R[]>;
export const forEach = Reactive.lift2(f1(Array.prototype.forEach));
export const includes = Reactive.lift2(f1(Array.prototype.includes));
export const indexOf = Reactive.lift2(f1(Array.prototype.indexOf));
export const join = Reactive.lift2(f1(Array.prototype.join));
export const keys = Reactive.lift1(f0(Array.prototype.keys));
export const lastIndexOf = Reactive.lift2(f1(Array.prototype.lastIndexOf));
export const map = Reactive.lift2(
    (xs: unknown[], fn: (v: unknown, i: number, l: unknown[]) => unknown) =>
        xs.map(fn),
) as <U, R>(
    xs: U[] | Reactive<U[]>,
    fn: ((v: U, i: number, l: U[]) => R) | Reactive<(v: U, i: number, l: U[]) => R>,
) => Reactive<R[]>;
export const pop = Reactive.lift1(f0(Array.prototype.pop));
export const push = Reactive.lift2(f1(Array.prototype.push));
export const reduce = Reactive.lift3(f2(Array.prototype.reduce));
export const reduceRight = Reactive.lift3(f2(Array.prototype.reduceRight));
export const reverse = Reactive.lift1(f0(Array.prototype.reverse));
export const shift = Reactive.lift1(f0(Array.prototype.shift));
export const slice = Reactive.lift3(f2(Array.prototype.slice));
export const some = Reactive.lift2(f1(Array.prototype.some));
export const sort = Reactive.lift2(f1(Array.prototype.sort));
export const splice = Reactive.lift3(f2(Array.prototype.splice));
export const unshift = Reactive.lift2(f1(Array.prototype.unshift));
export const values = Reactive.lift1(f0(Array.prototype.values));
