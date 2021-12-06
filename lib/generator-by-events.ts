import EventEmitter from "events";

const endSymbol = Symbol("end");
type endSymbol = typeof endSymbol;

const isEndSymbol = (value: unknown): value is endSymbol => value === endSymbol

export interface initCallback<T> {
    (arg: {
        push: (value: T) => void
        error: (error: any) => void
        done: () => void
    }): void;
}

export function generatorByEvents<T>(init: initCallback<T>): AsyncGenerator<T> {
    const events = new EventEmitter();
    const refError: { error?: any } = {};
    let finished = false;
    const changes: (T | endSymbol)[] = []

    const data = (value: T | endSymbol) => {
        const emitted = events.emit("data", value);
        if (!emitted) {
            changes.push(value);
        }
    }

    init({
        push: (v: T) => data(v),
        done: () => data(endSymbol),
        error: (e: any) => {
            refError.error = e;
            data(endSymbol);
        },
    })

    return {
        next: async () => {
            if (finished) return { value: undefined, done: true }
            if (Object.hasOwnProperty.call(refError, 'error')) {
                finished = true
                throw refError.error
            }
            if (changes.length === 0) {
                return new Promise<{ value: T, done: boolean }>((resolve, reject) => {
                    const handler = (snap: T | endSymbol) => {
                        if (Object.hasOwnProperty.call(refError, 'error')) {
                            finished = true
                            reject(refError.error)
                            return
                        }
                        if (isEndSymbol(snap)) {
                            resolve({ value: undefined!, done: true })
                            return
                        }
                        resolve({ value: snap, done: false });
                    }
                    events.once('data', handler);
                });
            }
            const value = changes.shift()!;
            if (isEndSymbol(value)) {
                return { value: undefined, done: true }
            }
            return { value, done: false };
        },
        return: async (value?: any) => {
            data(endSymbol);
            return { value, done: true };
        },
        throw: async (error: any) => {
            data(endSymbol);
            return { value: undefined, done: true };
        },
        [Symbol.asyncIterator]() {
            return this;
        },
    }
}
