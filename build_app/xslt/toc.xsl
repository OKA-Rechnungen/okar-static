<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" version="2.0" exclude-result-prefixes="xsl tei xs">

    <xsl:output encoding="UTF-8" media-type="text/html" method="html" version="5.0" indent="yes" omit-xml-declaration="yes"/>

    <xsl:import href="./partials/html_navbar.xsl"/>
    <xsl:import href="./partials/html_pageheader.xsl"/>
    <xsl:import href="./partials/html_head.xsl"/>
    <xsl:import href="partials/html_footer.xsl"/>
    <xsl:template match="/">
        <xsl:variable name="doc_title" select="'Editionseinheiten'"/>
        <html lang="de">
            <head>
                <xsl:call-template name="html_head">
                    <xsl:with-param name="html_title" select="$doc_title"/>
                </xsl:call-template>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/instantsearch.css@8.1.0/themes/algolia-min.css"/>
                <link rel="stylesheet" href="css/ts_search.css" type="text/css"/>
            </head>
            <body class="d-flex flex-column offset-burger">
                <xsl:call-template name="nav_bar">
                    <xsl:with-param name="responsive_behaviour" select="true()"/>
                </xsl:call-template>
                <xsl:call-template name="page_header">
                    <xsl:with-param name="responsive_behaviour" select="'hide_on_desktop'"/>
                </xsl:call-template>
                <main id="tocPage">
                    <div id="searchContainer" class="container-fluid">
                        <div class="row">
                            <div class="col-left">
                                <div class="toc-left-section">
                                    <div class="d-flex justify-content-center">
                                        <button type="button" class="pill-btn toc-view-toggle-btn" id="detailViewToggle" aria-pressed="false">Detailansicht</button>
                                    </div>
                                </div>
                                <details class="toc-left-section section-container facet-collapsible facet-collapsible--with-heading" open="open">
                                    <summary class="facet-collapsible-summary">Eingrenzungen</summary>
                                    <div class="toc-left-section toc-mobile-searchbox">
                                        <h3 class="toc-left-heading">Suche</h3>
                                        <div class="toc-search-pill">
                                            <div class="toc-search-pill-inner">
                                                <form action="search.html" method="get">
                                                    <input id="searchbox-mobile" class="form-control form-control-sm navbar-search" type="search" name="q" placeholder="Suche…" autocomplete="off"/>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                    <div class="toc-left-section">
                                        <h3 class="toc-left-heading">Rechnungszeitraum</h3>
                                        <div id="yearSlider"></div>
                                        <div id="yearCount" class="toc-year-count"></div>
                                    </div>
                                    <div class="toc-left-section">
                                        <h3 class="toc-left-heading">Kämmerer</h3>
                                        <div id="refinement-list-kaemmerer"></div>
                                    </div>
                                    <div class="toc-left-section">
                                        <h3 class="toc-left-heading">Beilage</h3>
                                        <div id="refinement-list-beilage"></div>
                                    </div>
                                    <div id="clear-refinements"></div>
                                </details>
                            </div>
                            <div class="col-right col">
                                <xsl:call-template name="page_header">
                                    <xsl:with-param name="responsive_behaviour" select="'hide_on_mobile'"/>
                                </xsl:call-template>
                                <div class="contents-frame">
                                    <div class="scroller">
                                        <section class="toc-content">
                                            <div class="toc-content-header" />
                                            <div>
                                                <div class="d-flex flex-column align-items-center" id="current-refinements" />
                                            </div>
                                            <div id="hits" />
                                            <div id="pagination" />
                                        </section>
                                    </div>
                                </div>
                                <div class="search-col-right-strip"/>
                                <button type="button" class="square-btn scroll-to-top semitrans" id="scrollToTopBtn" aria-label="Nach oben scrollen">
                                    <i class="bi bi-chevron-up" aria-hidden="true"></i>
                                </button>
                            </div>
                        </div>
                    </div>
                </main>
                <xsl:call-template name="html_footer"/>
                <script src="https://cdn.jsdelivr.net/npm/typesense-instantsearch-adapter@2/dist/typesense-instantsearch-adapter.min.js"/>
                <script src="https://cdn.jsdelivr.net/npm/instantsearch.js@4.66.0/dist/instantsearch.production.min.js"/>
                <script src="js/toc_search.js"/>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>
