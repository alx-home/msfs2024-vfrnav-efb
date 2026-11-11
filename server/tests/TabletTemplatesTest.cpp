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

#include "../Tablet/Templates.h"

#include <iostream>
#include <stdexcept>

/** @brief Exercise template replacement without touching aircraft or simulator files. */
class TabletTemplatesTest {
public:
   /** @brief Check replacement fidelity, single-pass behavior, and explicit error reporting. */
   static void Run() {
      using tablet::Templates;

      Check(Templates::Replace("", {}).empty(), "Empty templates must remain empty");
      Check(Templates::Replace("plain\r\n", {}) == "plain\r\n", "Line endings must be preserved");
      Check(
        Templates::Replace("@VALUE@/@VALUE@", {{"VALUE", "text"}}) == "text/text",
        "Repeated markers must receive the same replacement"
      );
      Check(
        Templates::Replace("@FIRST@ @SECOND@", {{"FIRST", "@SECOND@"}, {"SECOND", "done"}})
          == "@SECOND@ done",
        "Replacement values must not be interpreted recursively"
      );
      Check(
        Templates::Replace("mail@example.com @lower@ @", {}) == "mail@example.com @lower@ @",
        "Ordinary at signs must be preserved"
      );
      Check(
        Templates::Replace("@EMPTY@", {{"EMPTY", ""}}).empty(),
        "Empty replacement values must be supported"
      );
      Check(!Templates::Load("rig/model.xml").empty(), "Known embedded templates must be readable");

      Reject([] { Templates::Replace("@MISSING@", {}); });
      Reject([] { Templates::Replace("no marker", {{"UNUSED", "value"}}); });
      Reject([] { Templates::Replace("@VALUE@", {{"VALUE", "one"}, {"VALUE", "two"}}); });
      Reject([] { Templates::Replace("@VALUE@", {{"value", "invalid"}}); });
      Reject([] { Templates::Load("missing/template"); });
   }

private:
   /** @brief Fail the test with an actionable diagnostic when a condition is false. */
   static void Check(bool condition, char const* message) {
      if (!condition) {
         throw std::runtime_error(message);
      }
   }

   /** @brief Require an invalid template operation to report its input error. */
   template <class ACTION>
   static void Reject(ACTION action) {
      try {
         action();
      } catch (std::invalid_argument const&) {
         return;
      }

      throw std::runtime_error("Invalid template operation did not throw");
   }
};

/** @brief Run the template regression tests and return their process result. */
int
main() {
   try {
      TabletTemplatesTest::Run();
      std::cout << "Template fidelity, single-pass substitution, and input errors passed.\n";
      return 0;
   } catch (std::exception const& error) {
      std::cerr << error.what() << '\n';
      return 1;
   }
}
