type ObjectMapper<T> = {
   [K in keyof T as T[K] extends Required<T>[K] ? K : never]: TypeRecord<T[K]>;
} & {
   [K in keyof T as T[K] extends Required<T>[K] ? never : K]: { optional: true, record: TypeRecord<T[K]> };
};

export type TypeRecord<T> =
   T extends (unknown[]) ? TypeRecord<T[number]>[]
   : T extends typeof Function ? never
   : T extends object ? (object extends ObjectMapper<T> ? never : ObjectMapper<T>)
   : T extends boolean ? 'boolean'
   : T extends number ? 'number'
   : T extends bigint ? 'bigint'
   : T extends string ? 'string'
   : T;

export type ReducedType<T> =
   T extends (unknown[]) ? ReducedType<T[number]>[]
   : T extends typeof Function ? never
   : T extends object ? (object extends ObjectMapper<T> ? never : ObjectMapper<T>)
   : T;

declare global {
   interface String {
      hashCode(_seed?: number): number;
   }
}

export const isType = <T,>(elem: unknown, type: TypeRecord<T>): elem is T => {
   if (['boolean', 'number', 'bigint', 'string'].find(e => e === typeof type)) {
      return typeof elem === type;
   }

   if (Array.isArray(type)) {
      if (!Array.isArray(elem)) {
         return false;
      }

      return elem.reduce((last, current) => last && isType(current, type[0] as TypeRecord<unknown>), true);
   }

   console.assert(typeof type === 'object')

   if (Object.keys(type as object).find(key => key === 'optional')) {
      if (elem === undefined) {
         return true;
      } else {
         return isType(elem, (type as { optional: true, record: TypeRecord<unknown> }).record)
      }
   } else if (typeof elem !== 'object') {
      return false;
   }

   for (const key in type) {
      const value = type[key as keyof TypeRecord<T>];
      const subElem = (elem as T)[key as keyof T];

      if (!isType(subElem, value as TypeRecord<unknown>)) {
         return false;
      }
   }

   return true;
}

const reduceImpl = <T,>(elem: T, type: unknown): T => {
   console.assert(type !== undefined)

   if (['boolean', 'number', 'bigint', 'string'].find(e => e === typeof type)) {
      return elem;
   }

   if (Array.isArray(type)) {
      console.assert(Array.isArray(elem));
      return (elem as []).map(value => reduceImpl(value, (type as Array<unknown>)[0])).filter(value => value !== undefined) as T;
   }

   console.assert(typeof type === 'object')

   if (Object.keys(type as object).find(key => key === 'optional')) {
      if (elem !== undefined) {
         return reduceImpl(elem, (type as { optional: true, record: TypeRecord<unknown> }).record);
      } else {
         return undefined as T;
      }
   }

   console.assert(typeof elem === 'object')

   const result: object = {};
   for (const key in (type as object)) {
      const value = (type as object)[key as keyof object];
      const subElem = (elem as T)[key as keyof T];

      const res = reduceImpl(subElem, value);
      if (res !== undefined) {
         (result[key as keyof object] as unknown) = res;
      }

   }

   return result as T;
}

export const reduce = <T,>(elem: T, type: TypeRecord<T>): T => {
   return reduceImpl(elem, type);
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
