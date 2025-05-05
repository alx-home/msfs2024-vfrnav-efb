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
import { BingMaps } from "ol/source";
import { useMemo } from "react";

export const OlBingLayer = ({
  opacity,
  order,
  active,
  minZoom,
  maxZoom,
  clipAera
}: OlLayerProp & {
  opacity?: number
}) => {
  const source = useMemo(() => new BingMaps({
    key: "@TODO",
    imagerySet: 'AerialWithLabels'
  }), []);
  return <OlLayer source={source} opacity={opacity} order={order} active={active} minZoom={minZoom} maxZoom={maxZoom} clipAera={clipAera} />;
};