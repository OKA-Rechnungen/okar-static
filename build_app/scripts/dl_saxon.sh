#!/bin/bash

set -euo pipefail

echo "downloading saxon"

download_dir="saxon"
mkdir -p "${download_dir}"

curl -LsSf -o "${download_dir}/saxon9he.jar" \
	https://repo1.maven.org/maven2/net/sf/saxon/Saxon-HE/9.9.1-7/Saxon-HE-9.9.1-7.jar

echo "saxon9he.jar downloaded to ${download_dir}" >&2