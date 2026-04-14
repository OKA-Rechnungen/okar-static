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
        <xsl:variable name="doc_title" select="'Volltextsuche'"/>
        <html class="page h-100" lang="de">
            <head>
                <xsl:call-template name="html_head">
                    <xsl:with-param name="html_title" select="$doc_title"/>
                </xsl:call-template>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/instantsearch.css@8.1.0/themes/algolia-min.css"/>
                <link rel="stylesheet" href="css/ts_search.css" type="text/css"/>
            </head>
            <body class="d-flex flex-column h-100 offset-burger">
                <xsl:call-template name="nav_bar">
                    <xsl:with-param name="responsive_behaviour" select="true()"/>
                </xsl:call-template>
                <xsl:call-template name="page_header">
                    <xsl:with-param name="responsive_behaviour" select="'hide_on_desktop'"/>
                </xsl:call-template>
                <main id="searchPage">
                    <div id="searchContainer" class="container-fluid">
                        <div class="row">
                            <div class="col-left">
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
                                    <div id="stats-container"/>
                                </div>
                                <div class="toc-left-section">
                                    <p class="search-panel__hint">Verwenden Sie die Filter, um die Ergebnisliste weiter einzugrenzen. Die unscharfe Suche toleriert Tippfehler und ähnliche Schreibweisen.</p>
                                    <p class="text-center search-panel__hint">
                                        <a href="search-help.html">
                                            <i class="bi bi-question-circle"></i> Weiter Hinweise zur Volltextsuche
                                        </a>
                                    </p>
                                    <div id="fuzzy-toggle"/>
                                </div>
                                <div class="toc-left-section">
                                    <div id="refinement-range-year" />
                                    <details class="facet-collapsible" open="open">
                                        <summary class="facet-collapsible-summary">Kämmerer</summary>
                                        <div id="refinement-list-kaemmerer" />
                                    </details>
                                    <details class="facet-collapsible" open="open">
                                        <summary class="facet-collapsible-summary">Beilage</summary>
                                        <div id="refinement-list-beilage" />
                                    </details>
                                </div>
                                <div id="clear-refinements" />
                                <div class="toc-left-tailpiece" aria-hidden="true"></div>
                            </div>
                            <div class="col-right col">
                                <xsl:call-template name="page_header">
                                    <xsl:with-param name="responsive_behaviour" select="'hide_on_mobile'"/>
                                </xsl:call-template>
                                <div class="contents-frame">
                                    <div class="scroller">
                                        <section class="toc-content">
                                            <div class="toc-content-header" style="display: none;">
                                                <p class="toc-eyebrow">Suche</p>
                                                <h1>
                                                    <xsl:value-of select="$doc_title"/>
                                                </h1>
                                                <div class="toc-searchbox-container">
                                                    <div id="searchbox" />
                                                </div>
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
                <script src="js/ts_search.js"/>
                <script src="js/ts_update_url.js"/>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>