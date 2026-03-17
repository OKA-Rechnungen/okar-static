<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" exclude-result-prefixes="#all" version="2.0">

    <xsl:template match="/" name="nav_bar">
        <xsl:param name="site_top_variant" as="xs:string" select="'button'"/>
        <xsl:param name="show_site_top" as="xs:boolean" select="true()"/>
        <xsl:param name="show_bottom_button" as="xs:boolean" select="true()"/>

        <header class="site-header">
            <div class="container-fluid site-header-inner">
                <button class="site-button site-burger" type="button" data-bs-toggle="offcanvas" data-bs-target="#siteMenu" aria-controls="siteMenu" aria-label="Menü öffnen" />
            </div>
        </header>

        <div class="offcanvas offcanvas-start site-offcanvas" tabindex="-1" id="siteMenu" aria-labelledby="siteMenuLabel" data-bs-scroll="true">
            <div class="offcanvas-header">
                <button type="button" class="site-button site-close" data-bs-dismiss="offcanvas" aria-label="Schließen"/>
            </div>
            <div class="offcanvas-body">
                <nav class="site-menu" aria-label="Hauptmenü">
                    <div class="site-menu-section">Das Projekt</div>
                    <a class="site-menu-link site-menu-link--leaf" href="about.html">
                        <span class="site-menu-bullet" aria-hidden="true">▶︎</span>
                        <span class="site-menu-text">Über das Projekt</span>
                    </a>
                    <a class="site-menu-link site-menu-link--leaf" href="data.html">
                        <span class="site-menu-bullet" aria-hidden="true">▶︎</span>
                        <span class="site-menu-text">Daten &amp; Methodik</span>
                    </a>
                    <a class="site-menu-link site-menu-link--leaf" href="books.html">
                        <span class="site-menu-bullet" aria-hidden="true">▶︎</span>
                        <span class="site-menu-text">Rechnungsbücher</span>
                    </a>

                    <div class="site-menu-section">Suche</div>
                    <a class="site-menu-link site-menu-link--leaf" href="toc.html">
                        <span class="site-menu-bullet" aria-hidden="true">▶︎</span>
                        <span class="site-menu-text">Editionseinheiten</span>
                    </a>
                    <!-- <a class="site-menu-link site-menu-link-
                    -leaf" href="search.html">
                        <span class="site-menu-bullet" aria-hidden="true">▶︎</span>
                        <span class="site-menu-text">Volltextsuche</span>
                    </a> -->
                    <!--  
                    <div class="site-menu-section">Info</div> 
                    <a class="site-menu-link site-menu-link-
                    -leaf" href="imprint.html"> 
                        <span class="site-menu-bullet" aria-hidden="true">▶︎</span>
                        <span class="site-menu-text">Impressum</span>
                    </a> -->
                </nav>
            </div>
        </div>

        <xsl:if test="$show_site_top">
            <section class="site-top" aria-label="Start">
                <div class="container site-top-inner">
                    <div class="site-top-grid">
                        <div class="site-top-left">
                            <a class="site-top-title-link" href="index.html" aria-label="Zur Startseite">
                                <div class="site-top-title">
                                    <span>OBERKAMMER</span>
                                    <span>AMTSRECHNUNGS</span>
                                    <span>BÜCHER</span>
                                </div>
                            </a>
                        </div>
                        <div class="site-top-right">
                            <!-- <xsl:choose>
                                <xsl:when test="$site_top_variant = 'image'">
                                    <img class="site-top-image" src="images/banner_hero.png" alt="Titelbild"/>
                                </xsl:when>
                                <xsl:otherwise>
                                    <a class="section-button bgc site-top-project-button" href="about.html">Mehr über das Projekt</a>
                                </xsl:otherwise>
                            </xsl:choose> -->
                            <form class="navbar-search-form" action="search.html" method="get">
                                <div class="navbar-search-item" style="flex:1">
                                    <input id="navbar-search" class="form-control form-control-sm navbar-search" type="search" name="q" placeholder="Suche…" autocomplete="off"/>
                                </div>
                                <div class="navbar-search-item navbar-band-scope">
                                    <input id="band-search-scope" type="checkbox" checked="checked" class="form-check-input me-1"/>
                                    <label for="band-search-scope" class="form-check-label small">In diesem Band</label>
                                </div>
                                <div id="band-search-nav-controls" class="navbar-search-item navbar-band-scope" style="gap:.25rem">
                                    <span id="band-search-status" class="navbar-search-status small"></span>
                                    <div class="navbar-band-nav">
                                        <button id="band-search-prev" type="button" class="navbar-band-nav-btn" aria-label="Vorheriges Ergebnis" disabled="disabled">&#x25B2;</button>
                                        <button id="band-search-next" type="button" class="navbar-band-nav-btn" aria-label="Nächstes Ergebnis" disabled="disabled">&#x25BC;</button>
                                    </div>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
                <xsl:choose>
                        <xsl:when test="$site_top_variant = 'image'">
                            <div class="site-top-strip bild" aria-hidden="true"/>
                        </xsl:when>
                        <xsl:otherwise>
                            <div class="site-top-strip" aria-hidden="true"/>
                        </xsl:otherwise>
                    </xsl:choose>
                <xsl:if test="$show_bottom_button">
                    <a href="toc.html">
                        <button type="button" class="site-button  site-bottom-button semitrans" aria-label="Editionseinheiten"/>
                    </a>
                </xsl:if>
            </section>
            <xsl:if test="$show_bottom_button">
                <div class="container">
                    <a class="sitebutton site-button-bis" href="toc.html" role="button" aria-label="Zum Inhaltsverzeichnis">
                        EDITIONSEINHEITEN
                    </a>
                </div>
            </xsl:if>
        </xsl:if>
    </xsl:template>
</xsl:stylesheet>
