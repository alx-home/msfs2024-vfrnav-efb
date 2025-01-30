import { MapMenu, Menu } from "@pages/Map/MapMenu/MapMenu";
import { OlOSMLayer } from "@Ol/layers/OlOSMLayer";
import { OlRouteLayer } from "@Ol/layers/OlRoute";
import { OlWMTSLayer } from "@Ol/layers/OlWMTSLayer";
import { OlMap } from "@Ol/OlMap";
import { getTopLeft, getWidth } from 'ol/extent';
import { get as getProjection } from 'ol/proj';
import { Dispatch, SetStateAction, useCallback, useContext, useEffect, useMemo, useState } from "react";

import flightPlanImg from '@images/flight-plan.svg';
import layersImg from '@images/layers.svg';
import oaciImg from '@images/oaci.jpg';
import dsfImg from '@images/dsf.jpg';
import map4freeImg from '@images/map4free.jpg';
import bingImg from '@images/bing.jpg';
import opentopoImg from '@images/opentopo.jpg';
import ifrLowImg from '@images/ifr_low.jpg';
import ifrHighImg from '@images/ifr_high.jpg';
import sectionalImg from '@images/sectional.jpg';
import osmImg from '@images/osm.jpg';

import { OnLayerChange } from './MapMenu/Menus/Layers';
import MapContextProvider, { MapContext } from "./MapContext";
import { Settings } from "@Settings";

const projection = getProjection('EPSG:3857')!;
const projectionExtent = projection.getExtent();
const size = projectionExtent ? getWidth(projectionExtent) / 256 : 1;
const resolutions = new Array(19);
const matrixIds = new Array(19);

for (let z = 0; z < 19; ++z) {
   // generate resolutions and matrixIds arrays for this WMTS
   resolutions[z] = size / Math.pow(2, z);
   matrixIds[z] = z;
}

const OverlayItem = ({ menu, setMenu, setOpen, image, alt, currentMenu }: {
   menu: Menu,
   setMenu: Dispatch<SetStateAction<Menu>>,
   setOpen: Dispatch<SetStateAction<boolean>>,
   image: string,
   alt: string,
   currentMenu: Menu
}) => {
   return <button className='p-2 h-9 w-full bg-overlay hocus:bg-highlight'
      onClick={() => {
         setOpen(open => menu !== currentMenu ? true : !open);
         setMenu(currentMenu);
      }}
      onMouseUp={e => e.currentTarget.blur()}>
      <img src={image} alt={alt} />
   </button>;
};

const Overlay = ({ menu, setMenu, setOpen }: {
   menu: Menu,
   setMenu: Dispatch<SetStateAction<Menu>>,
   setOpen: Dispatch<SetStateAction<boolean>>
}) => {
   return <div className='flex flex-col justify-end m-2 w-9 pointer-events-auto'>
      <OverlayItem menu={menu} setMenu={setMenu} setOpen={setOpen} currentMenu={Menu.layers} alt='layers' image={layersImg} />
      <OverlayItem menu={menu} setMenu={setMenu} setOpen={setOpen} currentMenu={Menu.nav} alt='flight plan' image={flightPlanImg} />
   </div>;
};

const SpinAnimation = () => {
   const { triggerFlash, flash, flashKey } = useContext(MapContext)!;

   return <div className="absolute top-0 left-0 right-0 bottom-0 flex justify-center" >
      <span key={flashKey}
         className={"animate-ping-1 m-auto inline-flex aspect-square w-2/4 rounded-full bg-sky-400 opacity-75 justify-center"
            + (flash ? '' : ' hidden')}
         onAnimationEnd={() => triggerFlash(false)}
      >
         <h1 className="flex justify-center text-[2vw] m-auto">
            Start Drawing !
         </h1>
      </span>
   </div>;
}

export const MapPage = ({ active }: {
   active: boolean
}) => {
   const [opacity, setOpacity] = useState(' opacity-0');
   const [open, setOpen] = useState(false);
   const [menu, setMenu] = useState<Menu>(Menu.layers);
   const [layers, setLayers] = useState([
      {
         olLayer: <OlWMTSLayer key="wmts"
            opacity={1.0}
            url={'https://data.geopf.fr/private/wmts?apikey=ign_scan_ws'}
            layer={'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-OACI'}
            version={'1.0.0'}
            projection={projection}
            minZoom={6}
            maxZoom={11}
            tileGrid={{
               origin: getTopLeft(projectionExtent),
               resolutions: resolutions,
               matrixIds: matrixIds,
            }}
         />,
         src: oaciImg,
         alt: 'oaci layer',
         active: true,
         enabled: (_settings: Settings) => _settings.OACIEnabled
      },
      {
         olLayer: <OlOSMLayer key="dsf" url="https://secais.dfs.de/static-maps/icao500/tiles/{z}/{x}/{y}.png" crossOrigin={null} />,
         src: dsfImg,
         alt: 'dsf layer',
         enabled: (_settings: Settings) => _settings.germanyEnabled
      },
      {
         olLayer: <OlOSMLayer key="sectional" url="https://maps.iflightplanner.com/Maps/Tiles/Sectional/Z{z}/{y}/{x}.png" crossOrigin={null} />,
         src: sectionalImg,
         alt: 'sectional layer',
         enabled: (_settings: Settings) => _settings.USSectionalEnabled
      },
      {
         olLayer: <OlOSMLayer key="map-for-free" url="https://maps-for-free.com/layer/relief/z{z}/row{y}/{z}_{x}-{y}.jpg" crossOrigin={null} />,
         src: map4freeImg,
         alt: 'map for free layer',
         enabled: (_settings: Settings) => _settings.mapForFreeEnabled
      },
      {
         olLayer: <OlOSMLayer key="google" url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" crossOrigin={null} />,
         src: bingImg,
         alt: 'google layer',
         enabled: (_settings: Settings) => _settings.googleMapEnabled
      },
      {
         olLayer: <OlOSMLayer key="open-topo" url="https://tile.opentopomap.org/{z}/{x}/{y}.png" crossOrigin={null} />,
         src: opentopoImg,
         alt: 'open topo layer',
         enabled: (_settings: Settings) => _settings.openTopoEnabled
      },
      {
         olLayer: <OlOSMLayer key="ifr low" url="https://maps.iflightplanner.com/Maps/Tiles/IFRLow/Z{z}/{y}/{x}.png" crossOrigin={null} />,
         src: ifrLowImg,
         alt: 'ifr low layer',
         enabled: (_settings: Settings) => _settings.USIFRLowEnabled
      },
      {
         olLayer: <OlOSMLayer key="ifr high" url="https://maps.iflightplanner.com/Maps/Tiles/IFRHigh/Z{z}/{y}/{x}.png" crossOrigin={null} />,
         src: ifrHighImg,
         alt: 'ifr high layer',
         enabled: (_settings: Settings) => _settings.USIFRHighEnabled
      },
      {
         olLayer: <OlOSMLayer key="osm" />,
         src: osmImg,
         alt: 'osm layer',
         enabled: (_settings: Settings) => _settings.openStreetEnabled
      },
      // {
      //    olLayer: <OlBingLayer key="bing" />,
      //    src: bingImg,
      //    alt: 'bing layer'
      // }
   ].map((elem, index) => ({
      ...elem,
      order: index,
      active: elem.active ?? false
   })));

   const onLayerChange = useCallback<OnLayerChange>((values) =>
      setLayers(layers => {
         const newLayers = [...layers];

         values.forEach(elem => {
            if (elem.order !== undefined) {
               newLayers[elem.index].order = elem.order;
            }
            if (elem.active !== undefined) {
               newLayers[elem.index].active = elem.active;
            }
         });

         return newLayers;
      }), [setLayers]);

   useEffect(() => {
      if (active) {
         setOpacity(' opacity-100');
      } else {
         setOpacity(' opacity-0');
      }
   }, [active]);

   const olLayers = useMemo(() =>
      layers.map(layer => ({ ...layer.olLayer, props: { ...layer.olLayer.props, order: layers.length - 1 - layer.order, active: layer.active } })),
      [layers]);

   return <MapContextProvider>
      <div className={'transition transition-std relative grow h-full' + opacity} style={active ? {} : { display: 'none' }}>
         <OlMap id='map' className='absolute w-full h-full top-0 left-0'>
            {olLayers}
            <OlRouteLayer
               zIndex={layers.length}
               order={layers.length} />
         </OlMap>
         <div className="absolute z-10 pointer-events-none flex grow justify-end w-full h-full top-0 left-0">
            <div className={"relative flex grow justify-end h-full overflow-hidden"} >
               <SpinAnimation />
               <Overlay menu={menu} setMenu={setMenu} setOpen={setOpen} />
            </div>
            <div className="flex flex-row pointer-events-auto">
               <MapMenu key={"map-menu"} open={open} setOpen={setOpen} menu={menu} layers={layers}
                  onLayerChange={onLayerChange} />
            </div>
         </div>
      </div>
   </MapContextProvider>;
}