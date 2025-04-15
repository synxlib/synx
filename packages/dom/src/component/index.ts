import { create as createEvent, Event, stepper } from "@synx/frp/event";
import { Reactive, get, isReactive, subscribe, chain, map } from "@synx/frp/reactive";

export type ComponentFactory = () => {
    el: Node;
    props: Record<string, { prop: Reactive<any>; emit: (value: any) => void }>;
    outputs: Record<string, Reactive<any>>;
};

type ExtractPropType<P> = 
  P extends { prop: Reactive<infer A> } ? A : never;

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

export function refOutputs<T extends ReturnType<ComponentFactory>>(ref: RefObject<T>, outputName?: string) {
    if (outputName) {
        return chain(ref.ref, (r) => r.outputs[outputName]);
    } else {
        return map(ref.ref, (r) => r.outputs);
    }
}

export function defineComponent<T extends ReturnType<ComponentFactory>>(
    create: () => T,
): (
    props: ComponentInputProps<T> & {
        ref?: RefObject<T>;
    },
) => T {
    return (props) => {
        const instance = create();

        const { ref, ...rest } = props ?? {};

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

