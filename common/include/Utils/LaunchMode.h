

#pragma once

#include <string>

namespace launch_mode {
std::string Startup(bool clean = false);
std::string Login(bool clean = false);
std::string Never();

}  // namespace launch_mode