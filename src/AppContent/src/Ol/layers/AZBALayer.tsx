import VectorLayer from "ol/layer/Vector";
import { OlLayer, OlLayerProp } from "./OlLayer";
import { useContext, useEffect, useMemo, useRef, useState } from "react";
import Style from "ol/style/Style";
import Stroke from "ol/style/Stroke";
import Fill from "ol/style/Fill";
import { SettingsContext } from "@Settings";
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
   clipAera
}: OlLayerProp & {
   opacity?: number
}) => {
   const settings = useContext(SettingsContext)!;

   const activeHighLayer = useMemo(() => new VectorLayer({
      style: new Style({
         stroke: new Stroke({
            color: `rgba(${settings.map.azba.activeHighColor.red}, ${settings.map.azba.activeHighColor.green}, ${settings.map.azba.activeHighColor.blue}, ${settings.map.azba.activeHighColor.alpha})`,
            width: 3,
         }),
         fill: new Fill({
            color: `rgba(${settings.map.azba.activeHighColor.red}, ${settings.map.azba.activeHighColor.green}, ${settings.map.azba.activeHighColor.blue}, ${settings.map.azba.activeHighColor.alpha})`,
         })
      })
   }), [settings.map.azba.activeHighColor.alpha, settings.map.azba.activeHighColor.blue, settings.map.azba.activeHighColor.green, settings.map.azba.activeHighColor.red]);
   const activeLowLayer = useMemo(() => new VectorLayer({
      style: new Style({
         stroke: new Stroke({
            color: `rgba(${settings.map.azba.activeLowColor.red}, ${settings.map.azba.activeLowColor.green}, ${settings.map.azba.activeLowColor.blue}, ${settings.map.azba.activeLowColor.alpha})`,
            width: 3,
         }),
         fill: new Fill({
            color: `rgba(${settings.map.azba.activeLowColor.red}, ${settings.map.azba.activeLowColor.green}, ${settings.map.azba.activeLowColor.blue}, ${settings.map.azba.activeLowColor.alpha})`,
         })
      })
   }), [settings.map.azba.activeLowColor.alpha, settings.map.azba.activeLowColor.blue, settings.map.azba.activeLowColor.green, settings.map.azba.activeLowColor.red]);
   const inactiveHighLayer = useMemo(() => new VectorLayer({
      style: new Style({
         stroke: new Stroke({
            color: `rgba(${settings.map.azba.inactiveHighColor.red}, ${settings.map.azba.inactiveHighColor.green}, ${settings.map.azba.inactiveHighColor.blue}, ${settings.map.azba.inactiveHighColor.alpha})`,
            width: 3,
         }),
         fill: new Fill({
            color: `rgba(${settings.map.azba.inactiveHighColor.red}, ${settings.map.azba.inactiveHighColor.green}, ${settings.map.azba.inactiveHighColor.blue}, ${settings.map.azba.inactiveHighColor.alpha})`,
         })
      })
   }), [settings.map.azba.inactiveHighColor.alpha, settings.map.azba.inactiveHighColor.blue, settings.map.azba.inactiveHighColor.green, settings.map.azba.inactiveHighColor.red]);
   const inactiveLowLayer = useMemo(() => new VectorLayer({
      style: new Style({
         stroke: new Stroke({
            color: `rgba(${settings.map.azba.inactiveLowColor.red}, ${settings.map.azba.inactiveLowColor.green}, ${settings.map.azba.inactiveLowColor.blue}, ${settings.map.azba.inactiveLowColor.alpha})`,
            width: 3,
         }),
         fill: new Fill({
            color: `rgba(${settings.map.azba.inactiveLowColor.red}, ${settings.map.azba.inactiveLowColor.green}, ${settings.map.azba.inactiveLowColor.blue}, ${settings.map.azba.inactiveLowColor.alpha})`,
         })
      })
   }), [settings.map.azba.inactiveLowColor.alpha, settings.map.azba.inactiveLowColor.blue, settings.map.azba.inactiveLowColor.green, settings.map.azba.inactiveLowColor.red]);

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
      settings.getSIAAZBA().then(azba => {

         const activeHight = new VectorSource();
         const activeLow = new VectorSource();
         const inactiveHight = new VectorSource();
         const inactiveLow = new VectorSource();

         let nextRefresh: Date | undefined = undefined;
         const now = new Date();

         azba.forEach(elem => {
            const feature = new Feature(new Polygon([elem.coordinates.map(coord =>
               fromLonLat([coord.longitude, coord.latitude])
            )])) as (Feature<Polygon> & Interactive);

            let layer: VectorLayer | undefined = undefined;
            if (elem.timeslots.find(slot => {
               const start = new Date(slot.startTime)
               const end = slot.endTime
               start.setTime(start.getTime() - settings.map.azba.range * 60000);

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
               settings.setPopup(<AZBAPopup data={elem} />);
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
   }, [activeHighLayer, activeLowLayer, inactiveHighLayer, inactiveLowLayer, settings, refresh]);

   return <OlLayer key={"active high"} source={groupLayer} opacity={opacity} order={order} active={active} clipAera={clipAera} />
};


