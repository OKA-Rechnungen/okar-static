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
                <xsl:variable name="volumeId" select="replace(string(@xml:id), '\.xml$', '')"/>
                <xsl:variable name="volumeCol" select="concat($Facsimiles, '/', $volumeId)"/>
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
                </acdh:Resource>

                <xsl:if test="exists($graphics)">
                    <acdh:Collection rdf:about="{$volumeCol}">
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
                        <xsl:copy-of select="$constants"/>
                        <xsl:copy-of select="$constantsImg"/>
                    </acdh:Collection>

                    <xsl:for-each-group select="$graphics" group-by="@url">
                        <xsl:variable name="graphicUrl" select="string(current-grouping-key())"/>
                        <xsl:variable name="effectiveId" select="concat($volumeCol, '/', encode-for-uri($graphicUrl))"/>
                        <xsl:variable name="width" select="string(current-group()[1]/@width)"/>
                        <xsl:variable name="height" select="string(current-group()[1]/@height)"/>
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
                        <acdh:Resource rdf:about="{$effectiveId}">
                            <acdh:hasPid>create</acdh:hasPid>
                            <acdh:isPartOf rdf:resource="{$volumeCol}"/>
                            <!-- <acdh:hasAccessRestriction rdf:resource="https://vocabs.acdh.oeaw.ac.at/archeaccessrestrictions/public"/> -->
                            <acdh:hasLicense rdf:resource="https://vocabs.acdh.oeaw.ac.at/archelicenses/cc-by-4-0"/>
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
                    </xsl:for-each-group>
                </xsl:if>
            </xsl:for-each>
            <acdh:Resource rdf:about="https://id.acdh.oeaw.ac.at/okar/logo_okar.svg">
                <acdh:hasTitle xml:lang="de">Logo von „Oberkammeramtsrechnungsbücher der Stadt Wien“</acdh:hasTitle>
                <!--<acdh:hasPid>create</acdh:hasPid> -->
                <acdh:hasCategory rdf:resource="https://vocabs.acdh.oeaw.ac.at/archecategory/image"/>
                <acdh:hasFormat>image/+xml</acdh:hasFormat>
                <acdh:isTitleImageOf rdf:resource="https://id.acdh.oeaw.ac.at/okar"/>
                <xsl:copy-of select="$constants"/>
                <xsl:copy-of select="$constantsMeta"/>
            </acdh:Resource>
            <acdh:Metadata rdf:about="https://id.acdh.oeaw.ac.at/okar/vms.odd">
                <acdh:hasTitle xml:lang="de">XML/TEI Schema ODD für „Oberkammeramtsrechnungsbücher der Stadt Wien“</acdh:hasTitle>
                <acdh:hasDescription xml:lang="de">XML/TEI Schema ODD für „Oberkammeramtsrechnungsbücher der Stadt Wien“</acdh:hasDescription>
                <!-- <acdh:hasPid>create</acdh:hasPid> -->
                <acdh:hasCategory rdf:resource="https://vocabs.acdh.oeaw.ac.at/archecategory/other"/>
                <acdh:isMetadataFor rdf:resource="https://id.acdh.oeaw.ac.at/okar/editions"/>
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
