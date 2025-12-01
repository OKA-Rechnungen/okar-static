<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:acdh="https://vocabs.acdh.oeaw.ac.at/schema#" version="2.0" exclude-result-prefixes="#all">

    <xsl:output encoding="UTF-8" media-type="text/xml" method="xml" version="1.0" indent="yes" omit-xml-declaration="yes"/>
    <xsl:template match="/">
        <xsl:variable name="constants" select="acdh:ACDH/acdh:RepoObject/*"/>
        <xsl:variable name="constantsMeta" select="acdh:ACDH/acdh:MetaObject/*"/>
        <xsl:variable name="constantsEdition" select="acdh:ACDH/acdh:EditionObject/*"/>
        <xsl:variable name="constantsImg" select="acdh:ACDH/acdh:ImgObject/*"/>
        <xsl:variable name="TopColId">
            <xsl:value-of select="string(.//acdh:TopCollection/@rdf:about)"/>
        </xsl:variable>
        <xsl:variable name="Meta">
            <xsl:value-of select="concat($TopColId, '/meta')"/>
        </xsl:variable>
        <xsl:variable name="Editions">
            <xsl:value-of select="concat($TopColId, '/editions')"/>
        </xsl:variable>
        <xsl:variable name="Facsimiles">
            <xsl:value-of select="concat($TopColId, '/facsimiles')"/>
        </xsl:variable>
        <rdf:RDF xmlns:acdh="https://vocabs.acdh.oeaw.ac.at/schema#">
            <acdh:TopCollection>
                <xsl:attribute name="rdf:about">
                    <xsl:value-of select=".//acdh:TopCollection/@rdf:about"/>
                </xsl:attribute>
                <acdh:hasNextItem rdf:resource="{$Editions}"/>
                <xsl:for-each select=".//node()[parent::acdh:TopCollection]">
                    <xsl:copy-of select="."/>
                </xsl:for-each>
            </acdh:TopCollection>

            <xsl:for-each select=".//node()[parent::acdh:MetaAgents]">
                <xsl:copy-of select="."/>
            </xsl:for-each>

            <xsl:for-each select=".//acdh:Collection[@rdf:about=$Editions]">
                <acdh:Collection>
                    <xsl:attribute name="rdf:about">
                        <xsl:value-of select="@rdf:about"/>
                    </xsl:attribute>
                    <acdh:hasNextItem rdf:resource="{concat($TopColId, '/', (collection('../data/editions?select=*.xml')//tei:TEI)[1]/@xml:id)}"/>
                    <xsl:copy-of select="$constants"/>
                    <!-- <xsl:copy-of select="$constantsEdition"/> -->
                    <xsl:for-each select=".//acdh:*">
                        <xsl:copy-of select="."/>
                    </xsl:for-each>
                </acdh:Collection>
            </xsl:for-each>

            <xsl:for-each select=".//acdh:Collection[@rdf:about=$Meta]">
                <acdh:Collection>
                    <xsl:attribute name="rdf:about">
                        <xsl:value-of select="@rdf:about"/>
                    </xsl:attribute>
                    <acdh:hasContributor rdf:resource="https://id.acdh.oeaw.ac.at/fsanzlazaro"/>
                    <acdh:hasMetadataCreator rdf:resource="https://id.acdh.oeaw.ac.at/fsanzlazaro"/>
                    <acdh:hasNextItem rdf:resource="https://id.acdh.oeaw.ac.at/okar/logo_okar.svg"/>
                    <xsl:copy-of select="$constants"/>
                    <!-- <xsl:copy-of select="$constantsMeta"/> -->
                    <xsl:for-each select=".//acdh:*">
                        <xsl:copy-of select="."/>
                    </xsl:for-each>
                </acdh:Collection>
            </xsl:for-each>

            <xsl:for-each select=".//acdh:Collection[@rdf:about=$Facsimiles]">
                <acdh:Collection>
                    <xsl:attribute name="rdf:about">
                        <xsl:value-of select="@rdf:about"/>
                    </xsl:attribute>
                    <!-- <acdh:hasAccessRestriction rdf:resource="https://vocabs.acdh.oeaw.ac.at/archeaccessrestrictions/public"/> -->
                    <xsl:copy-of select="$constants"/>
                    <!-- <xsl:copy-of select="$constantsImg"/> -->
                    <!-- Add hasNextItem to first facsimile subcollection if present -->
                    <xsl:variable name="firstTEI" select="(collection('../data/editions?select=*.xml')//tei:TEI[.//tei:facsimile/tei:surface/tei:graphic])[1]"/>
                    <xsl:if test="$firstTEI">
                        <xsl:variable name="firstFacsName" select="replace(replace(document-uri($firstTEI), '^.*[\\/]', ''), '\\.xml$', '')"/>
                        <xsl:if test="string-length(normalize-space($firstFacsName))">
                            <acdh:hasNextItem rdf:resource="{concat($Facsimiles, '/', $firstFacsName)}"/>
                        </xsl:if>
                    </xsl:if>
                    <xsl:for-each select=".//acdh:*">
                        <xsl:copy-of select="."/>
                    </xsl:for-each>
                </acdh:Collection>
            </xsl:for-each>


            <xsl:for-each select="collection('../data/editions?select=*.xml')//tei:TEI">
                <xsl:variable name="id" select="concat(string($TopColId), '/', string(@xml:id))"/>
                <xsl:variable name="origDate" select="(.//tei:msContents/tei:p/tei:origDate)[1]"/>
                <xsl:variable name="origDateWhen" select="normalize-space(string($origDate/@when))"/>
                <xsl:variable name="origDateNotBefore" select="normalize-space(string($origDate/@notBefore))"/>
                <xsl:variable name="origDateNotAfter" select="normalize-space(string($origDate/@notAfter))"/>
                <xsl:variable name="contentDescriptionNodes" select=".//tei:msContents/tei:p[not(tei:origDate)]"/>
                <xsl:variable name="origDateDescription" select="normalize-space(string-join($contentDescriptionNodes//text(), ' '))"/>
                <xsl:variable name="shelfmark" select="normalize-space(string((.//tei:teiHeader/tei:fileDesc/tei:sourceDesc//tei:msIdentifier/tei:idno[@type='shelfmark'])[1]))"/>
                <xsl:variable name="origDateYear" select="if ($origDateWhen and matches($origDateWhen, '^-?\d{4}')) then replace($origDateWhen, '^(-?\d{4}).*$', '$1') else ''"/>
                <xsl:variable name="startYear" select="if ($origDateNotBefore and matches($origDateNotBefore, '^-?\d{4}')) then replace($origDateNotBefore, '^(-?\d{4}).*$', '$1') else ''"/>
                <xsl:variable name="endYear" select="if ($origDateNotAfter and matches($origDateNotAfter, '^-?\d{4}')) then replace($origDateNotAfter, '^(-?\d{4}).*$', '$1') else ''"/>
                <xsl:variable name="coverageIdentifierYear" select="if (string-length($origDateYear) &gt; 0) then $origDateYear else if (string-length($startYear) &gt; 0 and string-length($endYear) &gt; 0 and $startYear = $endYear) then $startYear else if (string-length($startYear) &gt; 0) then $startYear else $endYear"/>
                <xsl:variable name="coverageIdentifierUri" select="if (string-length($coverageIdentifierYear) &gt; 0 and $coverageIdentifierYear castable as xs:integer and xs:integer($coverageIdentifierYear) &gt;= 1500) then 'https://n2t.net/ark:/99152/p0qhb66' else 'https://n2t.net/ark:/99152/p0qhb66'"/>
                <xsl:variable name="coverageElements">
                <acdh:hasTag xml:lang="und">TEXT</acdh:hasTag>
                    <xsl:choose>
                        <xsl:when test="$origDateYear">
                            <acdh:hasTemporalCoverage xml:lang="und">
                                <xsl:value-of select="$origDateYear"/>
                            </acdh:hasTemporalCoverage>
                        </xsl:when>
                        <xsl:when test="$startYear and $endYear and $startYear = $endYear">
                            <acdh:hasTemporalCoverage>
                                <xsl:value-of select="$startYear"/>
                            </acdh:hasTemporalCoverage>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:if test="$origDateNotBefore">
                                <acdh:hasCoverageStartDate>
                                    <xsl:value-of select="$origDateNotBefore"/>
                                </acdh:hasCoverageStartDate>
                            </xsl:if>
                            <xsl:if test="$origDateNotAfter">
                                <acdh:hasCoverageEndDate>
                                    <xsl:value-of select="$origDateNotAfter"/>
                                </acdh:hasCoverageEndDate>
                            </xsl:if>
                        </xsl:otherwise>
                    </xsl:choose>
                </xsl:variable>
                <xsl:variable name="coverageIdentifierElements">
                    <xsl:if test="string-length($coverageIdentifierYear) &gt; 0">
                        <acdh:hasTemporalCoverageIdentifier>
				<xsl:value-of select="$coverageIdentifierUri"/>
                        </acdh:hasTemporalCoverageIdentifier>
                    </xsl:if>
                </xsl:variable>
                <xsl:variable name="descriptionElements">
                    <xsl:if test="$origDateDescription">
                        <acdh:hasDescription xml:lang="de">
                            <xsl:value-of select="$origDateDescription"/>
                        </acdh:hasDescription>
                    </xsl:if>
                </xsl:variable>
                <xsl:variable name="identifierElements">
                    <xsl:if test="$shelfmark">
                        <acdh:hasNonLinkedIdentifier>
                            <xsl:value-of select="$shelfmark"/>
                        </acdh:hasNonLinkedIdentifier>
                    </xsl:if>
                </xsl:variable>
                <!-- Prefer TEI @xml:id for volume id; fallback to document-uri basename. Use ends-with and substring to strip '.xml' robustly. -->
                <xsl:variable name="rawXmlId" select="normalize-space(string(@xml:id))"/>
                <xsl:variable name="rawDocName" select="replace(replace(document-uri(.), '^.*[\\/]', ''), '\\.[xX][mM][lL]$', '')"/>
                <xsl:variable name="volumeId">
                    <xsl:choose>
                        <xsl:when test="string-length($rawXmlId) &gt; 0">
                            <xsl:variable name="lowerId" select="lower-case($rawXmlId)"/>
                            <xsl:choose>
                                <xsl:when test="ends-with($lowerId, '.xml')">
                                    <xsl:value-of select="substring($rawXmlId, 1, string-length($rawXmlId) - 4)"/>
                                </xsl:when>
                                <xsl:otherwise>
                                    <xsl:value-of select="$rawXmlId"/>
                                </xsl:otherwise>
                            </xsl:choose>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:value-of select="$rawDocName"/>
                        </xsl:otherwise>
                    </xsl:choose>
                </xsl:variable>
                <!-- Ensure no trailing .xml in volumeCol even if volumeId may contain it -->
                <xsl:variable name="volumeCol" select="concat($Facsimiles, '/', replace($volumeId, '\\.[xX][mM][lL]$', ''))"/>
                <xsl:variable name="volumeTitle">
                    <xsl:choose>
                        <xsl:when test="normalize-space(.//tei:titleStmt/tei:title[@type='desc'][@level='a'][1])">
                            <xsl:value-of select="normalize-space(.//tei:titleStmt/tei:title[@type='desc'][@level='a'][1])"/>
                        </xsl:when>
                        <xsl:otherwise>
                            <xsl:value-of select="normalize-space(.//tei:titleStmt/tei:title[@type='main'][@level='a'][1])"/>
                        </xsl:otherwise>
                    </xsl:choose>
                </xsl:variable>
                <xsl:variable name="volumeLabel" select="if (string-length($volumeTitle) &gt; 0) then $volumeTitle else $volumeId"/>
                <xsl:variable name="graphics" select=".//tei:facsimile/tei:surface/tei:graphic[@url][not(starts-with(@url, 'http'))]"/>

                <acdh:Resource rdf:about="{$id}">
                    <acdh:hasLanguage rdf:resource="https://vocabs.acdh.oeaw.ac.at/iso6393/deu"/>
                    <acdh:hasTitle xml:lang="de">
                        <xsl:value-of select="concat(.//tei:titleStmt/tei:title[@type='main'][@level='a'], ' (', .//tei:titleStmt/tei:title[@type='desc'][@level='a'], ')')"/>
                    </acdh:hasTitle>
                    <xsl:copy-of select="$coverageElements/*"/>
                    <xsl:copy-of select="$coverageIdentifierElements/*"/>
                    <xsl:copy-of select="$descriptionElements/*"/>
                    <xsl:copy-of select="$identifierElements/*"/>
                    <xsl:copy-of select="$constants"/>
                    <xsl:copy-of select="$constantsEdition"/>
                    <xsl:variable name="teiPos" select="position()"/>
                    <xsl:variable name="nextTEI" select="(collection('../data/editions?select=*.xml')//tei:TEI)[$teiPos + 1]"/>
                    <xsl:choose>
                        <xsl:when test="$nextTEI">
                            <acdh:hasNextItem rdf:resource="{concat($TopColId, '/', $nextTEI/@xml:id)}"/>
                        </xsl:when>
                        <xsl:otherwise>
                            <acdh:hasNextItem rdf:resource="https://id.acdh.oeaw.ac.at/okar/logo_okar.svg"/>
                        </xsl:otherwise>
                    </xsl:choose>
                </acdh:Resource>

                <xsl:if test="exists($graphics)">
                    <xsl:variable name="nextTEIWithFacsimile" select="../following-sibling::tei:TEI[.//tei:facsimile/tei:surface/tei:graphic][1]"/>
                    <xsl:variable name="nextVolumeCol">
                        <xsl:choose>
                            <xsl:when test="$nextTEIWithFacsimile">
                                <xsl:value-of select="concat($Facsimiles, '/', replace(replace(document-uri($nextTEIWithFacsimile), '^.*[\\/]', ''), '\\.xml$', ''))"/>
                            </xsl:when>
                            <xsl:otherwise>
                                <xsl:value-of select="$Facsimiles"/>
                            </xsl:otherwise>
                        </xsl:choose>
                    </xsl:variable>
                    <xsl:variable name="nextVolumeFirstGraphic">
                        <xsl:if test="$nextTEIWithFacsimile">
                            <xsl:value-of select="concat($TopColId, '/', encode-for-uri(replace(replace($nextTEIWithFacsimile//tei:facsimile/tei:surface/tei:graphic[1]/@url, '^.*[\\/]', ''), '^[\\./]+', '')))"/>
                        </xsl:if>
                    </xsl:variable>
                    <!-- Find first image in this facsimile subcollection -->
                    <xsl:variable name="firstGraphic">
                        <xsl:if test="count($graphics) &gt; 0">
                                <xsl:value-of select="concat($TopColId, '/', encode-for-uri(replace(replace($graphics[1]/@url, '^.*[\\/]', ''), '^[\./]+', '')))"/>
                        </xsl:if>
                    </xsl:variable>
                    <acdh:Collection rdf:about="{$volumeCol}">
                            <!-- DEBUG: removed -->
                        <acdh:hasPid>create</acdh:hasPid>
                        <acdh:hasTitle xml:lang="de">
                            <xsl:value-of select="concat($volumeLabel, ' – Faksimiles')"/>
                        </acdh:hasTitle>
                        <acdh:hasDescription xml:lang="de">
                            <xsl:value-of select="concat('Digitalisierte Seiten des Bandes ', $volumeLabel)"/>
                        </acdh:hasDescription>
                        <acdh:hasSpatialCoverage rdf:resource="https://id.acdh.oeaw.ac.at/vienna" /> 
                        <xsl:copy-of select="$coverageElements/*"/>
                        <xsl:copy-of select="$coverageIdentifierElements/*"/>
                        <xsl:copy-of select="$descriptionElements/*"/>
                        <xsl:copy-of select="$identifierElements/*"/>
                        <acdh:isPartOf rdf:resource="{$Facsimiles}"/>
                        <!-- hasNextItem to first image if present, else to next volume col -->
                        <xsl:choose>
                            <xsl:when test="normalize-space($firstGraphic)">
                                <acdh:hasNextItem rdf:resource="{$firstGraphic}"/>
                            </xsl:when>
                            <xsl:when test="string-length($nextVolumeFirstGraphic) &gt; 0">
                                <acdh:hasNextItem rdf:resource="{$nextVolumeFirstGraphic}"/>
                            </xsl:when>
                            <xsl:otherwise>
                                <acdh:hasNextItem rdf:resource="{$nextVolumeCol}"/>
                            </xsl:otherwise>
                        </xsl:choose>
                        <xsl:copy-of select="$constants"/>
                        <xsl:copy-of select="$constantsImg"/>
                    </acdh:Collection>

                    <xsl:variable name="graphicsList" select="$graphics"/>
<xsl:for-each select="$graphics">
    <xsl:variable name="graphicUrl" select="string(@url)"/>
    <xsl:variable name="graphicFilename" select="replace(replace($graphicUrl, '^.*[\\/]', ''), '^[\\./]+', '')"/>
    <xsl:variable name="effectiveId" select="concat($TopColId, '/', encode-for-uri($graphicFilename))"/>
    <xsl:variable name="width" select="string(@width)"/>
    <xsl:variable name="height" select="string(@height)"/>
    <xsl:variable name="extentValue">
        <xsl:choose>
            <xsl:when test="$width and $height">
                <xsl:value-of select="concat($width, ' × ', $height)"/>
            </xsl:when>
            <xsl:when test="$width">
                <xsl:value-of select="$width"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:value-of select="$height"/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:variable>
    <!-- compute next-node position and uri; only emit hasNextItem when a next image exists -->
    <xsl:variable name="pos" select="position()"/>
    <xsl:variable name="nextNode" select="$graphics[$pos + 1]"/>
    <xsl:variable name="nextGraphicUri" select="if ($nextNode) then concat($TopColId, '/', encode-for-uri(replace(replace($nextNode/@url, '^.*[\\/]', ''), '^[\\./]+', ''))) else ''"/>
    <xsl:variable name="nextVolumeFirstGraphic" select="''"/>
    <acdh:Resource rdf:about="{$effectiveId}">
        <acdh:hasPid>create</acdh:hasPid>
        <acdh:isPartOf rdf:resource="{$volumeCol}"/>
        <xsl:if test="$nextNode or string-length($nextVolumeFirstGraphic) &gt; 0">
            <acdh:hasNextItem rdf:resource="{if ($nextNode) then $nextGraphicUri else $nextVolumeFirstGraphic}"/>
        </xsl:if>
        <!-- <acdh:hasAccessRestriction rdf:resource="https://vocabs.acdh.oeaw.ac.at/archeaccessrestrictions/public"/> -->
        <!-- <acdh:hasLicense rdf:resource="https://vocabs.acdh.oeaw.ac.at/archelicenses/cc-by-4-0"/> -->
        <acdh:hasCategory rdf:resource="https://vocabs.acdh.oeaw.ac.at/archecategory/image"/>
        <acdh:hasTag xml:lang="en">TEXT</acdh:hasTag>
        <acdh:hasFormat>image/tiff</acdh:hasFormat>
        <acdh:hasTitle xml:lang="de">
            <xsl:value-of select="concat($volumeLabel, ' – ', $graphicUrl)"/>
        </acdh:hasTitle>
        <!-- <acdh:hasUrl>
            <xsl:value-of select="$graphicUrl"/>
        </acdh:hasUrl> -->
        <xsl:if test="string-length($extentValue) &gt; 0">
            <acdh:hasExtent xml:lang="und">
                <xsl:value-of select="$extentValue"/>
            </acdh:hasExtent>
        </xsl:if>
        <xsl:copy-of select="$constants"/>
        <xsl:copy-of select="$constantsImg"/>
    </acdh:Resource>
                    </xsl:for-each>
                </xsl:if>
            </xsl:for-each>
            <acdh:Resource rdf:about="https://id.acdh.oeaw.ac.at/okar/logo_okar.svg">
                <acdh:hasTitle xml:lang="de">Logo von „Oberkammeramtsrechnungsbücher der Stadt Wien“</acdh:hasTitle>
                <!--<acdh:hasPid>create</acdh:hasPid> -->
                <acdh:hasCategory rdf:resource="https://vocabs.acdh.oeaw.ac.at/archecategory/image"/>
                <acdh:hasFormat>image/svg+xml</acdh:hasFormat>
                <acdh:isTitleImageOf rdf:resource="https://id.acdh.oeaw.ac.at/okar"/>
                <acdh:hasNextItem rdf:resource="https://id.acdh.oeaw.ac.at/okar/vms.odd"/>
                <xsl:copy-of select="$constants"/>
                <xsl:copy-of select="$constantsMeta"/>
            </acdh:Resource>
            <acdh:Metadata rdf:about="https://id.acdh.oeaw.ac.at/okar/vms.odd">
                <acdh:hasTitle xml:lang="de">XML/TEI Schema ODD für „Oberkammeramtsrechnungsbücher der Stadt Wien“</acdh:hasTitle>
                <acdh:hasDescription xml:lang="de">XML/TEI Schema ODD für „Oberkammeramtsrechnungsbücher der Stadt Wien“</acdh:hasDescription>
                <!-- <acdh:hasPid>create</acdh:hasPid> -->
                <acdh:hasCategory rdf:resource="https://vocabs.acdh.oeaw.ac.at/archecategory/other"/>
                <acdh:isMetadataFor rdf:resource="https://id.acdh.oeaw.ac.at/okar/editions"/>
                <acdh:hasNextItem rdf:resource="https://id.acdh.oeaw.ac.at/okar/vms.rng"/>
                <xsl:copy-of select="$constants"/>
                <xsl:copy-of select="$constantsMeta"/>
            </acdh:Metadata>
            <acdh:Metadata rdf:about="https://id.acdh.oeaw.ac.at/okar/vms.rng">
                <acdh:hasTitle xml:lang="de">TEI/XML Schema RNG für „Oberkammeramtsrechnungsbücher der Stadt Wien“</acdh:hasTitle>
                <acdh:hasDescription xml:lang="de">XML/TEI Schema RNG für „Oberkammeramtsrechnungsbücher der Stadt Wien“</acdh:hasDescription>
                <!-- <acdh:hasPid>create</acdh:hasPid> -->
                <acdh:hasCategory rdf:resource="https://vocabs.acdh.oeaw.ac.at/archecategory/other"/>
                <acdh:isMetadataFor rdf:resource="https://id.acdh.oeaw.ac.at/okar/editions"/>
                <xsl:copy-of select="$constants"/>
                <xsl:copy-of select="$constantsMeta"/>
            </acdh:Metadata>
        </rdf:RDF>
    </xsl:template>
</xsl:stylesheet>
