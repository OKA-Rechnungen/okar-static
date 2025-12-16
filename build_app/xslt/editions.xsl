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

    <xsl:function name="local:compute-page-number" as="xs:integer?">
        <xsl:param name="pb" as="element(tei:pb)?"/>
        <xsl:choose>
            <xsl:when test="not($pb)">
                <xsl:sequence select="()"/>
            </xsl:when>
            <xsl:otherwise>
                <xsl:variable name="n-raw" select="$pb/@n"/>
                <xsl:sequence select="
                    if ($n-raw castable as xs:integer and xs:integer($n-raw) gt 0) then xs:integer($n-raw)
                    else xs:integer(count($pb/preceding::tei:pb[
                        not(@n)
                        or (not(@n castable as xs:integer))
                        or ((@n castable as xs:integer) and xs:integer(@n) gt 0)
                    ])) + 1
                "/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:function>

    <xsl:function name="local:page-number-for-node" as="xs:integer?">
        <xsl:param name="context" as="node()?"/>
        <xsl:variable name="target-pb" select="
            if ($context instance of element(tei:pb)) then $context
            else $context/following::tei:pb[1]
        "/>
        <xsl:sequence select="local:compute-page-number($target-pb)"/>
    </xsl:function>

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
                            <div class="d-flex justify-content-end mb-2">
                                <button id="milestone-nav-btn" type="button" class="btn btn-outline-primary btn-sm" data-bs-toggle="modal" data-bs-target="#milestoneModal">
                                    Gliederung
                                </button>
                            </div>
                            <div class="row" id="fa_links">
                                <div class="col-4"  style="text-align:right">
                                    <xsl:if test="ends-with($prev,'.html')">
                                        <h3>
                                            <a>
                                                <xsl:attribute name="href">
                                                    <xsl:value-of select="$prev"/>
                                                </xsl:attribute>
                                                <span class="left" title="zurück" aria-hidden="true">&#x25C0;&#xFE0E;</span>
                                            </a>
                                        </h3>
                                    </xsl:if>
                                </div>
                                <div class="col-4 docinfo" style="text-align:center">
                                    <h3 align="center">
                                        <a href="{$teiSource}">
                                            <i class="fa-solid fa-file-code center" title="TEI/XML"></i>
                                        </a>
                                    </h3>
                                    <xsl:variable name="msDesc" select="//tei:sourceDesc/tei:msDesc"/>
                                    <xsl:variable name="msId" select="$msDesc/tei:msIdentifier"/>
                                    <xsl:variable name="msContents" select="$msDesc/tei:msContents"/>
                                    <xsl:variable name="shelfmark" select="$msId/tei:idno[@type='shelfmark'][1]"/>
                                    <xsl:variable name="repoName" select="($msId/tei:repository/tei:orgName[@xml:lang='de'], $msId/tei:repository/tei:orgName[1], $msId/tei:institution/tei:orgName[@xml:lang='de'], $msId/tei:institution/tei:orgName[1])[1]"/>
                                    <xsl:variable name="collection" select="$msId/tei:collection[1]"/>
                                    <xsl:variable name="origDate" select="$msContents//tei:origDate[1]"/>
                                    <xsl:variable name="origDateText">
                                        <xsl:choose>
                                            <xsl:when test="$origDate/@when">
                                                <xsl:value-of select="$origDate/@when"/>
                                            </xsl:when>
                                            <xsl:when test="$origDate/@from and $origDate/@to">
                                                <xsl:value-of select="concat($origDate/@from, ' - ', $origDate/@to)"/>
                                            </xsl:when>
                                            <xsl:otherwise>
                                                <xsl:value-of select="normalize-space($origDate)"/>
                                            </xsl:otherwise>
                                        </xsl:choose>
                                    </xsl:variable>
                                    <xsl:variable name="contentNote" select="normalize-space(($msContents/tei:summary[normalize-space()], $msContents/tei:p[normalize-space(string-join(.//text(), ' '))][1])[1])"/>

                                    <xsl:if test="$shelfmark or string($repoName) or string($collection) or string($origDateText) or string($contentNote)">
                                        <div class="metadata small">
                                            <xsl:if test="$shelfmark">
                                                <div><span class="fw-bold">Signatur:</span> <xsl:value-of select="$shelfmark"/></div>
                                            </xsl:if>
                                            <xsl:if test="string($repoName)">
                                                <div><span class="fw-bold">Archiv:</span> <xsl:value-of select="$repoName"/></div>
                                            </xsl:if>
                                            <xsl:if test="string($collection)">
                                                <div><span class="fw-bold">Sammlung:</span> <xsl:value-of select="$collection"/></div>
                                            </xsl:if>
                                            <xsl:if test="string($origDateText)">
                                                <div><span class="fw-bold">Datierung:</span> <xsl:value-of select="$origDateText"/></div>
                                            </xsl:if>
                                            <xsl:if test="string($contentNote)">
                                                <div><span class="fw-bold">Inhalt:</span> <xsl:value-of select="$contentNote"/></div>
                                            </xsl:if>
                                        </div>
                                    </xsl:if>
                                </div>
                                <div class="col-4" style="text-align:left">
                                    <xsl:if test="ends-with($next, '.html')">
                                        <h3>
                                            <a>
                                                <xsl:attribute name="href">
                                                    <xsl:value-of select="$next"/>
                                                </xsl:attribute>
                                                <span class="right" title="weiter" aria-hidden="true">&#x25B6;&#xFE0E;</span>
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
                <div class="modal fade" id="milestoneModal" tabindex="-1" aria-hidden="true">
                    <div class="modal-dialog modal-dialog-scrollable modal-lg">
                        <div class="modal-content">
                            <div class="modal-header">
                                <h5 class="modal-title" id="milestoneModalLabel">Inhaltliche Gliederung</h5>
                                <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                            </div>
                            <div class="modal-body">
                                <div id="milestone-nav-list" class="list-group"></div>
                                <div id="milestone-empty-state" class="text-muted small" style="display:none;">Keine Gliederungseinträge gefunden.</div>
                            </div>
                        </div>
                    </div>
                </div>
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

    <xsl:template match="tei:milestone">
        <xsl:variable name="unit" select="string(@unit)"/>
        <xsl:variable name="type" select="string(@type)"/>
        <xsl:variable name="subtype" select="string(@subtype)"/>
        <xsl:variable name="n" select="string(@n)"/>
        <xsl:variable name="target-pb" as="element(tei:pb)?">
            <xsl:choose>
                <xsl:when test="lower-case($type) = 'summary'">
                    <xsl:sequence select="preceding::tei:pb[1]"/>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:sequence select="following::tei:pb[1]"/>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <xsl:variable name="page-number" select="local:compute-page-number($target-pb)"/>
        <span class="milestone-anchor visually-hidden" aria-hidden="true"
            data-unit="{$unit}" data-type="{$type}" data-subtype="{$subtype}" data-n="{$n}">
            <xsl:if test="$page-number">
                <xsl:attribute name="data-page-number">
                    <xsl:value-of select="$page-number"/>
                </xsl:attribute>
            </xsl:if>
        </span>
    </xsl:template>

</xsl:stylesheet>