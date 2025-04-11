import type { Reactive } from "@synx/frp/reactive";
import type { Event } from "@synx/frp/event";
import { map as mapE, stepper } from "@synx/frp/event";
import { map as mapR, isReactive } from "@synx/frp/reactive";

/**
 * Creates a reactive random number that updates when the trigger changes
 *
 * @param trigger A reactive value or event that triggers a new random number when it changes
 * @param min Minimum value (default: 0)
 * @param max Maximum value (default: 1)
 * @returns A reactive random number that updates when the trigger changes
 */
export const random = <T>(
    trigger: Reactive<T> | Event<any>,
    min: number = 0,
    max: number = 1,
): Reactive<number> =>
    randomFactory(
        () => randomBetween(min, max),
        trigger,
    );

/**
 * Creates a reactive random integer that updates when the trigger changes
 *
 * @param trigger A reactive value that triggers a new random number when it changes
 * @param min Minimum value (inclusive, default: 0)
 * @param max Maximum value (exclusive, default: 100)
 * @returns A reactive random integer that updates when the trigger changes
 */
export const randomInt = <T>(
    trigger: Reactive<T> | Event<any>,
    min: number = 0,
    max: number = 100,
): Reactive<number> =>
    randomFactory(
        () => randomIntBetween(min, max),
        trigger,
    )

/**
 * Creates a reactive random item from an array that updates when the trigger changes
 *
 * @param trigger A reactive value that triggers a new random selection when it changes
 * @param items Array of items to choose from
 * @returns A reactive random item from the array that updates when the trigger changes
 */
export const randomItem = <T, U>(
    trigger: Reactive<T> | Event<T>,
    items: U[],
): Reactive<U> =>
    randomFactory(
        () => items[randomIntBetween(0, items.length - 1)],
        trigger,
    );

/**
 * Creates a reactive random boolean value that changes when the trigger changes
 *
 * @param trigger A reactive value that triggers a new random boolean when it changes
 * @param trueProbability Probability of getting true (0-1, default: 0.5)
 * @returns A reactive random boolean that updates when the trigger changes
 */
export const randomBool = <T>(
    trigger: Reactive<T> | Event<T>,
    trueProbability: number = 0.5,
): Reactive<boolean> =>
    randomFactory(
        () => Math.random() < trueProbability,
        trigger,
    );

function randomFactory<T, R>(
    fn: () => R,
    trigger: Reactive<T> | Event<T>
): Reactive<R> {
    if (isReactive(trigger)) {
        return mapR(trigger, fn);
    } else {
        return stepper(mapE(trigger, fn), fn());
    }
}

function randomBetween(min: number, max: number): number {
    return min + Math.random() * (max - min);
}

function randomIntBetween(min: number, max: number): number {
    return Math.floor(min + Math.random() * (max - min));
}

