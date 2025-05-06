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

#include "main.h"
#include "Resources.h"

#include <json/json.h>
#include <promise/promise.h>
#include <webview/webview.h>

#include <ShObjIdl_core.h>
#include <WinUser.h>
#include <dwmapi.h>
#include <errhandlingapi.h>
#include <intsafe.h>
#include <minwindef.h>
#include <windef.h>
#include <winnt.h>
#include <winreg.h>

#include <cstdlib>
#include <functional>
#include <iostream>
#include <utility>

#ifdef _WIN32
int WINAPI
WinMain(HINSTANCE /*hInst*/, HINSTANCE /*hPrevInst*/, LPSTR /*lpCmdLine*/, int /*nCmdShow*/) {
#else
int
main() {
#endif

#ifdef PROMISE_MEMCHECK
   auto const _{promise::Memcheck()};
#endif

   try {
#ifndef NDEBUG
      if (AttachConsole(ATTACH_PARENT_PROCESS) || AllocConsole()) {
         FILE* old = nullptr;
         freopen_s(&old, "CONOUT$", "w", stdout);
         freopen_s(&old, "CONOUT$", "w", stderr);
      }
#endif  // DEBUG

      Main main{};
   } catch (const webview::Exception& e) {
      std::cerr << e.what() << '\n';
      return 1;
   }

   return 0;
}

Main::Main()
   : webview_{
#ifndef NDEBUG
       true,
#else
       false,
#endif
       nullptr,
       []() constexpr {
          auto const options{webview::detail::Win32EdgeEngine::MakeOptions()};
          webview::detail::Win32EdgeEngine::SetSchemesOption({"app"}, options);
          return options;
       }(),
       USER_DATA_DIR,
       0,
       WS_EX_DLGMODALFRAME
     } {

   webview_.SetTitleBarColor(0, 0xb4, 0xff, 255);

#ifndef WATCH_MODE
   InstallResourceHandler();
#endif

#ifndef DEBUG
   webview_.AddUserScript(R"_(document.addEventListener("contextmenu", (e) => {
   e.preventDefault();
});)_");
#endif

   webview_.SetSize(960, 640, webview::Hint::NONE);
   webview_.SetSize(480, 320, webview::Hint::MIN);

   InstallBindings();

#ifdef WATCH_MODE
   webview_.Navigate("http://localhost:3999");
#else
   webview_.Navigate("app://app/index.html");
#endif
   webview_.Run();
}

#ifndef WATCH_MODE
void
Main::InstallResourceHandler() {
   webview_.RegisterUrlHandler("*", [](webview::http::request_t const& request) {
      if (std::string const origin = "app://app/"; request.uri.starts_with(origin)) {
         auto const file = request.uri.substr(origin.size());

         auto const resource = EMBEDED_RESOURCES.find(file);
         if (resource != EMBEDED_RESOURCES.end()) {
            std::vector<char> data{};
            data.resize(resource->second.size());
            std::ranges::copy(resource->second, reinterpret_cast<std::byte*>(data.data()));

            auto const ext         = file.substr(file.find_last_of('.') + 1);
            auto const contentType = ext == "js" ? "text/javascript" : "text/html";

            webview::http::response_t response{
              .body         = data,
              .reasonPhrase = "Ok",
              .statusCode   = 200,
              .headers      = {{"Content-Type", contentType}, {"Access-Control-Allow-Origin", "*"}}
            };

            return response;
         }
      }

      return webview::http::response_t{
        .body = {}, .reasonPhrase = "Not Found", .statusCode = 404, .headers = {}
      };
   });

   webview_.InstallResourceHandler();
}
#endif

template <class RETURN, class... ARGS>
void
Main::Bind(std::string_view name, RETURN (Main::*member_ptr)(ARGS...)) {
   [&]<std::size_t... INDEX>(std::index_sequence<INDEX...>) constexpr {
      webview_.Bind(
        name, std::function<RETURN(ARGS...)>{std::bind(member_ptr, this, std::_Ph<INDEX + 1>{}...)}
      );
   }(std::make_index_sequence<sizeof...(ARGS)>());
}

void
Main::Warning(std::string_view message) {
   webview_.Eval(R"(window.display_warning()" + js::Serialize(message) + R"();)");
}

void
Main::Error(std::string_view message) {
   webview_.Eval(R"(window.display_error()" + js::Serialize(message) + R"();)");
}

void
Main::Fatal(std::string_view message) {
   webview_.Eval(R"(window.display_fatal()" + js::Serialize(message) + R"();)");
}

void
Main::Info(std::string_view message) {
   webview_.Eval(R"(window.display_info()" + js::Serialize(message) + R"();)");
}

void
Main::InstallBindings() {
   Bind("abort", &Main::Abort);

   Bind("exists", &Main::Exists);
   Bind("parentExists", &Main::ParentExists);

   Bind("log", &Main::Log);

   Bind("openFile", &Main::OpenFile);
   Bind("openFolder", &Main::OpenFolder);

   Bind("findCommunity", &Main::FindCommunity);
   Bind("defaultInstallPath", &Main::DefaultInstallPath);

   Bind("validate", &Main::Validate);
}