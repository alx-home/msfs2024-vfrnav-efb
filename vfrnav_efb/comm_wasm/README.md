# VFRNav EFB standalone WASM module

The standalone module provides the existing CommBus-backed flight/blob storage and
global cockpit-tablet keyboard and joystick-button support. The module is packaged under `modules/` by
the `efbStorageWasm` asset group, so the shortcut and Shift bridge work without the
native VFRNav server and do not require per-aircraft keyboard/action files.

## Tablet shortcut

The default shortcut is `Ctrl+T`. The `VFRNAV_GET_TABLET_SHORTCUT` and
`VFRNAV_SET_TABLET_SHORTCUT` CommBus events return `data:<shortcut>` or
`error:<message>` through `VFRNAV_WASM_RESPONSE`. The EFB Settings page can capture
a shortcut or reset it to `Ctrl+T`. Valid choices are one letter or digit with
Ctrl, Shift, or Alt, optionally with a second modifier. The selected label is
persisted at `/work/tablet-shortcut.txt`.

The EFB bridge registers `JS_LISTENER_COMM_BUS` through `RegisterViewListenerT`
and sends `COMM_BUS_WASM_CALLBACK` using a module-local view-listener subclass,
matching the SDK's CommBus transport without loading `CommBus.js` or declaring
its global `CommBusListener` class. Failed initialization can be retried.
WASM initialization and request timeouts report errors instead
of leaving shortcut requests pending indefinitely. After changing the settings
UI or bridge, rebuild both `vfrnav_efb_embedded` and `vfrnav_efb_msfs`, rebuild
the simulator package, and reload it in the simulator to replace cached scripts.

The module opens SimConnect from `module_init`, registers its dispatch callback
once, and uses subscribed `Frame` events to acknowledge pending shortcut changes.
Standalone modules do not receive a `module_update` callback. The module
maps its inputs in low-priority, non-maskable input groups, and
registers each toggle/Shift event as a private client event subscribed through
a non-maskable notification group before mapping any keyboard input. It
uses the WASM named-variable API to write `L:VFRNAV_EFB_TOGGLE_REQUEST` and
`L:VFRNAV_EFB_SHIFT`. The latter combines left/right Shift down/up state and is
written as zero at initialization. Reconfiguration clears and remaps the tablet
input group; asynchronous SimConnect mapping exceptions restore the prior shortcut
and return an error to the settings page.

## Tablet joystick button

The keyboard shortcut and joystick button are independent: both can be assigned,
and removing the joystick button does not reset the keyboard shortcut.
In Settings, choose **Capture joystick button**, then press and release a button
within eight seconds while a flight is loaded. Capture can be cancelled, and
leaving Settings also cancels it. Buttons are displayed using one-based numbering.
Capture does not change the simulator's existing control assignments, so use a
button that does not already perform an unwanted aircraft action.

The `VFRNAV_TABLET_JOYSTICK` CommBus event accepts `get`, `capture`, `cancel`, or
`clear`, returning `data:<binding label>` (empty when unassigned) or `error:<message>`.
The module enumerates controllers with `SimConnect_EnumerateControllers` and
temporarily maps buttons 0 through 127 per controller in separate, non-maskable
input groups (128 mappings each, below SimConnect's 1000-per-group limit).
Controller enumeration also includes keyboard and mouse devices, and does not
provide button counts. Capture first probes these definitions with groups disabled,
then skips individual definitions rejected with SimConnect's generic invalid-input
exception. Only groups with usable buttons are enabled after the acknowledgement
window. The WASM log reports usable and rejected candidate counts; no usable buttons
is an explicit error. Other setup errors and permanent-binding mapping errors still
fail the operation.
The permanent joystick input group is created by its first mapping. It is only
cleared after creation, and clearing permanently deletes it. A second clear before
remapping produces SimConnect `UNRECOGNIZED_ID` (exception 3, parameter 1).
Both permanent and temporary group lifecycle tracking account for deletion, and
the permanent group lifecycle is reset when the SimConnect connection is reopened.
It does not rely on browser Gamepad indices or the options-screen Controls
listener, which are unavailable in some EFB views.

Temporary groups are disabled and cleared on completion, cancellation, timeout,
or failure. The captured button is mapped in a separate permanent input group
using `joystick:<DeviceId>:button:<index>` and the EX1 API. Mapping errors and
save failures leave the previous binding selected. The selected product ID,
composite ID, device name and button index are saved at `/work/tablet-joystick.txt`;
new saves are written and closed in `.tmp`, the committed file is moved to `.bak`,
then the temporary file is promoted without renaming over an existing destination.
Promotion failures restore the backup; startup recovers it if promotion was
interrupted. Filesystem failures report the operation and errno to Settings.
The backup is removed only after successful promotion.
Startup enumeration resolves the current device ID rather than persisting a
browser index. Missing or indistinguishable duplicate controllers are reported
in the WASM log instead of guessing a device; reconnect and capture again.
Axes and POV hats are not button bindings.

After building the module, run `node --test vfrnav_efb/comm_wasm/Joystick.test.mjs`
from the repository root. These tests execute the compiled WASM with simulated
SimConnect callbacks and WASI storage, covering capture, cancellation, timeout,
controller identity resolution, rollback, persistence and independent keyboard
bindings. Actual hardware delivery still needs verification in the simulator.
The suite also checks the Settings message handler through the real Manager and
RecordManager methods, including error propagation and empty cleared bindings.

The key definition passed to SimConnect uses `VK_LCONTROL+T` for `Ctrl+T`. This
syntax is documented in the MSFS 2024 SDK under **SimConnect API Reference >
Input Events > SimConnect_MapInputEventToClientEvent_EX1 > Remarks** (the examples
include `VK_LCONTROL+A+U`; the remarks specify up to two modifiers). EX1 is used
because that reference deprecates the older mapping API due to a device-ID bug.
The module uses the MSFS 2024 Vars API (`fsVarsRegisterLVar`, `fsVarsGetUnitId`,
and `fsVarsLVarSet`) for local-variable registration and writes.

## Tablet placement persistence

Tablet position, rotation and uniform scale are saved per aircraft configuration
path in `/work/tablet-poses.txt` after 500 ms without movement, and flushed on
aircraft changes and module shutdown. The primary file and its `.bak` recovery
copy are loaded on startup. Invalid or unreadable settings disable saving to
preserve the existing data.

MSFS can return WASI `EIO` (errno 29), rather than `ENOENT`, when a settings file
does not exist. On that error, the module checks file metadata to
confirm absence before allowing the first save or accepting an absent backup
during atomic-save cleanup. An existing unreadable file is never treated as
missing. The WASM tests simulate this MSFS behavior as well as a fresh module
session restoring the saved placement.

## Build

- CMake target: `vfrnav_comm_wasm`
- Output artifact: `build/vfrnav_efb/wasm/vfrnav_comm_wasm.wasm`
- Packaged to: `modules/vfrnav_comm_wasm.wasm`

The target uses the MSFS SDK WASM toolchain from `MSFS_SDK_LOCATION/WASM`
(`clang-cl.exe` + `wasm-ld.exe`) and links the MSFS 2024 WASM versions library.
The linker consumes every object from `vfrnav_comm_wasm_obj`, including the
SimConnect shortcut implementation. Building `vfrnav_efb_msfs` also rebuilds and
stages this module before the simulator package is assembled.
