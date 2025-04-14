import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import * as E from "./event";

// Mock setTimeout and clearTimeout for testing timing functions
vi.useFakeTimers();

describe("Event.debounce", () => {
    let cleanup: () => void;

    afterEach(() => {
        // Clean up subscriptions after each test
        if (cleanup) {
            cleanup();
        }

        // Reset mocked timers
        vi.clearAllTimers();
        vi.restoreAllMocks();
    });

    it("should create a debounced event", () => {
        const [event, emit] = E.create<number>();
        const debounced = E.debounce(event, 100);

        expect(debounced).toBeDefined();
        expect(typeof (debounced as any).future.run).toBe("function");

        // Clean up
        E.cleanup(event);
        E.cleanup(debounced);
    });

    it("should only emit after the debounce period", () => {
        const [event, emit] = E.create<number>();
        const debounced = E.debounce(event, 100);

        const handler = vi.fn();
        cleanup = E.subscribe(debounced, handler);

        // Emit a value
        emit(1);

        // Handler should not be called immediately
        expect(handler).not.toHaveBeenCalled();

        // Advance timer partially
        vi.advanceTimersByTime(50);
        expect(handler).not.toHaveBeenCalled();

        // Advance timer to completion
        vi.advanceTimersByTime(50);
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(1);

        // Clean up
        E.cleanup(event);
        E.cleanup(debounced);
    });

    it("should only emit the most recent value", () => {
        const [event, emit] = E.create<number>();
        const debounced = E.debounce(event, 100);

        const handler = vi.fn();
        cleanup = E.subscribe(debounced, handler);

        // Emit several values in quick succession
        emit(1);

        // Advance timer partially
        vi.advanceTimersByTime(50);
        expect(handler).not.toHaveBeenCalled();

        // Emit another value, which should reset the timer
        emit(2);

        // Advance timer partially again
        vi.advanceTimersByTime(50);
        expect(handler).not.toHaveBeenCalled();

        // Emit a third value
        emit(3);

        // Advance timer partially again
        vi.advanceTimersByTime(50);
        expect(handler).not.toHaveBeenCalled();

        // Advance timer to completion
        vi.advanceTimersByTime(50);

        // Only the most recent value should be emitted
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(3);

        // Clean up
        E.cleanup(event);
        E.cleanup(debounced);
    });

    it("should reset the timer each time a new value arrives", () => {
        const [event, emit] = E.create<number>();
        const debounced = E.debounce(event, 100);

        const handler = vi.fn();
        cleanup = E.subscribe(debounced, handler);

        // Emit a value
        emit(1);

        // Advance timer partially
        vi.advanceTimersByTime(90);
        expect(handler).not.toHaveBeenCalled();

        // Emit another value just before timeout
        emit(2);

        // Advance timer to what would have been the timeout for the first value
        vi.advanceTimersByTime(10);
        expect(handler).not.toHaveBeenCalled(); // Timer should have been reset

        // Advance to the timeout for the second value
        vi.advanceTimersByTime(90);
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(2);

        // Clean up
        E.cleanup(event);
        E.cleanup(debounced);
    });

    it("should handle multiple emissions after debounce period", () => {
        const [event, emit] = E.create<number>();
        const debounced = E.debounce(event, 100);

        const handler = vi.fn();
        cleanup = E.subscribe(debounced, handler);

        // First emission
        emit(1);
        vi.advanceTimersByTime(100);
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(1);

        // Reset the mock to make counting easier
        handler.mockClear();

        // Second emission
        emit(2);
        vi.advanceTimersByTime(100);
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(2);

        // Third emission with a delay in between
        handler.mockClear();
        emit(3);
        vi.advanceTimersByTime(50);

        // Fourth emission
        emit(4);
        vi.advanceTimersByTime(100);
        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(4);

        // Clean up
        E.cleanup(event);
        E.cleanup(debounced);
    });

    it("should properly clean up timers when unsubscribed", () => {
        const [event, emit] = E.create<number>();
        const debounced = E.debounce(event, 100);

        const clearTimeoutSpy = vi.spyOn(globalThis, "clearTimeout");

        const handler = vi.fn();
        const unsubscribe = E.subscribe(debounced, handler);

        // Emit a value to start the timer
        emit(1);

        // Unsubscribe before the timer finishes
        unsubscribe();
        E.cleanup(debounced);

        // Should have called clearTimeout
        expect(clearTimeoutSpy).toHaveBeenCalled();

        // Advance timer to completion
        vi.advanceTimersByTime(100);

        // Handler should not have been called
        expect(handler).not.toHaveBeenCalled();

        // Clean up
        E.cleanup(event);
    });

    it("should use default debounce time if not specified", () => {
        const [event, emit] = E.create<number>();
        const debounced = E.debounce(event); // Default is typically 249ms in your implementation

        const handler = vi.fn();
        cleanup = E.subscribe(debounced, handler);

        // Emit a value
        emit(1);

        // Advance timer partially
        vi.advanceTimersByTime(200);
        expect(handler).not.toHaveBeenCalled();

        // Advance timer to default timeout
        vi.advanceTimersByTime(49);
        expect(handler).toHaveBeenCalledTimes(1);

        // Clean up
        E.cleanup(event);
        E.cleanup(debounced);
    });

    it("should handle multiple subscribers correctly", () => {
        const [event, emit] = E.create<number>();
        const debounced = E.debounce(event, 100);

        const handler1 = vi.fn();
        const handler2 = vi.fn();

        const unsub1 = E.subscribe(debounced, handler1);
        const unsub2 = E.subscribe(debounced, handler2);

        // Set up cleanup to include both subscriptions
        cleanup = () => {
            unsub1();
            unsub2();
        };

        // Emit a value
        emit(1);

        // Advance timer to completion
        vi.advanceTimersByTime(100);

        // Both handlers should have been called with the same value
        expect(handler1).toHaveBeenCalledTimes(1);
        expect(handler1).toHaveBeenCalledWith(1);
        expect(handler2).toHaveBeenCalledTimes(1);
        expect(handler2).toHaveBeenCalledWith(1);

        // Clean up
        E.cleanup(event);
        E.cleanup(debounced);
    });

    it("should properly handle edge case of 0ms debounce time", () => {
        const [event, emit] = E.create<number>();
        const debounced = E.debounce(event, 0);

        const handler = vi.fn();
        cleanup = E.subscribe(debounced, handler);

        // Emit a value
        emit(1);

        // Even with 0ms, the debounce still uses setTimeout so we need to advance timers
        vi.advanceTimersByTime(0);

        expect(handler).toHaveBeenCalledTimes(1);
        expect(handler).toHaveBeenCalledWith(1);

        // Clean up
        E.cleanup(event);
        E.cleanup(debounced);
    });
});

