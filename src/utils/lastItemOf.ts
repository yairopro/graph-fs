const lastItemOf = <R extends unknown = unknown, T extends Array<R> = Array<R>>(
  array: T
): R => {
  return array[array.length - 1];
};
export { lastItemOf };
export default lastItemOf;
