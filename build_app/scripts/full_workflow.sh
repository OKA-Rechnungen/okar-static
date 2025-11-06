#!/bin/bash
ANT_OPTS: -Xmx6g
source env.local
rm -f html/*html html/*xml
build_app/scripts/script.sh
build_app/scripts/fetch_data.sh
ant -f build_app/xslt/build.xml
