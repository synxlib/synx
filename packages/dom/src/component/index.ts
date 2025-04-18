import { create as createEvent, Event, stepper } from "@synx/frp/event";
import { E, R } from "@synx/frp";
import {
    Reactive,
    get,
    isReactive,
    subscribe,
    chain,
    map,
    of,
} from "@synx/frp/reactive";
import { children as applyChildren } from "../children";
import { RefObject, RefMapObject } from "./ref";
export { Ref, RefMap, refOutput, mergeRefOutputs } from "./ref";

export type ComponentFactory = () => {
    el: Node;
    props: Record<string, { prop: Reactive<any>; emit: (value: any) => void }>;
    outputs: Record<string, Event<any>>;
};

type ExtractPropType<P> = P extends { prop: Reactive<infer A> } ? A : never;

type PropInput<P> = ExtractPropType<P> | Reactive<ExtractPropType<P>>;

type ComponentInputProps<T extends { props: Record<string, any> }> = {
    [K in keyof T["props"]]?: PropInput<T["props"][K]>;
};

export const Prop = <A>(initial: A) => {
    const [ev, emit] = createEvent<A>();
    const prop = stepper(ev, initial);
    return { prop, emit };
};

type Propify<T> = {
    [K in keyof T]: {
        prop: Reactive<T[K]>;
        emit: (value: T[K]) => void;
    };
};

export function defineComponent<
    InitialProps extends Record<string, unknown>,
    T extends {
        el: HTMLElement;
        props: Propify<InitialProps>;
        outputs: any;
    },
>(
    create: (initialProps: InitialProps) => T,
): (
    props: {
        ref?: RefObject<T & { cleanup: () => void }>;
    } & {
        [K in keyof InitialProps]: InitialProps[K] | Reactive<InitialProps[K]>;
    },
) => T & { cleanup: () => void } {
    return (props) => {
        const { ref, ...rest } = props ?? {};

        const instance = create(
            Object.fromEntries(
                Object.entries(rest).map(([k, v]) => [
                    k,
                    isReactive(v) ? get(v) : v,
                ]),
            ) as InitialProps,
        );

        const unsubscribers: (() => void)[] = [];

        for (const [key, value] of Object.entries(rest)) {
            const target = instance.props[key];
            if (target && typeof target === "object" && "emit" in target) {
                if (isReactive(value)) {
                    unsubscribers.push(subscribe(value, target.emit));
                } else {
                    target.emit(value);
                }
            }
        }

        const returnValue = {
            ...instance,
            cleanup: () => {
                for (const unsub of unsubscribers) unsub();
                unsubscribers.length = 0;
            },
        };

        if (ref) {
            ref.set(returnValue);
        }

        return returnValue;
    };
}

// export function children<T>(
//     list: Reactive<T[]>,
//     create: (item: T, index: number) => Node | [Node, () => void],
// ): (parent: HTMLElement) => () => void;

// export function children<T>(
//     list: Reactive<T[]>,
//     config: {
//         create: (item: T, index: number) => Node | [Node, () => void];
//         update?: (node: Node, item: T, index: number) => void;
//         shouldUpdate?: (prev: T, next: T) => boolean;
//         key?: (item: T) => string | number;
//     },
// ): (parent: HTMLElement) => () => void;

// export function children<T>(
//     list: Reactive<T[]>,
//     arg:
//         | ((item: T, index: number) => Node | [Node, () => void])
//         | {
//               create: (item: T, index: number) => Node | [Node, () => void];
//               update?: (node: Node, item: T, index: number) => void;
//               shouldUpdate?: (prev: T, next: T) => boolean;
//               key?: (item: T) => string | number;
//           },
// ) {
//     return (parent: HTMLElement) => {
//         const config = typeof arg === "function" ? { create: arg } : arg;

//         return applyChildren(parent, {
//             each: list,
//             create: config.create,
//             update: config.update,
//             shouldUpdate: config.shouldUpdate,
//             key: config.key,
//         });
//     };
// }

export function each<T>(
    list: Reactive<T[]>,
    config: {
        create: (
            item: T,
            key: string | number,
        ) =>
            | Node
            | [Node, () => void]
            | ReturnType<ComponentFactory & { cleanup: () => void }>;
        update?: (node: Node, item: T, index: number) => void;
        shouldUpdate?: (prev: T, next: T) => boolean;
        key?: (item: T) => string | number;
    },
): (parent: HTMLElement) => () => void;

export function each<T>(
    list: Reactive<T[]>,
    arg:
        | ((
              item: Reactive<T>,
              index: number,
          ) =>
              | Node
              | [Node, () => void]
              | ReturnType<ComponentFactory & { cleanup: () => void }>)
        | {
              create: (
                  item: Reactive<T>,
                  key: string | number,
              ) =>
                  | Node
                  | [Node, () => void]
                  | ReturnType<ComponentFactory & { cleanup: () => void }>;
              update?: (node: Node, item: T, index: number) => void;
              shouldUpdate?: (prev: T, next: T) => boolean;
              key?: (item: T) => string | number;
          },
) {
    return (parent: HTMLElement) => {
        const config =
            typeof arg === "function"
                ? {
                      create: arg,
                      key: undefined,
                      update: undefined,
                      shouldUpdate: undefined,
                  }
                : arg;

        const keyFn = config.key ?? ((_, i) => i);

        const items = R.mapEachReactive(list, config.create, {
            key: config.key,
        });

        const enhancedCreate = (
            item:
                | Node
                | {
                      el: Node;
                      props: Record<
                          string,
                          {
                              prop: Reactive<any>;
                              emit: (value: any) => void;
                          }
                      >;
                      outputs: Record<string, Event<any>>;
                  } & { cleanup: () => void }
                | [Node, () => void],
            index: number,
        ): [Node, () => void] => {
            if (Array.isArray(item)) return item;
            if ("el" in item) return [item.el, item.cleanup ?? (() => {})];
            return [item, () => {}];
        };

        return applyChildren(parent, {
            each: items,
            create: enhancedCreate,
        });
    };
}
