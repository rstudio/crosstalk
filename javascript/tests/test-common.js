export function createInvokeCounter() {
  let result = () => {
    result.count++;
  };
  result.count = 0;
  return result;
}
