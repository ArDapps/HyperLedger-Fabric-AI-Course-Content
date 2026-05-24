#!/usr/bin/env bash

# هذا الملف مش بيتشغل لوحده؛ السكريبتات الأخرى تعمل له source.
# وظيفته تحديد مكان fabric-samples بطريقة مريحة:
# 1. لو FABRIC_SAMPLES_PATH مضبوط صح، يستخدمه.
# 2. لو غير مضبوط، يجرب $HOME/fabric-samples.
# 3. لو القيمة placeholder من الشرح، يتجاهلها ويجرب المسار الافتراضي.

resolve_fabric_samples_path() {
  local configured_path="${FABRIC_SAMPLES_PATH:-}"
  local default_path="$HOME/fabric-samples"

  if [[ "$configured_path" == "/absolute/path/to/fabric-samples" || "$configured_path" == "/path/to/your/fabric-samples" ]]; then
    configured_path=""
  fi

  if [[ -n "$configured_path" && -d "$configured_path/test-network" ]]; then
    export FABRIC_SAMPLES_PATH="$configured_path"
    return 0
  fi

  if [[ -d "$default_path/test-network" ]]; then
    export FABRIC_SAMPLES_PATH="$default_path"
    return 0
  fi

  echo "Cannot find fabric-samples/test-network."
  echo "Set FABRIC_SAMPLES_PATH to the real fabric-samples directory."
  echo "Example: export FABRIC_SAMPLES_PATH=$HOME/fabric-samples"
  return 1
}
