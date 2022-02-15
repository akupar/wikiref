<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
                xmlns:marc="http://www.loc.gov/MARC21/slim"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                >
  <xsl:output method="text"/>
  <xsl:strip-space elements="*"/>

  <xsl:template name="remove-suffix">
    <xsl:param name="text" select="''" />
    <xsl:variable name="len" select="string-length($text)" />    

    
    <xsl:choose>
      <xsl:when test="substring($text, $len) = ','">
        <xsl:value-of select="substring($text, 1, $len - 1)" />
      </xsl:when>
      <xsl:when test="substring($text, $len) = '.'">
        <xsl:value-of select="substring($text, 1, $len - 1)" />
      </xsl:when>
      <xsl:when test="substring($text, $len - 1) = ' :'">
        <xsl:value-of select="substring($text, 1, $len - 2)" />
      </xsl:when>
      <xsl:when test="substring($text, $len - 1) = ' /'">
        <xsl:value-of select="substring($text, 1, $len - 2)" />
      </xsl:when>
      <xsl:when test="substring($text, $len - 2) = ' Oy'">
        <xsl:value-of select="substring($text, 1, $len - 3)" />
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$text" />
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>


    <xsl:template name="author">
    <xsl:apply-templates select="marc:datafield[@tag=100]/marc:subfield[@code='e'] 
                                 | marc:datafield[@tag=100] 
                                 | marc:datafield[@tag=700]/marc:subfield[@code='e']"/>
    </xsl:template>
    

  <xsl:template match="marc:record">
    <xsl:text>{{cite book&#10;</xsl:text>
    <xsl:call-template name="author"/>
    <xsl:text>&#10;</xsl:text>
    
    <xsl:text> | date = </xsl:text>
    <xsl:apply-templates select="marc:datafield[@tag=260]/marc:subfield[@code='c']"/>
    <xsl:text>&#10;</xsl:text>
    
    <xsl:text> | title = </xsl:text>
    <xsl:apply-templates select="marc:datafield[@tag=245]"/>
    <xsl:text>&#10;</xsl:text>
    
    <xsl:text> | url = </xsl:text>
    <xsl:apply-templates select="marc:datafield[@tag=856]/marc:subfield[@code='u']"/>
    <xsl:text>&#10;</xsl:text>

    <xsl:text> | format = </xsl:text>
    <xsl:apply-templates select="marc:datafield[@tag=856]/marc:subfield[@code='q']"/>
    <xsl:text>&#10;</xsl:text>
        
    <xsl:text> | location = </xsl:text>
    <xsl:apply-templates select="marc:datafield[@tag=260]/marc:subfield[@code='a']"/>
    <xsl:text>&#10;</xsl:text>
    
    <xsl:text> | publisher = </xsl:text>
    <xsl:apply-templates select="marc:datafield[@tag=260]/marc:subfield[@code='b']"/>
    <xsl:text>&#10;</xsl:text>
    
    <xsl:text> | page = </xsl:text>
    <xsl:text>&#10;</xsl:text>
    
    <xsl:text> | isbn = </xsl:text>
    <xsl:apply-templates select="marc:datafield[@tag=020]/marc:subfield[@code='a']"/>
    <xsl:text>&#10;</xsl:text>
    
    <xsl:text> | language = </xsl:text>
    <xsl:apply-templates select="marc:datafield[@tag=041]/marc:subfield[@code='a']"/>
    <xsl:text>&#10;</xsl:text>
    <xsl:text>}}&#10;</xsl:text>
  </xsl:template>



  <xsl:template match="marc:datafield[@tag=020]/marc:subfield[@code='a']">
    <!-- International Standard Book Number -->
    <xsl:text>ISBN </xsl:text><xsl:value-of select="text()"/>
    <xsl:if test="position() != last()">
      <xsl:text> &amp; </xsl:text>
    </xsl:if>
  </xsl:template>

  <xsl:template match="marc:datafield[@tag=022]/marc:subfield[@code='a']">
    <!-- International Standard Serial Number -->
    <xsl:text>ISSN </xsl:text><xsl:value-of select="text()"/>
    <xsl:if test="position() != last()">
      <xsl:text> &amp; </xsl:text>
    </xsl:if>
  </xsl:template>

  <xsl:template match="marc:datafield[@tag=024]/marc:subfield[@code='a']">
    <!-- Standard recording code -->
    <xsl:value-of select="text()"/>
    <xsl:if test="position() != last()">
      <xsl:text> &amp; </xsl:text>
    </xsl:if>
  </xsl:template>


  <xsl:template match="marc:datafield[@tag=041]/marc:subfield[@code='a']">
    <!-- Language code of text/sound track or separate title -->
    <xsl:value-of select="text()"/>
    <xsl:if test="position() != last()">
      <xsl:text> &amp; </xsl:text>
    </xsl:if>
  </xsl:template>

  
  <xsl:template match="marc:datafield[@tag=245]">
    <!-- Title -->

      <xsl:for-each select="marc:subfield[@code='a']">
	<!-- Title -->
	<xsl:value-of select="text()"/>
      </xsl:for-each>
      <xsl:for-each select="marc:subfield[@code='b']">
	<!-- Remainder of title -->
	<xsl:text> </xsl:text><xsl:value-of select="text()"/>
      </xsl:for-each>
      <xsl:for-each select="marc:subfield[@code='c']">
	<!-- Remainder of title page transcription/statement of responsibility -->
	<xsl:text> </xsl:text><xsl:value-of select="text()"/>
      </xsl:for-each>

  </xsl:template>

  <xsl:template match="marc:datafield[@tag=260]/marc:subfield[@code='a']">
    <!-- Place of publication, distribution, etc. -->
    <xsl:call-template name="remove-suffix">
      <xsl:with-param name="text" select="text()"/>
    </xsl:call-template>
  </xsl:template>

  <xsl:template match="marc:datafield[@tag=260]/marc:subfield[@code='b']">
    <!-- Name of publisher, distributor, etc. -->
    <xsl:call-template name="remove-suffix">
      <xsl:with-param name="text" select="text()"/>
    </xsl:call-template>
  </xsl:template>

  <xsl:template match="marc:datafield[@tag=260]/marc:subfield[@code='c']">
    <!-- Date of publication, distribution, etc. -->
    <xsl:value-of select="text()"/>
  </xsl:template>

  <xsl:template match="marc:datafield[@tag=100]">
    <xsl:for-each select="marc:subfield[@code='a']">
      <xsl:text> | author = </xsl:text>
      <xsl:if test="not(position() = 1 and position() = last())">
        <xsl:value-of select="position()"/>
      </xsl:if>
	<!-- Main entry - Personal name -->
        <xsl:call-template name="remove-suffix">
          <xsl:with-param name="text" select="text()"/>
        </xsl:call-template>
      </xsl:for-each>
  </xsl:template>

  
  <xsl:template match="marc:datafield[@tag=100]/marc:subfield[@code='e'] | marc:datafield[@tag=700]/marc:subfield[@code='e']">

    <xsl:choose>
      <xsl:when test="text() = 'toimittaja.'">
        <xsl:text> | editor</xsl:text>
        <xsl:if test="not(position() = 1 and position() = last())">
          <xsl:value-of select="position()"/>
        </xsl:if>
        <xsl:text> = </xsl:text>
        <xsl:for-each select="../marc:subfield[@code='a']">
	  <!-- Personal name -->
          <xsl:call-template name="remove-suffix">
            <xsl:with-param name="text" select="text()"/>
          </xsl:call-template>
        </xsl:for-each>
      </xsl:when>

      <xsl:when test="text() = 'kääntäjä.'">
        <xsl:text> | translator</xsl:text>
        <xsl:if test="not(position() = 1 and position() = last())">
          <xsl:value-of select="position()"/>
        </xsl:if>
        <xsl:text> = </xsl:text>
        <xsl:for-each select="../marc:subfield[@code='a']">
	  <!-- Personal name -->
          <xsl:call-template name="remove-suffix">
            <xsl:with-param name="text" select="text()"/>
          </xsl:call-template>
        </xsl:for-each>
      </xsl:when>

      <xsl:otherwise>
        <xsl:text> | author</xsl:text>
        <xsl:if test="not(position() = 1 and position() = last())">
          <xsl:value-of select="position()"/>
        </xsl:if>
        <xsl:text> = </xsl:text>
        <xsl:for-each select="../marc:subfield[@code='a']">
	  <!-- Personal name -->
          <xsl:call-template name="remove-suffix">
            <xsl:with-param name="text" select="text()"/>
          </xsl:call-template>
        </xsl:for-each>
      </xsl:otherwise>
    </xsl:choose>
    
  </xsl:template>

  <xsl:template match="marc:datafield[@tag=700]/marc:subfield[@code='a']">
  </xsl:template>
  
  <xsl:template match="marc:datafield[@tag=*]">
  </xsl:template>

</xsl:stylesheet>
