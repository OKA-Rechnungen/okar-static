#!/bin/bash

echo "fetching transkriptions from data_repo"
rm -rf data/
curl -LO https://github.com/oka-rechnungen/okar-data/archive/refs/heads/main.zip
unzip main

mv ./okar-data-main/data/ .

rm main.zip
rm -rf ./okar-data-main

echo "fetch imprint"
./build_app/scripts/dl_imprint.sh
