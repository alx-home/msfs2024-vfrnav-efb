#pragma once

#include "Resources.h"

#include <span>
#include <string>
#include <unordered_map>

using AppResources = std::unordered_map<std::string, std::span<const std::byte>>;

#ifndef WATCH_MODE
extern AppResources const MAIN_WINDOW_RESOURCES;
extern AppResources const TASKBAR_WINDOW_RESOURCES;
extern AppResources const TASKBAR_TOOLTIP_WINDOW_RESOURCES;
extern AppResources const EFB_RESOURCES;
#endif
