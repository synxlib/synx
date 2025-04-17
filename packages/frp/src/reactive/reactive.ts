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

    // Get or create the change event for this reactive
    const changeEvent = changes(impl);

    // Subscribe to the change event
    const eventUnsub = E.subscribe(changeEvent, fn);

    // Call immediately with current value
    fn(impl.currentValue);

    // Add to cleanup functions
    impl.internalAddCleanup(eventUnsub);

    return eventUnsub;
}

export function changes<A>(r: InternalReactive<A>): Event<A> {
    const impl = r as ReactiveImpl<A>;

    if (!impl.changeEvent) {
        impl.changeEvent = new E.EventImpl(Future.fromReactive(r));
    }

    return impl.changeEvent;
}

export function onCleanup<A>(ev: Reactive<A>, fn: () => void): void {
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

export function ap1<A, B>(
    r: Reactive<A>,
    rf: Reactive<(a: A) => B>,
): Reactive<B> {
    // Get initial value
    const initialValue = get(rf)(get(r));

    // Get change events for both reactives
    const aChanges = changes(r as InternalReactive<A>);
    const fChanges = changes(rf as InternalReactive<(a: A) => B>);

    // Create transform functions for mergeWith
    const whenValueChanges = (a: A) => get(rf)(a);
    const whenFunctionChanges = (f: (a: A) => B) => f(get(r));

    // Use mergeWith to combine both change events
    const combinedEvent = E.mergeWith(
        aChanges,
        fChanges,
        whenValueChanges,
        whenFunctionChanges,
    );

    // Create a new reactive with the initial value and combined event
    return create(initialValue, combinedEvent);
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
        innerUnsub = subscribe(inner, (b) => {
            result.currentValue = b;
            result.subscribers.forEach((f) => f(b));
        });
    });

    result.cleanupFns.add(innerUnsub);
    result.cleanupFns.add(outerUnsub);
    return result;
}

export function switchB<A>(
    initial: Reactive<A>,
    eventOfReactives: Event<Reactive<A>>,
): Reactive<A> {
    const initialValue = get(initial);
    const initialEvent = changes(initial as InternalReactive<A>);

    const switchedEvent = E.switchE(
        initialEvent,
        E.map(eventOfReactives, (r) => changes(r as InternalReactive<A>)),
    );

    return create(initialValue, switchedEvent);
}

export function concatE<A>(reactiveEvents: Reactive<Event<A>[]>): Event<A> {
    const current = E.concatAll(get(reactiveEvents)); // initial stream

    const updated = E.map(
        changes(reactiveEvents as InternalReactive<Event<A>[]>),
        E.concatAll,
    );

    return E.switchE(current, updated);
}

export function initialThen<A>(
    initial: Reactive<A>,
    trigger: Event<any>,
    next: () => Reactive<A>,
): Reactive<A> {
    return switchB(initial, E.map(trigger, next));
}

export function mapEachReactive<T, R>(
    list$: Reactive<T[]>,
    mapFn: (item$: Reactive<T>, index: number) => R,
    options?: {
        key?: (item: T, index: number) => string | number;
        isEqual?: (a: T, b: T) => boolean;
        dispose?: (output: R) => void;
    },
): Reactive<R[]> {
    const keyFn = options?.key ?? ((_: T, i: number) => i);
    const isEqual = options?.isEqual ?? ((a, b) => a === b);
    const dispose = options?.dispose;

    const map = new Map<
        string | number,
        { reactive: ReactiveImpl<T>; output: R }
    >();

    let result: R[] = [];
    const out = new ReactiveImpl(result);

    subscribe(list$, (items) => {
        const newKeys = new Set<string | number>();
        const newResult: R[] = [];

        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const key = keyFn(item, i);
            newKeys.add(key);

            let entry = map.get(key);

            if (entry) {
                if (!isEqual(entry.reactive.currentValue, item)) {
                    entry.reactive.updateValueInternal(item);
                }
            } else {
                const reactive = new ReactiveImpl(item);
                const output = mapFn(reactive, i);
                entry = { reactive, output };
                map.set(key, entry);
            }

            newResult.push(entry.output);
        }

        // Cleanup removed keys
        for (const [key, entry] of map.entries()) {
            if (!newKeys.has(key)) {
                cleanup(entry.reactive);
                dispose?.(entry.output);
                map.delete(key);
            }
        }

        result = newResult;
        out.updateValueInternal(result);
    });

    return out;
}
