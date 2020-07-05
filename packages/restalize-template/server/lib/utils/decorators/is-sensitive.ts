export type IsSensitiveOptions = {
  /**
   * The number of asterisks to use to mask
   * the sensitive value
   * @type {number}
   */
  maskLength: number;
};

/**
 * This decorator factory returns a decorator that returns
 * a fixed length string "**************"
 * for any class field decorated with @IsSensitive()
 * You can place this on the password field of an entity to
 * always mask it when converting to JSON.
 * @param {IsSensitiveOptions} options
 * @returns {string}
 */
export function IsSensitive(
  options = { maskLength: 15 } as IsSensitiveOptions
) {
  return function (target: any, key: string | symbol) {
    if (options.maskLength < 1) {
      throw new Error(
        "@IsSensitive Decorator: maskLength should be an integer greater than zero"
      );
    }
    let val = target[key];

    const descriptor = {
      get: () => val,
      set: (next: any) => (val = next),
      enumerable: true,
      configurable: true,
    };

    Object.defineProperty(target, key, descriptor);

    // we're using the getter function to store an
    // additional attibute to be used when doing toJSON()
    // @ts-ignore
    descriptor.get.$shouldMask = options.maskLength;

    target.toJSON = function () {
      let output: any = {};
      for (let i in this) {
        if (typeof this[i] !== "function") {
          const desc = Object.getOwnPropertyDescriptor(target, i);
          // @ts-ignore
          const maskLength = desc?.get.$shouldMask;
          if (maskLength && this[i] !== undefined) {
            output[i] = new Array(maskLength).fill("*").join("");
          } else {
            output[i] = this[i];
          }
        }
      }
      return output;
    };

    return target;
  };
}
