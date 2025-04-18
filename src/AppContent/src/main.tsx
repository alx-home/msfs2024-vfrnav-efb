import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App.tsx'

import 'abortcontroller-polyfill/dist/polyfill-patch-fetch'

import { polyfill } from '@polyfills/drag-events/index';
import '@polyfills/drag-events/default.css';
import '@polyfills/pointer-events.js';
import "@polyfills/canvas/canvas";
import "@polyfills/Url.ts";

import InterBlackFont from './fonts/Inter-Regular.ttf';
import InterBlackItalicFont from './fonts/Inter-Italic.ttf';
import InterBoldFont from './fonts/Inter-Bold.ttf';
import InterBoldItalicFont from './fonts/Inter-BoldItalic.ttf';
import InterExtraBoldFont from './fonts/Inter-ExtraBold.ttf';
import InterExtraBoldItalicFont from './fonts/Inter-ExtraBoldItalic.ttf';
import InterExtraLightFont from './fonts/Inter-ExtraLight.ttf';
import InterExtraLightItalicFont from './fonts/Inter-ExtraLightItalic.ttf';

import "@alx-home/pdfjs-dist/build/pdf.worker.min.mjs";

import 'geometry-polyfill';

if (!globalThis.PointerEvent) {

  class PointerEventImpl extends MouseEvent {
    readonly altitudeAngle: number = 0;
    readonly azimuthAngle: number = 0;
    readonly height: number = 0;
    readonly isPrimary: boolean = true;
    readonly pointerId: number = 0;
    readonly pointerType: string = "";
    readonly pressure: number = 0;
    readonly tangentialPressure: number = 0;
    readonly tiltX: number = 0;
    readonly tiltY: number = 0;
    readonly twist: number = 0;
    readonly width: number = 0;

    getCoalescedEvents(): PointerEvent[] {
      console.assert(false);
      return [];
    }
    getPredictedEvents(): PointerEvent[] {
      console.assert(false);
      return [];
    }
  };

  globalThis.PointerEvent = PointerEventImpl;
}

polyfill({
  holdToDrag: 100
});

const loadFont = (font: string, weight: "normal" | "bold" | "bolder" | "lighter", style: "normal" | "italic") => {
  const fontFace = new FontFace(
    "Inter-" + weight,
    `url(${font})`,
    {
      style: style
    }
  );

  document.fonts.add(fontFace);
  fontFace.load();
}

loadFont(InterBlackFont, "normal", "normal");
loadFont(InterBlackItalicFont, "normal", "italic");
loadFont(InterBoldFont, "bold", "normal");
loadFont(InterBoldItalicFont, "bold", "italic");
loadFont(InterExtraBoldFont, "bolder", "normal");
loadFont(InterExtraBoldItalicFont, "bolder", "italic");
loadFont(InterExtraLightFont, "lighter", "normal");
loadFont(InterExtraLightItalicFont, "lighter", "italic");

import './global.css';
import "./ol.css";

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
