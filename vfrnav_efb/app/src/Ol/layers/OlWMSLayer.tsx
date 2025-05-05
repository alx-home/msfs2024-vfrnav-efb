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

import { OlLayer, OlLayerProp } from "./OlLayer";
import { TileWMS } from "ol/source";
import { useMemo } from "react";

export const OlWMSLayer = ({
  opacity,
  url,
  crossOrigin,
  order,
  active,
  minZoom,
  maxZoom,
  clipAera
}: OlLayerProp & {
  url: string,
  crossOrigin?: string | null,
  opacity?: number
}) => {
  const source = useMemo(() => new TileWMS({
    params: {
      url: url,
      crossOrigin: crossOrigin ?? "anonymous"
    },
  }), [crossOrigin, url]);
  return <OlLayer source={source} opacity={opacity} order={order} active={active} minZoom={minZoom} maxZoom={maxZoom} clipAera={clipAera} />;
};