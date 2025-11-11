#!/bin/bash

REDMINE_ID="24844"
IMPRINT_XML=data/meta/imprint.xml
mkdir -p data/meta
touch ${IMPRINT_XML}
echo '<?xml version="1.0" encoding="UTF-8"?>' > ${IMPRINT_XML}
echo "<root>" >> ${IMPRINT_XML}
echo '<div lang="de">' >> ${IMPRINT_XML}
curl "https://imprint.acdh.oeaw.ac.at/${REDMINE_ID}?format=xhtml&locale=de" >> ${IMPRINT_XML}
echo "</div>"  >> ${IMPRINT_XML}
echo '<div lang="en">' >> ${IMPRINT_XML}
curl "https://imprint.acdh.oeaw.ac.at/${REDMINE_ID}?format=xhtml&locale=en" >> ${IMPRINT_XML}
echo "</div>" >> ${IMPRINT_XML}
echo "</root>" >> ${IMPRINT_XML}
