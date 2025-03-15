import { OlLayer, OlLayerProp } from "./OlLayer";
import { useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Point } from "ol/geom";
import { fromLonLat } from "ol/proj";
import VectorSource from "ol/source/Vector";
import { Feature } from "ol";

import Style from "ol/style/Style";
import VectorLayer from "ol/layer/Vector";


import { Interactive, MapContext } from "@pages/Map/MapContext";
import { Coordinate } from "ol/coordinate";

import PlaneImg from '@images/plane.svg';
import { messageHandler } from "@Settings/SettingsProvider";
import { PlanePos } from '@shared/PlanPos';

export const PlaneLayer = ({
   opacity,
   order,
   active,
   minZoom,
   maxZoom,
   clipAera
}: OlLayerProp & {
   opacity?: number
}) => {
   const { map } = useContext(MapContext)!;
   const vectorSource = useMemo(() => new VectorSource<Feature<Point>>({}), []);
   const [pos, setPos] = useState<PlanePos>({ lon: 2.3941664695739746, lat: 47.48055648803711, heading: 45, altitude: 3000 });

   const PlaneIcon = useRef<HTMLImageElement | null>(null);

   const elemStyle = useCallback((angle: number) => new Style({
      renderer(coordinates, state) {
         const [x, y] = coordinates as Coordinate;
         const ctx = state.context;
         const radius = 60;

         ctx.save()
         {
            ctx.translate(x, y)
            ctx.rotate(angle * Math.PI / 180)
            ctx.drawImage(PlaneIcon.current!, - radius, - radius, 2 * radius, 2 * radius)
         }
         ctx.restore();
      }
   }), []);

   // Layer displaying the clusters and individual features.
   const vectorLayer = useMemo(() => new VectorLayer({
      source: vectorSource
   }) as VectorLayer & Interactive, [vectorSource]);

   useEffect(() => {
      const onGetPlanePosition = (planePos: PlanePos) => {
         setPos(planePos);
      };

      messageHandler.subscribe("PlanePos", onGetPlanePosition)
      return () => messageHandler.unsubscribe("PlanePos", onGetPlanePosition);
   }, [map, vectorSource])

   useEffect(() => {
      vectorSource.clear();

      const coords = fromLonLat([pos.lon, pos.lat]);

      const feature = new Feature({
         geometry: new Point(coords)
      }) as Feature<Point> & Interactive;

      feature.setStyle(elemStyle(pos.heading));

      vectorSource.addFeature(feature)
   }, [elemStyle, map, pos, vectorSource])


   return <>
      <OlLayer key={"airports"} source={vectorLayer} opacity={opacity} order={order} active={active} minZoom={minZoom} maxZoom={maxZoom} clipAera={clipAera} />
      <div className="hidden">
         <img ref={PlaneIcon} src={PlaneImg} alt='plane' />
      </div>
   </>
};


