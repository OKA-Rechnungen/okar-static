<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet 
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0" xmlns:xs="http://www.w3.org/2001/XMLSchema"
    version="2.0" exclude-result-prefixes="xsl tei xs">
   
    <xsl:output encoding="UTF-8" media-type="text/html" method="html" version="5.0" indent="yes" omit-xml-declaration="yes"/>
    
    <xsl:import href="./partials/html_navbar.xsl"/>
    <xsl:import href="./partials/html_head.xsl"/>
    <xsl:import href="partials/html_footer.xsl"/>
    <xsl:template match="/">
        <xsl:variable name="doc_title" select="'Editionseinheiten'"/>
        <html class="page h-100" lang="de">
            <head>
                <xsl:call-template name="html_head">
                    <xsl:with-param name="html_title" select="$doc_title"/>
                </xsl:call-template>
                <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/instantsearch.css@8.1.0/themes/algolia-min.css"/>
                <link rel="stylesheet" href="css/ts_search.css" type="text/css"/>
            </head>
            <body class="d-flex flex-column h-100 has-site-top page-search page-toc-search">
                <main id="searchPage">
                    <div id="searchContainer" class="search-container">
                        <div class="search-col-left">
                            <div class="toc-left-section">
                                <label class="card-view-toggle">
                                    <input type="checkbox" id="detailViewToggle"/>
                                    <span class="card-view-toggle-text">Detailansicht</span>
                                </label>
                            </div>
                            <div class="toc-left-section">
                                <h3 class="toc-left-heading">Jahr</h3>
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
                            <div class="toc-left-tailpiece" aria-hidden="true"></div>
                        </div>
                        <div class="search-col-right">
                            <xsl:call-template name="nav_bar">
                                <xsl:with-param name="site_top_corner_href" select="'index.html'"/>
                                <xsl:with-param name="site_top_corner_icon_class" select="'bi bi-house'"/>
                                <xsl:with-param name="site_top_corner_aria_label" select="'Zur Startseite'"/>
                            </xsl:call-template>
                            <div>
                                <div class="d-flex flex-column align-items-center" id="current-refinements"></div>
                            </div>
                            <div id="hits"/>
                            <div id="pagination"/>
                            <div class="search-col-right-strip"/>
                            <button type="button" class="square-btn scroll-to-top semitrans" id="scrollToTopBtn" aria-label="Nach oben scrollen">
                                <i class="bi bi-chevron-up" aria-hidden="true"></i></button>
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
