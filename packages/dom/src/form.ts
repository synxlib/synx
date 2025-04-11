import { Event, map } from '@synx/frp/event';

export const targetValue = (ev: Event<globalThis.Event>) =>
    map(ev, (e) => (e.target as HTMLInputElement).value);