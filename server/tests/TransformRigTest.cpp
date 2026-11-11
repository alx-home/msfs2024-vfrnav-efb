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

#include "../Tablet/TransformRig.h"

#include <boost/json.hpp>
#ifdef TABLET_RIG_TEST_HEADER_ONLY_JSON
#   include <boost/json/src.hpp>
#endif
#include <algorithm>
#include <array>
#include <chrono>
#include <cmath>
#include <cstdint>
#include <cstring>
#include <fstream>
#include <iostream>
#include <map>
#include <limits>
#include <regex>
#include <set>
#include <sstream>
#include <stdexcept>
#include <vector>

namespace fs = std::filesystem;
namespace j  = boost::json;
/** Validates generated model structure and authored simulator behaviors. */
class TransformRigTest {
private:
   inline static unsigned checks{0};
   /** Counts and enforces a rig invariant. */
   static void Require(bool condition, char const* message) {
      ++checks;
      if (!condition) {
         throw std::runtime_error(message);
      }
   }
   /** Reads a generated asset without newline translation. */
   static std::string Read(fs::path const& path) {
      std::ifstream in{path, std::ios::binary};
      if (!in) {
         throw std::runtime_error("Missing test output: " + path.string());
      }
      return {std::istreambuf_iterator<char>{in}, std::istreambuf_iterator<char>{}};
   }
   /** Converts a glTF JSON index to the platform's size type. */
   static std::size_t Number(j::value const& value) { return value.to_number<std::size_t>(); }
   static void VisibilityUpdate(std::string const& code, std::map<std::string, double>& vars) {
      std::vector<double> stack{};
      std::vector<bool>   branches{};
      std::regex          tokens{R"(\([^)]*\)|\S+)"};
      auto                pop = [&]() {
         Require(!stack.empty(), "Visibility RPN stack underflow");
         auto value{stack.back()};
         stack.pop_back();
         return value;
      };
      for (std::sregex_iterator it{code.begin(), code.end(), tokens}, end{}; it != end; ++it) {
         auto token{it->str()};
         bool active{std::all_of(branches.begin(), branches.end(), [](bool b) { return b; })};
         if (token == "if{") {
            branches.push_back(active && pop() != 0);
         } else if (token == "}") {
            Require(!branches.empty(), "Unmatched visibility branch");
            branches.pop_back();
         } else if (!active) {
            continue;
         } else if (token.starts_with("(&gt;")) {
            vars[token.substr(5, token.size() - 6)] = pop();
         } else if (token.starts_with("(")) {
            stack.push_back(vars[token.substr(1, token.size() - 2)]);
         } else if (token == "!") {
            stack.push_back(pop() == 0 ? 1 : 0);
         } else if (token == "==" || token == "!=" || token == "and" || token == "+") {
            auto right{pop()};
            auto left{pop()};
            stack.push_back(
              token == "=="    ? left == right
              : token == "!="  ? left != right
              : token == "and" ? left != 0 && right != 0
                               : left + right
            );
         } else {
            stack.push_back(std::stod(token));
         }
      }
      Require(stack.empty() && branches.empty(), "Visibility RPN stack imbalance");
   }
   /** Evaluates the scalar drag-expression subset used by the rig. */
   static double Evaluate(
     std::string code,
     double      start,
     double      mouse,
     double      mouseAnchor = 0,
     bool        fast        = false
   ) {
      code = std::regex_replace(
        code, std::regex(R"(\(O:VFRNAV_MOUSE_START\))"), std::to_string(mouseAnchor)
      );
      code = std::regex_replace(code, std::regex(R"(\(O:VFRNAV_DRAG_SHIFT\))"), fast ? "1" : "0");
      code =
        std::regex_replace(code, std::regex(R"(\(O:VFRNAV_DRAG_START\))"), std::to_string(start));
      code = std::regex_replace(code, std::regex(R"(\(M:Relative[XY]\))"), std::to_string(mouse));
      code = std::regex_replace(
        code, std::regex(R"(\(L:VFRNAV_EFB_[A-Z]+, Number\))"), std::to_string(start)
      );
      std::istringstream  input{code};
      std::vector<double> stack{};
      for (std::string token{}; input >> token;) {
         if (
           token == "+" || token == "-" || token == "*" || token == "/" || token == "min"
           || token == "max"
         ) {
            Require(stack.size() >= 2, "RPN stack underflow");
            auto right{stack.back()};
            stack.pop_back();
            auto left{stack.back()};
            stack.pop_back();
            stack.push_back(
              token == "+"     ? left + right
              : token == "-"   ? left - right
              : token == "*"   ? left * right
              : token == "/"   ? left / right
              : token == "min" ? std::min(left, right)
                               : std::max(left, right)
            );
         } else {
            stack.push_back(std::stod(token));
         }
      }
      Require(stack.size() == 1, "RPN stack imbalance");
      return stack.back();
   }

   /** Evaluates press-anchored local move expressions for a captured orientation. */
   static std::array<double, 3> Move(
     std::string const&    code,
     double                mouse,
     double                heading,
     double                pitch,
     double                bank,
     double                mouseAnchor = 0,
     bool                  fast        = false,
     std::array<double, 3> anchor      = {0, .35, 1.2}
   ) {
      std::map<std::string, double> vars{
        {"(M:RelativeX)", mouse},
        {"(M:RelativeY)", mouse},
        {"(O:VFRNAV_MOUSE_START)", mouseAnchor},
        {"(O:VFRNAV_DRAG_SHIFT)", fast ? 1. : 0.},
        {"(O:VFRNAV_START_X)", anchor[0]},
        {"(O:VFRNAV_START_Y)", anchor[1]},
        {"(O:VFRNAV_START_Z)", anchor[2]},
        {"(O:VFRNAV_START_HEADING)", heading},
        {"(O:VFRNAV_START_PITCH)", pitch},
        {"(O:VFRNAV_START_BANK)", bank}
      };
      auto regs{Transform(code, vars)};
      return {regs[1], regs[2], regs[3]};
   }

   static std::array<double, 50>
   Transform(std::string const& code, std::map<std::string, double> const& vars) {
      std::array<double, 50> regs{};
      std::vector<double>    stack{};
      std::vector<bool>      branches{};
      bool                   closed_branch{false};
      std::regex             tokens{R"(\([^)]*\)|\S+)"};
      for (std::sregex_iterator it{code.begin(), code.end(), tokens}, end{}; it != end; ++it) {
         auto t{it->str()};
         bool active{std::all_of(branches.begin(), branches.end(), [](bool b) { return b; })};
         if (t == "if{") {
            bool condition{false};
            if (active) {
               Require(!stack.empty(), "Transform branch stack underflow");
               condition = stack.back() != 0;
               stack.pop_back();
            }
            branches.push_back(condition);
         } else if (t == "}") {
            Require(!branches.empty(), "Unmatched transform branch");
            closed_branch = branches.back();
            branches.pop_back();
         } else if (t == "els{") {
            branches.push_back(!closed_branch);
         } else if (!active) {
            continue;
         } else if (vars.contains(t)) {
            stack.push_back(vars.at(t));
         } else if (t.starts_with("sp")) {
            regs[std::stoi(t.substr(2))] = stack.back();
            stack.pop_back();
         } else if (t.starts_with("l")) {
            stack.push_back(regs[std::stoi(t.substr(1))]);
         } else if (t == "dgrd") {
            stack.back() *= std::acos(-1.) / 180;
         } else if (t == "sin") {
            stack.back() = std::sin(stack.back());
         } else if (t == "cos") {
            stack.back() = std::cos(stack.back());
         } else if (t == "asin") {
            stack.back() = std::asin(stack.back());
         } else if (t == "sqrt") {
            stack.back() = std::sqrt(stack.back());
         } else if (t == "abs") {
            stack.back() = std::abs(stack.back());
         } else if (t == "rddg") {
            stack.back() *= 180 / std::acos(-1.);
         } else if (
           t == "+" || t == "-" || t == "*" || t == "min" || t == "max" || t == "atg2"
           || t == "&lt;" || t == "&gt;" || t == "=="
         ) {
            Require(stack.size() >= 2, "Local move RPN stack underflow");
            auto b{stack.back()};
            stack.pop_back();
            auto a{stack.back()};
            stack.pop_back();
            stack.push_back(
              t == "+"      ? a + b
              : t == "-"    ? a - b
              : t == "*"    ? a * b
              : t == "min"  ? std::min(a, b)
              : t == "max"  ? std::max(a, b)
              : t == "atg2" ? std::atan2(a, b)
              : t == "=="   ? a == b
              : t == "&gt;" ? a > b
                            : a < b
            );
         } else {
            stack.push_back(std::stod(t));
         }
      }
      Require(stack.empty() && branches.empty(), "Transform math leaks stack");
      return regs;
   }

   using Matrix = std::array<std::array<double, 3>, 3>;
   static Matrix Orientation(std::array<double, 3> angles) {
      for (auto& angle : angles) {
         angle *= std::acos(-1.) / 180;
      }
      auto h{angles[0]}, p{angles[1]}, b{angles[2]};
      return {
        {{std::cos(h) * std::cos(b) + std::sin(h) * std::sin(p) * std::sin(b),
          -std::cos(h) * std::sin(b) + std::sin(h) * std::sin(p) * std::cos(b),
          std::sin(h) * std::cos(p)},
         {std::cos(p) * std::sin(b), std::cos(p) * std::cos(b), -std::sin(p)},
         {-std::sin(h) * std::cos(b) + std::cos(h) * std::sin(p) * std::sin(b),
          std::sin(h) * std::sin(b) + std::cos(h) * std::sin(p) * std::cos(b),
          std::cos(h) * std::cos(p)}}
      };
   }
   static void TestRotation(std::string const& callback, int axis) {
      auto begin{callback.find(
        "(M:Relative" + std::string{axis == 0 ? "Y" : "X"} + ") (O:VFRNAV_MOUSE_START) -"
      )};
      auto end{callback.find(" l30 (L:VFRNAV_EFB_PITCH", begin)};
      Require(
        begin != std::string::npos && end != std::string::npos, "Missing local rotation math"
      );
      auto math{callback.substr(begin, end - begin)};
      for (auto key : {"HEADING", "PITCH", "BANK"}) {
         Require(
           callback.find(
             "(L:VFRNAV_EFB_" + std::string{key} + ", Number) (&gt;O:VFRNAV_START_" + key + ")"
           ) != std::string::npos,
           "Every rotation must capture the full tablet orientation"
         );
      }
      for (auto angles : std::array<std::array<double, 3>, 10>{
             {{0, 0, 0},
              {0, 55, 0},
              {37, -24, 63},
              {140, 90, 17},
              {-60, -90, -100},
              {0, 180, 0},
              {179, 89.999, 179},
              {-179, -89.999, -179},
              {79, 89.9999999, 59},
              {37, -90.0000001, -120}}
           }) {
         for (double delta : {-179., -90., -18., 0., 18., 90., 179.}) {
            for (bool fast : {false, true}) {
               std::map<std::string, double> vars{
                 {"(M:RelativeX)", .1 + delta / 180},
                 {"(M:RelativeY)", .1 + delta / 180},
                 {"(O:VFRNAV_MOUSE_START)", .1},
                 {"(O:VFRNAV_DRAG_SHIFT)", fast ? 1. : 0.},
                 {"(O:VFRNAV_START_HEADING)", angles[0]},
                 {"(O:VFRNAV_START_PITCH)", angles[1]},
                 {"(O:VFRNAV_START_BANK)", angles[2]}
               };
               auto                  result{Transform(math, vars)};
               auto                  actual{Orientation({result[31], result[30], result[32]})};
               auto                  start{Orientation(angles)};
               std::array<double, 3> increment{};
               increment
                 [axis == 0   ? 1
                  : axis == 1 ? 2
                              : 0] = delta * (fast ? 4 : 1) * (axis == 1 ? -1 : 1);
               auto local{Orientation(increment)};
               for (int row{0}; row < 3; ++row) {
                  for (int col{0}; col < 3; ++col) {
                     double expected{};
                     for (int k{0}; k < 3; ++k) {
                        expected += start[row][k] * local[k][col];
                     }
                     Require(
                       std::abs(expected - actual[row][col]) < 1e-8,
                       "Rotation must compose around the current tablet-local axis"
                     );
                  }
               }
               Require(
                 result[30] >= -180 && result[30] <= 180 && result[31] >= -180 && result[31] <= 180
                   && result[32] >= -180 && result[32] <= 180,
                 "Rotation escaped animation bounds"
               );
               Require(Transform(math, vars) == result, "Stationary rotation drifts");
            }
         }
      }
   }

public:
   /** Runs the rig checks or emits a requested standalone source fixture. */
   static int Run(int argc, char** argv) {
      if (argc == 3) {
         try {
            tablet::TransformRig::Write(argv[2], "SimAttachments\\VFRNAV\\TransformRig", argv[1]);
            std::cout << "Procedural parent source written; SDK/native-child runtime verification "
                         "required.\n";
            return 0;
         } catch (std::exception const& error) {
            std::cerr << error.what() << '\n';
            return 1;
         }
      }
      auto root{
        fs::current_path() / "build"
        / ("rig-tests-" + std::to_string(std::chrono::steady_clock::now().time_since_epoch().count()))
      };
      try {
         // Intentionally nonexistent: stock source must not be required or read.
         tablet::TransformRig::Write(root, "SimAttachments\\VFRNAV\\Rig", "missing-stock.gltf");
         auto attachment{root / "SimAttachments" / "VFRNAV" / "Rig"};
         auto output{attachment / "model"};
         auto model{j::parse(Read(output / "rig.gltf")).as_object()};
         auto xml{Read(output / "model.xml")}, bytes{Read(output / "rig.bin")};
         auto scheduled_xml{xml};
         auto preset{Read(root / "UpdateFrequencyPresets" / "VFRNAV_Tablet.xml")};
         for (auto field :
              {"SizeOnScreenForMaxUpdateFrequency",
               "SizeOnScreenForMinUpdateFrequency",
               "SizeOnScreenToStopUpdate"}) {
            Require(
              preset.find("<" + std::string{field} + ">0</" + field + ">") != std::string::npos,
              "Tablet updates must not slow down or stop at any viewing angle"
            );
         }
         std::regex  components{R"(<Component\b[^>]*>)"};
         std::string update_preset{"UpdateFrequencyPreset=\"VFRNAV_Tablet_EveryFrame\""};
         for (std::sregex_iterator it{xml.begin(), xml.end(), components}, end{}; it != end; ++it) {
            Require(
              it->str().find(update_preset) != std::string::npos,
              "Every tablet component must use the per-frame update preset"
            );
         }
         xml = std::regex_replace(xml, std::regex(R"( UpdateFrequencyPreset="[^"]+")"), "");
         auto cfg{Read(attachment / "config" / "attached_objects.cfg")};
         auto edit_model{Read(root / "edit-model" / "model" / "model.xml")};
         Require(
           edit_model.find(
             R"(..\..\..\..\Instruments\Asobo_Tablet_Generic_8_3\model\TABLET_Generic_8_3_LOD00.gltf)"
           ) != std::string::npos
             && edit_model.find("Behaviors") == std::string::npos,
           "Edit model must reference installed native geometry without stock interactions"
         );
         Require(
           Read(root / "edit-model" / "texture" / "texture.cfg")
               .find(R"(fallback.1=..\..\..\..\Instruments\Asobo_Tablet_Generic_8_3\texture)")
             != std::string::npos,
           "Edit body textures must resolve from the installed stock attachment"
         );
         Require(
           cfg.find(R"(attachment_root="SimAttachments\VFRNAV\Rig\edit")") != std::string::npos
             && cfg.find("attach_to_node=\"VFRNAV_EDIT_INPUT_SHIELD\"") != std::string::npos,
           "Model-only edit attachment must use a separate panel-free root and edit mount"
         );
         auto actions{Read(attachment / "input" / "action.actiondb")};
         Require(
           actions
             == "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n"
                "<ActionDefinition><Contexts><Context ID=\"INPUT_EVENTS\"/>"
                "</Contexts><Actions Source=\"SimAttachments\\VFRNAV\\Rig\">"
                "<Action Name=\"VFRNAV_EFB_VISIBILITY_TOGGLE\">"
                "<Context>INPUT_EVENTS</Context><Type>DIGITAL</Type>"
                "<TT_Name>TT:VFRNAV.EFB.ACTION_NAME</TT_Name>"
                "<TT_Function>TT:VFRNAV.EFB.ACTION_FUNCTION</TT_Function>"
                "<TT_Category_Main>TT:VFRNAV.EFB.CATEGORY_MAIN</TT_Category_Main>"
                "<TT_Category_Sub>TT:VFRNAV.EFB.CATEGORY_SUB</TT_Category_Sub><TT_Tag/>"
                "</Action></Actions></ActionDefinition>\n",
           "Action database must use verified native schema and attachment-root Source"
         );
         auto        localization{j::parse(Read(attachment / "Localization" / "VFRNAV_EFB.loc"))};
         auto const& loc{localization.at("LocalisationFile")};
         Require(
           loc.at("Version").as_int64() == 2 && loc.at("Languages").as_array() == j::array{"en-US"},
           "Localization must follow SDK Version 2 English source schema"
         );
         auto const& strings{loc.at("Strings").as_object()};
         Require(strings.size() == 5, "Unexpected localization entries");
         std::regex token{R"(TT:([A-Z0-9_.]+))"};
         for (auto const& text : {actions, xml}) {
            for (std::sregex_iterator it{text.begin(), text.end(), token}, end{}; it != end; ++it) {
               auto key{(*it)[1].str()};
               Require(strings.contains(key), "Unresolved authored localization token");
               auto const& value{strings.at(key)};
               Require(
                 value.at("UUID").as_string().size() == 36
                   && value.at("Languages").at("en-US").at("LocalizationStatus") == "TranslationOk"
                   && !value.at("Languages").at("en-US").at("Text").as_string().empty(),
                 "Incomplete localized action label"
               );
            }
         }
         Require(
           strings.at("VFRNAV.EFB.CATEGORY_MAIN").at("Languages").at("en-US").at("Text")
               == "Cockpit Tablet"
             && strings.at("VFRNAV.EFB.CATEGORY_SUB").at("Languages").at("en-US").at("Text")
                  == "Visibility",
           "Action category display labels changed"
         );
         Require(
           xml.find("<Preset ID=\"" + std::string(tablet::RigInfo::TOGGLE_INPUT_EVENT) + "\">")
               != std::string::npos
             && actions.find(
                  "<Action Name=\"" + std::string(tablet::RigInfo::TOGGLE_INPUT_EVENT) + "\">"
                ) != std::string::npos,
           "Registered action and input preset names differ"
         );
         auto keyboard{Read(root / "aircraft-inputs" / "keyboard.xml")};
         Require(
           !fs::exists(attachment / "input" / "keyboard.xml"),
           "Keyboard profile must not enter unsupported SimAttachment input lister"
         );
         Require(
           !fs::exists(root / "InputProfiles"),
           "Aircraft-specific keyboard profile must not replace global profiles"
         );
         Require(
           keyboard
             == "<?xml version=\"1.0\" encoding=\"utf-8\"?>\n"
                "<DefaulftInput Primary=\"1\" PlatformAvailability=\"ALL\">"
                "<Version Num=\"19\"/>"
                "<Device DeviceName=\"Cockpit Tablet Keyboard\" "
                "GUID=\"884b96c3-56ef-11d1-bc8c-00a0c91405dd\" ProductID=\"884B\" "
                "CompositeID=\"0\" HWVer=\"1.0.0.0\">"
                "<Context ContextName=\"INPUT_EVENTS\">"
                "<Action ActionName=\"VFRNAV_EFB_VISIBILITY_TOGGLE\" Flag=\"2\" ValueEvent=\"0\">"
                "<Primary><KEY Information=\"LControlKey\">162</KEY>"
                "<KEY Information=\"T\">84</KEY>"
                "</Primary></Action></Context></Device></DefaulftInput>\n",
           "Keyboard profile must match SDK schema and configurable Ctrl+T default"
         );
         Require(
           keyboard.find("ActionName=\"" + std::string(tablet::RigInfo::TOGGLE_INPUT_EVENT) + "\"")
               != std::string::npos
             && keyboard.find("8194") == std::string::npos,
           "Keyboard profile must target registered preset with press/release flag"
         );
         Require(
           !fs::exists(attachment / "attached_objects.cfg"),
           "Child config must be in SDK-required config folder, not root"
         );
         Require(
           Read(attachment / "attachment.cfg").find("INHERIT") == std::string::npos,
           "Parent inherits stock"
         );
         Require(!fs::exists(attachment / "panel"), "Parent duplicates native panel");
         Require(!fs::exists(output / "stock.behavior.xml"), "Copied stock behavior");
         Require(model.find("images") == model.end(), "Parent contains stock textures");
         Require(
           cfg.find(R"(attachment_root="SimAttachments\Instruments\Asobo_Tablet_Generic_8_3")")
             != std::string::npos,
           "Wrong native child root"
         );
         Require(
           cfg.find(R"(attachment_file="model\TABLET_Generic_8_3.xml")") != std::string::npos,
           "Wrong native child model"
         );
         Require(
           cfg.find("attach_to_node=\"VFRNAV_NATIVE_TABLET_MOUNT\"") != std::string::npos,
           "Wrong child mount"
         );
         Require(
           cfg.find("attach_to_model=\"interior\"") != std::string::npos
             && cfg.find("attach_to_model_minsize=1") != std::string::npos,
           "Wrong documented child model settings"
         );
         Require(
           cfg.find("alias=\"VFRNAV_EFB_NATIVE_CHILD\"") != std::string::npos, "Missing child alias"
         );
         Require(cfg.find("attach_to=") == std::string::npos, "Invented alias parenting");
         Require(
           xml.find("<CompileBehaviors version=\"2\">") != std::string::npos
             && xml.find("<CompileBehaviors", xml.find("<CompileBehaviors") + 1)
                  == std::string::npos,
           "Expected single source tree"
         );
         Require(
           xml.find("<Behaviors") == std::string::npos
             && xml.find("<IncludeBase") == std::string::npos,
           "Mixed stock/source trees"
         );
         Require(
           xml.find("XMLVAR_3D_EFB_TABLET_Hidden") == std::string::npos,
           "Rig must not override the separate stock tablet-availability control"
         );
         Require(
           xml.find("outside-click hiding") != std::string::npos,
           "Stock visibility limitation undisclosed"
         );
         Require(
           xml.find(
             R"(ID="VFRNAV_PARENT_VISIBILITY" Node="VFRNAV_X"><Visibility><Parameter><Code>(L:VFRNAV_EFB_HIDDEN, Number) !</Code>)"
           ) != std::string::npos,
           "Global hidden must gate the ancestor of stock child and gizmos"
         );
         Require(
           xml.find(
             "(L:VFRNAV_EFB_TOGGLE_REQUEST, Number) 0 != if{ (L:VFRNAV_EFB_HIDDEN, Number) ! "
             "(&gt;L:VFRNAV_EFB_HIDDEN, Number) 0 (&gt;L:VFRNAV_EFB_TOGGLE_REQUEST, Number)"
           ) != std::string::npos,
           "Toggle request must atomically flip hidden and clear request"
         );
         Require(
           xml.find("(L:VFRNAV_EFB_HIDDEN, Number) if{ 0 (&gt;L:VFRNAV_EFB_MODE, Number)")
             != std::string::npos,
           "Hiding must reset mode and invalidate drag anchors"
         );
         {
            auto begin{xml.find(
              "<Update Frequency=\"60\" InteractionModel=\"All\">",
              xml.find("ID=\"VFRNAV_VISIBILITY_SYNC\"")
            )};
            Require(begin != std::string::npos, "Visibility synchronization must run at 60Hz");
            begin = xml.find('>', begin) + 1;
            auto code{xml.substr(begin, xml.find("</Update>", begin) - begin)};
            Require(
              code.find("MODE, Number) 0 &gt;") == std::string::npos,
              "Editing must not hide the stock bracket"
            );
            for (double initial : {0., 1.}) {
               std::map<std::string, double> vars{
                 {"L:VFRNAV_EFB_HIDDEN, Number", initial}, {"L:1:XMLVAR_3D_EFB_Hidden", initial}
               };
               VisibilityUpdate(code, vars);
               for (unsigned action{0}; action < 16; ++action) {
                  bool mount{action % 2 == 0};
                  auto expected{1 - vars["L:VFRNAV_EFB_HIDDEN, Number"]};
                  vars["L:VFRNAV_EFB_MODE, Number"] = 2;
                  if (mount) {
                     vars["L:1:XMLVAR_3D_EFB_Hidden"] = expected;
                  } else {
                     vars["L:VFRNAV_EFB_TOGGLE_REQUEST, Number"] = 1;
                     // A simultaneous stock click must not cancel an explicit toggle.
                     vars["L:1:XMLVAR_3D_EFB_Hidden"] = expected;
                  }
                  for (unsigned frame{0}; frame < 60; ++frame) {
                     VisibilityUpdate(code, vars);
                     Require(
                       vars["L:VFRNAV_EFB_HIDDEN, Number"] == expected
                         && vars["L:1:XMLVAR_3D_EFB_Hidden"] == expected,
                       "Stock mount and VFRNav visibility must settle without flicker"
                     );
                     Require(
                       vars["L:VFRNAV_EFB_TOGGLE_REQUEST, Number"] == 0,
                       "Visibility request must be acknowledged"
                     );
                  }
                  Require(
                    vars["L:VFRNAV_EFB_MODE, Number"] == (expected ? 0 : 2),
                    "Only hiding should leave edit mode"
                  );
               }
            }
         }
         Require(
           xml.find("<Preset ID=\"VFRNAV_EFB_VISIBILITY_TOGGLE\">") != std::string::npos
             && xml.find("<UseInputEvent ID=\"VFRNAV_EFB_INPUTS\"/>") != std::string::npos,
           "Visibility input preset must be instantiated"
         );
         Require(
           xml.find(
             "<Binding "
             "Alias=\"VFRNAV_EFB_VISIBILITY_TOGGLE\"><Action><Type>DIGITAL</"
             "Type><TT_Name>TT:VFRNAV.EFB.PRESET_NAME</"
             "TT_Name><TT_Description>TT:VFRNAV.EFB.ACTION_NAME</TT_Description></Action>"
           ) != std::string::npos,
           "Missing configurable digital input action metadata"
         );
         Require(
           xml.find(
             "p0 0 != (O:VFRNAV_TOGGLE_HELD) ! and if{ 1 (&gt;L:VFRNAV_EFB_TOGGLE_REQUEST, Number) "
             "} "
             "p0 0 != (&gt;O:VFRNAV_TOGGLE_HELD)"
           ) != std::string::npos,
           "Keyboard action must enqueue only on rising edge"
         );
         Require(
           xml.find(
             "<Set><Code>(L:VFRNAV_EFB_INPUT_CALLS, Number) 1 + "
             "(&gt;L:VFRNAV_EFB_INPUT_CALLS, Number) p0 (&gt;L:VFRNAV_EFB_INPUT_VALUE, Number) "
             "p0 -1 == if{ 1 (&gt;L:VFRNAV_EFB_TOGGLE_REQUEST, Number) } els{ "
             "p0 0 != (O:VFRNAV_TOGGLE_HELD) ! and if{ "
           ) != std::string::npos,
           "Input diagnostics must capture every Set call and payload before the latch gate"
         );
         auto trigger_begin{xml.find("<Preset ID=\"VFRNAV_EFB_VISIBILITY_TOGGLE\">")};
         auto trigger{
           xml.substr(trigger_begin, xml.find("</Preset>", trigger_begin) - trigger_begin)
         };
         auto trigger_code_begin{trigger.find("<Set><Code>") + 11};
         auto set_code{trigger.substr(
           trigger_code_begin, trigger.find("</Code>", trigger_code_begin) - trigger_code_begin
         )};
         auto sentinel_branch{set_code.find("p0 -1 == if{ ")};
         auto branch_begin{sentinel_branch + 13};
         auto branch_end{set_code.find(" } els{ ", branch_begin)};
         auto trigger_code{
           set_code.substr(0, sentinel_branch)
           + set_code.substr(branch_begin, branch_end - branch_begin)
         };
         Require(
           trigger.find("<Binding Alias=\"VFRNAV_EFB_VISIBILITY_TOGGLE\">") != std::string::npos
             && trigger.find("<Parameters><Param>-1</Param></Parameters>") != std::string::npos
             && trigger_code.find("TOGGLE_HELD") == std::string::npos,
           "Stable alias must map any payload to an ungated constant sentinel"
         );
         std::map<std::string, double> trigger_vars{};
         std::regex                    rpn_token{R"(\([^)]*\)|\S+)"};
         bool                          hidden{false};
         for (int press{1}; press <= 8; ++press) {
            std::vector<double> stack{};
            for (std::sregex_iterator it{trigger_code.begin(), trigger_code.end(), rpn_token},
                 end{};
                 it != end;
                 ++it) {
               auto trigger_token{it->str()};
               if (trigger_token == "p0") {
                  stack.push_back(-1);
               } else if (trigger_token == "+") {
                  Require(stack.size() >= 2, "Trigger add stack underflow");
                  auto right{stack.back()};
                  stack.pop_back();
                  stack.back() += right;
               } else if (trigger_token.starts_with("(&gt;L:")) {
                  Require(!stack.empty(), "Trigger write stack underflow");
                  trigger_vars[trigger_token.substr(7, trigger_token.size() - 8)] = stack.back();
                  stack.pop_back();
               } else if (trigger_token.starts_with("(L:")) {
                  stack.push_back(trigger_vars[trigger_token.substr(3, trigger_token.size() - 4)]);
               } else {
                  stack.push_back(std::stod(trigger_token));
               }
            }
            Require(
              stack.empty() && trigger_vars["VFRNAV_EFB_INPUT_CALLS, Number"] == press
                && trigger_vars["VFRNAV_EFB_INPUT_VALUE, Number"] == -1
                && trigger_vars["VFRNAV_EFB_TOGGLE_REQUEST, Number"] == 1,
              "Every zero-valued trigger must capture diagnostics and enqueue exactly one request"
            );
            hidden                                            = !hidden;
            trigger_vars["VFRNAV_EFB_TOGGLE_REQUEST, Number"] = 0;
            Require(
              hidden == (press % 2 != 0), "Zero trigger sequence failed alternating toggle contract"
            );
         }
         auto init_begin{xml.find("<Component ID=\"VFRNAV_INITIALIZE\">")};
         auto init_end{xml.find("</Component>", init_begin)};
         auto init_code{xml.substr(init_begin, init_end - init_begin)};
         for (auto const& key : {"X", "Y", "Z", "PITCH", "BANK", "HEADING", "WIDTH", "HEIGHT"}) {
            std::string name{key};
            bool        position{name == "X" || name == "Y" || name == "Z"},
              size{name == "WIDTH" || name == "HEIGHT"};
            auto low{
              size       ? "0.25"
              : position ? "-20"
                         : "-180"
            },
              high{
                size       ? "3"
                : position ? "20"
                           : "180"
              };
            auto fallback{size ? "1" : name == "Y" ? "0.35" : name == "Z" ? "1.2" : "0"};
            Require(
              init_code.find(
                "(L:VFRNAV_EFB_" + name + ", Number) " + low + " &gt;= (L:VFRNAV_EFB_" + name
                + ", Number) " + high + " &lt;= and ! if{ " + fallback + " (&gt;L:VFRNAV_EFB_"
                + name + ", Number)"
              ) != std::string::npos,
              "Invalid pose must recover to documented per-field default"
            );
            auto minimum{std::stod(low)}, maximum{std::stod(high)};
            for (double v : {minimum, (minimum + maximum) / 2, maximum}) {
               Require(v >= minimum && v <= maximum, "Valid boundary pose must be preserved");
            }
            for (double v :
                 {std::numeric_limits<double>::quiet_NaN(),
                  std::numeric_limits<double>::infinity(),
                  -std::numeric_limits<double>::infinity(),
                  minimum - 1,
                  maximum + 1}) {
               Require(
                 !(v >= minimum && v <= maximum),
                 "Nonfinite/out-of-range pose must trigger recovery"
               );
            }
         }
         Require(
           init_code.find(
             "(L:VFRNAV_EFB_RESET_POSE_REQUEST, Number) 0 != if{ 0 "
             "(&gt;L:VFRNAV_EFB_RESET_POSE_REQUEST, Number)"
           ) != std::string::npos
             && init_code.find("(&gt;L:VFRNAV_EFB_POSE_RECOVERIES, Number)") != std::string::npos,
           "Explicit reset request must be consumed and recovery observable"
         );
         Require(
           init_code.find(
             "0 (&gt;L:VFRNAV_EFB_INPUT_CALLS, Number) "
             "0 (&gt;L:VFRNAV_EFB_INPUT_VALUE, Number) 1 (&gt;L:VFRNAV_EFB_READY, Number) }"
           ) != std::string::npos
             && init_code.find("(L:VFRNAV_EFB_READY, Number) 0 == if{") != std::string::npos,
           "Input diagnostics must initialize only inside the READY gate"
         );
         auto const& nodes{model.at("nodes").as_array()};
         Require(
           tablet::RigInfo::SCREEN_CENTER_X == (-.060125693678855896 + .059906091541051865) / 2
             && tablet::RigInfo::SCREEN_CENTER_Y == (-.08903692662715912 + .08903694152832031) / 2
             && tablet::RigInfo::SCREEN_SURFACE_Z
                  == (-.006342912558466196 - .0063429116271436214) / 2,
           "Measured stock SCREEN bounds midpoint changed"
         );
         auto const& views{model.at("bufferViews").as_array()};
         auto const& access{model.at("accessors").as_array()};
         Require(
           model.at("buffers").as_array().size() == 1
             && Number(model.at("buffers").as_array()[0].at("byteLength")) == bytes.size(),
           "Single buffer contract broken"
         );
         std::set<std::string> names{};
         std::vector<unsigned> parents{};
         parents.resize(nodes.size(), 0);
         for (auto const& value : nodes) {
            auto const& node{value.as_object()};
            auto        name{std::string{node.at("name").as_string()}};
            Require(names.insert(name).second, "Duplicate node");
            Require(
              name != "TABLET" && name != "SCREEN" && name != "FRAME", "Stock geometry cloned"
            );
            if (auto children{node.if_contains("children")}) {
               for (auto const& child : children->as_array()) {
                  auto index{Number(child)};
                  Require(index < nodes.size(), "Invalid child");
                  Require(++parents[index] == 1, "Multiple parents");
               }
            }
         }
         auto cursor{Number(model.at("scenes").as_array()[0].at("nodes").as_array()[0])};
         for (auto name :
              {"VFRNAV_X",
               "VFRNAV_Y",
               "VFRNAV_Z",
               "VFRNAV_HEADING",
               "VFRNAV_PITCH",
               "VFRNAV_BANK",
               "VFRNAV_SCALE",
               "TABLET_MOUNT"}) {
            Require(nodes[cursor].at("name") == name, "Wrong transform chain");
            if (std::string(name) != "TABLET_MOUNT") {
               cursor = Number(nodes[cursor].at("children").as_array()[0]);
            }
         }
         auto mount{cursor};
         Require(
           xml.find("VISIBLE_NATIVE_TABLET") == std::string::npos,
           "Do not rely on parent-node visibility to hide a nested attachment"
         );
         bool native_mounted{false};
         for (auto const& child : nodes[mount].at("children").as_array()) {
            native_mounted |= nodes[Number(child)].at("name") == "VFRNAV_NATIVE_TABLET_MOUNT";
         }
         Require(native_mounted, "Native visibility mount must inherit the tablet pose and scale");
         for (auto const& view : views) {
            Require(Number(view.at("buffer")) == 0, "Invalid buffer index");
            auto offset{Number(view.at("byteOffset"))}, size{Number(view.at("byteLength"))};
            Require(
              offset % 4 == 0 && offset + size <= bytes.size(), "Invalid buffer extent/alignment"
            );
         }
         auto floats{[&](std::size_t index) {
            auto const& a{access[index]};
            auto const& view{views[Number(a.at("bufferView"))]};
            unsigned    width{a.at("type") == "VEC4" ? 4u : a.at("type") == "VEC3" ? 3u : 1u};
            auto        count{Number(a.at("count")) * width}, offset{Number(view.at("byteOffset"))};
            Require(
              a.at("componentType") == 5126 && count * 4 == Number(view.at("byteLength")),
              "Invalid accessor"
            );
            std::vector<float> result{};
            result.resize(count);
            for (std::size_t n{0}; n < count; ++n) {
               std::uint32_t bits{0};
               for (int c{0}; c < 4; ++c) {
                  bits |= static_cast<std::uint32_t>(
                            static_cast<unsigned char>(bytes[offset + n * 4 + c])
                          )
                          << (8 * c);
               }
               std::memcpy(&result[n], &bits, 4);
               Require(std::isfinite(result[n]), "Nonfinite sample");
            }
            if (auto low{a.as_object().if_contains("min")}) {
               auto const& high{a.at("max").as_array()};
               for (std::size_t n{0}; n < count; ++n) {
                  Require(
                    result[n] >= low->as_array()[n % width].to_number<double>()
                      && result[n] <= high[n % width].to_number<double>(),
                    "Wrong accessor bounds"
                  );
               }
            }
            return result;
         }};
         for (std::size_t n{0}; n < access.size(); ++n) {
            floats(n);
         }
         auto const& animations{model.at("animations").as_array()};
         Require(
           animations.size() == 9, "Expected pose animations and complementary tablet scales"
         );
         Require(
           xml.find("VFRNAV_ANIM_NATIVE_PARK") == std::string::npos,
           "Native tablet must hide through the stock control, not relocation"
         );
         for (auto const& animation : animations) {
            auto sampler{animation.at("samplers").as_array()[0]};
            auto times{floats(Number(sampler.at("input")))},
              values{floats(Number(sampler.at("output")))};
            auto target{animation.at("channels").as_array()[0].at("target")};
            Require(times.front() == 0 && times.back() == 100, "Wrong animation normalization");
            for (std::size_t n{1}; n < times.size(); ++n) {
               Require(times[n] > times[n - 1], "Unsorted keys");
            }
            if (target.at("path") == "rotation") {
               Require(times.size() == 9, "Missing intermediate rotation keys");
               for (std::size_t n{0}; n < values.size(); n += 4) {
                  double norm{0}, dot{0};
                  for (int c{0}; c < 4; ++c) {
                     norm += values[n + c] * values[n + c];
                     if (n) {
                        dot += values[n + c] * values[n - 4 + c];
                     }
                  }
                  Require(std::abs(norm - 1) < 1e-6, "Unnormalized quaternion");
                  if (n) {
                     Require(dot > .9, "Wrong shortest quaternion arc");
                  }
               }
            } else if (
              target.at("path") == "scale" && animation.at("name") == "VFRNAV_ANIM_SCALE"
            ) {
               Require(
                 values == std::vector<float>({.25f, .25f, .25f, 3, 3, 3}),
                 "Resize must be honestly uniform"
               );
            }
            auto name{std::string{animation.at("name").as_string()}};
            Require(
              scheduled_xml.find(
                "<Component ID=\"" + name + "\" UpdateFrequencyPreset=\"VFRNAV_Tablet_EveryFrame\">"
              ) != std::string::npos,
              "Every pose and tablet-swap animation must avoid default small-model throttling"
            );
            auto begin{xml.find("<Code>", xml.find("Name=\"" + name + "\"")) + 6};
            auto code{xml.substr(begin, xml.find("</Code>", begin) - begin)};
            if (name == "VFRNAV_ANIM_EDIT_TABLET" || name == "VFRNAV_ANIM_NATIVE_TABLET") {
               bool native{name == "VFRNAV_ANIM_NATIVE_TABLET"};
               Require(
                 nodes[Number(target.at("node"))].at("name")
                     == (native ? "VFRNAV_NATIVE_TABLET_MOUNT" : "VFRNAV_EDIT_INPUT_SHIELD")
                   && values
                        == (native ? std::vector<float>({1, 1, 1, 0, 0, 0}) : std::vector<float>({0, 0, 0, 1, 1, 1}))
                   && code
                        == "(L:VFRNAV_EFB_HIDDEN, Number) ! (L:VFRNAV_EFB_MODE, Number) 0 &gt; and "
                           "100 *",
                 "Native and edit tablets must have complementary scales without hiding the bracket"
               );
               continue;
            }
            double low{
              target.at("path") == "rotation" ? -180
              : target.at("path") == "scale"  ? .25
                                              : -20
            };
            double high{
              target.at("path") == "rotation" ? 180.
              : target.at("path") == "scale"  ? 3
                                              : 20
            };
            for (double v : {low - 1, low, (low + high) / 2, high, high + 1}) {
               Require(
                 std::abs(
                   Evaluate(code, v, 0) - (std::clamp(v, low, high) - low) * 100 / (high - low)
                 ) < 1e-8,
                 "Wrong animation RPN mapping"
               );
            }
         }
         Require(!names.contains("VFRNAV_MODE"), "Mode cube reintroduced");
         Require(
           names.contains("VFRNAV_EDIT_INPUT_SHIELD")
             && names.contains("VFRNAV_EDIT_INPUT_SURFACE"),
           "Missing edit-mode native-input guard"
         );
         Require(
           xml.find(
             "<Component ID=\"VISIBLE_EDIT_INPUT_SHIELD\" Node=\"VFRNAV_EDIT_INPUT_SHIELD\">"
             "<Visibility><Parameter><Code>(L:VFRNAV_EFB_HIDDEN, Number) ! "
             "(L:VFRNAV_EFB_MODE, Number) 0 &gt; and</Code></Parameter></Visibility></Component>"
           ) != std::string::npos,
           "Input guard must be absent in normal mode and when hidden"
         );
         unsigned                proxy_count{0};
         std::array<unsigned, 3> handle_counts{};
         std::string             cycle_mode{
           "(L:VFRNAV_EFB_HIDDEN, Number) ! (M:Event) 'RightSingle' scmi 0 == and if{ "
           "(L:VFRNAV_EFB_MODE, Number) 1 + 4 % (&gt;L:VFRNAV_EFB_MODE, Number) "
           "(L:VFRNAV_EFB_DRAG_CANCEL, Number) 1 + (&gt;L:VFRNAV_EFB_DRAG_CANCEL, Number) "
           "0 (&gt;O:VFRNAV_DRAG_ACTIVE) }"
         };
         auto check_cycle{[&](std::string const& callback) {
            for (auto const& instance : {"IMDefault", "IMDrag"}) {
               std::string opening{"<" + std::string{instance} + ">"};
               auto        start{callback.find(opening)};
               Require(
                 start != std::string::npos
                   && callback.compare(start + opening.size(), cycle_mode.size(), cycle_mode) == 0,
                 "Frame and handles must share hidden-guarded mode cycle and drag invalidation"
               );
            }
            auto first{callback.find(cycle_mode)};
            auto second{callback.find(cycle_mode, first + cycle_mode.size())};
            Require(
              second != std::string::npos
                && callback.find(cycle_mode, second + cycle_mode.size()) == std::string::npos,
              "Each input-model callback must contain exactly one mode cycle"
            );
         }};
         for (auto const& node : nodes) {
            auto name{std::string{node.at("name").as_string()}};
            if (name == "VFRNAV_EDIT_INPUT_SURFACE") {
               auto translation{node.at("translation").as_array()};
               auto depth{translation[2].to_number<double>()};
               Require(
                 depth < tablet::RigInfo::SCREEN_SURFACE_Z
                   && depth > tablet::RigInfo::SCREEN_SURFACE_Z
                                - tablet::RigInfo::GIZMO_SURFACE_CLEARANCE,
                 "Input proxy must sit in front of screen and behind handles"
               );
               auto        material{model.at("meshes")
                                      .as_array()[Number(node.at("mesh"))]
                                      .at("primitives")
                                      .as_array()[0]
                                      .at("material")};
               auto const& body_material{
                 model.at("materials").as_array()[Number(material)].as_object()
               };
               Require(
                 body_material.at("extensions").at("ASOBO_material_invisible").at("enabled")
                   == true,
                 "Proxy must not substitute procedural geometry for the stock tablet"
               );
               auto        position{model.at("meshes")
                                      .as_array()[Number(node.at("mesh"))]
                                      .at("primitives")
                                      .as_array()[0]
                                      .at("attributes")
                                      .at("POSITION")};
               auto const& bounds{access[Number(position)]};
               Require(
                 std::abs(bounds.at("max").as_array()[0].to_number<double>() - .062) < 1e-8
                   && std::abs(bounds.at("max").as_array()[1].to_number<double>() - .09) < 1e-8,
                 "Proxy must cover the screen"
               );
               auto component{xml.find("<Component ID=\"INTERACT_" + name + "\"")};
               auto callback{
                 xml.substr(component, xml.find("</Component>", component) - component)
               };
               check_cycle(callback);
               Require(
                 callback.find("<PrioritizeVCockpits>False</PrioritizeVCockpits>")
                     != std::string::npos
                   && callback.find(
                        "<MouseFlags>LeftSingle+LeftDrag+LeftRelease+RightSingle+RightDrag+"
                        "RightRelease+WheelUp+WheelDown</MouseFlags>"
                      ) != std::string::npos,
                 "Edit guard must capture screen interactions and preserve right-click mode cycling"
               );
            }
            if (name.starts_with("VFRNAV_FRAME_PROXY_")) {
               ++proxy_count;
               auto p{node.at("translation").as_array()};
               Require(
                 std::abs(p[0].to_number<double>()) > .062
                   || std::abs(p[1].to_number<double>()) > .09,
                 "Proxy covers native screen"
               );
               Require(parents[Number(&node - &nodes[0])] == 1, "Proxy detached");
               auto const& children{nodes[mount].at("children").as_array()};
               bool        found{false};
               for (auto const& c : children) {
                  found |= Number(c) == static_cast<std::size_t>(&node - &nodes[0]);
               }
               Require(found, "Proxy does not follow native tablet scale");
               auto mesh{nodes[static_cast<std::size_t>(&node - &nodes[0])].at("mesh")};
               auto material{model.at("meshes")
                               .as_array()[Number(mesh)]
                               .at("primitives")
                               .as_array()[0]
                               .at("material")};
               Require(
                 model.at("materials")
                     .as_array()[Number(material)]
                     .at("extensions")
                     .at("ASOBO_material_invisible")
                     .at("enabled")
                   == true,
                 "Frame proxy must be invisible"
               );
               auto component{xml.find("<Component ID=\"INTERACT_" + name + "\"")};
               auto callback{
                 xml.substr(component, xml.find("</Component>", component) - component)
               };
               check_cycle(callback);
               Require(
                 callback.find("<MouseFlags>RightSingle</MouseFlags>") != std::string::npos
                   && callback.find("Left") == std::string::npos,
                 "Proxy intercepts native left input"
               );
               Require(
                 callback.find("REVISION") == std::string::npos
                   && callback.find("1 + 4 %") != std::string::npos,
                 "Right click must only cycle mode"
               );
            }
            if (name.starts_with("VFRNAV_HANDLE_")) {
               auto translation{node.at("translation").as_array()};
               Require(
                 std::abs(translation[0].to_number<double>() - tablet::RigInfo::SCREEN_CENTER_X)
                     < 1e-12
                   && std::abs(
                        translation[1].to_number<double>() - tablet::RigInfo::SCREEN_CENTER_Y
                      ) < 1e-12
                   && std::abs(
                        translation[2].to_number<double>() - tablet::RigInfo::SCREEN_SURFACE_Z
                        + tablet::RigInfo::GIZMO_SURFACE_CLEARANCE
                      ) < 1e-12,
                 "Gizmo is not aligned with measured screen center/surface"
               );
               auto component{xml.find("<Component ID=\"INTERACT_" + name + "\"")};
               auto callback{
                 xml.substr(component, xml.find("</Component>", component) - component)
               };
               int mode{name[name.size() - 3] - '0'}, axis{name.back() - '0'};
               callback = std::regex_replace(callback, std::regex(R"(\s+)"), " ");
               ++handle_counts[mode - 1];
               Require(
                 callback.find(
                   "<Lock>True</Lock><LockFlagsTemporary>LeftSingle</LockFlagsTemporary>"
                 ) != std::string::npos
                   && callback.find("<DragFlagsLockable>LeftDrag</DragFlagsLockable>")
                        != std::string::npos,
                 "Every moving handle must retain pointer capture after leaving its projected "
                 "geometry"
               );
               Require(
                 callback.find("<PrioritizeVCockpits>False</PrioritizeVCockpits>")
                   != std::string::npos,
                 "Handles must not yield to native tablet input"
               );
               check_cycle(callback);
               Require(
                 callback.find(
                   "<MouseFlags>LeftSingle+LeftDrag+LeftRelease+Lock+Unlock+RightSingle</"
                   "MouseFlags>"
                 ) != std::string::npos,
                 "Every pickable handle must accept right click and preserve left drag lifecycle"
               );
               if (mode == 2) {
                  TestRotation(callback, axis);
                  continue;
               }
               Require(
                 callback.find(
                   cycle_mode
                   + " (M:Event) 'RightSingle' scmi 0 != if{ "
                     "(L:VFRNAV_EFB_HIDDEN, Number) ! (L:VFRNAV_EFB_MODE, Number) "
                   + std::to_string(mode) + " == and if{ "
                 ) != std::string::npos,
                 "Right click must skip all pose capture/edit paths"
               );
               Require(
                 std::string(tablet::K_SHIFT_LVAR) == "VFRNAV_EFB_SHIFT"
                   && callback.find(
                        "(L:VFRNAV_EFB_SHIFT, Number) abs 1.7976931348623157e308 &lt;= "
                        "(L:VFRNAV_EFB_SHIFT, Number) 0 != and (&gt;O:VFRNAV_CURRENT_SHIFT)"
                      ) != std::string::npos,
                 "Native Shift bridge must default nonfinite/unset values to normal gain"
               );
               Require(
                 callback.find("(O:VFRNAV_DRAG_SHIFT) (O:VFRNAV_CURRENT_SHIFT) != or if{ ")
                     != std::string::npos
                   && callback.find(
                        "(&gt;O:VFRNAV_MOUSE_START) (O:VFRNAV_CURRENT_SHIFT) "
                        "(&gt;O:VFRNAV_DRAG_SHIFT)"
                      ) != std::string::npos,
                 "Gain transitions must recapture current pose, mouse and Shift before editing"
               );
               for (double value :
                    {0.,
                     1.,
                     -2.,
                     std::numeric_limits<double>::max(),
                     std::numeric_limits<double>::quiet_NaN(),
                     std::numeric_limits<double>::infinity(),
                     -std::numeric_limits<double>::infinity()}) {
                  Require(
                    (std::abs(value) <= std::numeric_limits<double>::max() && value != 0)
                      == (std::isfinite(value) && value != 0),
                    "Shift finite guard mismatch"
                  );
               }
               if (mode == 1) {
                  auto start{callback.find(
                    axis == 0 ? "(M:RelativeX) (O:VFRNAV_MOUSE_START) -"
                              : "(M:RelativeY) (O:VFRNAV_MOUSE_START) -"
                  )};
                  auto math{
                    callback.substr(start, callback.find("l1 (L:VFRNAV_EFB_X", start) - start)
                  };
                  Require(parents[Number(&node - &nodes[0])] == 1, "Move handle detached");
                  std::size_t move_group{nodes.size()}, bank_node{nodes.size()};
                  for (std::size_t n{0}; n < nodes.size(); ++n) {
                     if (nodes[n].at("name") == "VFRNAV_MODE_1") {
                        move_group = n;
                     }
                     if (nodes[n].at("name") == "VFRNAV_BANK") {
                        bank_node = n;
                     }
                  }
                  Require(
                    move_group < nodes.size() && bank_node < nodes.size(),
                    "Missing local move hierarchy"
                  );
                  bool local{false};
                  for (auto const& child : nodes[bank_node].at("children").as_array()) {
                     local |= Number(child) == move_group;
                  }
                  Require(local, "Move arrows must inherit the same full rotation as the tablet");
                  for (auto angles : std::array<std::array<double, 3>, 4>{
                         {{0, 0, 0}, {90, 0, 0}, {90, 45, 0}, {37, -24, 63}}
                       }) {
                     double h{angles[0] * std::acos(-1.) / 180},
                       p{angles[1] * std::acos(-1.) / 180}, b{angles[2] * std::acos(-1.) / 180};
                     std::array<double, 3> v{};
                     v[axis] = axis == 0 ? -.04 : .04;
                     auto x{v[0] * std::cos(b) - v[1] * std::sin(b)},
                       y{v[0] * std::sin(b) + v[1] * std::cos(b)}, z{v[2]};
                     auto yy{y * std::cos(p) - z * std::sin(p)},
                       zz{y * std::sin(p) + z * std::cos(p)};
                     std::array<double, 3> expected{
                       -x * std::cos(h) - zz * std::sin(h),
                       .35 + yy,
                       1.2 + zz * std::cos(h) - x * std::sin(h)
                     };
                     for (int repeat{0}; repeat < 20; ++repeat) {
                        auto actual{Move(math, .1, angles[0], angles[1], angles[2])};
                        for (int c{0}; c < 3; ++c) {
                           Require(
                             std::abs(actual[c] - expected[c]) < 1e-10,
                             "Local axis movement does not match glTF rotation chain"
                           );
                        }
                     }
                  }
                  Require(
                    Move(math, 0, 90, 45, 12) == std::array<double, 3>{0, .35, 1.2},
                    "Anchor return must restore pose"
                  );
                  std::array<double, 3> initial{0, .35, 1.2};
                  auto                  normal{Move(math, .1, 37, -24, 63)};
                  auto                  shifted{Move(math, .1, 37, -24, 63, 0, true)};
                  auto                  transition{Move(math, .1, 37, -24, 63, .1, true, normal)};
                  auto                  accelerated{Move(math, .2, 37, -24, 63, .1, true, normal)};
                  auto released{Move(math, .2, 37, -24, 63, .2, false, accelerated)};
                  auto resumed{Move(math, .3, 37, -24, 63, .2, false, accelerated)};
                  for (int c{0}; c < 3; ++c) {
                     Require(
                       std::abs(shifted[c] - initial[c] - 4 * (normal[c] - initial[c])) < 1e-10,
                       "Shift local move gain must be 4x"
                     );
                     Require(
                       std::abs(transition[c] - normal[c]) < 1e-10
                         && std::abs(released[c] - accelerated[c]) < 1e-10,
                       "Local move jumps on Shift transition"
                     );
                     Require(
                       std::abs(accelerated[c] - normal[c] - 4 * (normal[c] - initial[c])) < 1e-10
                         && std::abs(resumed[c] - accelerated[c] - (normal[c] - initial[c]))
                              < 1e-10,
                       "Local move resumed gain or anchor incorrect"
                     );
                  }
                  for (int repeat{0}; repeat < 20; ++repeat) {
                     Require(
                       Move(math, .2, 37, -24, 63, .1, true, normal) == accelerated,
                       "Shift local move drifts"
                     );
                  }
                  Require(
                    callback.find("(O:VFRNAV_START_HEADING) abs 180 &lt;= and if{")
                      != std::string::npos,
                    "Local movement must guard captured rotations and positions"
                  );
                  Require(
                    callback.find(
                      axis == 0 ? "(M:RelativeX) abs 1 &lt;=" : "(M:RelativeY) abs 1 &lt;="
                    ) != std::string::npos
                      && callback.find("<DragMode>Default</DragMode>") != std::string::npos
                      && callback.find("DragPercent") == std::string::npos,
                    "Local movement must retain finite bounded conservative mouse input"
                  );
                  continue;
               }
               auto        begin{callback.find(" &lt;= and if{ (O:VFRNAV_DRAG_START) ") + 15};
               auto        code{callback.substr(begin, callback.find(" s0", begin) - begin)};
               std::string expected_input{
                 mode == 1   ? (axis == 0 ? "(M:RelativeX)" : "(M:RelativeY)")
                 : mode == 2 ? (axis == 0 ? "(M:RelativeY)" : "(M:RelativeX)")
                             : "(M:RelativeX)"
               };
               Require(
                 code.starts_with("(O:VFRNAV_DRAG_START) " + expected_input + " "),
                 "Wrong live-feedback mouse-axis mapping"
               );
               Require(
                 callback.find("<DragMode>Default</DragMode><DragScalar>1</DragScalar>")
                     != std::string::npos
                   && callback.find("DragPercent") == std::string::npos,
                 "Failed live trajectory must not remain active"
               );
               Require(
                 callback.find(
                   expected_input
                   + " abs 1 &lt;= (O:VFRNAV_MOUSE_START) abs 1 &lt;= and (O:VFRNAV_DRAG_START) "
                     "abs "
                   + std::string(
                     mode == 1   ? "20"
                     : mode == 2 ? "180"
                                 : "3"
                   )
                   + " &lt;= and if{ "
                 ) != std::string::npos,
                 "Reject nonfinite or excessive drag input before pose arithmetic"
               );
               Require(
                 callback.find("(L:VFRNAV_EFB_HIDDEN, Number) !") != std::string::npos,
                 "Hidden drag must not edit pose"
               );
               double speed{mode == 1 ? .4 : mode == 2 ? 180 : 2}, sign{1};
               double initial{mode == 2 ? 0. : 1.}, expected{initial + sign * .1 * speed};
               Require(
                 std::abs(Evaluate(code, initial, .1) - expected) < 1e-8,
                 "Wrong measured press-anchor delta"
               );
               auto normal{Evaluate(code, initial, .1)};
               auto fast{Evaluate(code, initial, .1, 0, true)};
               Require(
                 std::abs(fast - initial - 4 * (normal - initial)) < 1e-8,
                 "Shift gain must be 4x for rotation/resize"
               );
               Require(
                 std::abs(Evaluate(code, normal, .1, .1, true) - normal) < 1e-8,
                 "Shift press must not jump"
               );
               auto accelerated{Evaluate(code, normal, .2, .1, true)};
               Require(
                 std::abs(accelerated - normal - .1 * speed * 4) < 1e-8,
                 "Accelerated segment delta incorrect"
               );
               Require(
                 std::abs(Evaluate(code, accelerated, .2, .2, false) - accelerated) < 1e-8,
                 "Shift release must not jump"
               );
               Require(
                 std::abs(Evaluate(code, accelerated, .3, .2, false) - accelerated - .1 * speed)
                   < 1e-8,
                 "Normal gain must resume after Shift release"
               );
               for (int repeat{0}; repeat < 20; ++repeat) {
                  Require(
                    std::abs(Evaluate(code, initial, .1) - expected) < 1e-8,
                    "Stationary mouse drifts"
                  );
               }
               Require(
                 Evaluate(code, initial, 0) == initial, "Anchor return does not restore pose"
               );
               double bound{mode == 1 ? 20. : mode == 2 ? 180. : 3.};
               auto   accepts{[&](double mouse, double start) {
                  return std::abs(mouse) <= 1 && std::abs(start) <= bound;
               }};
               for (double invalid :
                    {std::numeric_limits<double>::quiet_NaN(),
                     std::numeric_limits<double>::infinity(),
                     -std::numeric_limits<double>::infinity(),
                     1.01,
                     -1.01}) {
                  Require(
                    !accepts(invalid, initial), "Invalid mouse input passed finite/range guard"
                  );
               }
               for (double invalid :
                    {std::numeric_limits<double>::quiet_NaN(),
                     std::numeric_limits<double>::infinity(),
                     -std::numeric_limits<double>::infinity(),
                     bound + 1}) {
                  Require(!accepts(.1, invalid), "Invalid anchor passed finite/range guard");
               }
               if (mode == 1) {
                  Require(
                    std::abs(Evaluate(code, initial, -.1) - (initial - .04)) < 1e-8,
                    "Move reverse displacement must be four centimetres"
                  );
                  Require(
                    Evaluate(code, 100, .1) == 20 && Evaluate(code, -100, -.1) == -20,
                    "Move displacement escaped public bounds"
                  );
               }
               Require(
                 callback.find("<Cursor>Grab</Cursor>") != std::string::npos
                   && callback.find("'LeftRelease'") != std::string::npos,
                 "Missing grasp/release"
               );
            }
         }
         Require(proxy_count == 4, "Missing authored frame perimeter proxies");
         Require(
           handle_counts == std::array<unsigned, 3>{3, 3, 1},
           "Missing right-click coverage for move, rotate or proportional resize handles"
         );
         for (auto const& mesh : model.at("meshes").as_array()) {
            auto primitive{mesh.at("primitives").as_array()[0]};
            auto positions{floats(Number(primitive.at("attributes").at("POSITION")))};
            auto normals{floats(Number(primitive.at("attributes").at("NORMAL")))};
            Require(
              positions.size() == normals.size() && positions.size() % 9 == 0, "Malformed triangles"
            );
            for (std::size_t p{0}; p < positions.size(); p += 9) {
               std::array<double, 3> u{}, v{};
               for (int c{0}; c < 3; ++c) {
                  u[c] = positions[p + 3 + c] - positions[p + c];
                  v[c] = positions[p + 6 + c] - positions[p + c];
               }
               auto dot{
                 (u[1] * v[2] - u[2] * v[1]) * normals[p]
                 + (u[2] * v[0] - u[0] * v[2]) * normals[p + 1]
                 + (u[0] * v[1] - u[1] * v[0]) * normals[p + 2]
               };
               Require(dot > 0, "Triangle winding mismatch");
            }
         }
         for (auto const& entry : fs::recursive_directory_iterator(attachment)) {
            if (entry.is_regular_file()) {
               Require(
                 (entry.path().extension() != "actiondb"
                  || entry.path() == attachment / "input" / "action.actiondb")
                   && entry.path().extension() != "png",
                 "Stock resource copied"
               );
            }
         }
         tablet::TransformRig::Write(
           root, "SimAttachments\\VFRNAV\\Alternate&Rig", "missing-stock.gltf"
         );
         Require(
           Read(root / "SimAttachments" / "VFRNAV" / "Alternate&Rig" / "input" / "action.actiondb")
               .find(R"(<Actions Source="SimAttachments\VFRNAV\Alternate&amp;Rig">)")
             != std::string::npos,
           "Action Source must follow caller rigRoot and escape XML attributes"
         );
         bool rejected{false};
         try {
            tablet::TransformRig::Write(root, "..\\escape", "");
         } catch (std::invalid_argument const&) {
            rejected = true;
         }
         Require(rejected, "Traversal accepted");
         rejected = false;
         try {
            tablet::TransformRig::Write(root, "SimAttachments\\VFRNAV\\Rig", "");
         } catch (std::invalid_argument const&) {
            rejected = true;
         }
         Require(rejected, "Existing rig overwritten");
         fs::remove_all(root);
         std::cout << checks
                   << " procedural-parent checks passed; nested native rendering/input/transform "
                      "runtime unverified.\n";
         return 0;
      } catch (std::exception const& error) {
         std::cerr << error.what() << '\n';
         fs::remove_all(root);
         return 1;
      }
   }
};

/** Runs the generated-rig regression checks. */
int
main(int argc, char** argv) {
   return TransformRigTest::Run(argc, argv);
}
