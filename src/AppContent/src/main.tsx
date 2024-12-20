import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App.tsx'

import { polyfill } from './drag-events/index';
import './drag-events/default.css';
import './pointer-events.js';

// import '@/fonts/Inter_28pt-Black.ttf';
// import '@/fonts/Inter_28pt-BlackItalic.ttf';
// import '@/fonts/Inter_28pt-Bold.ttf';
// import '@/fonts/Inter_28pt-BoldItalic.ttf';
// import '@/fonts/Inter_28pt-ExtraBold.ttf';
// import '@/fonts/Inter_28pt-ExtraBoldItalic.ttf';
// import '@/fonts/Inter_28pt-Light.ttf';
// import '@/fonts/Inter_28pt-LightItalic.ttf';


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

import './global.sass';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
