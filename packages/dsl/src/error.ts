export type Either<E, A> = Left<E> | Right<A>;

export class Left<E> {
    readonly _tag: "Left" = "Left";
    constructor(readonly value: E) {}

    isLeft(): this is Left<E> {
        return true;
    }

    isRight(): false {
        return false;
    }

    map<B>(_f: (a: never) => B): Either<E, B> {
        return this as any;
    }

    flatMap<B>(_f: (a: never) => Either<E, B>): Either<E, B> {
        return this as any;
    }

    ap<B, A>(this: Left<E>, _fa: Either<E, A>): Either<E, B> {
        return this;
    }

    fold<A, B>(onLeft: (e: E) => B, _onRight: (a: A) => B): B {
        return onLeft(this.value);
    }
}

export class Right<A> {
    readonly _tag: "Right" = "Right";
    constructor(readonly value: A) {}

    isLeft(): false {
        return false;
    }

    isRight(): this is Right<A> {
        return true;
    }

    map<B>(f: (a: A) => B): Either<never, B> {
        return new Right(f(this.value));
    }

    flatMap<E, B>(f: (a: A) => Either<E, B>): Either<E, B> {
        return f(this.value);
    }

    ap<E, B>(this: Right<(a: A) => B>, fa: Either<E, A>): Either<E, B> {
        return fa.isRight() ? new Right(this.value(fa.value)) : fa;
    }

    fold<E, B>(_onLeft: (e: E) => B, onRight: (a: A) => B): B {
        return onRight(this.value);
    }
}

export const left = <E, A>(e: E): Either<E, A> => new Left(e);
export const right = <E, A>(a: A): Either<E, A> => new Right(a);