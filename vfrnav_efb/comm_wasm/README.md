# vfrnav_efb storage WASM scaffold

This module listens to MSFS events and appends one JSON object per event to a JSONL file.

## Current subscriptions

- `Pause`
- `SimStart`

## Output file

- `work/vfrnav-storage/events.jsonl`

Each line in the output file is a JSON object:

```json
{ "event": "Pause", "eventId": 1, "data": 0, "timestampMs": 1730000000000 }
```

## Build target

- CMake target: `vfrnav_storage_wasm`
- Output artifact: `build/vfrnav_efb/storage/vfrnav_storage.wasm`

The target uses the MSFS SDK WASM toolchain from `MSFS_SDK_LOCATION/WASM` (`clang-cl.exe` + `wasm-ld.exe`).
