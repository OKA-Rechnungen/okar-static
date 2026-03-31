<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:local="http://dse-static.foo.bar" version="2.0" exclude-result-prefixes="xsl tei xs local">
    <xsl:output encoding="UTF-8" media-type="text/html" method="html" version="5.0" indent="yes" omit-xml-declaration="yes"/>

    <xsl:import href="./partials/html_head.xsl"/>
    <xsl:import href="./partials/html_navbar.xsl"/>
    <xsl:import href="./partials/html_footer.xsl"/>
    <xsl:import href="./partials/one_time_alert.xsl"/>

    <xsl:template match="tei:body">
        <xsl:apply-templates/>
    </xsl:template>
    <xsl:template match="tei:div">
        <div>
            <xsl:apply-templates/>
        </div>
    </xsl:template>
    <xsl:template match="tei:p">
        <p>
            <xsl:apply-templates/>
        </p>
    </xsl:template>
    <xsl:template match="tei:head[@rend]">
        <xsl:element name="{@rend}">
            <xsl:apply-templates/>
        </xsl:element>
    </xsl:template>
    <xsl:template match="tei:ref[@target]">
        <a href="{@target}">
            <xsl:apply-templates/>
        </a>
    </xsl:template>
    <xsl:template match="tei:h2">
        <h2>
            <xsl:if test="@class">
                <xsl:attribute name="class">
                    <xsl:value-of select="@class"/>
                </xsl:attribute>
            </xsl:if>
            <xsl:apply-templates/>
        </h2>
    </xsl:template>

    <xsl:template match="/">
        <xsl:variable name="doc_title">
            <xsl:value-of select='"OKAR – Oberkammeramtsrechnungsbücher"'/>
        </xsl:variable>
        <xsl:variable name="landing_meta" select="doc('../../data/meta/index.xml')" as="document-node()"/>
        <xsl:variable name="landing_divs" as="element(tei:div)*">
            <xsl:choose>
                <xsl:when test="exists($landing_meta//tei:text/tei:body/tei:div)">
                    <xsl:sequence select="$landing_meta//tei:text/tei:body/tei:div"/>
                </xsl:when>
                <xsl:otherwise>
                    <xsl:sequence select=".//tei:text/tei:body/tei:div"/>
                </xsl:otherwise>
            </xsl:choose>
        </xsl:variable>
        <html class="h-100" lang="de">
            <head>
                <xsl:call-template name="html_head">
                    <xsl:with-param name="html_title" select="$doc_title"/>
                </xsl:call-template>
            </head>
            <body class="d-flex flex-column h-100 landing has-site-top">
                <xsl:call-template name="nav_bar">
                </xsl:call-template>

                <main class="flex-shrink-0 landing-main">
                    <div class="container landing-section">
                        <div class="row">
                            <div class="col-md-6 col-12">
                                <div class="landing-section-pic-wrapper">
                                    <img class="landing-section-pic" src="images/page_03.png" alt="Bild eines Rechnungsbuchs aus dem 18. Jahrhundert"/>
                                </div>
                            </div>
                            <div class="col-md-6 col-12">
                                <div class="landing-section-text">
                                    <xsl:apply-templates select="$landing_divs" mode="landing"/>
                                </div>
                            </div>
                        </div>
                    </div>
                </main>

                <xsl:call-template name="html_footer">
                    <xsl:with-param name="show_full_footer" select="true()"/>
                </xsl:call-template>
            </body>
        </html>
    </xsl:template>

    <xsl:template match="tei:div" mode="landing">
        <div>
            <xsl:copy-of select="@*"/>
            <xsl:apply-templates select="node()" mode="landing"/>
            <xsl:if test="@type = 'contents' and not(preceding-sibling::tei:div[@type = 'contents'])">
                <div class="landing-cta">
                    <a class="pill-btn" href="about.html">Mehr über das Projekt</a>
                </div>
            </xsl:if>
        </div>
    </xsl:template>

    <xsl:template match="tei:h2" mode="landing">
        <h2>
            <xsl:copy-of select="@*"/>
            <xsl:apply-templates mode="landing"/>
        </h2>
    </xsl:template>

    <xsl:template match="tei:p" mode="landing">
        <p>
            <xsl:copy-of select="@*"/>
            <xsl:apply-templates mode="landing"/>
        </p>
    </xsl:template>

    <xsl:template match="tei:ref" mode="landing">
        <a>
            <xsl:attribute name="href">
                <xsl:value-of select="@target"/>
            </xsl:attribute>
            <xsl:copy-of select="@*[not(local-name() = 'target')]"/>
            <xsl:if test="not(@class)">
                <xsl:attribute name="class">landing-button</xsl:attribute>
            </xsl:if>
            <xsl:apply-templates mode="landing"/>
        </a>
    </xsl:template>

    <xsl:template match="tei:div//tei:head">
        <h2 id="{generate-id()}">
            <xsl:apply-templates/>
        </h2>
    </xsl:template>

    <xsl:template match="tei:p">
        <p id="{generate-id()}">
            <xsl:apply-templates/>
        </p>
    </xsl:template>

    <xsl:template match="tei:list">
        <ul id="{generate-id()}">
            <xsl:apply-templates/>
        </ul>
    </xsl:template>

    <xsl:template match="tei:item">
        <li id="{generate-id()}">
            <xsl:apply-templates/>
        </li>
    </xsl:template>

    <xsl:template match="tei:ref">
        <xsl:choose>
            <xsl:when test="starts-with(data(@target), 'http')">
                <a>
                    <xsl:attribute name="href">
                        <xsl:value-of select="@target"/>
                    </xsl:attribute>
                    <xsl:value-of select="."/>
                </a>
            </xsl:when>
            <xsl:otherwise>
                <xsl:apply-templates/>
            </xsl:otherwise>
        </xsl:choose>
    </xsl:template>
</xsl:stylesheet>