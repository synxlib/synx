import * as R from "@synx/frp/reactive";
import * as E from "@synx/frp/event";

export const locationHash = (() => {
    let hashReactive: R.Reactive<string> | undefined;
    return () => {
        if (!hashReactive) {
            const [hashChange, emit] = E.create<string>();
            const handler = () => emit(location.hash);
            window.addEventListener("hashchange", handler);
            emit(location.hash);
            hashReactive = E.stepper(hashChange, location.hash);
            E.onCleanup(hashChange, () => {
                window.removeEventListener("hashchange", handler);
            });
        }
        return hashReactive;
    };
})();

export function matchRoute<T extends string>(
    hash: R.Reactive<string>,
    routes: Record<T, string>,
): R.Reactive<T> {
    return R.map(hash, (h) => {
        const path = h.replace(/^#\/?/, "");
        const entry = Object.entries(routes).find(([, v]) => v === path);
        return (entry?.[0] as T) ?? Object.keys(routes)[0]; // fallback to first
    });
}

