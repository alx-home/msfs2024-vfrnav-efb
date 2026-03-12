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

import { GenRecord } from './Types';


export type PlanePosContent = {
  date: number,
  lat: number,
  lon: number,
  altitude: number,
  ground: number,
  heading: number,
  verticalSpeed: number,
  windVelocity: number,
  windDirection: number,
  indicatedAirSpeed?: number,
  trueAirSpeed?: number,
  groundVelocity?: number,
}

export type PlanePos = {
  __PLANE_POS__: true,
} & PlanePosContent;

export type PlaneBlob = {
  __PLANE_BLOB__: true,

  id: number,
  version?: number,
  value: string // encoded PlanePosContent[]
};

export const decodePlaneBlob = (blob: string, version: number): PlanePosContent[] => {
  const data = atob(blob);
  if (!data) {
    return [];
  }

  const values: PlanePosContent[] = [];

  const bytes = Uint8Array.from(data, c => c.charCodeAt(0));
  const poses = Array.from(new Float32Array(bytes.buffer));

  let date = 0;
  for (let index = 0; index < poses.length; index += (9 + ((version >= 2) ? 3 : 0))) {
    if (index === 0) {
      date = poses[0];
    } else {
      date += poses[index];
    }

    values.push({
      date: date,
      lat: poses[index + 1],
      lon: poses[index + 2],
      altitude: poses[index + 3],
      ground: poses[index + 4],
      heading: poses[index + 5],
      verticalSpeed: poses[index + 6],
      windVelocity: poses[index + 7],
      windDirection: poses[index + 8],
      indicatedAirSpeed: version >= 2 ? poses[index + 9] : undefined,
      trueAirSpeed: version >= 2 ? poses[index + 10] : undefined,
      groundVelocity: version >= 2 ? poses[index + 11] : undefined
    });
  }

  return values;
}

export const encodePlaneBlob = (data: PlanePosContent[]): string => {
  let lastDate = 0;

  const buffer = new Float32Array(data
    .flatMap(pos => {
      const result = [
        (pos.date - lastDate),
        pos.lat,
        pos.lon,
        pos.altitude,
        pos.ground,
        pos.heading,
        pos.verticalSpeed,
        pos.windVelocity,
        pos.windDirection,
        pos.indicatedAirSpeed ?? -1,
        pos.trueAirSpeed ?? -1,
        pos.groundVelocity ?? -1
      ];

      lastDate = pos.date;
      return result;
    }));

  const bytes = new Uint8Array(buffer.buffer);
  let binary = "";
  for (const element of bytes) {
    binary += String.fromCharCode(element);
  }

  return btoa(binary);
}

export const PlanePosRecord = GenRecord<PlanePos>({
  __PLANE_POS__: true,

  date: -1,
  lat: -1,
  lon: -1,
  altitude: -1,
  ground: -1,
  heading: -1,
  verticalSpeed: -1,
  windVelocity: -1,
  windDirection: -1
}, {
  indicatedAirSpeed: { optional: true, record: 'number' },
  trueAirSpeed: { optional: true, record: 'number' },
  groundVelocity: { optional: true, record: 'number' }
});


export const PlanePosContentRecord = GenRecord<PlanePosContent>({
  date: -1,
  lat: -1,
  lon: -1,
  altitude: -1,
  ground: -1,
  heading: -1,
  verticalSpeed: -1,
  windVelocity: -1,
  windDirection: -1,
}, {
  indicatedAirSpeed: { optional: true, record: 'number' },
  trueAirSpeed: { optional: true, record: 'number' },
  groundVelocity: { optional: true, record: 'number' }
});


export const PlaneBlobRecord = GenRecord<PlaneBlob>({
  __PLANE_BLOB__: true,

  id: 0,
  value: ""
}, {
  version: { optional: true, record: 'number' }
});

export type PlaneRecord = {
  name: string,
  id: number,
  active: boolean,
  touchdown: number,
  blobs: number[],
  size: number
}

export const PlaneRecordRecord = GenRecord<PlaneRecord>({
  name: 'undef',
  id: -1,
  active: false,
  touchdown: -1,
  size: 0,
  blobs: []
}, {
  blobs: { array: true, record: 'number' }
});

export type PlaneRecords = {
  __RECORDS__: true,

  value: PlaneRecord[]
};

export const PlaneRecordsRecord = GenRecord<PlaneRecords>({
  __RECORDS__: true,

  value: []
}, {
  value: { array: true, record: PlaneRecordRecord }
});


export type RemoveRecord = {
  __REMOVE_RECORD__: true

  id: number
}

export type GetPlaneBlob = {
  __GET_PLANE_BLOB__: true

  id: number
}

export type EditRecord = {
  __EDIT_RECORD__: true

  id: number
  name: string
}

export const GetPlaneBlobRecord = GenRecord<GetPlaneBlob>({
  __GET_PLANE_BLOB__: true,

  id: -1
}, {});


export const RemoveRecordRecord = GenRecord<RemoveRecord>({
  __REMOVE_RECORD__: true,

  id: -1
}, {})

export const EditRecordRecord = GenRecord<EditRecord>({
  __EDIT_RECORD__: true,

  id: -1,
  name: "undef"
}, {})