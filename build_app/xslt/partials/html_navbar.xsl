<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema" exclude-result-prefixes="#all" version="2.0">
    <xsl:template match="/" name="nav_bar">
        <xsl:param name="show-band-scope" as="xs:boolean" select="false()"/>
        <header>
            <nav aria-label="Primary" class="navbar navbar-expand-lg bg-body-tertiary">
                <div class="container-fluid">
                    <a class="navbar-brand" href="index.html">
                        <xsl:value-of select="$project_short_title"/>
                    </a>
                    <button class="navbar-toggler" type="button" data-bs-toggle="collapse" data-bs-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
                        <span class="navbar-toggler-icon"></span>
                    </button>
                    <div class="collapse navbar-collapse" id="navbarSupportedContent">
                        <ul class="navbar-nav me-auto mb-2 mb-lg-0">
                            <li class="nav-item dropdown">
                                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">Projekt</a>
                                <ul class="dropdown-menu">
                                    <li>
                                        <a class="dropdown-item" href="about.html">Über das Projekt</a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item" href="search-help.html">Hinweise zur Suche</a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item" href="imprint.html">Impressum</a>
                                    </li>
                                </ul>
                            </li>

                            <li class="nav-item">
                                <a class="nav-link" href="toc.html">Editionseinheiten</a>
                            </li>
<!-- 
                            <li class="nav-item dropdown disabled">
                                <a class="nav-link dropdown-toggle" href="#" role="button" data-bs-toggle="dropdown" aria-expanded="false">Register</a>
                                <ul class="dropdown-menu">
                                    <li>
                                        <a class="dropdown-item" href="listperson.html">Personen</a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item" href="listplace.html">Orte</a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item" href="listorg.html">Organisationen</a>
                                    </li>
                                    <li>
                                        <a class="dropdown-item" href="listbibl.html">Werke</a>
                                    </li>
                                </ul>
                            </li>
-->
                            <li class="nav-item navbar-search-item">
                                <form class="navbar-search-form" method="get" action="search.html" role="search">
                                    <label class="visually-hidden" for="navbar-search">Suche</label>
                                    <input class="form-control navbar-search" id="navbar-search" name="q" type="search" placeholder="Suche" aria-label="Suche" autocomplete="off" />
                                    <xsl:if test="$show-band-scope">
                                        <div class="form-check mt-1">
                                            <input id="band-search-scope" class="form-check-input" type="checkbox" checked="checked"/>
                                            <label class="form-check-label small" for="band-search-scope">In diesem Band</label>
                                        </div>
                                        <div id="band-search-nav-controls" class="navbar-band-nav" aria-label="Treffernavigation">
                                            <button id="band-search-prev" type="button" class="navbar-band-nav-btn" aria-label="Vorheriger Treffer" title="Vorheriger Treffer">
                                                <i class="bi bi-caret-up-fill" aria-hidden="true"></i>
                                            </button>
                                            <button id="band-search-next" type="button" class="navbar-band-nav-btn" aria-label="Nächster Treffer" title="Nächster Treffer">
                                                <i class="bi bi-caret-down-fill" aria-hidden="true"></i>
                                            </button>
                                        </div>
                                    </xsl:if>
                                </form>
                            </li>
                        </ul>
                    </div>
                </div>
            </nav>
        </header>
    </xsl:template>
</xsl:stylesheet>