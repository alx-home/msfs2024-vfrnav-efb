/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2024 Alexandre GARCIN
 *
 * This program is free software: you can redistribute it and/or modify it under the terms of the
 * GNU General Public License as published by the Free Software Foundation, version 3.
 *
 * This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without
 * even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the GNU
 * General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License along with this program. If
 * not, see <https://www.gnu.org/licenses/>.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './app/App'

import ResizeObserver from 'resize-observer-polyfill';

import InterBlackFont from '@alx-home/fonts/Inter-Regular.ttf';
import InterBlackItalicFont from '@alx-home/fonts/Inter-Italic.ttf';
import InterBoldFont from '@alx-home/fonts/Inter-Bold.ttf';
import InterBoldItalicFont from '@alx-home/fonts/Inter-BoldItalic.ttf';
import InterExtraBoldFont from '@alx-home/fonts/Inter-ExtraBold.ttf';
import InterExtraBoldItalicFont from '@alx-home/fonts/Inter-ExtraBoldItalic.ttf';
import InterExtraLightFont from '@alx-home/fonts/Inter-ExtraLight.ttf';
import InterExtraLightItalicFont from '@alx-home/fonts/Inter-ExtraLightItalic.ttf';

import "@alx-home/global.css";
import './global.css';
import "./ol.css";

import '@polyfills/drag-events/default.css';
(async () => {
  if (__MSFS_EMBEDED__) {
    await import('abortcontroller-polyfill/dist/polyfill-patch-fetch.js');
    await import('@polyfills/pointer-events.js');
    await import('geometry-polyfill');
    await import("@polyfills/canvas/canvas.js");

    const drag_polyfill = (await import('@polyfills/drag-events/index.js')).polyfill;
    drag_polyfill({
      holdToDrag: 100
    });

    if (!globalThis.ResizeObserver) {
      globalThis.ResizeObserver = ResizeObserver;
    }

    await import('@alx-home/pdfjs-dist/build/pdf.worker.min.mjs');
  } else {
    await import("pdfjs-dist/build/pdf.worker.min.mjs");
  }

  console.assert((typeof PointerEvent !== "undefined"));

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

  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
})()