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

#include "window/FileDialog.h"
#include "utils/Scoped.h"
#include "utils/String.h"

#include <ShObjIdl_core.h>
#include <array>
#include <combaseapi.h>
#include <exception>
#include <filesystem>
#include <json/json.h>
#include <mutex>
#include <objbase.h>
#include <promise/promise.h>
#include <ranges>
#include <span>
#include <string>
#include <string_view>
#include <thread>
#include <unordered_map>
#include <windows/Env.h>
#include <winnt.h>

namespace dialog {
struct Exception : std::exception {
   explicit Exception(std::string_view msg)
      : std::exception{msg.data()} {}
};

namespace {

enum class Type { FILE, FOLDER };

class FileDialog {
public:
   using Fdialog = std::unique_ptr<IFileOpenDialog, void (*)(IFileOpenDialog*)>;

   FileDialog()
      : fdialog_{[]() constexpr {
         // CREATE FileOpenDialog OBJECT
         IFileOpenDialog* fdialog_ptr;

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wlanguage-extension-token"
         if (HRESULT result = CoCreateInstance(
               CLSID_FileOpenDialog, nullptr, CLSCTX_INPROC_SERVER, IID_PPV_ARGS(&fdialog_ptr)
             );
             FAILED(result)) {
            throw Exception{"FileDialog::CoCreateInstance error: " + std::to_string(result)};
         }
#pragma clang diagnostic pop
         return Fdialog{fdialog_ptr, [](IFileOpenDialog* fdialog) { fdialog->Release(); }};
      }()} {
   }

   void SetFileTypes(std::span<COMDLG_FILTERSPEC> types) {
      fdialog_->SetFileTypes(types.size(), types.data());
   }

   void AddOptions(FILEOPENDIALOGOPTIONS option) {
      DWORD flags;
      if (HRESULT result = fdialog_->GetOptions(&flags); FAILED(result)) {
         throw Exception{"FileDialog::GetOption error: " + std::to_string(result)};
      }

      if (HRESULT result = fdialog_->SetOptions(flags | option); FAILED(result)) {
         throw Exception{"FileDialog::SetOptions error: " + std::to_string(result)};
      }
   }

   void SetFolder(std::wstring path) {
      std::ranges::transform(path, path.begin(), [](wchar_t value) {
         return value == L'/' ? L'\\' : value;
      });

      std::unique_ptr<IShellItem, void (*)(IShellItem*)> item{nullptr, [](IShellItem*) {}};
      {
         IShellItem* cur_folder = nullptr;

#pragma clang diagnostic push
#pragma clang diagnostic ignored "-Wlanguage-extension-token"
         if (HRESULT result =
               SHCreateItemFromParsingName(path.c_str(), nullptr, IID_PPV_ARGS(&cur_folder));
             FAILED(result)) {
            throw Exception{
              "FileDialog::SHCreateItemFromParsingName error: " + std::to_string(result)
            };
         }
#pragma clang diagnostic pop

         item = {cur_folder, [](IShellItem* pCurFolder) { pCurFolder->Release(); }};
      };

      if (HRESULT result = fdialog_->SetFolder(item.get()); FAILED(result)) {
         throw Exception{"FileDialog::SetFolder error: " + std::to_string(result)};
      }
   }

   bool Show(HWND owner = nullptr) {
      if (HRESULT result = fdialog_->Show(owner); FAILED(result)) {
         if (result == HRESULT_FROM_WIN32(ERROR_CANCELLED)) {
            return false;
         }
         throw Exception{"FileDialog::Show error: " + std::to_string(result)};
      }

      return true;
   }

   std::wstring GetResult() {

      std::unique_ptr<IShellItem, void (*)(IShellItem*)> files{nullptr, [](IShellItem*) {}};
      {
         //  RETRIEVE FILE NAME FROM THE SELECTED ITEM
         IShellItem* files_ptr;
         if (HRESULT result = fdialog_->GetResult(&files_ptr); FAILED(result)) {
            throw Exception{"FileDialog::GetResult error: " + std::to_string(result)};
         }

         files = {files_ptr, [](IShellItem* files) { files->Release(); }};
      };

      LPWSTR result_ptr;
      if (HRESULT result = files->GetDisplayName(SIGDN_FILESYSPATH, &result_ptr); FAILED(result)) {
         throw Exception{"FileDialog::GetDisplayName error: " + std::to_string(result)};
      }

      std::wstring result{result_ptr};
      CoTaskMemFree(result_ptr);
      return result;
   }

   auto operator->() { return fdialog_.get(); }

   auto operator->() const { return fdialog_.get(); }

private:
   Fdialog fdialog_;
};

template <Type TYPE>
Promise<std::string>
Open(std::string_view path, std::vector<Filter> filters) {
   static std::mutex                                        s__thread_mutex{};
   static std::unordered_map<std::thread::id, std::jthread> s__threads{};

   co_return co_await MakePromise(
     [path, filters = std::move(filters)](
       Resolve<std::string> const& resolve, Reject const& reject
     ) -> Promise<std::string, true> {
        {
           std::lock_guard lock{s__thread_mutex};
           std::jthread    thread{[&reject,
                                &resolve,
                                filters = std::move(filters),
                                value = std::filesystem::path{ReplaceEnv(std::string{path})}]() {
              ScopeExit _{[]() constexpr {
                 std::lock_guard lock{s__thread_mutex};

                 auto it = s__threads.find(std::this_thread::get_id());
                 assert(it != s__threads.end());
                 it->second.detach();
                 s__threads.erase(it);
              }};

              try {
                 FileDialog fdialog{};

                 if constexpr (TYPE == Type::FILE) {
                    std::vector<COMDLG_FILTERSPEC>                     file_types{};
                    std::vector<std::pair<std::wstring, std::wstring>> wfilters;

                    for (auto const& filter : filters) {
                       wfilters.emplace_back(
                         utils::WidenString(filter.name_),
                         utils::WidenString(
                           filter.value_ | std::views::join_with(';')
                           | std::ranges::to<std::string>()
                         )
                       );
                    }
                    for (auto const& wfilter : wfilters) {
                       auto const& [name, filter] = wfilter;
                       file_types.emplace_back(COMDLG_FILTERSPEC{name.c_str(), filter.c_str()});
                    }
                    fdialog.SetFileTypes(file_types);
                 } else {
                    fdialog.AddOptions(FOS_PICKFOLDERS);
                 }

                 if (std::filesystem::exists(value)) {

                    std::filesystem::path path{value};
                    if (!std::filesystem::is_directory(path)) {
                       path = path.parent_path();
                    }

                    fdialog.SetFolder(path);
                 }

                 if (!fdialog.Show()) {
                    return MakeReject<Exception>(reject, "FileDialog closed");
                 }

                 return resolve(utils::NarrowString(fdialog.GetResult()));
              } catch (...) {
                 return reject(std::current_exception());
              }
           }};
           s__threads.emplace(thread.get_id(), std::move(thread));
        }

        co_return;
     }
   );
}
}  // namespace

Promise<std::string>
OpenFile(std::string_view path, std::vector<Filter> filters) {
   return MakePromise(Open<Type::FILE>, path, std::move(filters));
}

Promise<std::string>
OpenFolder(std::string_view path) {
   return MakePromise(Open<Type::FOLDER>, path, std::vector<dialog::Filter>{});
}
}  // namespace dialog
