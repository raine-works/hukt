/** biome-ignore-all lint/suspicious/noExplicitAny: any is needed */
type ErrorCodes = 'ABORT_ERR';

export class CustomError extends Error {
	code: ErrorCodes;
	id: string;
	constructor(options: { message?: string; code: ErrorCodes; cause?: Error }) {
		super(options.message, { cause: options.cause });
		this.name = this.constructor.name;
		this.code = options.code;
		this.id = Bun.randomUUIDv7();
	}
}

type Success<T> = { data: T; error: null };
type Failure<E> = { data: null; error: E };
type Result<T, E = CustomError> = Success<T> | Failure<E>;

function isAsyncIterable<T>(input: any): input is AsyncIterable<T> {
	return input != null && typeof input[Symbol.asyncIterator] === 'function';
}

// 1. Overload for Promises
export function tryCatch<T, E = CustomError>(promise: Promise<T>): Promise<Result<T, E>>;

// 2. Overload for Async Iterables
export function tryCatch<T, E = CustomError>(iterable: AsyncIterable<T>): AsyncGenerator<Result<T, E>>;

// 3. New Overload for Synchronous Functions
export function tryCatch<T, E = CustomError>(fn: () => T): Result<T, E>;

export function tryCatch<T, E = CustomError>(
	input: Promise<T> | AsyncIterable<T> | (() => T)
): Promise<Result<T, E>> | AsyncGenerator<Result<T, E>> | Result<T, E> {
	// Handle Synchronous Function
	if (typeof input === 'function') {
		try {
			return { data: input(), error: null };
		} catch (error) {
			return { data: null, error: error as E };
		}
	}

	// Handle Async Iterable
	if (isAsyncIterable(input)) {
		return (async function* () {
			try {
				for await (const item of input) {
					yield { data: item, error: null };
				}
			} catch (error) {
				yield { data: null, error: error as E };
			}
		})();
	}

	// Handle Promise
	return input
		.then((data) => ({ data, error: null }) as Success<T>)
		.catch((error) => ({ data: null, error: error as E }) as Failure<E>);
}
