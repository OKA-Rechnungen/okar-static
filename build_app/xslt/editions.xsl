<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet 
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:local="http://dse-static.foo.bar"
    version="2.0" exclude-result-prefixes="xsl tei xs local">
    <xsl:output encoding="UTF-8" media-type="text/html" method="html" version="5.0" indent="yes" omit-xml-declaration="yes"/>
    
    <xsl:import href="./partials/shared.xsl"/>
    <xsl:import href="./partials/osd-container.xsl" />
    <xsl:import href="./partials/html_navbar.xsl"/>
    <xsl:import href="./partials/html_head.xsl"/>
    <xsl:import href="./partials/html_footer.xsl"/>
     <xsl:import href="./partials/tei-facsimile.xsl"/>
    <xsl:import href="./partials/aot-options.xsl"/>

    <xsl:variable name="prev">
        <xsl:value-of select="replace(tokenize(data(tei:TEI/@prev), '/')[last()], '.xml', '.html')"/>
    </xsl:variable>
    <xsl:variable name="next">
        <xsl:value-of select="replace(tokenize(data(tei:TEI/@next), '/')[last()], '.xml', '.html')"/>
    </xsl:variable>
    <xsl:variable name="teiSource">
        <xsl:value-of select="data(tei:TEI/@xml:id)"/>
    </xsl:variable>
    <xsl:variable name="link">
        <xsl:value-of select="replace($teiSource, '.xml', '.html')"/>
    </xsl:variable>
    <xsl:variable name="doc_title">
        <xsl:value-of select=".//tei:titleStmt/tei:title[1]/text()"/>
    </xsl:variable>


    <xsl:template match="/">
        <html class="h-100">
            <head>
                <xsl:call-template name="html_head">
                    <xsl:with-param name="html_title" select="$doc_title"></xsl:with-param>
                </xsl:call-template>
                <!-- <style>
                    .navBarNavDropdown ul li:nth-child(2) {
                        display: none !important;
                    }
                </style> -->
            </head>
            <body class="d-flex flex-column h-100">
                <xsl:call-template name="nav_bar"/>
                <main class="hfeed site flex-grow" id="page">
                    <div class="edition_container ">
                        <div class="offcanvas offcanvas-start" tabindex="-1"
                            id="offcanvasNavigation" aria-labelledby="offcanvasNavigationLabel"
                            data-bs-scroll="true" data-bs-backdrop="false">
                            <div class="offcanvas-header" />
                            <div class="offcanvas-body" />
                        </div>
                        <div class="offcanvas offcanvas-end" tabindex="0" id="offcanvasOptions"
                            aria-labelledby="offcanvasOptionsLabel" data-bs-scroll="true"
                            data-bs-backdrop="false">
                        </div>
                        
                        <div class="row" id="edition_metadata">
                            <xsl:variable name="doc_type"
                                select="//tei:sourceDesc/tei:msDesc/tei:physDesc/tei:objectDesc/@form[1]"/>
                            <h2 align="center">
                                <xsl:value-of select="$doc_title"/>
                            </h2>
                            <div class="row" id="fa_links">
                                <div class="col-4"  style="text-align:right">
                                    <xsl:if test="ends-with($prev,'.html')">
                                        <h3>
                                            <a>
                                                <xsl:attribute name="href">
                                                    <xsl:value-of select="$prev"/>
                                                </xsl:attribute>
                                                <i class="fa-solid fa-caret-left left" title="zurück"/>
                                            </a>
                                        </h3>
                                    </xsl:if>
                                </div>
                                <div class="col-4 docinfo" style="text-align:center">
                                    <h3 align="center">
                                        <a href="{$teiSource}">
                                            <i class="fa-solid fa-file-code center" title="TEI/XML"/>
                                        </a>
                                    </h3>
                                </div>
                                <div class="col-4" style="text-align:left">
                                    <xsl:if test="ends-with($next, '.html')">
                                        <h3>
                                            <a>
                                                <xsl:attribute name="href">
                                                    <xsl:value-of select="$next"/>
                                                </xsl:attribute>
                                                <i class="fa-solid fa-caret-right right" title="weiter"/>
                                            </a>
                                        </h3>
                                    </xsl:if>
                                </div>
                            </div> 
                        </div>
                        <!--    THIS IS THE MAIN DIV -->                     
                        <div class="wp-transcript">
                            <div id="container-resize" class="row transcript active">
                                <!--  <div id="text-resize" class="col-md-4 col-lg-4 col-sm-1 text" /> -->
                                <div id="img-resize" class="col-md-6 col-lg-6 col-sm-12 facsimiles" >   <!-- OSD container (facsimiles).  Maybe 6 (1/2 of the total)-->
                                    <div id="viewer">
                                        <div id="container_facs_1" class="osd-container"/>
                                    </div>
                                </div>
                                <div id="text-resize" lang="de" class="col-md-6 col-lg-6 col-sm-12 text yes-index"> <!--- Maybe 6 (1/2 of the total) -->
                                    <div id="transcript">
                                        <!-- Limit transcript output to the TEI body content -->
                                        <xsl:apply-templates select="tei:TEI/tei:text/tei:body/node()"/>
                                    </div>
                                </div>
                            </div>
                            <!-- create list* elements for entities bs-modal -->
                        </div>
                    </div>
                </main>
                <xsl:call-template name="html_footer"/>
                <script src="https://cdnjs.cloudflare.com/ajax/libs/openseadragon/5.0.1/openseadragon.min.js"/>
                <script type="text/javascript" src="js/osd_scroll.js"></script>
                <script src="https://unpkg.com/de-micro-editor@0.3.4/dist/de-editor.min.js"></script>
                <script type="text/javascript" src="js/run.js"></script>
            </body>
        </html>
    </xsl:template>

    <xsl:template match="tei:pb[@n castable as xs:integer and xs:integer(@n) le 0]" priority="1"/>

    <xsl:template match="tei:pb">
        <xsl:variable name="facs" select="substring-after(data(@facs), '#')"/>
        <xsl:variable name="graphic_url" select="(ancestor::tei:TEI//tei:surface[@xml:id=$facs]/tei:graphic/@url)[1]"/>

        <xsl:variable name="page-number" as="xs:integer"
        select="if (@n castable as xs:integer and xs:integer(@n) &gt; 0)
            then xs:integer(@n)
            else xs:integer(count(preceding::tei:pb[
            not(@n)
            or (not(@n castable as xs:integer))
            or ((@n castable as xs:integer) and xs:integer(@n) &gt; 0)
            ])) + 1"/>

        <xsl:variable name="facs_url">
            <xsl:choose>
                <xsl:when test="string-length($graphic_url) &gt; 0">
                    <!-- Use the linked graphic file name, strip leading numeric prefixes and normalise extension -->
                    <xsl:value-of select="replace(replace($graphic_url, '^\d+_', ''), '\.[^.]+$', '.tif')"/>
                </xsl:when>
                <xsl:otherwise>
                    <!-- Fall back to a best guess derived from the TEI source and page index -->
                    <xsl:variable name="base-name" select="replace($teiSource, '\.xml$', '')"/>
                    <xsl:value-of select="concat($base-name, '_', format-number($page-number, '00000'), '.tif')"/>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:variable>

        <xsl:variable name="pb-type" select="if (@type) then @type else 'primary'"/>
        <xsl:variable name="witness-ref" select="if (@edRef) then (if (starts-with(@edRef, '#')) then @edRef else concat('#', @edRef)) else '#primary'"/>

        <span class="pb {$pb-type}" source="{$facs_url}" wit="{$witness-ref}" data-pb-type="{$pb-type}" data-page-number="{string($page-number)}"/>
    </xsl:template>
    <xsl:template match="tei:facsimile" />

</xsl:stylesheet>