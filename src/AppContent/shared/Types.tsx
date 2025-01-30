export type TypeUUID = {
   typeUUID: string
};
export type Type<T> = Record<keyof T, boolean> & TypeUUID;

declare global {
   interface String {
      hashCode(_seed?: number): number;
   }
}

export function isType<T>(elem: unknown | T, record: object): elem is T {
   return Object.keys(record).filter(key => key !== 'typeUUID').reduce((result, key) =>
      result && (elem as T)[key as keyof T] !== undefined, true);
}

export function reduce<T>(elem: unknown | T, record: object): T {
   return JSON.parse(`{${Object.keys(record).filter(key => key !== 'typeUUID').map(key => `"${key}":${(JSON.stringify((elem as T)[key as keyof T]))}`).join()}}`);
}

export const deepEquals = (object1: object, object2: object) => {
   const keys1 = Object.keys(object1);
   const keys2 = Object.keys(object2);
   if (keys1.length !== keys2.length) {
      return false;
   }
   for (const key of keys1) {
      const val1 = object1[key as keyof object];
      const val2 = object2[key as keyof object];
      const areObjects = isObject(val1) && isObject(val2);
      if (
         areObjects && !deepEquals(val1, val2) ||
         !areObjects && val1 !== val2
      ) {
         return false;
      }
   }
   return true;
}

export const isObject = (object: object) => {
   return object != null && typeof object === 'object';
}

// String.prototype.hashCode = function (seed: number = 0) {
//    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed;
//    for (let i = 0, ch; i < this.length; ++i) {
//       ch = this.charCodeAt(i);
//       h1 = Math.imul(h1 ^ ch, 2654435761);
//       h2 = Math.imul(h2 ^ ch, 1597334677);
//    }
//    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507);
//    h1 ^= Math.imul(h2 ^ (h2 >>> 13), 3266489909);
//    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507);
//    h2 ^= Math.imul(h1 ^ (h1 >>> 13), 3266489909);

//    return 4294967296 * (2097151 & h2) + (h1 >>> 0);
// }
