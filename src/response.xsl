<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
                xmlns:marc="http://www.loc.gov/MARC21/slim"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                xmlns:zs="http://www.loc.gov/zing/srw/"
                >
  <xsl:import href="marc-to-wiki.xsl"/>
  
  <xsl:output method="html"/>
  <xsl:strip-space elements="*"/>
  
  <xsl:template match="/zs:searchRetrieveResponse">
    <html>
      <head>
        <title>Result</title>
      </head>
      <body>
        <div id="main">
          <xsl:apply-templates />
        </div>
      </body>
    </html>
  </xsl:template>

  <xsl:template match="zs:records/zs:record">
    <xsl:variable name="schema">
      <xsl:value-of select="zs:recordSchema/text()"/>
    </xsl:variable>
    <xsl:choose>
      <xsl:when test="$schema = 'info:srw/schema/1/marcxml-v1.1'">
        <pre>
          <xsl:text>&#10;</xsl:text>
          <xsl:apply-templates select="zs:recordData"/>
        </pre>
      </xsl:when>
      <xsl:otherwise>
        <xsl:message terminate="yes">Cannot parse <xsl:value-of select="$schema"/></xsl:message>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  
  <xsl:template match="zs:recordData">
    <xsl:apply-imports />
  </xsl:template>

  
  
</xsl:stylesheet>
