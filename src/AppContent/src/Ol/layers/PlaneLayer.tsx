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
import { ActiveRecord, EditRecord, GetRecord, PlanePos, PlaneRecord, RemoveRecord } from '@shared/PlanPos';

import airplaneRecordJson from '@Utils/AirplaneRecord.json';
import records0 from '@Utils/record-0.json';
import records1 from '@Utils/record-1.json';
import records2 from '@Utils/record-2.json';

declare global {
   // eslint-disable-next-line no-var
   var recordsInterval: NodeJS.Timeout | undefined;
   // eslint-disable-next-line no-var
   var onEditRecord: (_message: EditRecord) => void;
   // eslint-disable-next-line no-var
   var onRemoveRecord: (_message: RemoveRecord) => void;
   // eslint-disable-next-line no-var
   var onActiveRecord: (_message: ActiveRecord) => void;
   // eslint-disable-next-line no-var
   var onGetRecord: (_message: GetRecord) => void;
}

if (!__MSFS_EMBEDED__) {
   const subIndex = { value: 0 };
   const records = airplaneRecordJson as PlaneRecord[];
   const index = { value: records.length - 1 };
   const percent = { value: 0 };

   if (window.recordsInterval) {
      clearInterval(window.recordsInterval);
      messageHandler.unsubscribe("EditRecord", window.onEditRecord)
      messageHandler.unsubscribe("ActiveRecord", window.onActiveRecord)
      messageHandler.unsubscribe("RemoveRecord", window.onRemoveRecord)
      messageHandler.unsubscribe("GetRecord", window.onGetRecord)
   }
   window.onEditRecord = ({ id, name }: EditRecord) => {
      records.find(elem => elem.id === id)!.name = name
      messageHandler?.send({ mType: "PlaneRecords", value: records });
   }
   window.onActiveRecord = ({ id, active }: ActiveRecord) => {
      records.find(elem => elem.id === id)!.active = active
      messageHandler?.send({ mType: "PlaneRecords", value: records });
   }
   window.onRemoveRecord = ({ id }: RemoveRecord) => {
      records.splice(records.findIndex(elem => elem.id === id), 1)
      --index.value;
      messageHandler?.send({ mType: "PlaneRecords", value: records.toSpliced(index.value) });
   }
   window.onGetRecord = ({ id }: GetRecord) => {
      console.assert(id < 3);
      messageHandler?.send({ mType: "PlanePoses", id: id, value: id === 0 ? records0 : id === 1 ? records1 : records2 });
   }

   messageHandler.subscribe("EditRecord", window.onEditRecord)
   messageHandler.subscribe("ActiveRecord", window.onActiveRecord)
   messageHandler.subscribe("RemoveRecord", window.onRemoveRecord)
   messageHandler.subscribe("GetRecord", window.onGetRecord)
   messageHandler.send({ mType: "PlaneRecords", value: records.toSpliced(index.value + 1) });

   window.recordsInterval = setInterval(() => {
      const id = records[index.value].id;
      const record = id === 0 ? records0 : id === 1 ? records1 : records2;
      const data = record[subIndex.value];
      const nextData = record[subIndex.value + 1];
      let deltaHeading = (nextData.heading - data.heading);
      deltaHeading = (deltaHeading > 180 ? deltaHeading - 360 :
         deltaHeading < -180 ? 360 + deltaHeading : deltaHeading);
      const heading = data.heading + deltaHeading * percent.value;

      messageHandler.send({
         mType: "PlanePos",

         ...data,
         heading: heading,
         lat: data.lat + (nextData.lat - data.lat) * percent.value,
         lon: data.lon + (nextData.lon - data.lon) * percent.value
      });

      percent.value += 1 / 10;

      if (percent.value >= 1) {
         percent.value = 0;
         ++subIndex.value;
      }

      if (subIndex.value === record.length - 1) {
         messageHandler?.send({ mType: "PlaneRecords", value: records.toSpliced(index.value + 1) });

         subIndex.value = 0;
         ++index.value;

         if (index.value === records.length) {
            index.value = records.length - 1;
         }
      }

   }, 50)
}

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
   const [pos, setPos] = useState<PlanePos>({
      date: Date.now(),
      lon: 2.3941664695739746, lat: 47.48055648803711,
      heading: 45,
      altitude: 3000,
      ground: 100,
      verticalSpeed: 0,
      windDirection: 0,
      windVelocity: 0
   });

   const PlaneIcon = useRef<HTMLImageElement | null>(null);

   const elemStyle = useCallback((angle: number) => new Style({
      renderer(coordinates, state) {
         const [x, y] = coordinates as Coordinate;
         const ctx = state.context;
         const radius = 15;

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


