<xsl:stylesheet 
    xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:rdf="http://www.w3.org/1999/02/22-rdf-syntax-ns#"
    xmlns:acdh="https://vocabs.acdh.oeaw.ac.at/schema#"
    version="2.0" exclude-result-prefixes="#all">

    <xsl:output encoding="UTF-8" media-type="text/xml" method="xml" version="1.0" indent="yes" omit-xml-declaration="yes"/>
    <xsl:template match="/">
        <xsl:variable name="constants">
            <xsl:for-each select=".//node()[parent::acdh:RepoObject]">
                <xsl:copy-of select="."/>
            </xsl:for-each>
        </xsl:variable>
        <xsl:variable name="constantsImg">
            <xsl:for-each select=".//node()[parent::acdh:ImgObject]">
                <xsl:copy-of select="."/>
            </xsl:for-each>
        </xsl:variable>
        <xsl:variable name="TopColId">
            <xsl:value-of select="string(.//acdh:TopCollection/@rdf:about)"/>
        </xsl:variable>
        <xsl:variable name="Meta">
            <xsl:value-of select="concat($TopColId, '/meta')"/>
        </xsl:variable>
         <xsl:variable name="Editions">
            <xsl:value-of select="concat($TopColId, '/editions')"/>
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
                    <xsl:attribute name="rdf:about"><xsl:value-of select="@rdf:about"/></xsl:attribute>
                    <acdh:hasContributor rdf:resource="https://id.acdh.oeaw.ac.at/rklugseder"/>
                    <acdh:hasContributor rdf:resource="https://id.acdh.oeaw.ac.at/unterholzner"/>
                    <acdh:hasContributor rdf:resource="https://id.acdh.oeaw.ac.at/fsanzlazaro"/>
                    <acdh:hasContributor rdf:resource="https://id.acdh.oeaw.ac.at/dschopper"/> 
                    <acdh:hasMetadataCreator rdf:resource="https://id.acdh.oeaw.ac.at/fsanzlazaro"/>
                    <xsl:copy-of select="$constants"/>
                    <xsl:for-each select=".//acdh:*">
                        <xsl:copy-of select="."/>
                    </xsl:for-each>
                </acdh:Collection>
            </xsl:for-each>

             <xsl:for-each select=".//acdh:Collection[@rdf:about=$Meta]">
                <acdh:Collection>
                    <xsl:attribute name="rdf:about"><xsl:value-of select="@rdf:about"/></xsl:attribute>
                    <acdh:hasContributor rdf:resource="https://id.acdh.oeaw.ac.at/fsanzlazaro"/>
                    <acdh:hasMetadataCreator rdf:resource="https://id.acdh.oeaw.ac.at/fsanzlazaro"/>
                    <xsl:copy-of select="$constants"/>
                    <xsl:for-each select=".//acdh:*">
                        <xsl:copy-of select="."/>
                    </xsl:for-each>
                </acdh:Collection>
            </xsl:for-each>


            <xsl:for-each select="collection('../data/editions?select=*.xml')//tei:TEI">
                <!--TEIs-->
                <xsl:variable name="partOf">
                    <xsl:value-of select="concat(string(@xml:base), '/editions')"/>
                </xsl:variable>
                <xsl:variable name="id">
                    <xsl:value-of select="concat(string($TopColId), '/', string(@xml:id))"/>
                </xsl:variable>
                <acdh:Resource rdf:about="{$id}">
                    <!-- <acdh:hasPid>create</acdh:hasPid> -->
                    <acdh:hasLanguage rdf:resource="https://vocabs.acdh.oeaw.ac.at/iso6393/deu"/>
                    <acdh:hasTitle xml:lang="de">
                        <xsl:value-of select="concat(.//tei:titleStmt/tei:title[@type='main'][@level='a'], ' (', .//tei:titleStmt/tei:title[@type='desc'][@level='a'], ')')"/>
                    </acdh:hasTitle>
                    <acdh:hasAccessRestriction rdf:resource="https://vocabs.acdh.oeaw.ac.at/archeaccessrestrictions/public"/>
                    <acdh:hasCategory rdf:resource="https://vocabs.acdh.oeaw.ac.at/archecategory/text/tei"/>
                    <acdh:isPartOf rdf:resource="{$partOf}"/>
                    <acdh:hasContributor rdf:resource="https://id.acdh.oeaw.ac.at/rklugseder"/>
                    <acdh:hasContributor rdf:resource="https://id.acdh.oeaw.ac.at/unterholzner"/>
                    <acdh:hasContributor rdf:resource="https://id.acdh.oeaw.ac.at/fsanzlazaro"/>
                    <acdh:hasContributor rdf:resource="https://id.acdh.oeaw.ac.at/dschopper"/> 
                    <acdh:hasLicense rdf:resource="https://vocabs.acdh.oeaw.ac.at/archelicenses/cc-by-4-0"/>
                    <xsl:copy-of select="$constants"/>
                </acdh:Resource>
            </xsl:for-each>

            <acdh:Resource rdf:about="https://id.acdh.oeaw.ac.at/okar/logo_okar.svg">
                <acdh:isPartOf rdf:resource="{$Meta}"/>
                <acdh:hasTitle xml:lang="de">Logo von „Oberkammeramtsrechnungsbücher der Stadt Wien“</acdh:hasTitle>
                <!--<acdh:hasPid>create</acdh:hasPid> -->
                <acdh:hasLicensor rdf:resource="https://id.acdh.oeaw.ac.at/acdh"/>
                <acdh:hasContact rdf:resource="https://id.acdh.oeaw.ac.at/rklugseder"/>
                <acdh:hasOwner rdf:resource="https://id.acdh.oeaw.ac.at/acdh"/>
                <acdh:hasDepositor rdf:resource="https://id.acdh.oeaw.ac.at/rklugseder"/>
                <acdh:hasCurator rdf:resource="https://id.acdh.oeaw.ac.at/fsanzlazaro"/>
                <acdh:hasMetadataCreator rdf:resource="https://id.acdh.oeaw.ac.at/fsanzlazaro"/>
                <acdh:hasRightsHolder rdf:resource="https://id.acdh.oeaw.ac.at/oeaw"/>
                <acdh:hasLicense rdf:resource="https://vocabs.acdh.oeaw.ac.at/archelicenses/cc-by-4-0"/>
                <acdh:hasCategory rdf:resource="https://vocabs.acdh.oeaw.ac.at/archecategory/image"/>
                <acdh:hasAccessRestriction rdf:resource="https://vocabs.acdh.oeaw.ac.at/archeaccessrestrictions/public"/>
                <acdh:hasFormat>image/+xml</acdh:hasFormat>
                <acdh:isTitleImageOf rdf:resource="https://id.acdh.oeaw.ac.at/okar"/>
                <acdh:hasCategory rdf:resource="https://vocabs.acdh.oeaw.ac.at/archecategory/image"/>
                <acdh:hasCreator rdf:resource="https://id.acdh.oeaw.ac.at/fsanzlazaro"/>
                <acdh:hasContributor rdf:resource="https://id.acdh.oeaw.ac.at/fsanzlazaro"/>
            </acdh:Resource>
            <acdh:Metadata rdf:about="https://id.acdh.oeaw.ac.at/okar/vms.odd">
                 <acdh:isPartOf rdf:resource="{$Meta}"/>
                <acdh:hasTitle xml:lang="de">XML/TEI Schema ODD für „Oberkammeramtsrechnungsbücher der Stadt Wien“</acdh:hasTitle>
                <acdh:hasDescription xml:lang="de">XML/TEI Schema ODD für „Oberkammeramtsrechnungsbücher der Stadt Wien“</acdh:hasDescription>
                <!-- <acdh:hasPid>create</acdh:hasPid> -->
                <acdh:hasLicensor rdf:resource="https://id.acdh.oeaw.ac.at/acdh"/>
                <acdh:hasOwner rdf:resource="https://id.acdh.oeaw.ac.at/acdh"/>
                <acdh:hasDepositor rdf:resource="https://id.acdh.oeaw.ac.at/rklugseder"/>
                <acdh:hasCurator rdf:resource="https://id.acdh.oeaw.ac.at/fsanzlazaro"/>
                <acdh:hasMetadataCreator rdf:resource="https://id.acdh.oeaw.ac.at/fsanzlazaro"/>
                <acdh:hasRightsHolder rdf:resource="https://id.acdh.oeaw.ac.at/oeaw"/>
                <acdh:hasLicense rdf:resource="https://vocabs.acdh.oeaw.ac.at/archelicenses/cc-by-4-0"/>
                <acdh:hasCategory rdf:resource="https://vocabs.acdh.oeaw.ac.at/archecategory/text/tei"/>
                <acdh:hasAccessRestriction rdf:resource="https://vocabs.acdh.oeaw.ac.at/archeaccessrestrictions/public"/>
                <acdh:hasCreatedStartDate rdf:datatype="http://www.w3.org/2001/XMLSchema#date">2025-11-17</acdh:hasCreatedStartDate>
                <acdh:hasCreatedEndDate rdf:datatype="http://www.w3.org/2001/XMLSchema#date">2025-12-20</acdh:hasCreatedEndDate>
                <acdh:isMetadataFor rdf:resource="https://id.acdh.oeaw.ac.at/okar/editions"/>
                <acdh:hasCreator rdf:resource="https://id.acdh.oeaw.ac.at/fsanzlazaro"/>
            </acdh:Metadata>
            <acdh:Metadata rdf:about="https://id.acdh.oeaw.ac.at/okar/vms.rng">
                                <acdh:isPartOf rdf:resource="{$Meta}"/>
                <acdh:hasTitle xml:lang="de">TEI/XML Schema RNG für „Oberkammeramtsrechnungsbücher der Stadt Wien“</acdh:hasTitle>
                <acdh:hasDescription xml:lang="de">XML/TEI Schema RNG für „Oberkammeramtsrechnungsbücher der Stadt Wien“</acdh:hasDescription>
                <!-- <acdh:hasPid>create</acdh:hasPid> -->
                <acdh:hasLicensor rdf:resource="https://id.acdh.oeaw.ac.at/acdh"/>
                <acdh:hasOwner rdf:resource="https://id.acdh.oeaw.ac.at/acdh"/>
                <acdh:hasDepositor rdf:resource="https://id.acdh.oeaw.ac.at/rklugseder"/>
                <acdh:hasCurator rdf:resource="https://id.acdh.oeaw.ac.at/fsanzlazaro"/>
                <acdh:hasMetadataCreator rdf:resource="https://id.acdh.oeaw.ac.at/fsanzlazaro"/>
                <acdh:hasRightsHolder rdf:resource="https://id.acdh.oeaw.ac.at/oeaw"/>
                <acdh:hasLicense rdf:resource="https://vocabs.acdh.oeaw.ac.at/archelicenses/cc-by-4-0"/>
                <acdh:hasCategory rdf:resource="https://vocabs.acdh.oeaw.ac.at/archecategory/text/tei"/>
                <acdh:hasAccessRestriction rdf:resource="https://vocabs.acdh.oeaw.ac.at/archeaccessrestrictions/public"/>
                <acdh:hasCreatedStartDate rdf:datatype="http://www.w3.org/2001/XMLSchema#date">2023-07-19</acdh:hasCreatedStartDate>
                <acdh:hasCreatedEndDate rdf:datatype="http://www.w3.org/2001/XMLSchema#date">2025-10-15</acdh:hasCreatedEndDate>
                <acdh:isMetadataFor rdf:resource="https://id.acdh.oeaw.ac.at/okar/editions"/>
                <acdh:hasCreator rdf:resource="https://id.acdh.oeaw.ac.at/fsanzlazaro"/>
            </acdh:Metadata>
        </rdf:RDF>
    </xsl:template>   
</xsl:stylesheet>
