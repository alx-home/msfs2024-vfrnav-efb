import useKeyUp from "@/Events/KeyUp";
import useMouseRelease from "@/Events/MouseRelease";
import { View } from "ol";
import { fromLonLat } from "ol/proj";
import { PropsWithChildren, useContext, useEffect, useRef, useState } from "react";
import { MapContext } from "@/MapPage/MapContext";

export const OlMap = ({ children, id, className }: PropsWithChildren<{ id: string, className: string }>) => {
   const mapContext = useContext(MapContext)!;
   const [center,] = useState(fromLonLat([1.5911241345835847, 48.104707368204686]));
   const [zoom,] = useState(10);
   const keyUp = useKeyUp();
   const [mouseInside, setMouseInside] = useState(false);
   const mouseRelease = useMouseRelease();
   const mapElement = useRef<HTMLDivElement | null>(null);

   useEffect(() => {
      if (mouseRelease) {
         if (!mouseInside) {
            mapContext.cancel?.();
         }
      }
   }, [mouseRelease, mapContext, mouseInside]);

   useEffect(() => {
      if (keyUp === 'Escape') {
         mapContext.cancel?.();
      }
   }, [keyUp, mapContext])

   useEffect(() => {
      if (mapContext.map && mapElement.current) {
         mapContext.map.setView(new View({
            center: center,
            zoom: zoom,
         }));
      }
   }, [mapContext.map, mapElement, center, zoom]);

   useEffect(() => {
      if (mapContext.map && mapElement.current) {
         mapContext.map.setTarget(mapElement.current);
      }
   }, [mapContext.map, mapElement]);

   return <div className={"flex " + className}
      onMouseLeave={() => setMouseInside(false)}
      onMouseEnter={() => setMouseInside(true)}
   >
      <div ref={mapElement} id={id} className="grow w-full" />
      {children}
   </div>;
}