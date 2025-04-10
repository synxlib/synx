import { Reactive } from "@synx/frp";


const f0 = <A, R>(method: () => R) => (str: string): R => {
    return method.call(str);
}

const f1 = <A, R>(method: (arg: A) => R) => (str: string, arg: A): R => {
    return method.call(str, arg);
}

const f2 = <A, B, R>(method: (a: A, b: B) => R) => (str: string, a: A, b: B): R => {
    return method.call(str, a, b);
}

export const at = Reactive.lift2(f1(String.prototype.at));
export const charAt = Reactive.lift2(f1(String.prototype.charAt));
export const charCodeAt = Reactive.lift2(f1(String.prototype.charCodeAt));
export const codePointAt = Reactive.lift2(f1(String.prototype.codePointAt));
export const concat = Reactive.lift2(f1(String.prototype.concat));
export const endsWith = Reactive.lift3(f2(String.prototype.endsWith));
export const includes = Reactive.lift2(f1(String.prototype.includes));
export const indexOf = Reactive.lift2(f1(String.prototype.indexOf));
export const lastIndexOf = Reactive.lift2(f1(String.prototype.lastIndexOf));
export const localeCompare = Reactive.lift2(f1(String.prototype.localeCompare));
export const match = Reactive.lift2(f1(String.prototype.match));
export const matchAll = Reactive.lift2(f1(String.prototype.matchAll));
export const normalize = Reactive.lift2(f1(String.prototype.normalize));
export const padEnd = Reactive.lift2(f1(String.prototype.padEnd));
export const padStart = Reactive.lift2(f1(String.prototype.padStart));
export const repeat = Reactive.lift2(f1(String.prototype.repeat));
export const replace = Reactive.lift3(f2(String.prototype.replace));
export const replaceAll = Reactive.lift3(f2(String.prototype.replaceAll));
export const search = Reactive.lift2(f1(String.prototype.search));
export const slice = Reactive.lift3(f2(String.prototype.slice));
export const split = Reactive.lift3(f2(String.prototype.split));
export const startsWith = Reactive.lift3(f2(String.prototype.startsWith));
export const substring = Reactive.lift3(f2(String.prototype.substring));
export const toLocaleLowerCase = Reactive.lift1(f0(String.prototype.toLocaleLowerCase));
export const toLocaleUpperCase = Reactive.lift1(f0(String.prototype.toLocaleUpperCase));
export const toLowerCase = Reactive.lift1(f0(String.prototype.toLowerCase));
export const toUpperCase = Reactive.lift1(f0(String.prototype.toUpperCase));
export const trim = Reactive.lift1(f0(String.prototype.trim));
export const trimEnd = Reactive.lift1(f0(String.prototype.trimEnd));
export const trimStart = Reactive.lift1(f0(String.prototype.trimStart));

