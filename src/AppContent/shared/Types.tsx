export type TypeUUID = {
   typeUUID: string
};

export type SubType<T> = {
   [K in keyof T]: T[K] extends object ? SubType<T[K]> : (T[K] extends typeof Function ? never : boolean);
};

export type Type<T> = SubType<T> & TypeUUID;

declare global {
   interface String {
      hashCode(_seed?: number): number;
   }
}

export function isType<T>(elem: T | unknown, record: Type<T>): elem is T {
   for (const key in record) {
      if (key !== 'typeUUID') {
         const value = record[key as keyof Type<T>];
         const subElem = elem === undefined ? undefined : (elem as T)[key as keyof T];

         if (typeof value === 'boolean') {
            if (value && subElem === undefined) {
               return false;
            }

            continue;
         }

         if (typeof value === 'object') {
            if (!isType(subElem, value as Type<unknown>)) {
               return false;
            }
         }
      }
   }

   return true;
}

export function reduce<T>(elem: T, record: Type<T>): T {
   const result: object = {};

   for (const key in record) {
      if (key !== 'typeUUID') {
         const value = record[key as keyof Type<T>];
         const subElem = (elem as T)[key as keyof T];

         if (typeof value === 'boolean') {
            if (subElem !== undefined) {
               (result[key as keyof object] as T[keyof T]) = subElem;
            }

            continue;
         } else if (typeof value === 'object') {
            const res = reduce(subElem, value as Type<unknown>);
            if (res !== undefined) {
               (result[key as keyof object] as unknown) = res;
            }
         }
      }
   }

   return result as T;
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
