/*
 * SPDX-License-Identifier: (GNU General Public License v3.0 only)
 * Copyright © 2026 Alexandre GARCIN
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

#include "FileSystem.h"
#include <windows.h>
#include <bcrypt.h>
#include <algorithm>
#include <array>
#include <cctype>
#include <climits>
#include <fstream>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <stdexcept>

namespace tablet {
namespace fs = std::filesystem;

class HashProvider {
public:
   /** @brief Open the SHA-256 algorithm provider or report initialization failure. */
   HashProvider();

   /** @brief Release the owned BCrypt algorithm provider. */
   ~HashProvider();

   /** @brief Disallow copying the owned provider. */
   HashProvider(HashProvider const&) = delete;

   /** @brief Disallow assignment of the owned provider. */
   HashProvider& operator=(HashProvider const&) = delete;

   /** @brief Borrow the algorithm handle for a hash operation. */
   BCRYPT_ALG_HANDLE Get() const;

private:
   BCRYPT_ALG_HANDLE handle_{};
};

HashProvider::HashProvider() {
   if (BCryptOpenAlgorithmProvider(&handle_, BCRYPT_SHA256_ALGORITHM, nullptr, 0) < 0) {
      throw std::runtime_error("SHA256 initialization failed.");
   }
}

HashProvider::~HashProvider() { BCryptCloseAlgorithmProvider(handle_, 0); }

BCRYPT_ALG_HANDLE
HashProvider::Get() const { return handle_; }

std::string
FileSystem::Lower(std::string text) {
   std::ranges::transform(text, text.begin(), [](unsigned char ch) {
      return static_cast<char>(std::tolower(ch));
   });
   return text;
}

std::string
FileSystem::Trim(std::string text) {
   auto first{text.find_first_not_of(" \t\r\n\"")};
   if (first == std::string::npos) {
      return {};
   }

   auto last{text.find_last_not_of(" \t\r\n\"")};
   if (last == std::string::npos || last < first) {
      return {};
   }

   return text.substr(first, last - first + 1);
}

fs::path
FileSystem::ExtendedPath(fs::path const& path) {
   auto absolute{fs::absolute(path).lexically_normal().native()};
   if (absolute.starts_with(L"\\\\?\\")) {
      return fs::path{absolute};
   }

   if (absolute.starts_with(L"\\\\")) {
      return fs::path{L"\\\\?\\UNC\\" + absolute.substr(2)};
   }

   return fs::path{L"\\\\?\\" + absolute};
}

void
FileSystem::SafePath(fs::path path) {
   for (; !path.empty(); path = path.parent_path()) {
      auto attributes{GetFileAttributesW(path.c_str())};
      if (attributes != INVALID_FILE_ATTRIBUTES && (attributes & FILE_ATTRIBUTE_REPARSE_POINT)) {
         throw std::runtime_error("Linked/reparse paths are not supported: " + path.string());
      }

      if (path == path.parent_path()) {
         break;
      }
   }
}

std::string
FileSystem::ReadBytes(fs::path const& path) {
   FileSystem::SafePath(path);

   std::ifstream input{FileSystem::ExtendedPath(path), std::ios::binary};
   if (!input) {
      throw std::runtime_error(
        "Cannot read " + path.string()
        + ". In Deep mode enable/refresh VFS projection; protected files may remain inaccessible."
      );
   }

   std::ostringstream result{};

   result << input.rdbuf();
   if (input.bad()) {
      throw std::runtime_error("Read failed: " + path.string());
   }

   return result.str();
}

std::string
FileSystem::Read(fs::path const& path) {
   auto text{FileSystem::ReadBytes(path)};
   if (text.starts_with("\xFF\xFE")) {
      if (text.size() % 2) {
         throw std::runtime_error("Invalid UTF-16 file: " + path.string());
      }

      std::wstring wide{};

      for (std::size_t n{2}; n < text.size(); n += 2) {
         wide += static_cast<wchar_t>(
           static_cast<unsigned char>(text[n]) | static_cast<unsigned char>(text[n + 1]) << 8
         );
      }

      int size{WideCharToMultiByte(
        CP_UTF8,
        WC_ERR_INVALID_CHARS,
        wide.data(),
        static_cast<int>(wide.size()),
        nullptr,
        0,
        nullptr,
        nullptr
      )};
      if (!size && !wide.empty()) {
         throw std::runtime_error("Invalid UTF-16 configuration.");
      }

      text.resize(size);
      WideCharToMultiByte(
        CP_UTF8,
        WC_ERR_INVALID_CHARS,
        wide.data(),
        static_cast<int>(wide.size()),
        text.data(),
        size,
        nullptr,
        nullptr
      );
   }

   if (text.starts_with("\xEF\xBB\xBF")) {
      text.erase(0, 3);
   }

   return text;
}

std::string
FileSystem::Hash(std::string_view text) {
   HashProvider                  algorithm{};
   std::array<unsigned char, 32> output{};
   if (
     text.size() > ULONG_MAX
     || BCryptHash(
          algorithm.Get(),
          nullptr,
          0,
          reinterpret_cast<PUCHAR>(const_cast<char*>(text.data())),
          static_cast<ULONG>(text.size()),
          output.data(),
          static_cast<ULONG>(output.size())
        ) < 0
   ) {
      throw std::runtime_error("SHA256 failed.");
   }

   std::ostringstream stream{};

   for (auto byte : output) {
      stream << std::hex << std::setw(2) << std::setfill('0') << +byte;
   }

   return stream.str();
}

std::vector<fs::path>
FileSystem::Files(fs::path const& root) {
   FileSystem::SafePath(root);

   std::vector<fs::path> result{};

   for (auto const& entry : fs::recursive_directory_iterator{root}) {
      FileSystem::SafePath(entry.path());
      if (entry.is_regular_file()) {
         result.push_back(entry.path());
      }
   }

   std::ranges::sort(result);
   return result;
}

fs::path
FileSystem::VirtualPath(std::string text) {
   if (text.empty()) {
      throw std::runtime_error("Empty virtual path is unsupported.");
   }

   std::ranges::replace(text, '/', '\\');

   fs::path result{text};
   if (result.is_absolute() || result.has_root_name()) {
      throw std::runtime_error("Absolute attachment path is unsupported.");
   }

   for (auto const& part : result) {
      if (part == ".." || part == ".") {
         throw std::runtime_error("Attachment traversal is unsupported.");
      }
   }

   return result;
}

fs::path
FileSystem::Resolve(std::vector<fs::path> const& roots, fs::path const& relative) {
   for (auto const& root : roots) {
      auto target{root / relative};

      FileSystem::SafePath(target);
      if (fs::is_regular_file(target)) {
         return target;
      }
   }

   throw std::runtime_error("Required dependency is not readable: " + relative.string());
}

std::string
FileSystem::QuoteIni(std::string_view input) {
   std::string out{"\""};

   for (char ch : input) {
      if (ch == '"') {
         out += '\\';
      }

      out += ch;
   }

   out += '"';
   return out;
}

void
FileSystem::Write(fs::path const& path, std::string_view bytes) {
   auto target{FileSystem::ExtendedPath(path)};

   fs::create_directories(target.parent_path());

   try {
      std::ofstream out{};

      out.exceptions(std::ios::badbit | std::ios::failbit);
      out.open(target, std::ios::binary | std::ios::trunc);
      out.write(bytes.data(), static_cast<std::streamsize>(bytes.size()));
      out.close();
   } catch (std::ios_base::failure const& error) {
      throw std::runtime_error(
        "Cannot write EFB patch file " + path.string() + ": " + error.what()
      );
   }
}

std::string
FileSystem::Pretty(std::string name) {
   std::ranges::replace(name, '_', ' ');
   std::ranges::replace(name, '-', ' ');

   bool upper{true};

   for (char& ch : name) {
      if (upper && std::isalpha(static_cast<unsigned char>(ch))) {
         ch = static_cast<char>(std::toupper(static_cast<unsigned char>(ch)));
      }

      upper = ch == ' ';
   }

   return name;
}

void
FileSystem::MakeWritableTree(fs::path const& root) noexcept {
   try {
      for (auto const& file : FileSystem::Files(root)) {
         std::error_code ec{};

         fs::permissions(file, fs::perms::owner_write, fs::perm_options::add, ec);

         if (ec) {
            std::cerr << "Cannot make managed file writable: " << file << ": " << ec.message()
                      << '\n';
         }
      }
   } catch (std::exception const& error) {
      std::cerr << "Cannot prepare managed directory for cleanup: " << root << ": " << error.what()
                << '\n';
   }
}
}  // namespace tablet
