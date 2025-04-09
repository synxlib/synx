import { Event } from "@synx/frp";

// Create an event from a DOM event source with cleanup
export function fromEvent<K extends keyof HTMLElementEventMap>(
    element: HTMLElement,
    eventName: K,
    useCapture = false
): Event<HTMLElementEventMap[K]> {
    const [event, emit] = Event.create<HTMLElementEventMap[K]>();

    // Create the event handler
    const handler = (e: HTMLElementEventMap[K]) => {
        emit(e);
    };

    // Add the event listener
    element.addEventListener(eventName, handler as EventListener, useCapture);

    // Add cleanup to remove the event listener
    event.cleanup = () => {
        element.removeEventListener(eventName, handler as EventListener);
    };

    return event;
}
