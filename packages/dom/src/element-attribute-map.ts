import type { JSX as SolidJSX } from "solid-js";

type RawJSXMap = SolidJSX.IntrinsicElements;

type StripEvents<T> = {
    [K in keyof T as K extends `on${string}` ? never : K]: T[K];
};

export type ElementAttributeMap = {
    [K in keyof RawJSXMap]: StripEvents<RawJSXMap[K]>;
};
