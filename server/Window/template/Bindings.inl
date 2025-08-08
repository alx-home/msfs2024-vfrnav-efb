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

#pragma once

#include "Window.h"

#include "Bindings/abort.inl"
#include "Bindings/log.inl"
#include "Bindings/Files.inl"
#include "Bindings/Taskbar.inl"
#include "Bindings/Settings.inl"
#include "Bindings/Message.inl"

template <WIN WINDOW>
void
Window<WINDOW>::InstallBindings() {
   webview_->Dispatch([this]() {
      webview_->AddUserScript("(()=>{window.__WEB_SERVER__ = false;})()");
   });

   Bind("abort", &Window::Abort);

   Bind("exists", &Window::Exists);
   Bind("file_exists", &Window::FileExists);
   Bind("parentExists", &Window::ParentExists);

   Bind("log", &Window::Log);

   Bind("openFile", &Window::OpenFile);
   Bind("getFile", &Window::GetFile);
   Bind("openFolder", &Window::OpenFolder);

   Bind("showTaskbar", &Window::ShowTaskbar);
   Bind("hideTaskbar", &Window::HideTaskbar);

   Bind("showTaskbarToolTip", &Window::ShowToolTip);
   Bind("hideTaskbarToolTip", &Window::HideToolTip);

   Bind("openEFB", &Window::OpenEFB);
   Bind("openWebEFB", &Window::OpenWebEFB);

   Bind("showSettings", &Window::ShowSettings);

   Bind("autostartServer", &Window::AutostartServer);
   Bind("serverPort", &Window::ServerPort);
   Bind("startupOption", &Window::StartupOption);

   Bind("watchServerState", &Window::WatchServerState);
   Bind("getServerState", &Window::GetServerState);
   Bind("switchServer", &Window::SwitchServer);

   Bind("vfrnav_postMessage", &Window::VDispatchMessage);
}