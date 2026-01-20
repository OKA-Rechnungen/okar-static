<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" exclude-result-prefixes="#all" version="2.0">
    
    <xsl:template match="/" name="nav_bar">
        <xsl:param name="site_top_variant" as="xs:string" select="'button'"/>
        <xsl:param name="show_site_top" as="xs:boolean" select="true()"/>

        <header class="site-header">
            <div class="container-fluid site-header-inner">
                <button class="site-button site-burger" type="button" data-bs-toggle="offcanvas" data-bs-target="#siteMenu" aria-controls="siteMenu" aria-label="Menü öffnen">
                    <i class="bi bi-list" aria-hidden="true"></i>
                </button>
            </div>
        </header>

        <div class="offcanvas offcanvas-start site-offcanvas" tabindex="-1" id="siteMenu" aria-labelledby="siteMenuLabel" data-bs-scroll="true">
            <div class="offcanvas-header">
                <button type="button" class="site-button site-close" data-bs-dismiss="offcanvas" aria-label="Schließen">
                    <i class="bi bi-x" aria-hidden="true"></i>
                </button>
            </div>
            <div class="offcanvas-body">
                <nav class="site-menu" aria-label="Hauptmenü">
                    <div class="site-menu-section">Das Projekt</div>
                    <a class="site-menu-link site-menu-link--leaf" href="toc.html">
                        <span class="site-menu-bullet" aria-hidden="true"><i class="bi bi-chevron-double-right" aria-hidden="true"></i></span>
                        <span class="site-menu-text">Editionseinheiten</span>
                    </a>
                    <a class="site-menu-link site-menu-link--leaf" href="about.html">
                        <span class="site-menu-bullet" aria-hidden="true"><i class="bi bi-chevron-double-right" aria-hidden="true"></i></span>
                        <span class="site-menu-text">Über das Projekt</span>
                    </a>
                    <a class="site-menu-link site-menu-link--leaf" href="books.html">
                        <span class="site-menu-bullet" aria-hidden="true"><i class="bi bi-chevron-double-right" aria-hidden="true"></i></span>
                        <span class="site-menu-text">Rechnungsbücher</span>
                    </a>

                    <div class="site-menu-section">Suche</div>
                    <a class="site-menu-link site-menu-link--leaf" href="search.html">
                        <span class="site-menu-bullet" aria-hidden="true"><i class="bi bi-chevron-double-right" aria-hidden="true"></i></span>
                        <span class="site-menu-text">Volltextsuche</span>
                    </a>

                    <div class="site-menu-section">Info</div>
                    <a class="site-menu-link site-menu-link--leaf" href="imprint.html">
                        <span class="site-menu-bullet" aria-hidden="true"><i class="bi bi-chevron-double-right" aria-hidden="true"></i></span>
                        <span class="site-menu-text">Impressum</span>
                    </a>
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
                            <xsl:choose>
                                <xsl:when test="$site_top_variant = 'image'">
                                    <img class="site-top-image" src="images/banner_hero.png" alt="Titelbild"/>
                                </xsl:when>
                                <xsl:otherwise>
                                    <a class="section-button bgc site-top-project-button" href="about.html">Mehr über das Projekt</a>
                                </xsl:otherwise>
                            </xsl:choose>
                        </div>
                    </div>
                    <xsl:choose>
                        <xsl:when test="$site_top_variant = 'image'">
                            <div class="site-top-strip bild" aria-hidden="true">
                                <a class="site-button site-bottom-button semitrans" href="toc.html" role="button" aria-label="Schnellvorlauf">
                                    <i class="bi bi-chevron-double-right" aria-hidden="true"></i>
                                </a>
                            </div>
                        </xsl:when>
                        <xsl:otherwise>
                            <div class="site-top-strip" aria-hidden="true"/>
                        </xsl:otherwise>
                    </xsl:choose>
                </div>
            </section>
        </xsl:if>
    </xsl:template>
</xsl:stylesheet>