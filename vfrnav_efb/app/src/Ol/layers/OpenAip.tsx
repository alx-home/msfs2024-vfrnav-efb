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

import { MVT } from "ol/format";
import { OlLayer, OlLayerProp } from "./OlLayer";
import { useContext, useMemo, useRef } from "react";
import VectorTileLayer from "ol/layer/VectorTile";
import VectorTileSource from 'ol/source/VectorTile';
import { Feature, VectorTile } from "ol";
import Style from "ol/style/Style";
import { Coordinate } from "ol/coordinate";
import { MapContext } from "@pages/Map/MapContext";
import { MultiLineString, Point } from "ol/geom";
import { createXYZ } from "ol/tilegrid";
import windTurbineImg from '@efb-images/wind_turbine.svg'
import towerImg from '@efb-images/tower.svg'
import { SettingsContext } from "@Settings/SettingsProvider";

const Norm = (coord: Coordinate) => Math.sqrt(Math.pow(coord[0], 2) + Math.pow(coord[0], 1))
const inExtend = (coord: Coordinate, extend: number[]) => (coord[0] >= extend[0]) && (coord[0] <= extend[2])
  && (coord[1] >= extend[1]) && (coord[1] <= extend[3])

export const OpenAip = ({
  opacity,
  url,
  order,
  active,
  minZoom,
  maxZoom,
  clipAera
}: OlLayerProp & {
  url?: string,
  crossOrigin?: string | null,
  opacity?: number
}) => {
  const { map } = useContext(MapContext)!;
  const windTurbine = useRef<HTMLImageElement | null>(null);
  const tower = useRef<HTMLImageElement | null>(null);
  const settings = useContext(SettingsContext)!;

  const source = useMemo(() => new VectorTileLayer({
    declutter: true,
    style: feature => {
      const properties = feature.getProperties();

      const is_prohibited = properties['type'] === 'prohibited'
      const is_restricted = properties['type'] === 'restricted'
      const is_danger = properties['type'] === 'danger'
      const is_ctr = properties['type'] === 'ctr'
      const is_tma = properties['type'] === 'tma'
      const is_fir = properties['type'] === 'fir'
      const is_siv = properties['type'] === 'fis_sector'
      const is_rmz = properties['type'] === 'rmz'
      const is_matz = (properties['type'] === 'atz' || properties['type'] === 'matz')
      const is_overflight = properties['type'] === 'overflight_restriction'
      const is_ctr_tma = is_ctr || is_tma
      const is_wind_turbine = properties['type'] === "wind_turbine"
      const is_tower = !!['building', "tower", 'chimney', "obstacle"].find(value => value === properties['type'])
      const is_border = properties['layer'] === 'airspaces_border_offset_2x';

      if (is_prohibited || is_restricted || is_danger || is_ctr_tma || is_fir || is_siv || is_rmz || is_overflight || is_matz || is_wind_turbine || is_tower) {
        return new Style({
          renderer: (coords_, state) => {
            const view = map.getView();
            const resolution = 1000 / view.getResolution()!;

            const zRatio = (resolution / 20)


            const setStyle = (ctx: CanvasRenderingContext2D) => {
              if (is_ctr_tma) {
                const classType = properties['icao_class'];

                if (is_ctr) {
                  ctx.setLineDash([60 * zRatio, 10 * zRatio]);
                }

                if (classType === "a" || classType === "b" || classType === "c" || classType === "d") {
                  ctx.fillStyle = `rgba(115, 142, 195, 0.6)`
                } else {
                  ctx.fillStyle = `rgba(180, 204, 232, 0.6)`
                }
                ctx.strokeStyle = `rgba(14, 72, 131, 1)`
              } else if (is_fir) {
                ctx.strokeStyle = `rgba(0, 0, 0, 1)`
              } else if (is_siv) {
                ctx.strokeStyle = `rgba(0, 92, 32, 1)`
                ctx.setLineDash([4 * zRatio, 10 * zRatio]);
              } else if (is_overflight) {
                ctx.strokeStyle = `rgba(255, 0, 0, 1)`
              } else if (is_rmz) {
                ctx.strokeStyle = `rgba(0, 0, 0, 1)`
                ctx.setLineDash([40 * zRatio, 10 * zRatio, 10 * zRatio, 10 * zRatio]);
              } else if (is_matz) {
                ctx.strokeStyle = `rgba(14, 72, 131, 1)`
                ctx.setLineDash([8 * zRatio, 25 * zRatio]);
              } else {
                ctx.fillStyle = `rgba(255, 0, 0, 0.2)`
                ctx.strokeStyle = `rgba(255, 0, 0, 1)`
              }
            }

            const ctx = state.context;

            if (is_wind_turbine) {
              const coords1 = coords_ as Coordinate
              const ratio = zRatio * (properties['zIndex'] > 12 ? 0.2 : 1);
              const width = 40 * ratio;
              const height = 70 * ratio;
              ctx.drawImage(windTurbine.current!, coords1[0] - width / 2, coords1[1] - height, width, height)
            } else if (is_tower) {
              const coords1 = coords_ as Coordinate
              const ratio = zRatio * (properties['zIndex'] > 12 ? 0.2 : 1);
              const width = 40 * ratio;
              const height = 55 * ratio;
              ctx.drawImage(tower.current!, coords1[0] - width / 2, coords1[1] - height, width, height)
            } else {
              const tileExtent = (() => {
                const extent = properties["tileExtent"];
                return [...map.getPixelFromCoordinate([extent[0], extent[3]]), ...map.getPixelFromCoordinate([extent[2], extent[1]])];
              })();

              ctx.save()
              {
                if ((is_ctr_tma || is_siv || is_rmz || is_prohibited || is_restricted || is_danger) && properties['layer'] === 'airspaces' && properties['zIndex'] > 9) {
                  ctx.save()
                  const coords__ = (() => {
                    const coords1 = (coords_ as Coordinate[][]);
                    for (let index = 0; index < coords1.length; ++index) {
                      const coords = coords1[index];

                      for (let index = 0; index < coords.length - 1; ++index) {
                        const center = [(coords[index][0] + coords[index + 1][0]) / 2, (coords[index][1] + coords[index + 1][1]) / 2]
                        if (inExtend(center, tileExtent)) {
                          let angle = Math.atan2(coords[index][1] - coords[index + 1][1], coords[index][0] - coords[index + 1][0])
                          let way = 1;

                          if (angle > Math.PI / 2) {
                            angle = angle + Math.PI;
                            way = -1;
                          } else if (angle < -Math.PI / 2) {
                            angle = angle + Math.PI;
                            way = -1;
                          }

                          return [center, angle, way]
                        }
                      }
                    }

                    return undefined;
                  })()

                  if (coords__) {
                    const coords = coords__[0] as number[];
                    const way = coords__[2] as number;
                    const texts = properties['texts'];
                    const key = Math.floor(coords[0] / 100) + ' ' + Math.floor(coords[1] / 100) + ' ' + way.toString();

                    const [owner, text] = (() => {
                      const text = texts.get(key);
                      if (text) {
                        return [text.source_id === properties['source_id'], text.text as string[][]]
                      } else {
                        const text = {
                          source_id: properties['source_id'],
                          text: []
                        }

                        texts.set(key, text);
                        return [true, text.text as string[][]]
                      }
                    })()

                    const firstText = properties['name'] + (is_ctr_tma ? ' / ' + properties['icao_class'].toUpperCase() : '');
                    if (!text.find(value => value[0] === firstText)) {
                      text.push([firstText, (() => {
                        const lowerText = (() => {
                          if (properties['lower_limit_reference_datum'] === 'GND') {
                            return "GND";
                          } else if (properties['lower_limit_unit'] === 'FL') {
                            return `FL${properties['lower_limit_value']}`;
                          } else {
                            return properties['lower_limit_value'];
                          }
                        })()

                        const upperText = (() => {
                          if (properties['upper_limit_unit'] === 'FL') {
                            return `FL${properties['upper_limit_value']}`;
                          } else {
                            return properties['upper_limit_value'];
                          }
                        })()

                        return lowerText + ' / ' + upperText
                      })()])
                    }

                    if (owner) {
                      const angle = coords__[1] as number
                      const way = coords__[2] as number

                      ctx.lineWidth = Math.floor(settings.map.text.borderSize);
                      ctx.font = `900 ${settings.map.text.minSize * zRatio}px Inter-bold, sans-serif`;

                      ctx.textAlign = "center";
                      ctx.translate(coords[0], coords[1]);

                      const trans = -15 * zRatio * way;

                      ctx.rotate(angle)
                      ctx.translate(0, trans);

                      for (const currentText of text as string[][]) {

                        ctx.fillStyle = `rgba(${settings.map.text.color.red.toFixed(0)}, ${settings.map.text.color.green.toFixed(0)}, ${settings.map.text.color.blue.toFixed(0)}, ${settings.map.text.color.alpha})`;

                        ctx.fillText(currentText[trans > 0 ? 0 : 1], 0, 0);
                        ctx.translate(0, trans);
                        ctx.fillText(currentText[trans > 0 ? 1 : 0], 0, 0);
                        ctx.translate(0, trans);
                      }
                    }
                  }
                  ctx.restore()
                }

                ctx.beginPath()
                ctx.moveTo(tileExtent[0], tileExtent[1])
                ctx.lineTo(tileExtent[2], tileExtent[1])
                ctx.lineTo(tileExtent[2], tileExtent[3])
                ctx.lineTo(tileExtent[0], tileExtent[3])
                ctx.clip()

                setStyle(ctx);

                if (is_border) {
                  ctx.beginPath();
                  for (const coords of (coords_ as Coordinate[][])) {
                    ctx.moveTo(coords[0][0], coords[0][1]);
                    for (let index = 1; index < coords.length; ++index) {
                      const coord = coords[index];
                      ctx.lineTo(coord[0], coord[1]);
                    }
                  }
                  ctx.clip('evenodd');

                  if (properties['zIndex'] > 8) {
                    if (is_prohibited || is_danger || is_restricted || is_ctr_tma) {
                      const tileWidth = (tileExtent[2] - tileExtent[0]);
                      const tileHeight = (tileExtent[3] - tileExtent[1]);

                      const borderCanvas = (() => {
                        const canvas = document.createElement('canvas');
                        canvas.width = tileWidth
                        canvas.height = tileHeight

                        const ctx = canvas.getContext('2d')!;
                        setStyle(ctx);

                        if (is_danger || is_ctr_tma) {
                          ctx.fillRect(0, 0, tileWidth, tileHeight);
                        }

                        if (is_prohibited || is_restricted || is_danger) {
                          const length = Norm([tileWidth, tileHeight])

                          const size = is_prohibited ? 4 : 2;
                          let numStep = Math.floor(length / (2 * size));
                          if (1 === (numStep & 1)) {
                            numStep -= 1;
                          }

                          ctx.lineWidth = 2
                          ctx.strokeStyle = `rgba(255, 0, 0, 1)`

                          const delta = 1 / numStep;
                          for (let pos = 0; pos < 1; pos += delta) {
                            ctx.beginPath()
                            ctx.moveTo(tileWidth * 2 * pos, 0);
                            ctx.lineTo(0, tileHeight * 2 * pos);
                            ctx.stroke()

                            if (is_prohibited) {
                              ctx.beginPath()
                              ctx.moveTo(tileWidth * (1 - 2 * pos), 0);
                              ctx.lineTo(tileWidth, tileHeight * 2 * pos);
                              ctx.stroke()
                            }
                          }
                        }

                        return canvas;
                      })()

                      ctx.drawImage(borderCanvas, tileExtent[0], tileExtent[1]);
                    }
                  }
                } else if (properties['layer'] === 'airspaces') {
                  if (is_prohibited) {
                    for (const coords of (coords_ as Coordinate[][])) {
                      ctx.beginPath();
                      ctx.moveTo(coords[0][0], coords[0][1]);
                      for (let index = 1; index < coords.length; ++index) {
                        const coord = coords[index];
                        ctx.lineTo(coord[0], coord[1]);
                      }

                      ctx.fill()
                    }
                  }

                  ///v4/mapbox.mapbox-terrain-v2,mapbox.mapbox-streets-v8/13/4086/2854.vector.pbf
                  ctx.lineWidth = Math.min(30, ((is_ctr || is_rmz || is_overflight) ? 8 : is_matz ? 15 : 3) * zRatio)
                  for (const coords of (coords_ as Coordinate[][])) {
                    ctx.beginPath();
                    ctx.moveTo(coords[0][0], coords[0][1]);
                    for (let index = 1; index < coords.length; ++index) {
                      const coord = coords[index];
                      ctx.lineTo(coord[0], coord[1]);
                    }

                    ctx.stroke()
                  }
                }
              }
              ctx.restore()
            }
          }
        })
      }
    },

    source: new VectorTileSource({
      format: new MVT(),
      tileGrid: createXYZ({
        maxZoom: 19
      }),
      url: url,
      tileLoadFunction: (tile_, url) => {
        const tile = (tile_ as VectorTile<Feature>);
        tile.setLoader(async (extent, _, projection) => {
          const response = await fetch(url, {
            headers: [
              ["x-openaip-api-key", "bf2df3ae9c5c969fe269d1418df194f2"]
            ]
          });
          const data = await response.arrayBuffer();
          const format = tile.getFormat();

          const texts = new Map<string, {
            source_id: string
            text: string[][]
          }>();
          const features = format.readFeatures(data, {
            featureProjection: projection,
            extent: extent
          }).filter(feature => {
            const properties = feature.getProperties();
            return ((
              properties['type'] === 'prohibited'
              || properties['type'] === 'restricted'
              || properties['type'] === 'danger'
              || properties['type'] === 'ctr'
              || properties['type'] === 'tma'
              || properties['type'] === 'fir'
              || properties['type'] === 'fis_sector'
              || properties['type'] === 'atz'
              || properties['type'] === 'matz'
              || properties['type'] === 'overflight_restriction'
              || properties['type'] === 'rmz'
              || properties['type'] === 'wind_turbine'
              || properties['type'] === 'obstacle'
              || properties['type'] === 'tower'
              || properties['type'] === 'chimney'
              || properties['type'] === 'building'
            )
              && (['airspaces', 'airspaces_border_offset_2x']
                .find(layer => (layer === properties['layer'])
                  && (tile.getTileCoord()[0] > 6))
                || ((properties['layer'] === 'obstacles') && (tile.getTileCoord()[0] > 9))))
          }).map((feature) => {
            const properties = feature.getProperties();

            if (properties['layer'] === 'obstacles') {
              type Flat = {
                flatCoordinates_: number[]
              };
              const coords = (feature as unknown as Flat).flatCoordinates_ as Coordinate;

              const new_feature = new Feature();
              new_feature.setProperties({
                ...properties,
                geometry: new Point(coords),
                tileExtent: tile.extent,
                zIndex: tile.getTileCoord()[0],
                xTile: tile.getTileCoord()[1],
                yTile: tile.getTileCoord()[2],
              });

              return new_feature;
            } else {
              type Flat = {
                flatCoordinates_: number[],
                ends_: number[]
              };
              const flat = (feature as unknown as Flat);
              const coords = flat.flatCoordinates_.reduce((result, value, index) => {
                if (index === 0 || flat.ends_.find(value => value === index)) {
                  result.push([])
                }

                const coords = result[result.length - 1];
                if (index & 1) {
                  coords[coords.length - 1][1] = value;
                } else {
                  coords[coords.length] = [value, 0];
                }

                return result;
              }, [] as Coordinate[][]);

              const new_feature = new Feature();
              new_feature.setProperties({
                ...properties,
                geometry: new MultiLineString(coords),
                tileExtent: tile.extent,
                zIndex: tile.getTileCoord()[0],
                xTile: tile.getTileCoord()[1],
                yTile: tile.getTileCoord()[2],
                texts: texts,
              });

              return new_feature;
            }
          });

          tile.setFeatures(features);
        })
      }
    })
  }), [map, settings.map.text.borderSize, settings.map.text.color.alpha, settings.map.text.color.blue, settings.map.text.color.green, settings.map.text.color.red, settings.map.text.minSize, url]);

  return <>
    <div className="hidden">
      <img ref={windTurbine} src={windTurbineImg} alt='helipad' />
      <img ref={tower} src={towerImg} alt='helipad' />
    </div>
    <OlLayer source={source} opacity={opacity} order={order} active={active} minZoom={minZoom} maxZoom={maxZoom} clipAera={clipAera} />
  </>;
};