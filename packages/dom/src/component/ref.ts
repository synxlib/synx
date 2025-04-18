import type { Reactive } from "@synx/frp/reactive";
import type { Event } from "@synx/frp/event";
import { E, R } from "@synx/frp";
import { ComponentFactory } from ".";

/**
 * A reference object that contains a reactive value and a setter
 */
export type RefObject<T> = {
    ref: Reactive<T | null>;
    set: (val: T) => void;
};

/**
 * Create a new RefObject
 */
export function Ref<T>(): RefObject<T> {
    const [ev, emit] = E.create<T>();
    return { ref: E.stepper(ev, null), set: emit } as const;
}

/**
 * A reference map that contains multiple refs indexed by keys
 */
export type RefMapObject<K, T> = {
    map: Reactive<Map<K, T | null>>;
    get: (key: K) => RefObject<T>;
    set: (key: K, value: T) => void;
    delete: (key: K) => void;
    values: () => Reactive<Array<T | null>>;
    keys: () => Reactive<Array<K>>;
    entries: () => Reactive<Array<[K, T | null]>>;
    size: Reactive<number>;
    forEach: (callback: (value: T | null, key: K) => void) => void;
    clear: () => void;
};

/**
 * Create a new reference map that manages multiple refs
 */
export function RefMap<K, T>(): RefMapObject<K, T> {
    // Create an event and a reactive map using the stepper pattern
    const [mapEvent, emitMapUpdate] = E.create<Map<K, T | null>>();
    const reactiveMap = E.stepper(mapEvent, new Map<K, T | null>());

    // Add or update a value
    const set = (key: K, value: T) => {
        const currentMap = R.get(reactiveMap);
        const newMap = new Map(currentMap);
        newMap.set(key, value);
        emitMapUpdate(newMap);
    };

    // Get a ref for a specific key
    const get = (key: K): RefObject<T> => {
        // Create a derived reactive that watches the main map
        const keyRef = R.map(reactiveMap, (map) => map.get(key) ?? null);

        // Create a setter for this specific key
        const setter = (value: T) => set(key, value);

        return { ref: keyRef, set: setter };
    };

    // Delete a key
    const deleteKey = (key: K) => {
        const currentMap = R.get(reactiveMap);
        const newMap = new Map(currentMap);
        newMap.delete(key);
        emitMapUpdate(newMap);
    };

    // Clear all entries
    const clear = () => {
        emitMapUpdate(new Map<K, T | null>());
    };

    // Create derived reactive values
    const values = () => R.map(reactiveMap, (map) => Array.from(map.values()));
    const keys = () => R.map(reactiveMap, (map) => Array.from(map.keys()));
    const entries = () =>
        R.map(reactiveMap, (map) => Array.from(map.entries()));
    const size = R.map(reactiveMap, (map) => map.size);

    return {
        map: reactiveMap,
        get,
        set,
        delete: deleteKey,
        clear,
        values,
        keys,
        entries,
        size,
        forEach: (callback) => {
            const map = R.get(reactiveMap);
            map.forEach(callback);
        },
    };
}

/**
 * Get an output event from a component ref
 */
export const refOutput = <T>(
    r: {
        ref: Reactive<
            { outputs?: Record<string, Event<any>> } | undefined | null
        >;
    },
    n: string,
    defaultValue?: T,
): Event<T> => {
    const fallback =
        defaultValue !== undefined ? E.of(defaultValue) : E.never<T>();

    const outputEventReactive = R.map(
        r.ref,
        (v) => (v?.outputs?.[n] ?? fallback),
    );

    const initial = R.get(r.ref)?.outputs?.[n] ?? fallback;

    const event = R.switchR(initial, outputEventReactive);

    return event;
};

/**
 * Get a reactive array of output events from a RefMap
 */
export const refMapOutputs = <K, T, O>(
    r: RefMapObject<K, ReturnType<ComponentFactory>>,
    n: string,
    defaultValue?: O,
): Reactive<Event<O>[]> => {
    // Convert map to array of values
    const componentsArray = R.map(r.map, (map) => Array.from(map.values()));

    // Map each component to its output event
    return R.map(componentsArray, (components) =>
        components
            .filter(Boolean) // Remove nulls
            .map((component) => {
                if (component?.outputs?.[n]) {
                    return component.outputs[n] as Event<O>;
                }
                return defaultValue !== undefined
                    ? E.of(defaultValue)
                    : E.never<O>();
            }),
    );
};

/**
 * Merge all output events from a RefMap into a single event
 */
export const mergeRefOutputs = <
    K,
    T extends { outputs?: Record<string, Event<any>> },
    O = any,
>(
    r: RefMapObject<K, T>,
    n: string,
    defaultValue?: O,
): Event<O> => {
    // Get reactive array of events
    const eventsArray = R.map(r.values(), (components) =>
        components
            .filter(Boolean) // Remove nulls
            .map((component) => {
                if (component?.outputs?.[n]) {
                    return component.outputs[n] as Event<O>;
                }
                return defaultValue !== undefined
                    ? E.of(defaultValue)
                    : E.never<O>();
            }),
    );

    // Use R.concatE to merge all events in the array
    return R.concatE(eventsArray);
};

/**
 * Utility to concatenate all output events from a reactive array of components
 */
export const concatOutputsFromArray = <T, O>(
    itemsRef: Reactive<Array<ReturnType<ComponentFactory> | null | undefined>>,
    outputName: string,
    defaultValue?: O,
): Event<O> => {
    // Map the reactive array to a reactive array of events
    const eventsArray = R.map(itemsRef, (items) =>
        (items || []).filter(Boolean).map((item) => {
            if (item?.outputs?.[outputName]) {
                return item.outputs[outputName] as Event<O>;
            }
            return defaultValue !== undefined
                ? E.of(defaultValue)
                : E.never<O>();
        }),
    );

    // Use R.concatE to merge all events in the array
    return R.concatE(eventsArray);
};

