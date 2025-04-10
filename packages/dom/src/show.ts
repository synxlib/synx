import { Reactive } from "@synx/frp";

export function show(
    el: HTMLElement,
    reactive: Reactive<boolean>,
    opts: { important?: boolean } = {},
): () => void {
    const computed = getComputedStyle(el).display;
    const originalDisplay =
        computed === "none"
            ? getDefaultDisplay(el.tagName.toLowerCase())
            : computed;

    const setVisibility = (visible: boolean) => {
        if (visible) {
            el.style.setProperty(
                "display",
                originalDisplay,
                opts.important ? "important" : "",
            );
        } else {
            el.style.setProperty(
                "display",
                "none",
                opts.important ? "important" : "",
            );
        }
    };

    if (el.hasAttribute("x-cloak")) el.removeAttribute("x-cloak");

    setVisibility(reactive.get());
    return reactive.subscribe(setVisibility);
}

const displayCache = new Map<string, string>();

function getDefaultDisplay(tagName: string): string {
    if (displayCache.has(tagName)) return displayCache.get(tagName)!;

    const temp = document.createElement(tagName);
    document.body.appendChild(temp);
    const display = getComputedStyle(temp).display;
    document.body.removeChild(temp);

    displayCache.set(tagName, display);
    return display;
}

