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

#pragma once

#include "FileSystem.h"
#include <string>
#include <vector>
#include <list>
#include <iterator>
#include <set>
#include <algorithm>
#include <cctype>
#include <sstream>
#include <stdexcept>
#include <utility>

namespace tablet {
/** @brief Preserve an INI section's header and lines while editing individual keys. */
class Section {
   friend class Planner;
   friend class Ini;

   std::string              name_{};
   std::vector<std::string> lines_{};
   std::string              header_{};

public:
   /** @brief Construct a section while preserving its original header and lines.
    *
    * @param name Normalized section name.
    * @param lines Original section lines.
    * @param header Original section header. */
   Section(std::string name, std::vector<std::string> lines, std::string header)
      : name_{std::move(name)}
      , lines_{std::move(lines)}
      , header_{std::move(header)} {}

   /** @brief Find a normalized key value without changing the source lines.
    *
    * @param key Normalized key to find.
    *
    * @return Trimmed value, or an empty string if the key is absent. */
   std::string Get(std::string const& key) const {
      for (auto const& line : lines_) {
         auto equals{line.find('=')};
         if (
           equals != std::string::npos
           && FileSystem::Lower(FileSystem::Trim(line.substr(0, equals))) == key
         ) {
            auto comment{line.find(';', equals)};
            auto length{comment == std::string::npos ? std::string::npos : comment - equals - 1};

            return FileSystem::Trim(line.substr(equals + 1, length));
         }
      }

      return {};
   }

   /** @brief Replace or append a key while preserving trailing comments.
    *
    * @param key Normalized key to update.
    * @param value Replacement value. */
   void Set(std::string const& key, std::string const& value) {
      for (auto& line : lines_) {
         auto equals{line.find('=')};
         if (
           equals == std::string::npos
           || FileSystem::Lower(FileSystem::Trim(line.substr(0, equals))) != key
         ) {
            continue;
         }

         auto start{line.find_first_not_of(" \t", equals + 1)};
         if (start == std::string::npos) {
            start = equals + 1;
         }

         bool quoted{false};
         auto comment{std::string::npos};

         for (auto i{start}; i < line.size(); ++i) {
            if (line[i] == '"') {
               quoted = !quoted;
            }

            if (!quoted && line[i] == ';') {
               comment = i;
               break;
            }
         }

         auto suffix{comment == std::string::npos ? std::string{} : " " + line.substr(comment)};

         line = line.substr(0, start) + value + suffix;
         return;
      }

      lines_.push_back(key + " = " + value);
   }

   /** @brief Remove all lines defining the requested key.
    *
    * @param key Normalized key to remove. */
   void Remove(std::string const& key) {
      std::erase_if(lines_, [&](std::string const& line) {
         auto equals{line.find('=')};

         return equals != std::string::npos
                && FileSystem::Lower(FileSystem::Trim(line.substr(0, equals))) == key;
      });
   }
};

/** @brief Parse and edit simulator INI files while preserving section order and comments. */
class Ini {
   friend class Planner;

   std::list<Section> sections_{{"", {}, {}}};

public:
   /** @brief Parse an INI document while rejecting malformed or duplicate sections.
    *
    * @param text INI document to parse.
    *
    * @throws std::runtime_error If a section header is malformed or duplicated. */
   explicit Ini(std::string const& text) {
      std::istringstream    input{text};
      std::string           line{};
      std::set<std::string> names{};

      while (std::getline(input, line)) {
         if (line.ends_with('\r')) {
            line.pop_back();
         }

         auto trimmed{FileSystem::Trim(line)};
         if (trimmed.starts_with('[')) {
            auto end{trimmed.find(']')};
            if (end == std::string::npos) {
               throw std::runtime_error("Malformed INI section.");
            }

            auto name{FileSystem::Lower(trimmed.substr(1, end - 1))};
            if (!names.insert(name).second) {
               throw std::runtime_error("Duplicate INI section: " + name);
            }

            sections_.emplace_back(std::move(name), std::vector<std::string>{}, line);
         } else if (!sections_.empty()) {
            sections_.back().lines_.push_back(line);
         }
      }
   }

   /** @brief Find or create a section without invalidating references, keeping VERSION first.
    *
    * @param name Normalized section name.
    *
    * @return Reference to the existing or newly created section. */
   Section& Get(std::string const& name) {
      for (auto& section : sections_) {
         if (section.name_ == name) {
            return section;
         }
      }

      auto uppercase{name};

      std::ranges::transform(uppercase, uppercase.begin(), [](unsigned char ch) {
         return static_cast<char>(std::toupper(ch));
      });

      Section created{name, {}, "[" + uppercase + "]"};
      if (name == "version") {
         return *sections_.insert(std::next(sections_.begin()), std::move(created));
      }

      sections_.push_back(std::move(created));
      return sections_.back();
   }

   /** @brief Serialize the edited document with simulator-compatible CRLF endings.
    *
    * @return Serialized INI document. */
   std::string Text() const {
      std::string result{};

      for (auto const& section : sections_) {
         if (!section.name_.empty()) {
            result += section.header_ + "\r\n";
         }

         for (auto const& line : section.lines_) {
            result += line + "\r\n";
         }
      }

      return result;
   }
};
}  // namespace tablet
