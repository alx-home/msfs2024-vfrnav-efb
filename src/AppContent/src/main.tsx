import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App.tsx'

import { polyfill } from './drag-events/index';
import './drag-events/default.css';
import './pointer-events.js';

import InterBlackFont from './fonts/Inter_28pt-Black.ttf';
import InterBlackItalicFont from './fonts/Inter_28pt-BlackItalic.ttf';
import InterBoldFont from './fonts/Inter_28pt-Bold.ttf';
import InterBoldItalicFont from './fonts/Inter_28pt-BoldItalic.ttf';
import InterExtraBoldFont from './fonts/Inter_28pt-ExtraBold.ttf';
import InterExtraBoldItalicFont from './fonts/Inter_28pt-ExtraBoldItalic.ttf';
import InterExtraLightFont from './fonts/Inter_28pt-ExtraLight.ttf';
import InterExtraLightItalicFont from './fonts/Inter_28pt-ExtraLightItalic.ttf';

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

// options are optional ;)
polyfill({
  // holdToDrag: 1000 @todo
});

const loadFont = (font: string, weight: "normal" | "bold" | "bolder" | "lighter", style: "normal" | "italic") => {
  const fontFace = new FontFace(
    "Inter",
    `url(${font})`,
    {
      weight: weight,
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

import './global.sass';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
