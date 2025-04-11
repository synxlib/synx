import { lift1, lift2, lift3 } from "@synx/frp/reactive";


const f0 = <R>(method: () => R) => (str: string): R => {
    return method.call(str);
}

const f1 = <A, R>(method: (arg: A) => R) => (str: string, arg: A): R => {
    return method.call(str, arg);
}

const f2 = <A, B, R>(method: (a: A, b: B) => R) => (str: string, a: A, b: B): R => {
    return method.call(str, a, b);
}

export const at = lift2(f1(String.prototype.at));
export const charAt = lift2(f1(String.prototype.charAt));
export const charCodeAt = lift2(f1(String.prototype.charCodeAt));
export const codePointAt = lift2(f1(String.prototype.codePointAt));
export const concat = lift2(f1(String.prototype.concat));
export const endsWith = lift3(f2(String.prototype.endsWith));
export const includes = lift2(f1(String.prototype.includes));
export const indexOf = lift2(f1(String.prototype.indexOf));
export const lastIndexOf = lift2(f1(String.prototype.lastIndexOf));
export const localeCompare = lift2(f1(String.prototype.localeCompare));
export const match = lift2(f1(String.prototype.match));
export const matchAll = lift2(f1(String.prototype.matchAll));
export const normalize = lift2(f1(String.prototype.normalize));
export const padEnd = lift2(f1(String.prototype.padEnd));
export const padStart = lift2(f1(String.prototype.padStart));
export const repeat = lift2(f1(String.prototype.repeat));
export const replace = lift3(f2(String.prototype.replace));
export const replaceAll = lift3(f2(String.prototype.replaceAll));
export const search = lift2(f1(String.prototype.search));
export const slice = lift3(f2(String.prototype.slice));
export const split = lift3(f2(String.prototype.split));
export const startsWith = lift3(f2(String.prototype.startsWith));
export const substring = lift3(f2(String.prototype.substring));
export const toLocaleLowerCase = lift1(f0(String.prototype.toLocaleLowerCase));
export const toLocaleUpperCase = lift1(f0(String.prototype.toLocaleUpperCase));
export const toLowerCase = lift1(f0(String.prototype.toLowerCase));
export const toUpperCase = lift1(f0(String.prototype.toUpperCase));
export const trim = lift1(f0(String.prototype.trim));
export const trimEnd = lift1(f0(String.prototype.trimEnd));
export const trimStart = lift1(f0(String.prototype.trimStart));

