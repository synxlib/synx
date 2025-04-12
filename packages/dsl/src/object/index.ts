import { map, lift1, lift2 } from "@synx/frp/reactive";


const f0 = <R>(method: () => R) => (obj: object): R => {
    return method.call(obj);
}

const f1 = <A, R>(method: (arg: A) => R) => (obj: object, arg: A): R => {
    return method.call(obj, arg);
}

const f2 = <A, B, R>(method: (a: A, b: B) => R) => (obj: object, a: A, b: B): R => {
    return method.call(obj, a, b);
}

export const has = lift2(f1(Object.prototype.hasOwnProperty));
export const keys = lift1(Object.keys);
export const values = lift1(Object.values);
export const entries = lift1(Object.entries);
export const prop = lift2((obj: object, key: string) => obj[key]);