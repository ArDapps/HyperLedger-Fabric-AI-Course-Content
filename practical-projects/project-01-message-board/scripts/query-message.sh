#!/usr/bin/env bash
set -euo pipefail

# هذا السكريبت يقرأ رسالة واحدة باستخدام message id.

if [ "$#" -ne 1 ]; then
  echo "Usage: $0 <message-id>"
  exit 1
fi

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

# نستخدم Org1 للقراءة، ويمكن عمل نسخة مشابهة لـ Org2.
source "$PROJECT_DIR/scripts/env-org1.sh"

# نقرأ رسالة واحدة من channel المشترك باستخدام دالة ReadMessage.
peer chaincode query \
  -C mychannel \
  -n messages \
  -c "{\"function\":\"ReadMessage\",\"Args\":[\"$1\"]}"
