export { Event } from "./event";
export { fromDOMEvent, interval } from "./helpers";
import { Reactive as OriginalReactive } from "./reactive";
import { lift as liftFn, lift1 as lift1Fn, lift2 as lift2Fn, lift3 as lift3Fn, liftAll as liftAlFn } from "./lift";

export namespace Reactive {
    export const of = OriginalReactive.of;
    export const lift = liftFn;
    export const lift1 = lift1Fn;
    export const lift2 = lift2Fn;
    export const lift3 = lift3Fn;
    export const liftAll = liftAlFn;
};

export type Reactive<T> = OriginalReactive<T>;