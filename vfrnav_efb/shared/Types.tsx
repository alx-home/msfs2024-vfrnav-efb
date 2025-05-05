/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2024 Alexandre GARCIN
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If
 * not, see <https://www.gnu.org/licenses/>.
 */

type PartialObjectMapper<T> = {
  [K in keyof T as T[K] extends Required<T>[K] ? K : never]: PartialTypeRecord<T[K]>;
};

export type PartialTypeRecord<T> =
  T extends (unknown[]) ? { array: true, record: PartialTypeRecord<T[number]> }
  : T extends typeof Function ? never
  : T extends object ? PartialObjectMapper<T>
  : T extends boolean ? 'boolean'
  : T extends number ? 'number'
  : T extends bigint ? 'bigint'
  : T extends string ? 'string'
  : T;

type ExtendIf<T, U = T> = T extends never ? never : {} extends T ? never : U;

type ExtendObjectMapper<T> = {
  [K in keyof T as T[K] extends Required<T>[K] ? never : K]-?: { optional: true, record: TypeRecord2<T[K]> };
} & {
  [K in keyof T as (ExtendTypeRecord<T[K]> extends infer R ? ExtendIf<R, K> : never)]: ExtendTypeRecord<T[K]>;
};


export type ExtendTypeRecord<T> =
  T extends (unknown[]) ? ExtendIf<ExtendTypeRecord<T[number]>, { array: true, record: TypeRecord2<T[number]> }>
  : T extends object ? ExtendIf<ExtendObjectMapper<T>>
  : never;

type ObjectMapper<T> = {
  [K in keyof T as T[K] extends Required<T>[K] ? K : never]: TypeRecord2<T[K]>;
} & {
  [K in keyof T as T[K] extends Required<T>[K] ? never : K]-?: { optional: true, record: TypeRecord2<T[K]> };
};

export type TypeRecord2<T> =
  T extends (unknown[]) ? { array: true, record: TypeRecord2<T[number]> }
  : T extends typeof Function ? never
  : T extends object ? ObjectMapper<T>
  : T extends boolean ? 'boolean'
  : T extends number ? 'number'
  : T extends bigint ? 'bigint'
  : T extends string ? 'string'
  : T;

export type TypeRecord<T> = TypeRecord2<T> & {
  defaultValues: T
};

declare global {
  interface String {
    hashCode(_seed?: number): number;
  }
}

export const isType = <T,>(elem: unknown, type: TypeRecord<T>): elem is T => {
  if (['boolean', 'number', 'bigint', 'string'].find(e => e === typeof type)) {
    return typeof elem === type;
  }


  console.assert(typeof type === 'object')

  if (Object.keys(type as any).length === 2 && (type as any)['array'] && (type as any)['record']) {
    if (!Array.isArray(elem)) {
      return false;
    }

    return elem.reduce((last, current) => last && isType(current, (type as any).record), true);
  }

  if (Object.keys(type as any).length === 2 && (type as any)['optional'] && (type as any)['record']) {
    if (elem === undefined) {
      return true;
    } else {
      return isType(elem, (type as any).record)
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

  if (Object.keys(type as any).length === 2 && (type as any)['array'] && (type as any)['record']) {
    console.assert(Array.isArray(elem));
    return (elem as []).map(value => reduceImpl(value, (type as any).record)).filter(value => value !== undefined) as T;
  }

  console.assert(typeof type === 'object')

  if (Object.keys(type as any).length === 2 && (type as any)['optional'] && (type as any)['record']) {
    if (elem !== undefined) {
      return reduceImpl(elem, (type as any).record);
    } else {
      return undefined as T;
    }
  }

  console.assert(typeof elem === 'object')

  const result: object = {};
  for (const key in (type as object)) {
    if (key === "defaultValues") {
      continue;
    }

    const value = (type as object)[key as keyof object];
    const subElem = elem[key as keyof T];

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

const fillImpl = <T,>(elem: T, defaultValue: T): T => {
  if (defaultValue === undefined) {
    return elem;
  }

  {
    const type = ['boolean', 'number', 'bigint', 'string'].find(e => e === typeof defaultValue)
    if (type) {
      if (elem !== undefined && typeof elem === type) {
        return elem
      }
      return defaultValue;
    }
  }

  if (Array.isArray(defaultValue)) {
    if (!Array.isArray(elem)) {
      return defaultValue;
    }
    return (elem as []).map(value => fillImpl(value, (defaultValue as Array<unknown>)[0])) as T;
  }

  console.assert(typeof defaultValue === 'object')
  if (typeof elem !== 'object') {
    return defaultValue;
  }

  for (const key in (defaultValue as object)) {
    const value = (defaultValue as object)[key as keyof object];
    const subElem = (elem as T)[key as keyof T];

    (elem as T)[key as keyof T] = fillImpl(subElem, value);
  }

  return elem;
}

export const fill = <T,>(elem: T, defaultValue: T): T => {
  return fillImpl(elem, defaultValue);
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

const GenRecord2 = <T,>(defaultValue: T): PartialTypeRecord<T> => {
  if (['boolean', 'number', 'bigint', 'string'].find(e => e === typeof defaultValue)) {
    return typeof defaultValue as PartialTypeRecord<T>;
  }

  if (Array.isArray(defaultValue)) {
    return undefined as PartialTypeRecord<T>;
  }

  console.assert(typeof defaultValue === 'object')

  const result = {};
  for (const key in defaultValue) {
    const value = defaultValue[key];

    (result as any)[key] = GenRecord2(value);
  }

  return result as PartialTypeRecord<T>;
}

const AppendExt = (extensions: any, record?: any): any => {
  if (['boolean', 'number', 'bigint', 'string'].find(e => e === typeof extensions)) {
    return extensions;
  }

  if (Object.keys(extensions).length === 2 && extensions['array'] && extensions['record']) {
    if (record) {
      console.assert(Object.keys(record).length === 2 && record['array'] && record['record'])
      return { array: true, record: AppendExt(extensions.record, record!.record) };
    }

    return extensions;
  }

  console.assert(typeof extensions === 'object')

  if (record) {
    const result = (Object.keys(extensions).length === 2 && extensions['optional'] && extensions['record'])
      ? { optional: true, record: record }
      : record;

    for (const key in extensions) {
      if (key === "defaultValues") {
        continue;
      }

      if (!result[key]) {
        result[key] = extensions[key];
      } else {
        result[key] = AppendExt(extensions[key], record[key]);
      }
    }

    return result;
  } else {
    return extensions;
  }
}

export const GenRecord = <T, R = ExtendTypeRecord<T> extends never ? {} | undefined : ExtendTypeRecord<T>>(defaultValues: T, extensions: R): TypeRecord<T> => {
  const record = AppendExt(extensions as any, GenRecord2(defaultValues) as any);
  return { ...record, defaultValues: defaultValues };
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
