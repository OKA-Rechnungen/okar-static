#!/bin/bash

set -euo pipefail

# ensure we execute from the repository root so relative paths resolve correctly
script_location_dir="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "${script_location_dir}/../.."

./build_app/scripts/dl_saxon.sh
./build_app/scripts/dl_imprint.sh
