import isDefined from './isDefined';

const toString = (path: any): String | void => {
  if (isDefined(path)) return String(path);
};
export { toString };
export default toString;
