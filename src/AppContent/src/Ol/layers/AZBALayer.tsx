import VectorLayer from "ol/layer/Vector";
import { OlLayer, OlLayerProp } from "./OlLayer";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import { SettingsContext } from "@Settings/SettingsProvider";
import VectorSource from "ol/source/Vector";
import { Feature } from "ol";
import { Polygon } from "ol/geom";
import { fromLonLat } from "ol/proj";
import LayerGroup from "ol/layer/Group";
import { Interactive } from "@pages/Map/MapContext";
import { AZBAPopup } from "./AZBAPopup";

export const AZBALayer = ({
   opacity,
   order,
   active,
   minZoom,
   maxZoom,
   clipAera
}: OlLayerProp & {
   opacity?: number
}) => {
   const { getSIAAZBA, setPopup, map } = useContext(SettingsContext)!;
   const { azba } = map;

   const activeHighLayer = useMemo(() => new VectorLayer({
      style: new Style({
         stroke: new Stroke({
            color: `rgba(${azba.activeHighColor.red.toFixed(0)}, ${azba.activeHighColor.green.toFixed(0)}, ${azba.activeHighColor.blue.toFixed(0)}, ${azba.activeHighColor.alpha})`,
            width: 3,
         }),
         fill: new Fill({
            color: `rgba(${azba.activeHighColor.red.toFixed(0)}, ${azba.activeHighColor.green.toFixed(0)}, ${azba.activeHighColor.blue.toFixed(0)}, ${azba.activeHighColor.alpha})`,
         })
      })
   }), [azba.activeHighColor.alpha, azba.activeHighColor.blue, azba.activeHighColor.green, azba.activeHighColor.red]);
   const activeLowLayer = useMemo(() => new VectorLayer({
      style: new Style({
         stroke: new Stroke({
            color: `rgba(${azba.activeLowColor.red.toFixed(0)}, ${azba.activeLowColor.green.toFixed(0)}, ${azba.activeLowColor.blue.toFixed(0)}, ${azba.activeLowColor.alpha})`,
            width: 3,
         }),
         fill: new Fill({
            color: `rgba(${azba.activeLowColor.red.toFixed(0)}, ${azba.activeLowColor.green.toFixed(0)}, ${azba.activeLowColor.blue.toFixed(0)}, ${azba.activeLowColor.alpha})`,
         })
      })
   }), [azba.activeLowColor.alpha, azba.activeLowColor.blue, azba.activeLowColor.green, azba.activeLowColor.red]);
   const inactiveHighLayer = useMemo(() => new VectorLayer({
      style: new Style({
         stroke: new Stroke({
            color: `rgba(${azba.inactiveHighColor.red.toFixed(0)}, ${azba.inactiveHighColor.green.toFixed(0)}, ${azba.inactiveHighColor.blue.toFixed(0)}, ${azba.inactiveHighColor.alpha})`,
            width: 3,
         }),
         fill: new Fill({
            color: `rgba(${azba.inactiveHighColor.red.toFixed(0)}, ${azba.inactiveHighColor.green.toFixed(0)}, ${azba.inactiveHighColor.blue.toFixed(0)}, ${azba.inactiveHighColor.alpha})`,
         })
      })
   }), [azba.inactiveHighColor.alpha, azba.inactiveHighColor.blue, azba.inactiveHighColor.green, azba.inactiveHighColor.red]);
   const inactiveLowLayer = useMemo(() => new VectorLayer({
      style: new Style({
         stroke: new Stroke({
            color: `rgba(${azba.inactiveLowColor.red.toFixed(0)}, ${azba.inactiveLowColor.green.toFixed(0)}, ${azba.inactiveLowColor.blue.toFixed(0)}, ${azba.inactiveLowColor.alpha})`,
            width: 3,
         }),
         fill: new Fill({
            color: `rgba(${azba.inactiveLowColor.red.toFixed(0)}, ${azba.inactiveLowColor.green.toFixed(0)}, ${azba.inactiveLowColor.blue.toFixed(0)}, ${azba.inactiveLowColor.alpha})`,
         })
      })
   }), [azba.inactiveLowColor.alpha, azba.inactiveLowColor.blue, azba.inactiveLowColor.green, azba.inactiveLowColor.red]);

   const groupLayer = useMemo(() => new LayerGroup({
      layers: [
         activeHighLayer,
         activeLowLayer,
         inactiveHighLayer,
         inactiveLowLayer
      ]
   }), [activeHighLayer, activeLowLayer, inactiveHighLayer, inactiveLowLayer])

   const [refresh, setRefresh] = useState(0);
   const timer = useRef<NodeJS.Timeout>(undefined);


   useEffect(() => {
      getSIAAZBA().then(data => {

         const activeHight = new VectorSource();
         const activeLow = new VectorSource();
         const inactiveHight = new VectorSource();
         const inactiveLow = new VectorSource();

         let nextRefresh: Date | undefined = undefined;
         const now = new Date();

         data.forEach(elem => {
            const feature = new Feature(new Polygon([elem.coordinates.map(coord =>
               fromLonLat([coord.longitude, coord.latitude])
            )])) as (Feature<Polygon> & Interactive);

            let layer: VectorLayer | undefined = undefined;
            if (elem.timeslots.find(slot => {
               const start = new Date(slot.startTime)
               const end = slot.endTime
               start.setTime(start.getTime() - azba.range * 60000);

               if (start > now) {
                  if (!nextRefresh) {
                     nextRefresh = start
                  } else if (start < nextRefresh) {
                     nextRefresh = start;
                  }
               } else if (end > now) {
                  if (!nextRefresh) {
                     nextRefresh = end
                  } else if (end < nextRefresh) {
                     nextRefresh = end;
                  }
               }

               return (now <= end) && (now >= start)
            })) {
               if (elem.lower === 0) {
                  layer = activeLowLayer;
                  activeLow.addFeature(feature);
               } else {
                  layer = activeHighLayer;
                  activeHight.addFeature(feature);
               }
            } else {
               if (elem.lower === 0) {
                  layer = inactiveLowLayer;
                  inactiveLow.addFeature(feature);
               } else {
                  layer = inactiveHighLayer;
                  inactiveHight.addFeature(feature);
               }
            }

            const color = (layer.getStyle()! as Style).getFill()!.getColor()!.toString();
            feature.onHover = () => {
               feature.setStyle(new Style({
                  stroke: (layer.getStyle()! as Style).getStroke() ?? undefined,
                  fill: new Fill({
                     color: color.replace(/rgba *\( *(\d+) *, *(\d+) *, *(\d+) *, *([\d|.]+) *\)/g, (_, r, g, b, a) =>
                        `rgba(${r}, ${g}, ${b}, ${Math.min(1, a * 2)})`
                     )
                  })
               }))
            }
            feature.onBlur = () => {
               feature.setStyle(undefined);
            }

            feature.onClick = () => {
               setPopup(<AZBAPopup data={elem} />);
            }
         })

         if (timer.current) {
            clearTimeout(timer.current)
         }

         timer.current = setTimeout(() => {
            setRefresh(val => val + 1)
         }, nextRefresh!.getTime() - now.getTime());

         activeHighLayer.setSource(activeHight);
         activeLowLayer.setSource(activeLow);
         inactiveHighLayer.setSource(inactiveHight);
         inactiveLowLayer.setSource(inactiveLow);
      });
   }, [activeHighLayer, activeLowLayer, inactiveHighLayer, inactiveLowLayer, refresh, getSIAAZBA, azba.range, setPopup]);

   return <OlLayer key={"active high"} source={groupLayer} opacity={opacity} order={order} active={active} minZoom={minZoom} maxZoom={maxZoom} clipAera={clipAera} />
};


