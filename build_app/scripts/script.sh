#!/bin/bash

# hacky way to make sure the script 
# gets always run from parent-dir 
# so relative paths get resolved the right way
script_location_dir="${BASH_SOURCE[0]}"
cd $script_location_dir && cd ..
# run scripts
./build_app/scripts/dl_saxon.sh
./build_app/scripts/dl_imprint.sh
