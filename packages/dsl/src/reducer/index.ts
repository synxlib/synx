import * as E from "@synx/frp/event";
import { Reactive } from "@synx/frp/reactive";

export function on<A, S>(
    event: E.Event<A>,
    reducer: (value: A, state: S) => S,
): [E.Event<A>, (value: A, state: S) => S] {
    return [event, reducer];
}

export function combineReducers<S>(
    initial: S,
    registrations: Array<[E.Event<any>, (value: any, state: S) => S]>,
): Reactive<S> {
    // Convert each event to produce a state updater function
    const stateUpdaters = registrations.map(([event, reducer]) =>
        E.map(event, (value) => (state: S) => reducer(value, state)),
    );

    // Combine all state updater events
    const allUpdaters = stateUpdaters.reduce(
        (combined, updater) => E.concat(combined, updater),
        E.never<(state: S) => S>(),
    );

    return E.fold(allUpdaters, initial, (state, updater) => updater(state));
}
