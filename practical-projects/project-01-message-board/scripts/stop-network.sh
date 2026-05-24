#!/usr/bin/env bash
set -euo pipefail

# هذا السكريبت يوقف test-network ويحذف containers والـ crypto المؤقتة.
# استخدمه عندما تريد البدء من جديد أو تنظيف Docker.

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
source "$PROJECT_DIR/scripts/resolve-fabric-samples.sh"
resolve_fabric_samples_path

cd "$FABRIC_SAMPLES_PATH/test-network"

# network.sh down هو أمر الإيقاف الرسمي في Fabric samples.
./network.sh down
