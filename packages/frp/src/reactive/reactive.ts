// import { EventImpl, subscribe as subscribeEvent } from "./event";
import type { Event } from "../event/event";
import * as E from "../event/event";
import { Future } from "../future";

export interface Reactive<A> {
    readonly __impl__: true;
    readonly __tag__: "Reactive";
}

export interface InternalReactive<A> extends Reactive<A> {
    currentValue: A;
    changeEvent?: Event<A>;
    subscribers: Array<(value: A) => void>;
    cleanupFns: Set<() => void>;
    updateValueInternal(newValue: A): void;
    /**
     * Subscribe to changes with control over immediate notification (only for Future to call)
     * @internal
     */
    subscribeInternal(
        handler: (value: A) => void,
        notifyWithCurrent: boolean,
    ): () => void;
}

export class ReactiveImpl<A> implements InternalReactive<A> {
    readonly __impl__ = true;
    readonly __tag__ = "Reactive";
    currentValue: A;
    changeEvent?: Event<A>;
    subscribers: Array<(value: A) => void> = [];
    cleanupFns: Set<() => void> = new Set();

    constructor(initialValue: A, changeEvent?: Event<A>) {
        this.currentValue = initialValue;
        this.changeEvent = changeEvent;

        if (changeEvent) {
            const unsub = E.subscribe(changeEvent, (v) => {
                this.currentValue = v;
                this.subscribers.forEach((sub) => sub(v));
            });
            this.cleanupFns.add(unsub);
        }
    }

    updateValueInternal(newValue: A): void {
        this.currentValue = newValue;
        for (const sub of this.subscribers) {
            try {
                sub(newValue);
            } catch (e) {
                console.error("subscriber error:", e);
            }
        }
    }

    internalAddCleanup(fn: () => void) {
        this.cleanupFns.add(fn);
    }

    /**
     * Internal method to subscribe to changes with control over immediate notification
     * @internal
     */
    subscribeInternal(
        handler: (value: A) => void,
        notifyWithCurrent: boolean,
    ): () => void {
        this.subscribers.push(handler);

        // Call immediately with current value if requested
        if (notifyWithCurrent) {
            handler(this.currentValue);
        }

        // Return unsubscribe function
        return () => {
            this.subscribers = this.subscribers.filter(
                (sub) => sub !== handler,
            );
        };
    }
}

export function isReactive<T>(value: unknown): value is Reactive<T> {
    return (value as any)?.__tag__ === "Reactive";
}

export function create<A>(value: A, event?: Event<A>): Reactive<A> {
    return new ReactiveImpl(value, event);
}

export function of<A>(value: A): Reactive<A> {
    return new ReactiveImpl(value);
}

export function get<A>(r: Reactive<A>): A {
    return (r as ReactiveImpl<A>).currentValue;
}

export function subscribe<A>(
    r: Reactive<A>,
    fn: (value: A) => void,
): () => void {
    const impl = r as ReactiveImpl<A>;
    if (impl.subscribers == null) {
        console.log("subscribers is null", impl);
    }
    impl.subscribers.push(fn);
    fn(impl.currentValue); // emit current value immediately

    const unsub = () => {
        impl.subscribers = impl.subscribers.filter((f) => f !== fn);
    };

    impl.cleanupFns.add(unsub);
    return unsub;
}

export function changes<A>(r: InternalReactive<A>): Event<A> {
    const impl = r as ReactiveImpl<A>;

    if (!impl.changeEvent) {
        impl.changeEvent = new E.EventImpl(Future.fromReactive(r));
    }

    return impl.changeEvent;
}

export function addCleanup<A>(ev: Reactive<A>, fn: () => void): void {
    const impl = ev as unknown as ReactiveImpl<A>;
    impl.internalAddCleanup(fn);
}

export function cleanup<A>(r: Reactive<A>) {
    const impl = r as ReactiveImpl<A>;
    for (const fn of impl.cleanupFns) {
        try {
            fn();
        } catch (e) {
            console.error("cleanup failed", e);
        }
    }
    impl.cleanupFns.clear();
    impl.subscribers = [];
}

export function map<A, B>(r: Reactive<A>, fn: (a: A) => B): Reactive<B> {
    return ap(r, of(fn));
}

export function ap<A, B>(
    r: Reactive<A>,
    rf: Reactive<(a: A) => B>,
): Reactive<B> {
    const result = new ReactiveImpl(get(rf)(get(r)));

    const sub1 = subscribe(r, (a) => {
        result.currentValue = get(rf)(a);
        result.subscribers.forEach((fn) => fn(result.currentValue));
    });

    const sub2 = subscribe(rf, (f) => {
        result.currentValue = f(get(r));
        result.subscribers.forEach((fn) => fn(result.currentValue));
    });

    result.cleanupFns.add(sub1);
    result.cleanupFns.add(sub2);
    return result;
}

export function chain<A, B>(
    r: Reactive<A>,
    fn: (a: A) => Reactive<B>,
): Reactive<B> {
    let inner = fn(get(r));
    const result = new ReactiveImpl(get(inner));

    let innerUnsub = subscribe(inner, (b) => {
        result.currentValue = b;
        result.subscribers.forEach((f) => f(b));
    });

    const outerUnsub = subscribe(r, (a) => {
        innerUnsub(); // cleanup previous inner
        inner = fn(a);
        result.currentValue = get(inner);
        result.subscribers.forEach((f) => f(result.currentValue));
        innerUnsub = subscribe(inner, (b) => {
            result.currentValue = b;
            result.subscribers.forEach((f) => f(b));
        });
    });

    result.cleanupFns.add(innerUnsub);
    result.cleanupFns.add(outerUnsub);
    return result;
}
