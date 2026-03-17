<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" version="2.0" exclude-result-prefixes="xsl tei xs">

    <xsl:output encoding="UTF-8" media-type="text/html" method="html" version="5.0" indent="yes" omit-xml-declaration="yes"/>

    <xsl:import href="./partials/html_navbar.xsl"/>
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
            <body class="d-flex flex-column h-100 has-site-top page-search">
                <main id="searchPage">
                    <div id="searchContainer" class="search-container">
                        <div class="search-col-left">
                            <div class="toc-left-section">
                                <h3 class="toc-left-heading">Suche</h3>
                                <div class="toc-search-pill">
                                    <div class="toc-search-pill-inner">
                                        <div id="searchbox"></div>
                                    </div>
                                </div>
                            </div>
                            <div class="toc-left-section">
                                <div id="stats-container"/>
                            </div>
                            <div class="toc-left-section">
                                <div id="clear-refinements"/>
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
                                <div id="refinement-list-kaemmerer" />
                                <div id="refinement-list-beilage" />
                            </div>
                        </div>
                        <div class="search-col-right">
                            <xsl:call-template name="nav_bar"/>
                            <div class="container">
                                <!-- <h2 class="align-center">
                                    <xsl:value-of select="$doc_title"/>
                                </h2> -->
                            </div>
                            <div>
                                <div class="d-flex flex-column align-items-center" id="current-refinements"></div>
                            </div>
                            <div id="hits"/>
                            <div id="pagination"/>
                            <div class="search-col-right-strip"/>
                            <button type="button" class="site-button scroll-to-top" id="scrollToTopBtn" aria-label="Nach oben scrollen" />
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