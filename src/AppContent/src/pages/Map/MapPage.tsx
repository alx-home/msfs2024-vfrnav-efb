import { MapMenu, Menu } from "@pages/Map/MapMenu/MapMenu";
import { OlOSMLayer } from "@Ol/layers/OlOSMLayer";
import { OlRouteLayer } from "@Ol/layers/OlRoute";
import { OlWMTSLayer } from "@Ol/layers/OlWMTSLayer";
import { OlMap } from "@Ol/OlMap";
import { getTopLeft, getWidth } from 'ol/extent';
import { fromLonLat, get as getProjection } from 'ol/proj';
import { Dispatch, SetStateAction, useCallback, useContext, useEffect, useMemo, useState } from "react";

import flightPlanImg from '@images/flight-plan.svg';
import layersImg from '@images/layers.svg';
import oaciImg from '@images/oaci.jpg';
import azbaImg from '@images/azba.jpg';
import airportsImg from '@images/airports.jpg';
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
import { GlobalSettings } from "@Settings/Settings";
import { AZBALayer } from "@Ol/layers/AZBALayer";
import { SettingsContext } from "@Settings/SettingsProvider";
import { AirportsLayer } from "@Ol/layers/AirportsLayer";

const projection = getProjection('EPSG:3857')!;
const projectionExtent = projection.getExtent();
const size = projectionExtent ? getWidth(projectionExtent) / 256 : 1;
const resolutions = new Array(19);
const matrixIds = new Array(19);

for (let z = 0; z < 19; ++z) {
   // generate resolutions and matrixIds arrays for this WMTS
   resolutions[z] = size / Math.pow(2, Math.min(11, z + 6)) + (11 - z) * 0.0000000000001;
   matrixIds[z] = Math.min(11, z + 6);
}

const OverlayItem = ({ menu, setMenu, setOpen, image, alt, currentMenu }: {
   menu: Menu,
   setMenu: Dispatch<SetStateAction<Menu>>,
   setOpen: Dispatch<SetStateAction<boolean>>,
   image: string,
   alt: string,
   currentMenu: Menu
}) => {
   return <button className='p-2 h-9 group-hover:h-20 w-full bg-overlay hocus:bg-highlight'
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
   return <div className='flex flex-col justify-end m-2 pointer-events-auto'>
      <div className="group flex flex-col shrink w-9 hover:w-20">
         <OverlayItem menu={menu} setMenu={setMenu} setOpen={setOpen} currentMenu={Menu.nav} alt='flight plan' image={flightPlanImg} />
         <OverlayItem menu={menu} setMenu={setMenu} setOpen={setOpen} currentMenu={Menu.layers} alt='layers' image={layersImg} />
      </div>
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

const OACIBoundaries = [[-430238.11752151186, 6642123.685482322], [-389883.6964853683, 6643358.491022568], [-319230.03696249507, 6645466.263948025], [-197449.46163180465, 6647886.734341714], [-132591.15784436982, 6648166.289704094], [-39550.551584052846, 6648092.966879105], [55602.138382717516, 6647015.180643878], [166941.3940578537, 6644290.545377773], [288006.11943556456, 6639849.719795959], [382228.89893457456, 6641274.49761283], [470744.5190805885, 6641465.7003093725], [571486.3383089912, 6640977.474239895], [672566.256053328, 6639096.517961349], [748756.647604502, 6636856.466353371], [784428.1016173608, 6635852.9069511965], [865388.3944449641, 6632330.453057634], [937568.7185747456, 6628779.498923898], [898874.8375369421, 5869392.564614281], [881824.7296716573, 5870299.485245413], [876475.8807500215, 5725919.713240032], [861844.2279010892, 5727008.017997391], [857448.555674709, 5643527.164080664], [873836.9021945461, 5643801.433940186], [871179.6582790628, 5562625.829893081], [1001746.807191739, 5560588.349138281], [1057586.333727492, 5559146.782014351], [1134508.9611335627, 5556500.412502842], [1117920.4666418843, 5376472.797696554], [1099057.094597893, 5161004.592838535], [1085402.2278816353, 5002414.193325912], [384839.7596691013, 5002298.447136659], [384862.8509842946, 5143234.481764811], [330037.4331763477, 5143305.412690781], [326374.1276078542, 5208456.165904087], [288326.2299173883, 5207356.396504112], [213950.73313233297, 5204681.657673249], [166893.84752978187, 5202646.706421179], [145283.2274157692, 5201523.269440593], [144768.7330596557, 5212474.807665927], [119164.86249498789, 5212699.074226405], [67751.82931594951, 5212444.7982948115], [-52.997291390907776, 5211677.032701466], [-55759.25310876027, 5210620.8377614925], [-93862.57508467912, 5209721.086878415], [-136363.39522079818, 5208521.68453633], [-167142.38317630373, 5207685.258431856], [-225003.20718745416, 5205424.716774719], [-270343.96552372904, 5203478.459343167], [-291516.5958697789, 5202431.565060163], [-296582.8208178529, 5311891.907279465], [-324316.06193439936, 5883711.019638791], [-561711.7661548575, 5874422.370375842], [-586986.4671386455, 6339615.402381649], [-591943.0181610738, 6427719.401335435], [-594966.1543398899, 6476302.795402026], [-424368.0135648898, 6483321.81744408], [-427572.7546026764, 6563262.215645323], [-428526.6559546032, 6593666.293619203], [-430238.11752151186, 6642123.685482322]];

export const MapPage = ({ active }: {
   active: boolean
}) => {
   const settings = useContext(SettingsContext)!;
   const [opacity, setOpacity] = useState(' opacity-0');
   const [open, setOpen] = useState(false);
   const [menu, setMenu] = useState<Menu>(Menu.layers);
   const [layers, setLayers] = useState([
      {
         olLayer: <AirportsLayer key="airports" />,
         src: airportsImg,
         alt: 'airports layer',
         getSettings: (_settings: GlobalSettings) => _settings.airports,
      },
      {
         olLayer: <AZBALayer key="azba" />,
         src: azbaImg,
         alt: 'azba layer',
         getSettings: (_settings: GlobalSettings) => _settings.azba,
      },
      {
         olLayer: <OlWMTSLayer key="wmts"
            opacity={1.0}
            url={'https://data.geopf.fr/private/wmts?apikey=ign_scan_ws'}
            layer={'GEOGRAPHICALGRIDSYSTEMS.MAPS.SCAN-OACI'}
            version={'1.0.0'}
            projection={projection}
            clipAera={OACIBoundaries}
            tileGrid={{
               origin: getTopLeft(projectionExtent),
               resolutions: resolutions,
               matrixIds: matrixIds,
               extent: [...fromLonLat([-5.99644, 40.3893]), ...fromLonLat([11.146, 51.4441])]
            }}
         />,
         src: oaciImg,
         alt: 'oaci layer',
         getSettings: (_settings: GlobalSettings) => _settings.OACI,
      },
      {
         olLayer: <OlOSMLayer key="dsf" url="https://secais.dfs.de/static-maps/icao500/tiles/{z}/{x}/{y}.png" crossOrigin={null} />,
         src: dsfImg,
         alt: 'dsf layer',
         getSettings: (_settings: GlobalSettings) => _settings.germany
      },
      {
         olLayer: <OlOSMLayer key="sectional" url="https://maps.iflightplanner.com/Maps/Tiles/Sectional/Z{z}/{y}/{x}.png" crossOrigin={null} />,
         src: sectionalImg,
         alt: 'sectional layer',
         getSettings: (_settings: GlobalSettings) => _settings.USSectional
      },
      {
         olLayer: <OlOSMLayer key="map-for-free" url="https://maps-for-free.com/layer/relief/z{z}/row{y}/{z}_{x}-{y}.jpg" crossOrigin={null} />,
         src: map4freeImg,
         alt: 'map for free layer',
         getSettings: (_settings: GlobalSettings) => _settings.mapforfree
      },
      {
         olLayer: <OlOSMLayer key="google" url="https://mt1.google.com/vt/lyrs=y&x={x}&y={y}&z={z}" crossOrigin={null} />,
         src: bingImg,
         alt: 'google layer',
         getSettings: (_settings: GlobalSettings) => _settings.googlemap
      },
      {
         olLayer: <OlOSMLayer key="open-topo" url="https://tile.opentopomap.org/{z}/{x}/{y}.png" crossOrigin={null} />,
         src: opentopoImg,
         alt: 'open topo layer',
         getSettings: (_settings: GlobalSettings) => _settings.opentopo
      },
      {
         olLayer: <OlOSMLayer key="ifr low" url="https://maps.iflightplanner.com/Maps/Tiles/IFRLow/Z{z}/{y}/{x}.png" crossOrigin={null} />,
         src: ifrLowImg,
         alt: 'ifr low layer',
         getSettings: (_settings: GlobalSettings) => _settings.USIFRLow,
      },
      {
         olLayer: <OlOSMLayer key="ifr high" url="https://maps.iflightplanner.com/Maps/Tiles/IFRHigh/Z{z}/{y}/{x}.png" crossOrigin={null} />,
         src: ifrHighImg,
         alt: 'ifr high layer',
         getSettings: (_settings: GlobalSettings) => _settings.USIFRHigh,
      },
      {
         olLayer: <OlOSMLayer key="osm" />,
         src: osmImg,
         alt: 'osm layer',
         getSettings: (_settings: GlobalSettings) => _settings.openstreet,
      },
      // {
      //    olLayer: <OlBingLayer key="bing" />,
      //    src: bingImg,
      //    alt: 'bing layer'
      // }
   ].map((elem, index) => ({
      ...elem,
      order: index
   })));

   const onLayerChange = useCallback<OnLayerChange>((values) =>
      setLayers(layers => {
         const newLayers = [...layers];

         values.forEach(elem => {
            if (elem.order !== undefined) {
               newLayers[elem.index].order = elem.order;
            }
         });

         return newLayers;
      }), []);

   useEffect(() => {
      if (active) {
         setOpacity(' opacity-100');
      } else {
         setOpacity(' opacity-0');
      }
   }, [active]);

   const olLayers = useMemo(() =>
      layers.map(layer => {
         const layerSettings = layer.getSettings(settings);
         return { ...layer.olLayer, props: { ...layer.olLayer.props, order: layers.length - 1 - layer.order, active: layerSettings.active, enabled: layerSettings.enabled, minZoom: layerSettings.minZoom, maxZoom: layerSettings.maxZoom } }
      }),
      [layers, settings]);

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