<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" exclude-result-prefixes="#all" version="2.0">

    <xsl:template match="/" name="nav_bar">
        <xsl:param name="responsive_behaviour" select="'no_responsiveness'" />
        <xsl:param name="burger_onset" select="false()" />
        <header class="site-header">
            <div class="container-fluid site-header-inner">
                <button class="square-btn burger-btn semitrans" type="button" data-bs-toggle="offcanvas" data-bs-target="#siteMenu" aria-controls="siteMenu" aria-label="Menü öffnen"> <i class="bi bi-list" aria-hidden="true"></i> </button>
            </div>
        </header>

        <div class="offcanvas offcanvas-start site-offcanvas" tabindex="-1" id="siteMenu" aria-labelledby="siteMenuLabel" data-bs-scroll="true">
            <div class="offcanvas-header">
                <button type="button" class="square-btn close-btn" data-bs-dismiss="offcanvas" aria-label="Schließen">
                    <i class="bi bi-x" aria-hidden="true"></i>
                </button>
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
                </nav>
            </div>
        </div>
    </xsl:template>
</xsl:stylesheet>