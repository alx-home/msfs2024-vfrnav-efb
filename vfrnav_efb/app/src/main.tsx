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
import { Chart, registerables } from 'chart.js';
import { App } from './app/App'

import { messageHandler } from '@Settings/SettingsProvider';

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

import icon from '@vfrnav/images/app-icon.svg'

import '@polyfills/drag-events/default.css';


import 'chartjs-plugin-dragdata';
import { Manager } from './Manager';
import { MessageType } from '@shared/MessageHandler';


const updateFavicon = () => {
  const favicon = document.querySelector('link[rel="icon"]') as HTMLLinkElement;
  if (favicon) {
    favicon.href = icon;
  } else {
    const newFavicon = document.createElement('link');
    newFavicon.rel = 'icon';
    newFavicon.href = icon;
    document.head.appendChild(newFavicon);
  }
}

Chart.register(...registerables);

(async () => {
  if (__MSFS_EMBEDED__) {
    await import('abortcontroller-polyfill/dist/polyfill-patch-fetch.js');
    await import('@polyfills/pointer-events.js');
    await import('geometry-polyfill');
    await import("@polyfills/canvas/canvas.js");
    globalThis.Intl = ((await import('intl')) as {
      default: typeof globalThis.Intl
    }).default;

    await import('intl/locale-data/jsonp/en.js');

    const drag_polyfill = (await import('@polyfills/drag-events/index.js')).polyfill;
    drag_polyfill({
      holdToDrag: 100
    });

    if (!globalThis.ResizeObserver) {
      globalThis.ResizeObserver = ResizeObserver;
    }

    await import('@alx-home/pdfjs-dist/build/pdf.worker.min.mjs');
  } else {
    window.__WEB_SERVER__ ??= true;

    await import("pdfjs-dist/build/pdf.worker.min.mjs");

    updateFavicon()
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

  if (window.__WEB_SERVER__) {
    window.manager = new Manager();
    window.vfrnav_postMessage = (message: MessageType) => {
      (window.manager as Manager).postMessage(message);
    };
  }

  if (__MSFS_EMBEDED__ || window.__WEB_SERVER__) {
    window.file_exists = (() => {
      const id = {
        next: 0
      };

      const resolvers = new Map<number, {
        resolve: (_: boolean) => void,
        reject: (_: Error) => void
      }>();

      messageHandler.subscribe("__FILE_EXISTS_RESPONSE__", message => {
        const resolver = resolvers.get(message.id);
        console.assert(!!resolver);

        resolver?.resolve(message.result);
        resolvers.delete(message.id);
      });

      return (name: string): Promise<boolean> => {
        return new Promise<boolean>((resolve, reject) => {
          const my_id = ++id.next;

          resolvers.set(my_id, {
            resolve: resolve,
            reject: reject
          });

          messageHandler.send({
            __FILE_EXISTS__: true,

            path: name,
            id: my_id
          });
        });
      }
    })();


    window.openFile = (() => {
      const id = {
        next: 0
      };

      const resolvers = new Map<number, {
        resolve: (_: string) => void,
        reject: (_: Error) => void
      }>();

      messageHandler.subscribe("__OPEN_FILE_RESPONSE__", message => {
        const resolver = resolvers.get(message.id);
        console.assert(!!resolver);

        if (message.path.length) {
          resolver?.resolve(message.path);
        } else {
          resolver?.reject(new Error("File not found"));
        }
        resolvers.delete(message.id);
      });

      return (path: string, filters: {
        name: string,
        value: string[]
      }[]): Promise<string> => {
        return new Promise<string>((resolve, reject) => {
          const my_id = ++id.next;

          resolvers.set(my_id, {
            resolve: resolve,
            reject: reject
          });

          messageHandler.send({
            __OPEN_FILE__: true,

            path: path,
            filters: filters,
            id: my_id
          });
        });
      }
    })();

    window.getFile = (() => {
      const id = {
        next: 0
      };

      const resolvers = new Map<number, {
        resolve: (_: string) => void,
        reject: (_: Error) => void
      }>();

      messageHandler.subscribe("__GET_FILE_RESPONSE__", message => {
        const resolver = resolvers.get(message.id);
        console.assert(!!resolver);

        if (message.data.length) {
          resolver?.resolve(message.data);
        } else {
          resolver?.reject(new Error("File not found"));
        }
        resolvers.delete(message.id);
      });

      return (name: string): Promise<string> => {
        return new Promise<string>((resolve, reject) => {
          const my_id = ++id.next;

          resolvers.set(my_id, {
            resolve: resolve,
            reject: reject
          });

          messageHandler.send({
            __GET_FILE__: true,

            path: name,
            id: my_id
          });
        });
      }
    })();

    window.severStateChanged = (() => {
      const state = {
        current: false
      }
      const resolvers = new Array<(_: boolean) => void>();

      messageHandler.subscribe("__SERVER_STATE__", message => {
        state.current = message.state;
        const resolvers_ = [...resolvers];
        resolvers.length = 0;
        resolvers_.forEach(resolve => resolve(state.current));
      });

      messageHandler.send({ __GET_SERVER_STATE__: true });

      return async (currentState: boolean) => {
        if (currentState != state.current) {
          return state.current
        } else {
          return new Promise<boolean>((resolve) => {
            resolvers.push(resolve)
          });
        }
      }
    })();
  }
})()