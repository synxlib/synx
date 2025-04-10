import { Event } from "@synx/frp";

export function on<K extends keyof HTMLElementEventMap>(
    el: HTMLElement,
    eventName: K,
    options: OnOptions<K> = {},
): Event<HTMLElementEventMap[K]> {
    const [event, emit] = Event.create<HTMLElementEventMap[K]>();

    const target: EventTarget = options.window
        ? window
        : options.document
          ? document
          : el;

    const handler = (e: globalThis.Event) => {
        const eventTyped = e as HTMLElementEventMap[K];

        if (options.self && e.target !== el) return;
        if (options.outside && !isClickOutside(el, e)) return;

        // if (isKeyboardEvent(eventName)) {
        //     const keyEvent = eventTyped as KeyboardEvent;
        //     const keyOptions = options as Extract<
        //         OnOptions<K>,
        //         { key?: string }
        //     >;

        //     if (keyOptions.key && keyEvent.key !== keyOptions.key) return;
        // }

        if (isKeyboardEvent(eventName)) {
            const keyEvent = eventTyped as KeyboardEvent;
            if (hasKeyOption(options) && keyEvent.key !== options.key) return;
        }


        if (isMouseEvent(eventName)) {
            const mouse = eventTyped as MouseEvent;
            if (options.ctrl && !mouse.ctrlKey) return;
            if (options.shift && !mouse.shiftKey) return;
            if (options.alt && !mouse.altKey) return;
            if (options.meta && !mouse.metaKey) return;
        }

        if ("ctrlKey" in eventTyped && options.ctrl && !eventTyped.ctrlKey)
            return;
        if ("shiftKey" in eventTyped && options.shift && !eventTyped.shiftKey)
            return;
        if ("altKey" in eventTyped && options.alt && !eventTyped.altKey) return;
        if ("metaKey" in eventTyped && options.meta && !eventTyped.metaKey)
            return;

        if (options.prevent) e.preventDefault();
        if (options.stop) e.stopPropagation();

        emit(eventTyped);
    };

    target.addEventListener(eventName, handler, {
        capture: options.capture,
        once: options.once,
        passive: options.passive,
    });

    event.cleanup = () => {
        target.removeEventListener(eventName, handler, {
            capture: options.capture,
        });
    };

    return event;
}

function isClickOutside(el: HTMLElement, event: globalThis.Event): boolean {
    return el && !el.contains(event.target as Node);
}

type BaseOptions = {
    prevent?: boolean;
    stop?: boolean;
    once?: boolean;
    capture?: boolean;
    passive?: boolean;
    self?: boolean;
    outside?: boolean;

    window?: boolean;
    document?: boolean;

    ctrl?: boolean;
    shift?: boolean;
    alt?: boolean;
    meta?: boolean;
};

type KeyboardEventName = "keydown" | "keyup" | "keypress";

type MouseEventName =
    | "click"
    | "dblclick"
    | "contextmenu"
    | "auxclick"
    | "mousedown"
    | "mouseup"
    | "mouseover"
    | "mousemove"
    | "mouseenter"
    | "mouseleave"
    | "mouseout";

function isKeyboardEvent(name: string): name is KeyboardEventName {
    return name === "keydown" || name === "keyup" || name === "keypress";
}

function isMouseEvent(name: string): name is MouseEventName {
    return [
        "click",
        "dblclick",
        "contextmenu",
        "auxclick",
        "mousedown",
        "mouseup",
        "mouseover",
        "mousemove",
        "mouseenter",
        "mouseleave",
        "mouseout",
    ].includes(name);
}

type OnOptions<K extends keyof HTMLElementEventMap> =
    HTMLElementEventMap[K] extends KeyboardEvent
        ? BaseOptions & {
              key?: KeyboardEvent["key"];
              ctrl?: boolean;
              shift?: boolean;
              alt?: boolean;
              meta?: boolean;
          }
        : HTMLElementEventMap[K] extends MouseEvent
          ? BaseOptions & {
                ctrl?: boolean;
                shift?: boolean;
                alt?: boolean;
                meta?: boolean;
            }
          : BaseOptions;

function hasKeyOption<K extends keyof HTMLElementEventMap>(
    opts: OnOptions<K>,
): opts is OnOptions<K> & { key: string } {
    return typeof (opts as any).key === "string";
}
