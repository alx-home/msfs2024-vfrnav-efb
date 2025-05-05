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

import { App } from './App/App';

import '@alx-home/global.css';

window.onerror = function (_message, _file, _line, _col, error) {
  window.display_error(error?.message ?? "An unknown error occurred !");
  return false;
};

window.addEventListener("error", function (e) {
  window.display_error(e.error.message);
  return false;
})

window.addEventListener('unhandledrejection', function (e) {
  if (e.reason == "App is stopping !") {
    window.display_appstopping();
  } else {
    window.display_error(e.reason);
  }
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
