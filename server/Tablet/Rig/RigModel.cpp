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

#include "RigModel.h"
#include "../TransformRig.h"

#include <boost/json.hpp>
#include <algorithm>
#include <array>
#include <cmath>
#include <cstdint>
#include <cstring>
#include <numbers>
#include <stdexcept>
#include <vector>

namespace tablet {
namespace {
namespace j = boost::json;

/**
 * Builds the procedural glTF tree, its binary buffers, and native behaviors.
 */
class RigModelBuilder {
private:
   j::object         model_{};
   std::vector<char> bytes_{};
   std::size_t       buffer_{0};

public:
   /** Initializes required glTF collections and takes ownership of binary data. */
   explicit RigModelBuilder(j::object input, std::vector<char> initialBytes)
      : model_{std::move(input)}
      , bytes_{std::move(initialBytes)} {
      for (auto name :
           {"accessors", "bufferViews", "buffers", "nodes", "animations", "meshes", "materials"}) {
         if (!model_.contains(name)) {
            model_[name] = j::array{};
         }
      }
   }

   /** Returns the mutable glTF model under construction. */
   j::object& Model() { return model_; }

   /** Returns the procedural binary buffer. */
   std::vector<char>& Bytes() { return bytes_; }

   /** Appends float values and creates a glTF accessor for them. */
   std::size_t
   Access(std::vector<float> const& values, unsigned width, bool bounds = false, int target = 0) {
      auto&     views{model_.at("bufferViews").as_array()};
      j::object view{
        {"buffer", buffer_},
        {"byteOffset", bytes_.size()},
        {"byteLength", values.size() * sizeof(float)}
      };

      if (target) {
         view["target"] = target;
      }

      views.push_back(view);
      for (float value : values) {
         static_assert(sizeof(float) == 4);

         std::uint32_t bits{};

         std::memcpy(&bits, &value, sizeof bits);
         for (int n{0}; n < 4; ++n) {
            bytes_.push_back(static_cast<char>((bits >> (n * 8)) & 255));
         }
      }

      j::object accessor{
        {"bufferView", views.size() - 1},
        {"componentType", 5126},
        {"count", values.size() / width},
        {"type",
         width == 1   ? "SCALAR"
         : width == 3 ? "VEC3"
                      : "VEC4"}
      };

      if (bounds) {
         j::array low{}, high{};

         for (unsigned c{0}; c < width; ++c) {
            float lo{values.at(c)}, hi{lo};

            for (std::size_t n{c}; n < values.size(); n += width) {
               lo = std::min(lo, values[n]);
               hi = std::max(hi, values[n]);
            }

            low.push_back(lo);
            high.push_back(hi);
         }

         accessor["min"] = low;
         accessor["max"] = high;
      }

      auto& accessors{model_.at("accessors").as_array()};

      accessors.push_back(accessor);
      return accessors.size() - 1;
   }

   /** Adds a uniquely identified node to the glTF model. */
   std::size_t Node(std::string const& name, j::array children = {}) {
      auto& nodes{model_.at("nodes").as_array()};

      nodes.push_back(
        j::object{
          {"name", name},
          {"children", children},
          {"extensions", j::object{{"ASOBO_unique_id", j::object{{"id", name}}}}}
        }
      );
      return nodes.size() - 1;
   }

   /** Adds animation samplers and channels referenced by the authored behaviors. */
   void Animate(
     std::size_t               node,
     std::string const&        name,
     std::string const&        path,
     std::vector<float> const& values,
     unsigned                  width
   ) {
      unsigned           count{static_cast<unsigned>(values.size()) / width};
      std::vector<float> times{};

      for (unsigned n{0}; n < count; ++n) {
         times.push_back(100.f * n / (count - 1));
      }

      auto input{Access(times, 1, true)};
      auto output{Access(values, width)};

      model_.at("animations")
        .as_array()
        .push_back(
          j::object{
            {"name", name},
            {"samplers",
             j::array{
               j::object{{"input", input}, {"output", output}, {"interpolation", "LINEAR"}}
             }},
            {"channels",
             j::array{
               j::object{{"sampler", 0}, {"target", j::object{{"node", node}, {"path", path}}}}
             }}
          }
        );
   }

   /** Builds an unindexed flat-shaded box mesh beneath the specified parent. */
   std::size_t Box(
     std::size_t        parent,
     std::string const& name,
     float              x,
     float              y,
     float              z,
     unsigned           color,
     float              hx = .009f,
     float              hy = .009f,
     float              hz = .009f
   ) {
      // Original unindexed flat-shaded cube; no stock mesh is copied into code.
      std::vector<float>                        positions{}, normals{};
      const std::array<std::array<float, 3>, 8> corners{
        {{{-1, -1, -1}},
         {{1, -1, -1}},
         {{1, 1, -1}},
         {{-1, 1, -1}},
         {{-1, -1, 1}},
         {{1, -1, 1}},
         {{1, 1, 1}},
         {{-1, 1, 1}}}
      };
      const std::array<std::array<int, 4>, 6> faces{
        {{{0, 3, 2, 1}},
         {{4, 5, 6, 7}},
         {{0, 4, 7, 3}},
         {{1, 2, 6, 5}},
         {{0, 1, 5, 4}},
         {{3, 7, 6, 2}}}
      };
      const std::array<std::array<float, 3>, 6> ns{
        {{{0, 0, -1}}, {{0, 0, 1}}, {{-1, 0, 0}}, {{1, 0, 0}}, {{0, -1, 0}}, {{0, 1, 0}}}
      };

      for (int face{0}; face < 6; ++face) {
         for (int index : {0, 1, 2, 0, 2, 3}) {
            auto const& p{corners[faces[face][index]]};

            for (int axis{0}; axis < 3; ++axis) {
               positions.push_back(p[axis] * (axis == 0 ? hx : axis == 1 ? hy : hz));
               normals.push_back(ns[face][axis]);
            }
         }
      }

      auto  pos{Access(positions, 3, true, 34962)}, norm{Access(normals, 3, false, 34962)};
      auto& meshes{model_.at("meshes").as_array()};
      auto  mesh{meshes.size()};

      meshes.push_back(
        j::object{
          {"name", name},
          {"primitives",
           j::array{j::object{
             {"attributes", j::object{{"POSITION", pos}, {"NORMAL", norm}}},
             {"material", color},
             {"mode", 4}
           }}}
        }
      );

      auto  index{Node(name)};
      auto& node{model_.at("nodes").as_array().at(index).as_object()};

      node["mesh"]        = mesh;
      node["translation"] = j::array{x, y, z};
      model_.at("nodes")
        .as_array()
        .at(parent)
        .as_object()
        .at("children")
        .as_array()
        .push_back(index);
      return index;
   }

   /** Builds a procedural translation arrow or rotation ring beneath parent. */
   void Gizmo(std::size_t parent, std::string const& name, int axis, bool ring, unsigned color) {
      using Point = std::array<float, 3>;
      std::vector<float> positions{}, normals{};
      auto               triangle{[&](Point a, Point c, Point d) {
         Point u{}, v{}, normal{};

         for (int n{0}; n < 3; ++n) {
            u[n] = c[n] - a[n];
            v[n] = d[n] - a[n];
         }

         normal = {u[1] * v[2] - u[2] * v[1], u[2] * v[0] - u[0] * v[2], u[0] * v[1] - u[1] * v[0]};

         float length{
           std::sqrt(normal[0] * normal[0] + normal[1] * normal[1] + normal[2] * normal[2])
         };
         if (length < 1e-10f) {
            return;
         }

         for (auto const& p : {a, c, d}) {
            for (int n{0}; n < 3; ++n) {
               positions.push_back(p[n]);
               normals.push_back(normal[n] / length);
            }
         }
      }};
      auto               point{[axis](float along, float a, float c) {
         Point p{};

         p[axis]           = along;
         p[(axis + 1) % 3] = a;
         p[(axis + 2) % 3] = c;
         return p;
      }};
      constexpr float    tau{2.f * static_cast<float>(std::numbers::pi)};

      if (ring) {
         // Closed, thick 3D torus in the plane normal to the selected axis.
         auto sample{[&](int major, int minor) {
            float a{tau * major / 48}, c{tau * minor / 8};
            float radius{.042f + .0035f * std::cos(c)};

            return point(.0035f * std::sin(c), radius * std::cos(a), radius * std::sin(a));
         }};

         for (int major{0}; major < 48; ++major) {
            for (int minor{0}; minor < 8; ++minor) {
               auto a{sample(major, minor)}, c{sample(major + 1, minor)};
               auto d{sample(major + 1, minor + 1)}, e{sample(major, minor + 1)};

               triangle(a, c, d);
               triangle(a, d, e);
            }
         }
      } else {
         // Double-ended arrow: cylindrical shaft with two conical arrowheads.
         const std::array<float, 6> along{-.06f, -.044f, -.044f, .044f, .044f, .06f};
         const std::array<float, 6> radii{0, .011f, .0035f, .0035f, .011f, 0};

         for (int segment{0}; segment < 5; ++segment) {
            for (int slice{0}; slice < 12; ++slice) {
               auto sample{[&](int end, int side) {
                  float a{tau * side / 12};

                  return point(along[end], radii[end] * std::cos(a), radii[end] * std::sin(a));
               }};
               auto a{sample(segment, slice)}, c{sample(segment, slice + 1)};
               auto d{sample(segment + 1, slice + 1)}, e{sample(segment + 1, slice)};

               triangle(a, c, d);
               triangle(a, d, e);
            }
         }
      }

      auto  pos{Access(positions, 3, true, 34962)}, norm{Access(normals, 3, false, 34962)};
      auto& meshes{model_.at("meshes").as_array()};
      auto  mesh{meshes.size()};

      meshes.push_back(
        j::object{
          {"name", name},
          {"primitives",
           j::array{j::object{
             {"attributes", j::object{{"POSITION", pos}, {"NORMAL", norm}}},
             {"material", color},
             {"mode", 4}
           }}}
        }
      );

      auto  index{Node(name)};
      auto& node{model_.at("nodes").as_array()[index].as_object()};

      node["mesh"] = mesh;
      // Editing controls are centered in front of the tablet, normal mode hides
      // them so the native screen has no extra left-click interception.
      node["translation"] = j::array{
        RigInfo::SCREEN_CENTER_X,
        RigInfo::SCREEN_CENTER_Y,
        RigInfo::SCREEN_SURFACE_Z - RigInfo::GIZMO_SURFACE_CLEARANCE
      };
      model_.at("nodes").as_array()[parent].as_object().at("children").as_array().push_back(index);
   }
};
}  // namespace

RigModel::Data
RigModel::Build() {
   RigModelBuilder b{
     j::object{
       {"asset",
        j::object{{"version", "2.0"}, {"generator", "VFRNAV procedural transform parent"}}},
       {"scene", 0},
       {"scenes", j::array{j::object{{"nodes", j::array{}}}}}
     },
     {}
   };
   if (!b.Model().contains("extensionsUsed")) {
      b.Model()["extensionsUsed"] = j::array{};
   }

   auto& extensions{b.Model().at("extensionsUsed").as_array()};
   bool  has_unique_id{false};

   for (auto const& extension : extensions) {
      has_unique_id |= extension == "ASOBO_unique_id";
   }

   if (!has_unique_id) {
      extensions.push_back("ASOBO_unique_id");
   }

   auto& scenes{b.Model().at("scenes").as_array()};
   if (scenes.size() != 1) {
      throw std::invalid_argument("Prototype requires exactly one glTF scene");
   }

   // Node order implements aircraft-local translation, then heading/pitch/bank.
   auto tx{b.Node("VFRNAV_X")}, ty{b.Node("VFRNAV_Y")}, tz{b.Node("VFRNAV_Z")};
   auto heading{b.Node("VFRNAV_HEADING")}, pitch{b.Node("VFRNAV_PITCH")},
     bank{b.Node("VFRNAV_BANK")};
   auto scale{b.Node("VFRNAV_SCALE")};
   auto mount{b.Node(RigInfo::MOUNT_NODE)};
   auto native_mount{b.Node("VFRNAV_NATIVE_TABLET_MOUNT")};
   b.Animate(native_mount, "VFRNAV_ANIM_NATIVE_TABLET", "scale", {1, 1, 1, 0, 0, 0}, 3);

   b.Model().at("nodes").as_array()[mount].as_object()["children"] = j::array{native_mount};

   const std::array chain{tx, ty, tz, heading, pitch, bank, scale, mount};

   for (std::size_t n{0}; n + 1 < chain.size(); ++n) {
      b.Model().at("nodes").as_array()[chain[n]].as_object()["children"] = j::array{chain[n + 1]};
   }

   scenes[0].as_object()["nodes"]                                  = j::array{tx};
   b.Model().at("nodes").as_array()[ty].as_object()["translation"] = j::array{0, .35, 0};
   b.Model().at("nodes").as_array()[tz].as_object()["translation"] = j::array{0, 0, 1.2};
   for (int axis{0}; axis < 3; ++axis) {
      std::vector<float> values{};

      values.resize(6, 0.f);
      // SDK/stock observed attachment X points left; verify raw-glTF sign in sim.
      values[axis]     = axis == 0 ? 20.f : -20.f;
      values[axis + 3] = -values[axis];

      std::string key{axis == 0 ? "X" : axis == 1 ? "Y" : "Z"};

      b.Animate(chain[axis], "VFRNAV_ANIM_" + key, "translation", values, 3);
   }

   for (auto const& rotation : std::array<std::pair<std::size_t, std::string>, 3>{
          {{heading, "HEADING"}, {pitch, "PITCH"}, {bank, "BANK"}}
        }) {
      std::vector<float> values{};
      int axis{rotation.second == "PITCH" ? 0 : rotation.second == "HEADING" ? 1 : 2};

      // Intermediate keys avoid the identical-antipodal +/-180 endpoint
      // shortest-path interpolation collapsing a full rotation.
      for (int degrees{-180}; degrees <= 180; degrees += 45) {
         double angle{degrees * std::numbers::pi / 360.};

         for (int n{0}; n < 3; ++n) {
            values.push_back(n == axis ? static_cast<float>(std::sin(angle)) : 0.f);
         }

         values.push_back(static_cast<float>(std::cos(angle)));
      }

      b.Animate(rotation.first, "VFRNAV_ANIM_" + rotation.second, "rotation", values, 4);
   }

   b.Animate(scale, "VFRNAV_ANIM_SCALE", "scale", {.25f, .25f, .25f, 3, 3, 3}, 3);

   auto material{b.Model().at("materials").as_array().size()};

   for (j::array color :
        {j::array{1, .12, .08, 1},
         j::array{.1, 1, .15, 1},
         j::array{.1, .4, 1, 1},
         j::array{1, .7, .08, 1}}) {
      b.Model()
        .at("materials")
        .as_array()
        .push_back(
          j::object{
            {"name",
             "VFRNAV_HANDLE_" + std::to_string(b.Model().at("materials").as_array().size())},
            {"doubleSided", true},
            {"pbrMetallicRoughness",
             j::object{{"baseColorFactor", color}, {"metallicFactor", 0}, {"roughnessFactor", 1}}}
          }
        );
   }

   auto proxy_material{b.Model().at("materials").as_array().size()};

   b.Model()
     .at("materials")
     .as_array()
     .push_back(
       j::object{
         {"name", "VFRNAV_RIGHT_CLICK_PROXY"},
         {"doubleSided", true},
         {"extensions", j::object{{"ASOBO_material_invisible", j::object{{"enabled", true}}}}}
       }
     );
   b.Model().at("extensionsUsed").as_array().push_back("ASOBO_material_invisible");
   // Original narrow frame perimeter, not a screen overlay. Right-only
   // MouseRects are a runtime probe: native left-input arbitration is unverified.
   for (int side{0}; side < 4; ++side) {
      auto name{"VFRNAV_FRAME_PROXY_" + std::to_string(side)};
      bool vertical{side < 2};

      b.Box(
        mount,
        name,
        static_cast<float>(RigInfo::SCREEN_CENTER_X)
          + (vertical ? (side == 0 ? -.065f : .065f) : 0),
        static_cast<float>(RigInfo::SCREEN_CENTER_Y)
          + (vertical ? 0 : (side == 2 ? -.092f : .092f)),
        -.008f,
        static_cast<unsigned>(proxy_material),
        vertical ? .003f : .062f,
        vertical ? .095f : .003f,
        .002f
      );
   }

   auto shield{b.Node("VFRNAV_EDIT_INPUT_SHIELD")};

   b.Model().at("nodes").as_array()[mount].as_object().at("children").as_array().push_back(shield);
   b.Model().at("nodes").as_array()[shield].as_object()["scale"] = j::array{0, 0, 0};
   b.Animate(shield, "VFRNAV_ANIM_EDIT_TABLET", "scale", {0, 0, 0, 1, 1, 1}, 3);
   // Invisible input surface only; the installed stock model supplies the body.
   b.Box(
     shield,
     "VFRNAV_EDIT_INPUT_SURFACE",
     static_cast<float>(RigInfo::SCREEN_CENTER_X),
     static_cast<float>(RigInfo::SCREEN_CENTER_Y),
     static_cast<float>(RigInfo::SCREEN_SURFACE_Z - RigInfo::GIZMO_SURFACE_CLEARANCE / 2),
     static_cast<unsigned>(proxy_material),
     .062f,
     .09f,
     .00005f
   );
   for (int mode{1}; mode <= 3; ++mode) {
      auto group_name{"VFRNAV_MODE_" + std::to_string(mode)};
      auto group{b.Node(group_name)};

      // Keep handle sizes and pick volumes independent of tablet resizing.
      b.Model().at("nodes").as_array()[bank].as_object().at("children").as_array().push_back(group);

      int count{mode == 3 ? 1 : 3};

      for (int axis{0}; axis < count; ++axis) {
         auto name{"VFRNAV_HANDLE_" + std::to_string(mode) + "_" + std::to_string(axis)};
         int  geometry_axis{mode == 2 ? (axis == 0 ? 0 : axis == 1 ? 2 : 1) : axis};

         b.Gizmo(
           group, name, geometry_axis, mode == 2, static_cast<unsigned>(material + geometry_axis)
         );
      }
   }

   b.Model().at("buffers").as_array().push_back(
     j::object{{"uri", "rig.bin"}, {"byteLength", b.Bytes().size()}}
   );
   return {std::move(b.Model()), std::move(b.Bytes())};
}
}  // namespace tablet
