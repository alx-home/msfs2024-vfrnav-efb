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

#include <promise/promise.h>
#include <promise/Mutex.h>
#include <promise/Pool.h>

#include <filesystem>
#include <functional>
#include <string>
#include <vector>
#include <json/json.h>

namespace tablet {
/** @brief Per-source state and diagnostic emitted by a fleet operation. */
struct Entry {
   std::string source_{};
   std::string state_{};
   std::string message_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"source", &Entry::source_},
     js::_{"state", &Entry::state_},
     js::_{"message", &Entry::message_}
   };
};

/** @brief Aircraft container metadata, ownership status, and patch diagnostics. */
struct Aircraft {
   std::string              id_{};
   std::string              name_{};
   std::string              container_{};
   std::string              status_{};
   std::string              efb_{};
   std::string              reason_{};
   std::size_t              preset_count_{};
   std::vector<std::string> preset_names_{};
   std::vector<std::string> warnings_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"id", &Aircraft::id_},
     js::_{"name", &Aircraft::name_},
     js::_{"container", &Aircraft::container_},
     js::_{"status", &Aircraft::status_},
     js::_{"efb", &Aircraft::efb_},
     js::_{"reason", &Aircraft::reason_},
     js::_{"presetCount", &Aircraft::preset_count_},
     js::_{"presetNames", &Aircraft::preset_names_},
     js::_{"warnings", &Aircraft::warnings_},
   };
};

/** @brief Aggregate results serialized for the aircraft management interface. */
struct Report {
   std::string mode_{};
   std::string action_{};
   std::string community_{};

   bool restart_required_{};

   std::size_t           available_{};
   std::size_t           patched_{};
   std::size_t           outdated_{};
   std::size_t           unsupported_{};
   std::size_t           foreign_{};
   std::size_t           generated_{};
   std::size_t           removed_{};
   std::vector<Aircraft> aircraft_{};
   std::vector<Entry>    entries_{};

   static constexpr js::Proto PROTOTYPE{
     js::_{"mode", &Report::mode_},
     js::_{"action", &Report::action_},
     js::_{"community", &Report::community_},
     js::_{"restartRequired", &Report::restart_required_},
     js::_{"aircraft", &Report::aircraft_},
     js::_{"entries", &Report::entries_},
     js::_{"available", &Report::available_},
     js::_{"patched", &Report::patched_},
     js::_{"outdated", &Report::outdated_},
     js::_{"unsupported", &Report::unsupported_},
     js::_{"foreign", &Report::foreign_},
     js::_{"generated", &Report::generated_},
     js::_{"removed", &Report::removed_},
   };
};

/** @brief Fleet inputs and output location; optional containers restrict discovery. */
struct Paths {
   std::filesystem::path    community_{};
   std::filesystem::path    projection_{};
   std::filesystem::path    output_{};
   std::vector<std::string> containers_{};
};

/** @brief Discover aircraft and coordinate managed overlay installation and removal. */
class Fleet {
public:
   /** @brief Awaitable hop moving the current coroutine onto a pool worker thread. */
   using Dispatch = std::function<WPromise<void>()>;

   /** @brief Locate Community and VFS projection using FindMSFS and simulator configuration.
    *
    * @return Discovered fleet paths. */
   static Paths FindPaths();

   /** @brief Scan, install, inventory, or remove verified aircraft packages, processing every
    * aircraft in parallel on the pool workers.
    *
    * @tparam SIZE Number of pool workers.
    *
    * @param pool Worker pool used for aircraft processing.
    * @param paths Source and output locations.
    * @param mode Discovery mode.
    * @param action Fleet operation to perform.
    * @param selection Aircraft IDs selected for the operation.
    *
    * @return Awaitable fleet report. */
   template <std::size_t SIZE>
   static WPromise<Report> Manage(
     promise::Pool<SIZE> const&      pool,
     Paths const&                    paths,
     std::string const&              mode,
     std::string const&              action,
     std::vector<std::string> const& selection = {}
   ) {
      return Manage(
        Dispatch{[&pool]() { return pool.Dispatch(); }}, paths, mode, action, selection
      );
   }

   /** @brief Execute a fleet operation using configured paths and JSON-selected aircraft ids,
    * processing every aircraft in parallel on the pool workers.
    *
    * @tparam SIZE Number of pool workers.
    *
    * @param pool Worker pool used for aircraft processing.
    * @param mode Discovery mode.
    * @param action Fleet operation to perform.
    * @param selectionJson JSON array of selected aircraft IDs.
    *
    * @return Awaitable serialized fleet report. */
   template <std::size_t SIZE>
   static WPromise<std::string> Manage(
     promise::Pool<SIZE> const& pool,
     std::string const&         mode,
     std::string const&         action,
     std::string const&         selectionJson = "[]"
   ) {
      return Manage(Dispatch{[&pool]() { return pool.Dispatch(); }}, mode, action, selectionJson);
   }

   /** @brief Scan, install, inventory, or remove verified aircraft packages, dispatching each
    * aircraft's processing through the supplied worker hop.
    *
    * @param dispatch Awaitable worker-thread dispatch function.
    * @param paths Source and output locations.
    * @param mode Discovery mode.
    * @param action Fleet operation to perform.
    * @param selection Aircraft IDs selected for the operation.
    *
    * @return Awaitable fleet report. */
   static WPromise<Report> Manage(
     Dispatch                        dispatch,
     Paths const&                    paths,
     std::string const&              mode,
     std::string const&              action,
     std::vector<std::string> const& selection = {}
   );

   /** @brief Execute a fleet operation using configured paths and JSON-selected aircraft ids.
    *
    * @param dispatch Awaitable worker-thread dispatch function.
    * @param mode Discovery mode.
    * @param action Fleet operation to perform.
    * @param selectionJson JSON array of selected aircraft IDs.
    *
    * @return Awaitable serialized fleet report. */
   static WPromise<std::string> Manage(
     Dispatch           dispatch,
     std::string const& mode,
     std::string const& action,
     std::string const& selectionJson = "[]"
   );

private:
   /** @brief Coroutine owning the managed operation; parameters are copied into its frame.
    *
    * @param dispatch Awaitable worker-thread dispatch function.
    * @param paths Source and output locations.
    * @param mode Discovery mode.
    * @param action Fleet operation to perform.
    * @param selection Aircraft IDs selected for the operation.
    *
    * @return Promise for the fleet report. */
   static Promise<Report> ManageTask(
     Dispatch                 dispatch,
     Paths                    paths,
     std::string              mode,
     std::string              action,
     std::vector<std::string> selection
   );

   /** @brief Coroutine decoding the JSON selection before running the managed operation.
    *
    * @param dispatch Awaitable worker-thread dispatch function.
    * @param mode Discovery mode.
    * @param action Fleet operation to perform.
    * @param selectionJson JSON array of selected aircraft IDs.
    *
    * @return Promise for the serialized fleet report. */
   static Promise<std::string> ManageJsonTask(
     Dispatch    dispatch,
     std::string mode,
     std::string action,
     std::string selectionJson
   );

   static promise::Mutex management_mutex_;
};
}  // namespace tablet
