import { OlLayerProp } from "./OlLayer";
import VectorSource from "ol/source/Vector";
import { Feature } from "ol";
import { Geometry, LineString, SimpleGeometry } from "ol/geom";
import VectorLayer from "ol/layer/Vector";
import Draw from "ol/interaction/Draw";
import Modify from "ol/interaction/Modify";
import Snap from "ol/interaction/Snap";
import { doubleClick } from 'ol/events/condition';
import { FeatureLike } from "ol/Feature";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import { getLength } from 'ol/sphere';
import { toContext } from "ol/render";
import Fill from "ol/style/Fill";
import { Coordinate } from "ol/coordinate";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { SettingsContext } from "@Settings/SettingsProvider";

import greenMarker from '@images/marker-icon-green.svg';
import redMarker from '@images/marker-icon-red.svg';
import blueMarker from '@images/marker-icon-blue.svg';
import { MapContext } from "@pages/Map/MapContext";

const useMap = () => {
   const { map } = useContext(MapContext)!;
   const [, setNextId] = useState(1);
   const [modify, setModify] = useState<Modify>();
   const [snap, setSnap] = useState<Snap>();
   const [layer, setLayer] = useState<VectorLayer>();
   const [modified, setModified] = useState<Feature[]>();
   const [newFeatures, setNewFeatures] = useState<Feature[]>();

   const source = useMemo(() => {
      const source = new VectorSource<Feature<Geometry>>({
         features: []
      })
      source.on('addfeature', e => {
         if (e.feature && e.feature.getId() === undefined) {
            setNextId(id => {
               e.feature!.setId(id);

               setNewFeatures(newFeatures => {
                  const result = ([...(newFeatures ?? [])]);
                  const index = result.findIndex(elem => elem.getId() === e.feature!.getId());

                  if (index === -1) {
                     result[result.length] = e.feature!;
                  } else {
                     result[index] = e.feature!;
                  }

                  return result;
               });
               return id + 1;
            });
         }
      });

      return source;
   }, []);



   useEffect(() => {
      const layer = new VectorLayer({
         source: source
      });
      map.addLayer(layer);
      setLayer(layer);

      return () => { map.removeLayer(layer) };
   }, [source, map]);

   useEffect(() => {
      const modify = new Modify({
         source: source,
         deleteCondition: doubleClick
      });

      modify.on('modifyend', e => {
         setModified(features => {
            const newFeatures = [...(features ?? [])];
            e.features.forEach(feature => {
               const index = newFeatures.findIndex((elem) => elem.getId() === feature.getId());

               if (index !== -1) {
                  newFeatures[index] = feature;
               } else {
                  newFeatures[newFeatures.length] = feature;
               }
            });

            return newFeatures;
         });
      });

      map.addInteraction(modify);
      setModify(modify);

      return () => { map.removeInteraction(modify) };
   }, [source, map]);

   useEffect(() => {
      const snap = new Snap({ source: source });
      map.addInteraction(snap);
      setSnap(snap);

      return () => { map.removeInteraction(snap) };
   }, [source, map]);

   useEffect(() => {
      if (modified) {
         setModified(undefined);
      }
   }, [modified]);

   useEffect(() => {
      if (newFeatures) {
         setNewFeatures(undefined);
      }
   }, [newFeatures, setNewFeatures]);

   return {
      source: source,
      modify: modify,
      snap: snap,
      layer: layer,
      modified: modified,
      newFeatures: newFeatures
   };
};

const useDraw = (source?: VectorSource<Feature<Geometry>>) => {
   const { map, setAddNav, triggerFlash } = useContext(MapContext)!;
   const [draw, setDraw] = useState<Draw>();

   const updateDraw = useCallback((draw: Draw | undefined) => {
      setDraw(oldDraw => {
         if (oldDraw) {
            map.removeInteraction(oldDraw);
         }

         if (draw) {
            map.addInteraction(draw);
         }

         return draw;
      });
   }, [setDraw, map]);

   useEffect(() => {
      setAddNav(() => () => {
         const draw = new Draw({
            type: 'MultiLineString',
            source: source
         });
         updateDraw(draw);
         triggerFlash();

         draw.on('drawend', () => {
            updateDraw(undefined);
         });
      });
   }, [setAddNav, triggerFlash, updateDraw, source]);

   useEffect(() => () => {
      updateDraw(undefined);
   }, [updateDraw]);

   return { draw: draw };
}

export const OlRouteLayer = ({
   order,
   zIndex
}: {
   zIndex: number
} & OlLayerProp) => {
   const { setNavData, setCounter, counter, map, setCancel, navData } = useContext(MapContext)!;
   const settings = useContext(SettingsContext)!;

   const { source, layer, modified, newFeatures } = useMap();
   const { draw } = useDraw(source);

   const greenMarkerImg = useRef<HTMLImageElement | null>(null);
   const redMarkerImg = useRef<HTMLImageElement | null>(null);
   const blueMarkerImg = useRef<HTMLImageElement | null>(null);

   const onAddFeature = useCallback(((feature: Feature, layer: VectorLayer) => {
      setNavData(items => {
         return [...items, { id: counter, order: items.length, active: true, name: `New Nav ${counter}`, shortName: `${counter}`, feature: feature, layer: layer }];
      });
      setCounter(counter => counter + 1);
   }), [setNavData, setCounter, counter]);

   useEffect(() => {
      newFeatures?.forEach(feature => {
         onAddFeature(feature, layer!)
      });
   }, [newFeatures, onAddFeature, layer]);

   const navRenderer = useMemo(() => (feature: FeatureLike) => {
      const geom = feature.getGeometry();

      if (geom?.getType() === 'MultiLineString') {
         return [new Style({
            renderer: (coords, state) => {
               const context = state.context;
               const renderContext = toContext(context, {
                  pixelRatio: 1,
               });

               const geometry = state.geometry.clone() as SimpleGeometry;
               geometry.setCoordinates(coords);


               renderContext.setFillStrokeStyle(new Fill(), new Stroke({
                  width: 5,
                  color: 'white'
               }));
               renderContext.drawGeometry(geometry);

               renderContext.setFillStrokeStyle(new Fill(), new Stroke({
                  width: 4,
                  color: '#1f2937'
               }));
               renderContext.drawGeometry(geometry);

               if (geometry.getType() === 'MultiLineString') {
                  const coords_ = (coords as Coordinate[][])[0];

                  // Draw markers
                  //------------------------------
                  coords_.forEach((coord, index) => {
                     const size = settings.map.markerSize;

                     if (index === 0) {
                        // First Coord
                        context.drawImage(greenMarkerImg.current!, coord[0] - size / 2, coord[1] - size, size, size);
                     } else if (index === coords_.length - 1) {
                        // Last Coord
                        context.drawImage(redMarkerImg.current!, coord[0] - size / 2, coord[1] - size, size, size);
                     } else {
                        // Coord in between
                        context.drawImage(blueMarkerImg.current!, coord[0] - size / 2, coord[1] - size, size, size);
                     }
                  });

                  // Draw Distance/cap
                  //------------------------------
                  coords_.forEach((coord, index) => {
                     if (index !== coords_.length - 1) {
                        const nextCoord = coords_[index + 1];

                        const vector = [nextCoord[0] - coord[0], nextCoord[1] - coord[1]];
                        let angle = Math.atan2(vector[1], vector[0]) * 180 / Math.PI;
                        let mag = 90 + angle;

                        if (mag < 0) {
                           mag += 360;
                        }

                        if (angle < -90 || angle > 90) {
                           angle = angle - 180;
                        }

                        const geoDistance = getLength((new LineString([map.getCoordinateFromPixelInternal(coord), map.getCoordinateFromPixelInternal(nextCoord)]))) * 0.0005399568;
                        const distance = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);

                        const fdays = geoDistance / (24 * settings.speed);
                        const days = Math.floor(fdays);
                        const fhours = (fdays - days) * 24;
                        const hours = Math.floor(fhours);
                        const fminutes = (fhours - hours) * 60;
                        const minutes = Math.floor(fminutes);
                        const fseconds = (fminutes - minutes) * 60;
                        const seconds = Math.floor(fseconds);

                        const text = Math.floor(mag).toString() + "\u00b0 "
                           + Math.floor(geoDistance).toString() + " nm  "
                           + (days ? days.toString() + 'd ' : '')
                           + ((days || hours) ? ((days && (hours < 10) ? '0' : '') + hours.toString() + ":") : "")
                           + ((days || hours || minutes) ? ((minutes < 10 ? "0" : '') + minutes.toString() + ":") : "")
                           + (seconds < 10 ? '0' : '') + seconds.toString();

                        const maxSize = settings.map.text.maxSize;

                        const center = [(coord[0] + nextCoord[0]) >> 1, (coord[1] + nextCoord[1]) >> 1];

                        context.save();
                        context.strokeStyle = `rgba(${settings.map.text.borderColor.red.toFixed(0)}, ${settings.map.text.borderColor.green.toFixed(0)}, ${settings.map.text.borderColor.blue.toFixed(0)}, ${settings.map.text.borderColor.alpha})`;
                        context.lineWidth = Math.floor(settings.map.text.borderSize);
                        context.font = "900 " + maxSize.toFixed(0) + "px Inter-bold, sans-serif";
                        const textWidth = context.measureText(text).width;
                        const textSize = Math.min(maxSize, maxSize * (distance - settings.map.markerSize * 1.5) / textWidth);
                        context.font = "900 " + textSize.toFixed(0) + "px Inter-bold, sans-serif";

                        if (textSize >= settings.map.text.minSize) {
                           context.textAlign = "center";
                           context.translate(center[0], center[1]);
                           context.rotate(angle * Math.PI / 180);
                           context.translate(((mag > 90 && mag <= 180) || (mag >= 270)) ? -settings.map.markerSize * 0.25 : settings.map.markerSize * 0.25, -settings.map.text.borderSize * 0.25 - 5);

                           context.strokeText(text, 0, 0);

                           context.fillStyle = `rgba(${settings.map.text.color.red.toFixed(0)}, ${settings.map.text.color.green.toFixed(0)}, ${settings.map.text.color.blue.toFixed(0)}, ${settings.map.text.color.alpha})`;
                           context.fillText(text, 0, 0);
                        }
                        context.restore();
                     }
                  });
               }
            }
         })]
      }

      return [];
   }, [map, settings.map.markerSize, settings.map.text.borderColor.alpha, settings.map.text.borderColor.blue, settings.map.text.borderColor.green, settings.map.text.borderColor.red, settings.map.text.borderSize, settings.map.text.color.alpha, settings.map.text.color.blue, settings.map.text.color.green, settings.map.text.color.red, settings.map.text.maxSize, settings.map.text.minSize, settings.speed]);

   useEffect(() => {
      layer?.setZIndex(zIndex);
   }, [zIndex, layer]);

   useEffect(() => {
      if (layer) {
         layer.setStyle(navRenderer);
      }
   }, [navRenderer, layer]);

   useEffect(() => {
      if (order !== undefined) {
         layer?.setZIndex(order);
      }
   }, [order, layer]);

   useEffect(() => {
      setCancel(() => () => {
         if (draw) {
            map.removeInteraction(draw);
         }
      });
   }, [map, setCancel, draw]);

   useEffect(() => {
      if (modified) {
         modified.forEach((feature) => {
            const data = navData.find(elem => elem.feature.getId() === feature.getId());
            if (data) { data.feature = feature; }
         });
      }
   }, [modified, navData]);

   useEffect(() => {
      if (source) {
         const features = navData.filter(data => data.active).sort((left, right) => left.order - right.order).map(data => {
            const feature = data.feature.clone();
            feature.setId(data.feature.getId());
            return feature;
         });
         source.clear();
         source.addFeatures(features);
      }
   }, [navData, source]);


   useEffect(() => {
      if (order !== undefined) {
         layer?.setZIndex(order);
      }
   }, [order, layer]);

   return <div className="hidden">
      <img ref={greenMarkerImg} src={greenMarker} alt='start marker' />
      <img ref={redMarkerImg} src={redMarker} alt='destination marker' />
      <img ref={blueMarkerImg} src={blueMarker} alt='intermediate marker' />
   </div>;
};