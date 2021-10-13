const lastItemOf = <T extends Array<unknown> = Array<unknown>>(array: T)  => {
  return array[array.length - 1];
};
export { lastItemOf };
export default lastItemOf;
