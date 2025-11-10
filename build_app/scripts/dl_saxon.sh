#!/bin/bash

set -euo pipefail

echo "downloading saxon"

tmp_zip="$(mktemp saxonXXXX.zip)"
curl -LsSf -o "${tmp_zip}" https://sourceforge.net/projects/saxon/files/Saxon-HE/9.9/SaxonHE9-9-1-7J.zip/download

rm -rf saxon
unzip -q "${tmp_zip}" -d saxon
rm -f "${tmp_zip}"