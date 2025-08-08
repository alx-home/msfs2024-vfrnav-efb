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

#include "Window.h"
#include "Resources.h"
#include "main.h"
#include "Server/WebSockets/Messages/Messages.h"
#include "utils/Scoped.h"
#include "windows/SystemTray.h"

#include <json/json.h>
#include <processthreadsapi.h>
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
#include <winuser.h>
#include <functional>
#include <memory>
#include <mutex>
#include <vector>

std::atomic<std::size_t> WinRefCount::s__refcount{};

namespace {
template <WIN WINDOW>
struct Params;

// requires over template explicit instantiation to avoid clangd reporting unused errors
template <WIN WINDOW>
   requires(WINDOW == WIN::MAIN)
struct Params<WINDOW> {
   static constexpr std::size_t PORT = 4000;
#ifndef WATCH_MODE
   static constexpr AppResources const& s__resources = MAIN_WINDOW_RESOURCES;
#endif
   static constexpr bool           MODAL = true;
   static constexpr wchar_t const* NAME  = L"Main Webview";
};

template <WIN WINDOW>
   requires(WINDOW == WIN::TASKBAR)
struct Params<WINDOW> {
   static constexpr std::size_t PORT = 4001;
#ifndef WATCH_MODE
   static constexpr AppResources const& s__resources = TASKBAR_WINDOW_RESOURCES;
#endif
   static constexpr bool           MODAL = false;
   static constexpr wchar_t const* NAME  = L"Taskbar Webview";
};

template <WIN WINDOW>
   requires(WINDOW == WIN::TASKBAR_TOOLTIP)
struct Params<WINDOW> {
   static constexpr std::size_t PORT = 4002;
#ifndef WATCH_MODE
   static constexpr AppResources const& s__resources = TASKBAR_TOOLTIP_WINDOW_RESOURCES;
#endif
   static constexpr bool           MODAL = false;
   static constexpr wchar_t const* NAME  = L"Tooltip Webview";
};

template <WIN WINDOW>
   requires(WINDOW == WIN::EFB)
struct Params<WINDOW> {
   static constexpr std::size_t PORT = 4003;
#ifndef WATCH_MODE
   static constexpr AppResources const& s__resources = EFB_RESOURCES;
#endif
   static constexpr bool           MODAL = true;
   static constexpr wchar_t const* NAME  = L"EFB Webview";
};

}  // namespace

template <WIN WINDOW>
Window<WINDOW>::Window(std::function<void()> on_terminate)
   : thread_{
       [this](std::stop_token stoken, std::function<void()> on_terminate) constexpr {
          ScopeExit _{[this, &stoken]() constexpr {
             std::unique_lock lock{mutex_};
             std::condition_variable_any().wait(lock, stoken, [] { return false; });
             webview_ = nullptr;
          }};

          {
             struct Unlock {
                Window& self_;
                ~Unlock() {
                   std::lock_guard lock{self_.mutex_};
                   self_.cv_.notify_all();
                }
             } _{.self_ = *this};

             SetThreadDescription(GetCurrentThread(), Params<WINDOW>::NAME);

             webview_ = std::make_unique<webview::webview>(
#ifndef NDEBUG
               true,
#else
               false,
#endif
               nullptr,
               []() constexpr {
                  auto const options{webview::detail::Win32EdgeEngine::MakeOptions()};
                  webview::detail::Win32EdgeEngine::SetSchemesOption({"app", "coui"}, options);
                  return options;
               }(),
               USER_DATA_DIR,
               0,
               Params<WINDOW>::MODAL ? WS_EX_DLGMODALFRAME : WS_EX_TOOLWINDOW,
               std::move(on_terminate)
             );

             if constexpr (Params<WINDOW>::MODAL) {
                webview_->SetTitleBarColor(0, 0xb4, 0xff, 255);
             } else if constexpr (WINDOW == WIN::TASKBAR_TOOLTIP) {
                webview_->SetBackgroung(255, 255, 255, 0);
             }

#ifndef WATCH_MODE
             InstallResourceHandler();
#endif

#ifndef DEBUG
             webview_->AddUserScript(R"_(document.addEventListener("contextmenu", (e) => {
      e.preventDefault();
      });)_");
#endif

             if constexpr (Params<WINDOW>::MODAL) {
                webview_->SetSize(1024, 680, webview::Hint::NONE);
                webview_->SetSize(500, 320, webview::Hint::MIN);

                // Windows starts visible
                ++s__refcount;
                // Bring it to foreground
                webview_->Show();
             } else {
                // Do not decrement tooltip refcount
                webview_->Hide();

                if constexpr (WINDOW == WIN::TASKBAR_TOOLTIP) {
                   webview_->SetSize(250, 180, webview::Hint::STATIC);

                   auto const trayRect = win32::SystemTray::GetTrayWndRect();
                   webview_->SetPos(
                     trayRect.left + 15 - webview_->Width() / 2, trayRect.top - webview_->Height()
                   );
                } else {
                   webview_->SetSize(200, 200, webview::Hint::STATIC);
                }

                webview_->SetTopMost();
             }

             InstallBindings();

#ifdef WATCH_MODE
             webview_->Navigate("http://localhost:" + std::to_string(Params<WINDOW>::PORT));
#else
             webview_->Navigate("app://app/index.html");
#endif
          };

          webview_->Run();
       },
       std::move(on_terminate)
     } {
   {
      std::unique_lock lock{mutex_};
      cv_.wait(lock);
   }

   if constexpr (WIN::EFB == WINDOW) {
      Dispatch([this]() constexpr {
         if (Main::Running()) {
            auto const id = std::bit_cast<std::size_t>(this);
            Main::Get()->SetMessageHandler(
              id, {[this](std::size_t, ws::Message message) constexpr {
                 webview_->Call<void>("vfrnav_onmessage", std::move(message));
              }}
            );
         }
      });
   }
}

template <WIN WINDOW>
void
Window<WINDOW>::Dispatch(std::function<void()> func) const {
   webview_->Dispatch(std::move(func));
}

template <WIN WINDOW>
Window<WINDOW>::~Window() {
   if constexpr (WIN::EFB == WINDOW) {
      Dispatch([this]() constexpr {
         if (Main::Running()) {
            Main::Get()->UnsetMessageHandler(std::bit_cast<std::size_t>(this));
         }
      });
   }

   Dispatch([]() constexpr { PostQuitMessage(0); });
   thread_.request_stop();
}

template <WIN WINDOW>
void
Window<WINDOW>::Hide() const {
   if (webview_->Hidden()) {
      return;
   }

   webview_->Hide();

   DecRefcount();
}

template <WIN WINDOW>
void
Window<WINDOW>::DecRefcount() {
   if constexpr (WINDOW != WIN::TASKBAR_TOOLTIP) {
      if (!--s__refcount) {
         // Show ToolTip

         if (Main::Running()) {
            Main::Get()->OpenToolTip();
         }
      }
   }
}

template <WIN WINDOW>
void
Window<WINDOW>::Show() const {
   if (webview_->Hidden()) {
      ++s__refcount;
   }

   webview_->Show();
}

template <WIN WINDOW>
void
Window<WINDOW>::Restore() const {
   webview_->Restore();
}

template <WIN WINDOW>
void
Window<WINDOW>::SetPos(int x, int y) {
   webview_->SetPos(x, y);
}

template <WIN WINDOW>
int
Window<WINDOW>::Width() const {
   return webview_->Width();
}

template <WIN WINDOW>
int
Window<WINDOW>::Height() const {
   return webview_->Height();
}

template <WIN WINDOW>
webview::Pos
Window<WINDOW>::GetPos() const {
   return webview_->GetPos();
}

template <WIN WINDOW>
webview::Size
Window<WINDOW>::GetSize() const {
   return webview_->GetSize();
}

template <WIN WINDOW>
webview::Bounds
Window<WINDOW>::GetBounds() const {
   return webview_->GetBounds();
}

#ifndef WATCH_MODE
template <WIN WINDOW>
void
Window<WINDOW>::InstallResourceHandler() {
   auto const filters = []() constexpr -> std::vector<std::string_view> {
      if constexpr (WINDOW == WIN::EFB) {
         // Passthrough other requests
         return {"app://*"};
      } else {
         return {"*"};
      }
   }();
   webview_->RegisterUrlHandlers(filters, [](webview::http::request_t const& request) constexpr {
      std::string file;
      bool        found{false};
      if (std::string const origin = "app://app/"; request.uri.starts_with(origin)) {
         file  = request.uri.substr(origin.size());
         found = true;
      }
      if (found) {
         auto const& resources = Params<WINDOW>::s__resources;
         auto const  resource  = resources.find(file);
         if (resource != resources.end()) {
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

   webview_->InstallResourceHandler();
}
#endif

template <WIN WINDOW>
template <class RETURN, class... ARGS>
void
Window<WINDOW>::Bind(std::string_view name, RETURN (Window::*member_ptr)(ARGS...)) {
   [&]<std::size_t... INDEX>(std::index_sequence<INDEX...>) constexpr {
      webview_->Bind(
        name, std::function<RETURN(ARGS...)>{std::bind(member_ptr, this, std::_Ph<INDEX + 1>{}...)}
      );
   }(std::make_index_sequence<sizeof...(ARGS)>());
}

template <WIN WINDOW>
void
Window<WINDOW>::Warning(std::string_view message) {
   webview_->Eval(R"(window.display_warning()" + js::Stringify(message) + R"();)");
}

template <WIN WINDOW>
void
Window<WINDOW>::Error(std::string_view message) {
   webview_->Eval(R"(window.display_error()" + js::Stringify(message) + R"();)");
}

template <WIN WINDOW>
void
Window<WINDOW>::Fatal(std::string_view message) {
   webview_->Eval(R"(window.display_fatal()" + js::Stringify(message) + R"();)");
}

template <WIN WINDOW>
void
Window<WINDOW>::Info(std::string_view message) {
   webview_->Eval(R"(window.display_info()" + js::Stringify(message) + R"();)");
}

#include "Bindings.inl"