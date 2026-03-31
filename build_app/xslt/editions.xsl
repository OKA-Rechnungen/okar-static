<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:local="http://dse-static.foo.bar" version="2.0" exclude-result-prefixes="xsl tei xs local">
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
        <html class="h-100" lang="de">
            <head>
                <xsl:call-template name="html_head">
                    <xsl:with-param name="html_title" select="$doc_title"></xsl:with-param>
                </xsl:call-template>
                <!-- <style>
                    .navBarNavDropdown ul li:nth-child(2) {
                        display: none !important;
                    }
                </style> -->
                <link rel="stylesheet" href="css/toc.css" type="text/css"/>
            </head>
            <body class="d-flex flex-column h-100 has-site-top page-edition">
                <main class="hfeed site flex-grow" id="page">
                    <div class="edition_container">
                        <div class="offcanvas offcanvas-start" tabindex="-1" id="offcanvasNavigation" aria-labelledby="offcanvasNavigationLabel" data-bs-scroll="true" data-bs-backdrop="false">
                            <div class="offcanvas-header" />
                            <div class="offcanvas-body" />
                        </div>
                        <div class="offcanvas offcanvas-end" tabindex="0" id="offcanvasOptions" aria-labelledby="offcanvasOptionsLabel" data-bs-scroll="true" data-bs-backdrop="false">
                        </div>

                        <!-- Two-column layout: metadata left, content right -->
                        <div class="edition-two-columns">
                            <div class="edition-header-slot">
                                <xsl:call-template name="nav_bar"/>
                            </div>
                            <!-- Left column: metadata -->
                            <aside class="edition-col-left">
                                <div id="edition_metadata">
                                    <xsl:variable name="doc_type" select="//tei:sourceDesc/tei:msDesc/tei:physDesc/tei:objectDesc/@form[1]"/>
                                    <h2 class="edition-title">
                                        <xsl:value-of select="$doc_title"/>
                                    </h2>
                                    <xsl:variable name="msDesc" select="//tei:sourceDesc/tei:msDesc"/>
                                    <xsl:variable name="msId" select="$msDesc/tei:msIdentifier"/>
                                    <xsl:variable name="msContents" select="$msDesc/tei:msContents"/>
                                    <xsl:variable name="shelfmark" select="$msId/tei:idno[@type='shelfmark'][1]"/>
                                    <xsl:variable name="repoName" select="($msId/tei:repository/tei:orgName[@xml:lang='de'], $msId/tei:repository/tei:orgName[1], $msId/tei:institution/tei:orgName[@xml:lang='de'], $msId/tei:institution/tei:orgName[1])[1]"/>
                                    <xsl:variable name="collection" select="$msId/tei:collection[1]"/>
                                    <xsl:variable name="origDate" select="$msContents//tei:origDate[1]"/>
                                    <xsl:variable name="beilageLabels" as="xs:string*" select="distinct-values(( //tei:standOff//tei:spanGrp//tei:span[@type='section'][matches(@subtype, '^Beilage(\s|$)')]/@subtype, //tei:TEI/tei:text//tei:milestone[@type='section'][matches(@subtype, '^Beilage(\s|$)')]/@subtype
                                        ))"/>
                                    <xsl:variable name="origDateText">
                                        <xsl:choose>
                                            <xsl:when test="$origDate/@when">
                                                <xsl:variable name="when" select="string($origDate/@when)"/>
                                                <xsl:value-of select="if (matches($when, '^\d{4}')) then substring($when, 1, 4) else normalize-space($when)"/>
                                            </xsl:when>
                                            <xsl:when test="$origDate/@from and $origDate/@to">
                                                <xsl:variable name="from" select="string($origDate/@from)"/>
                                                <xsl:variable name="to" select="string($origDate/@to)"/>
                                                <xsl:variable name="fromYear" select="if (matches($from, '^\d{4}')) then substring($from, 1, 4) else normalize-space($from)"/>
                                                <xsl:variable name="toYear" select="if (matches($to, '^\d{4}')) then substring($to, 1, 4) else normalize-space($to)"/>
                                                <xsl:value-of select="concat($fromYear, '–', $toYear)"/>
                                            </xsl:when>
                                            <xsl:otherwise>
                                                <xsl:value-of select="normalize-space($origDate)"/>
                                            </xsl:otherwise>
                                        </xsl:choose>
                                    </xsl:variable>
                                    <xsl:variable name="contentNote" select="normalize-space(($msContents/tei:summary[normalize-space()], $msContents/tei:p[normalize-space(string-join(.//text(), ' '))][1])[1])"/>

                                    <xsl:if test="$shelfmark or string($repoName) or string($collection) or string($origDateText) or string($contentNote) or exists($beilageLabels)">
                                        <details class="edition-metadata-collapsible" open="open">
                                            <summary class="edition-metadata-summary">Bibliographische Angabe</summary>
                                            <dl class="edition-metadata-list">
                                                <xsl:if test="$shelfmark">
                                                    <dt>Signatur</dt>
                                                    <dd>
                                                        <xsl:value-of select="$shelfmark"/>
                                                    </dd>
                                                </xsl:if>
                                                <xsl:if test="string($repoName)">
                                                    <dt>Archiv</dt>
                                                    <dd>
                                                        <xsl:value-of select="$repoName"/>
                                                    </dd>
                                                </xsl:if>
                                                <xsl:if test="string($collection)">
                                                    <dt>Sammlung</dt>
                                                    <dd>
                                                        <xsl:value-of select="$collection"/>
                                                    </dd>
                                                </xsl:if>
                                                <xsl:if test="string($origDateText)">
                                                    <dt>Datierung</dt>
                                                    <dd>
                                                        <xsl:value-of select="$origDateText"/>
                                                    </dd>
                                                </xsl:if>
                                                <xsl:if test="exists($beilageLabels)">
                                                    <div>
                                                        <span class="fw-bold">Beilage:</span>
                                                        <xsl:text></xsl:text>
                                                        <xsl:value-of select="string-join($beilageLabels, ', ')"/>
                                                    </div>
                                                </xsl:if>
                                                <xsl:if test="string($contentNote)">
                                                    <dt>Inhalt</dt>
                                                    <dd>
                                                        <xsl:value-of select="$contentNote"/>
                                                    </dd>
                                                </xsl:if>
                                            </dl>
                                        </details>
                                    </xsl:if>
                                    <div class="left-column-section flex">
                                        <button id="milestone-nav-btn" type="button" class="pill-btn" data-bs-toggle="modal" data-bs-target="#milestoneModal">
                                        Gliederung
                                        </button>
                                    </div>
                                </div>
                            </aside>

                            <!-- Right column: facsimile and transcript -->
                            <div class="edition-col-right">
                                <div class="edition-nav-links">
                                    <xsl:if test="ends-with($prev,'.html')">
                                        <a class="edition-nav-prev" href="{$prev}" title="zurück">
                                            <span aria-hidden="true">&#x25C0;&#xFE0E;</span> Zurück
                                        </a>
                                    </xsl:if>
                                    <a href="{$teiSource}" class="edition-tei-link" title="TEI/XML">
                                        <i class="fa-solid fa-file-code"></i> TEI/XML
                                    </a>
                                    <xsl:if test="ends-with($next, '.html')">
                                        <a class="edition-nav-next" href="{$next}" title="weiter">
                                            Weiter <span aria-hidden="true">&#x25B6;&#xFE0E;</span>
                                        </a>
                                    </xsl:if>
                                </div>
                                <input type="checkbox" id="edition-mobile-view-toggle" class="edition-mobile-view-input"/>
                                <div class="view-toggle">
                                    <label for="edition-mobile-view-toggle" class="pill-btn toc-view-toggle-btn edition-mobile-view-toggle" role="button">
                                        <span class="edition-mobile-view-label edition-mobile-view-label--facs">Transkription</span>
                                        <span class="edition-mobile-view-label edition-mobile-view-label--text">Faksimile</span>
                                    </label>
                                </div>
                                <div class="wp-transcript">
                                    <div id="container-resize" class="row transcript active">
                                        <div id="img-resize" class="col-md-6 col-lg-6 col-sm-12 facsimiles">
                                            <div id="viewer">
                                                <div id="container_facs_1" class="osd-container"/>
                                                <div class="edition-facsimile-touch-guard" aria-hidden="true"></div>
                                            </div>
                                        </div>
                                        <div id="text-resize" lang="de" class="col-md-6 col-lg-6 col-sm-12 text yes-index">
                                            <div class="page-nav-container"/>
                                            <div id="transcript">
                                                <xsl:apply-templates select="tei:TEI/tei:text/tei:body/node()"/>
                                            </div>
                                        </div>

                                    </div>
                                </div>
                            </div>
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
                <script type="text/javascript" src="js/run.js?v=20260312f"></script>
            </body>
        </html>
    </xsl:template>

    <xsl:template match="tei:pb[@n castable as xs:integer and xs:integer(@n) le 0]" priority="1"/>

    <xsl:template match="tei:pb">
        <xsl:variable name="facs" select="substring-after(data(@facs), '#')"/>
        <xsl:variable name="graphic_url" select="(ancestor::tei:TEI//tei:surface[@xml:id=$facs]/tei:graphic/@url)[1]"/>

        <xsl:variable name="page-number" as="xs:integer" select="if (@n castable as xs:integer and xs:integer(@n) &gt; 0)
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
            <xsl:sequence select="preceding::tei:pb[1]"/>
        </xsl:variable>
        <xsl:variable name="page-number" select="local:compute-page-number($target-pb)"/>
        <span class="milestone-anchor visually-hidden" aria-hidden="true" data-unit="{$unit}" data-type="{$type}" data-subtype="{$subtype}" data-n="{$n}">
            <xsl:if test="$page-number">
                <xsl:attribute name="data-page-number">
                    <xsl:value-of select="$page-number"/>
                </xsl:attribute>
            </xsl:if>
        </span>
    </xsl:template>

</xsl:stylesheet>