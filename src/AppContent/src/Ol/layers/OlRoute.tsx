import { OlLayerProp } from "./OlLayer";
import VectorSource from "ol/source/Vector";
import { Feature } from "ol";
import { Geometry, LineString, MultiLineString, SimpleGeometry } from "ol/geom";
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
import { SettingsContext } from "@/Settings";

import greenMarker from '@/images/marker-icon-green.svg';
import redMarker from '@/images/marker-icon-red.svg';
import blueMarker from '@/images/marker-icon-blue.svg';
import { MapContext } from "@/MapPage/MapContext";

const useMap = () => {
   const { map } = useContext(MapContext)!;
   const [, setNextId] = useState(1);
   const [modify, setModify] = useState<Modify>();
   const [snap, setSnap] = useState<Snap>();
   const [layer, setLayer] = useState<VectorLayer>();
   const source = useMemo(() => new VectorSource<Feature<Geometry>>({
      features: []
   }), []);
   const [modified, setModified] = useState<Feature[]>();
   const [newFeatures, setNewFeatures] = useState<Feature[]>();

   const updateLayer = useCallback((layer: VectorLayer | undefined) => {
      setLayer(oldLayer => {
         if (oldLayer) {
            map.removeLayer(oldLayer);
         }

         if (layer) {
            map.addLayer(layer);
         }
         return layer;
      });
   }, [map]);

   const updateModify = useCallback((modify: Modify | undefined) => {
      setModify(oldModify => {
         if (oldModify) {
            map.removeInteraction(oldModify);
         }

         if (modify) {
            map.addInteraction(modify);
         }

         return modify;
      });
   }, [map]);

   const updateSnap = useCallback((snap: Snap | undefined) => {
      setSnap(oldSnap => {
         if (oldSnap) {
            map.removeInteraction(oldSnap);
         }

         if (snap) {
            map.addInteraction(snap);
         }

         return snap;
      });
   }, [map]);

   const removeRefs = useCallback(() => {
      updateLayer(undefined);
      updateModify(undefined);
      updateSnap(undefined);
   }, [updateLayer, updateModify, updateSnap]);

   useEffect(() => {
      removeRefs();

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

      updateLayer(new VectorLayer({
         source: source
      }));

      const modify = new Modify({
         source: source,
         deleteCondition: doubleClick
      });
      const snap = new Snap({ source: source });

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

      updateModify(modify);
      updateSnap(snap);

      return () => {
         removeRefs();
      };
   }, [map, removeRefs, setNewFeatures, setNextId, source, updateLayer, updateModify, updateSnap]);

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
         const geoCoords = (geom as MultiLineString).getCoordinates();

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
                     if (index === 0) {
                        // First Coord
                        context.drawImage(greenMarkerImg.current!, coord[0] - 25, coord[1] - 50, 50, 50);
                     } else if (index === coords_.length - 1) {
                        // Last Coord
                        context.drawImage(redMarkerImg.current!, coord[0] - 25, coord[1] - 50, 50, 50);
                     } else {
                        // Coord in between
                        context.drawImage(blueMarkerImg.current!, coord[0] - 25, coord[1] - 50, 50, 50);
                     }
                  });

                  // Draw Distance/cap
                  //------------------------------
                  coords_.forEach((coord, index) => {
                     if (index !== coords_.length - 1) {
                        const nextCoord = coords_[index + 1];

                        const vector = [nextCoord[0] - coord[0], nextCoord[1] - coord[1]];
                        let angle = Math.atan2(vector[1], vector[0]);
                        let mag = -angle * 180 / Math.PI;

                        if (mag < 0) {
                           mag += 360;
                        }

                        if ((angle * 2 < -Math.PI) || (2 * angle > Math.PI)) {
                           angle = angle - Math.PI;
                        }

                        const distance = Math.sqrt(vector[0] * vector[0] + vector[1] * vector[1]);

                        const geoDistance = (getLength((new LineString([geoCoords[0][index], geoCoords[0][index + 1]]))) * 0.0005399568);
                        const text = mag.toFixed(0) + "\u00b0 " + geoDistance.toFixed(0) + " nm  " + (geoDistance * 60 / settings.speed).toFixed(0) + "'";

                        const maxSize = 24;//@todo parameter

                        const center = [(coord[0] + nextCoord[0]) / 2, (coord[1] + nextCoord[1]) / 2];
                        const textSize = Math.min(distance * 2 / text.length - 10 /* @todo parameter */, maxSize);
                        context.save();
                        if (textSize > 5/* @todo parameter */) {
                           context.font = "900 "/* @todo parameter */ + textSize.toFixed(0) + "px Inter, sans-serif";
                           context.textAlign = "center";
                           context.translate(center[0], center[1]);
                           context.rotate(angle);
                           context.translate(10, -8);

                           context.lineWidth = 10;
                           context.strokeStyle = 'rgba(255, 255, 255, 0.8)';//@todo degree msfs
                           context.strokeText(text, 0, 0);

                           context.fillStyle = 'rgba(31, 41, 55, 0.8)';//@todo parameter
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
   }, [settings.speed]);

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