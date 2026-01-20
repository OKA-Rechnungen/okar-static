<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet 
    xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:local="http://dse-static.foo.bar"
    version="2.0" exclude-result-prefixes="xsl tei xs local">
    <xsl:output encoding="UTF-8" media-type="text/html" method="html" version="5.0" indent="yes" omit-xml-declaration="yes"/>
    
    <xsl:import href="partials/html_navbar.xsl"/>
    <xsl:import href="partials/html_head.xsl"/>
    <xsl:import href="partials/html_footer.xsl"/>
    <xsl:import href="partials/tabulator_dl_buttons.xsl"/>
    <xsl:import href="partials/tabulator_js.xsl"/>

    <xsl:template match="/">
        <xsl:variable name="doc_title" select="'Inhaltsverzeichnis'"/>
        <html class="h-100" lang="de">
            <head>
                <xsl:call-template name="html_head">
                    <xsl:with-param name="html_title" select="$doc_title"></xsl:with-param>
                </xsl:call-template>
            </head>

            <body class="d-flex flex-column h-100 has-site-top page-search">
                <main id="searchPage">
                    <div id="searchContainer" class="search-container">
                        <div class="search-col-left">
                            <div class="person-left-section">
                                <h3 class="person-left-heading">Suche</h3>
                                <div class="person-name-search">
                                    <div class="person-name-search-inner">
                                        <input class="person-facet-filter" id="tocSearchFilter" type="search" placeholder="Nach Titel suchen..." autocomplete="off" />
                                    </div>
                                </div>
                            </div>
                            <div class="person-left-section">
                                <h3 class="person-left-heading">Sortierung</h3>
                                <div id="sort-by">
                                    <select class="form-select" id="tocSortSelect">
                                        <option value="title">Nach Titel</option>
                                        <option value="filename">Nach Dateiname</option>
                                    </select>
                                </div>
                            </div>
                            <div class="person-left-tailpiece" aria-hidden="true"></div>
                        </div>
                        <div class="search-col-right">
                            <xsl:call-template name="nav_bar"/>
                            <div class="container py-4">
                                <h1>Inhaltsverzeichnis</h1>
                                <table id="myTable">
                                    <thead>
                                        <tr>
                                            <th scope="col" width="20" tabulator-formatter="html" tabulator-headerSort="false" tabulator-download="false">#</th>
                                            <th scope="col" tabulator-headerFilter="input">Titel</th>
                                            <th scope="col" tabulator-headerFilter="input">Dateinname</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <xsl:for-each
                                            select="collection('../../data/editions?select=*.xml')//tei:TEI">
                                            <xsl:variable name="full_path">
                                                <xsl:value-of select="document-uri(/)"/>
                                            </xsl:variable>
                                            <tr>
                                                <td>
                                                    <a>
                                                        <xsl:attribute name="href">
                                                            <xsl:value-of
                                                                select="replace(tokenize($full_path, '/')[last()], '.xml', '.html')"
                                                            />
                                                        </xsl:attribute>
                                                        <i class="bi bi-link-45deg"/>
                                                    </a>
                                                </td>
                                                <td>
                                                    <xsl:value-of
                                                        select=".//tei:titleStmt/tei:title[1]/text()"/>
                                                </td>
                                                <td>
                                                    <xsl:value-of select="tokenize($full_path, '/')[last()]"
                                                    />
                                                </td>
                                            </tr>
                                        </xsl:for-each>
                                    </tbody>
                                </table>
                                <xsl:call-template name="tabulator_dl_buttons"/>
                            </div>
                            <div class="search-col-right-strip" />
                            <button type="button" class="site-button scroll-to-top" id="scrollToTopBtn" aria-label="Nach oben scrollen">
                                <i class="bi bi-chevron-double-up" aria-hidden="true"></i>
                            </button>
                        </div>
                    </div>
                </main>
                <xsl:call-template name="html_footer"/>
                <xsl:call-template name="tabulator_js"/>
                <script>
                    // Simple scroll to top functionality
                    document.addEventListener('DOMContentLoaded', function() {
                        var scrollBtn = document.getElementById('scrollToTopBtn');
                        if (scrollBtn) {
                            scrollBtn.addEventListener('click', function() {
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            });
                        }
                    });
                </script>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>
