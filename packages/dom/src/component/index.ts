import { create as createEvent, Event, stepper } from "@synx/frp/event";
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

export type ComponentFactory = () => {
    el: Node;
    props: Record<string, { prop: Reactive<any>; emit: (value: any) => void }>;
    outputs: Record<string, Reactive<any>>;
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

type RefObject<T> = { ref: Reactive<T>; set: (val: T) => void };

export function Ref<T>() {
    const [ev, emit] = createEvent<T>();
    const ref = stepper(ev, undefined as unknown as T);
    const set = (val: T) => emit(val);
    return { ref, set } as const;
}

export const refOutput = <T>(
    r: { ref: Reactive<{ outputs?: Record<string, Reactive<T>> } | undefined> },
    n: string,
    defaultValue?: T,
): Reactive<T> => {
    return chain(
        map(r.ref, (_r) => _r?.outputs || {}),
        (o) => o[n] || of(defaultValue),
    );
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
    }
>(
    create: (initialProps: InitialProps) => T
): (
    props: {
        ref?: RefObject<T>;
    } & {
        [K in keyof InitialProps]: InitialProps[K] | Reactive<InitialProps[K]>;
    }
) => T {
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

        if (ref) {
            ref.set(instance);
        }

        for (const [key, value] of Object.entries(rest)) {
            const target = instance.props[key];
            if (target && typeof target === "object" && "emit" in target) {
                if (isReactive(value)) {
                    subscribe(value, target.emit);
                } else {
                    target.emit(value);
                }
            }
        }

        return instance;
    };
}

export function children<T>(
    list: Reactive<T[]>,
    create: (item: T, index: number) => Node,
): (parent: HTMLElement) => () => void;

export function children<T>(
    list: Reactive<T[]>,
    config: {
        create: (item: T, index: number) => Node;
        update?: (node: Node, item: T, index: number) => void;
        shouldUpdate?: (prev: T, next: T) => boolean;
        key?: (item: T) => string | number;
    },
): (parent: HTMLElement) => () => void;

export function children<T>(
    list: Reactive<T[]>,
    arg:
        | ((item: T, index: number) => Node)
        | {
              create: (item: T, index: number) => Node;
              update?: (node: Node, item: T, index: number) => void;
              shouldUpdate?: (prev: T, next: T) => boolean;
              key?: (item: T) => string | number;
          },
) {
    return (parent: HTMLElement) => {
        const config = typeof arg === "function" ? { create: arg } : arg;

        // const initialChildren = get(list);
        // const fragment = document.createDocumentFragment();
        // fragment.append(
        //     ...initialChildren.map((item, index) => config.create(item, index)),
        // );
        // parent.appendChild(fragment);

        return applyChildren(parent, {
            each: list,
            create: config.create,
            update: config.update,
            shouldUpdate: config.shouldUpdate,
            key: config.key,
        });
    };
}
