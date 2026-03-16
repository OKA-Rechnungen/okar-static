<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet 
    xmlns="http://www.w3.org/1999/xhtml"
    xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
    xmlns:tei="http://www.tei-c.org/ns/1.0"
    xmlns:xs="http://www.w3.org/2001/XMLSchema"
    xmlns:local="http://dse-static.foo.bar"
    version="2.0" exclude-result-prefixes="xsl tei xs local">
    <xsl:output encoding="UTF-8" media-type="text/html" method="html" version="5.0" indent="yes" omit-xml-declaration="yes"/>

    <xsl:import href="./partials/html_head.xsl"/>
    <xsl:import href="./partials/html_navbar.xsl"/>
    <xsl:import href="./partials/html_footer.xsl"/>
    <xsl:import href="./partials/one_time_alert.xsl"/>

    <xsl:template match="tei:body">
        <xsl:apply-templates/>
    </xsl:template>
    <xsl:template match="tei:div">
        <div><xsl:apply-templates/></div>
    </xsl:template>
    <xsl:template match="tei:p">
        <p><xsl:apply-templates/></p>
    </xsl:template>
    <xsl:template match="tei:head[@rend]">
        <xsl:element name="{@rend}">
            <xsl:apply-templates/>
        </xsl:element>
    </xsl:template>
    <xsl:template match="tei:ref[@target]">
        <a href="{@target}"><xsl:apply-templates/></a>
    </xsl:template>
    <xsl:template match="tei:h2">
        <h2>
            <xsl:if test="@class">
                <xsl:attribute name="class"><xsl:value-of select="@class"/></xsl:attribute>
            </xsl:if>
            <xsl:apply-templates/>
        </h2>
    </xsl:template>

    <xsl:template match="/">
        <xsl:variable name="doc_title">
            <xsl:value-of select='"OKAR"'/>
        </xsl:variable>
        <html class="h-100">
            <head>
                <xsl:call-template name="html_head">
                    <xsl:with-param name="html_title" select="$doc_title"></xsl:with-param>
                </xsl:call-template>
            </head>            
            <body class="d-flex flex-column h-100">
                <xsl:call-template name="nav_bar"/>
                <main class="flex-shrink-0 flex-grow-1">
                    <div class="container">
                        <xsl:call-template name="one_time_alert"/>
                        <h1><xsl:value-of select="$project_short_title"/></h1>
                        <h2><xsl:value-of select="$project_title"/></h2>
                        <xsl:apply-templates select=".//tei:body"/>
                    </div>
                </main>
                <xsl:call-template name="html_footer">
                    <xsl:with-param name="show_full_footer" select="true()"/>
                </xsl:call-template>
            </body>
        </html>
    </xsl:template>
</xsl:stylesheet>