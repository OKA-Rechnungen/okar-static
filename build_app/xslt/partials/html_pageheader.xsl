<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" exclude-result-prefixes="#all" version="2.0">

    <xsl:template match="/" name="page_header">
        <xsl:param name="responsive_behaviour" select="'no_responsiveness'" />
        <section class="site-top {$responsive_behaviour}" aria-label="Start">
            <div class="container site-top-inner py-4">
                <div class="row" id="site-top-grid">
                    <div id="site-top-left" class="col-md-6 col-12">
                        <a class="site-top-title-link" href="index.html" aria-label="Zur Startseite">
                            <div class="site-top-title">
                                <span>Oberkammeramts⸗</span>
                                <span>rechnungsbücher</span>
                            </div>
                        </a>
                    </div>
                    <div id="site-top-right" class="col-md-6 col-12">
                        <form class="navbar-search-form" action="search.html" method="get">
                            <div class="row">
                                <div id="searchBox" class="col-12 col-md-6 d-flex justify-content-center">
                                    <div class="navbar-search-item navbar-search-box" style="flex:1">
                                        <input id="navbar-search" class="form-control form-control-sm navbar-search" type="search" name="q" placeholder="Suche…" autocomplete="off"/>
                                        <button type="submit" class="navbar-search-submit" aria-label="Suche starten">
                                            <i class="bi bi-search" aria-hidden="true"></i>
                                        </button>
                                    </div>
                                </div>
                                <div id="inVolume" class="col-12 col-md-6">
                                    <div class="row">
                                        <div class="col-auto navbar-search-item navbar-band-scope">
                                            <input id="band-search-scope" type="checkbox" checked="checked" class="form-check-input me-1"/>
                                            <label for="band-search-scope" class="form-check-label small">In diesem Band</label>
                                        </div>
                                        <div class="col-auto navbar-search-item navbar-band-scope" style="gap:.25rem" id="band-search-nav-controls">
                                            <span id="band-search-status" class="navbar-search-status small" />
                                            <div class="navbar-band-nav">
                                                <button id="band-search-prev" type="button" class="navbar-band-nav-btn" aria-label="Vorheriges Ergebnis" disabled="disabled">&#x25B2;</button>
                                                <button id="band-search-next" type="button" class="navbar-band-nav-btn" aria-label="Nächstes Ergebnis" disabled="disabled">&#x25BC;</button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </section>
    </xsl:template>
</xsl:stylesheet>