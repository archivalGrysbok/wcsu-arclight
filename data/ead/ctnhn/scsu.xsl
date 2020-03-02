<!-- This is based on the style sheet created by James Ford Bell Stylesheet (January 2005). -->
<!-- Embellishments have been made to the original design by Brian Stevens to daos, extrefs, controlaccess and container list templates as well as some formatting changes, 2007  -->
<!--  This stylesheet generates a Table of Contents in an HTML table cell along the left side of the screen.  -->


<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0" xmlns:ns2="http://www.w3.org/1999/xlink" xmlns:ns="urn:isbn:1-931666-22-9">

<xsl:strip-space elements="*"/>

<!-- Creates the body of the finding aid.-->
<xsl:output method="html"/>
<xsl:template match="/">
<xsl:variable name="file">
<xsl:value-of select="ns:ead/ns:eadheader/ns:eadid"/>
</xsl:variable>
<html>
<head>
<!--<style>
P.toc {font-family: "sans-serif"; font-weight: bold; font-size: 75%; font-color: white}
P.rtoc {font-family: "sans-serif"; font-size: 65%; text-align: right; font-color: white}
P.seriestoc {font-family: "sans-serif"; font-size: 65%}
h1 {font-family: "sans-serif"; font-weight:bold; font-size: 175%}
h2 {font-family: "sans-serif"; font-weight:bold; font-size: 125%}
h3 {font-family: "sans-serif"; font-weight:bold; font-size: 100%}
h4 {font-family: "sans-serif"; font-size: 100%}
h5 {font-family: "sans-serif"; font-weight: bold; font-size: 75%}
</style>
-->
<title>
<xsl:value-of select="ns:ead/ns:eadheader/ns:filedesc/ns:titlestmt"/>
</title>
</head>
<link rel="stylesheet" type="text/css" href="ead.css"/>
<body>

<!-- top design -->

<table width="575" align="center" cellspacing="0" cellpadding="1" border="0">

<tr> <td><div align="center"><a href="http://www.easternct.edu/smithlibrary/library1/archives.htm"><img src="scsuLogo.jpg" border="0"/></a></div>

    </td>

  </tr>
<!--<tr> <td bgcolor="#00457A" height="25"> 

      <div align="center"><b><font face="sans-serif" color="ffffff" size="3">ECSU Archives</font></b></div>

    </td>

  </tr> -->



<tr> 

    <td><div align="center"><font size="-2" face="tahoma" color="#993333">Hilton C. Buley Library | Southern Connecticut State University | 501 Crescent Street | New Haven, CT 06515 | (203) 392-5750
</font></div> </td>


  </tr>

<tr><td width="575"></td></tr>



<tr><td><xsl:call-template name="eadheader"/></td></tr>

<tr><td><table cellpadding="5">





<!-- table for toc and finding aid text -->



<tr><td width="50"></td><td width="525"></td></tr>
<tr>
<td valign="top" bgcolor="#FFCC33" class="toc"><xsl:call-template name="toc"/></td>
<td valign="top" bgcolor="#FFFFFF" class="body"><xsl:call-template name="body"/></td>
</tr></table></td></tr></table>



</body>
</html>
</xsl:template>

<xsl:template match="ns:eadheader/ns:titleproper/ns:date">
<br />
<xsl:apply-templates/>
</xsl:template>

<xsl:template match="ns:eadheader/ns:titleproper/ns:num">
<br/>
</xsl:template>

<xsl:template name="eadheader">

<xsl:for-each select="ns:ead/ns:eadheader/ns:filedesc/ns:titlestmt">

<center><a name="a0"></a></center>

<br/>

<h1><center>
<xsl:apply-templates select="ns:titleproper"/>

</center></h1>
<h3><center>
<xsl:value-of select="ns:subtitle"/><br/>
</center></h3>

<font size="-1"><center> 

<xsl:value-of select="ns:author"/>

</center></font>
<font size="-1"><b><i><center> 

<xsl:value-of select="ns:sponsor"/>

</center></i></b></font>

</xsl:for-each>

<xsl:for-each select="ns:ead/ns:eadheader/ns:filedesc/ns:publicationstmt">
<br></br>
<div align="center">
<h6><xsl:apply-templates select="ns:address"/></h6>
<h6><xsl:value-of select="ns:p"/></h6>
<h6><xsl:value-of select="ns:publisher"/></h6></div>
</xsl:for-each>

<xsl:for-each select="ns:ead/ns:eadheader/ns:profiledesc">
<font size="-3"><xsl:value-of select="ns:creation"/>
<xsl:value-of select="ns:langusage"/></font>
</xsl:for-each>


<hr/>

</xsl:template>




<!-- top of Table of Contents -->



<xsl:template name="toc">
<xsl:variable name="file">
<xsl:value-of select="ns:ead/ns:eadheader/ns:eadid"/>
</xsl:variable>

<br/>

<!-- A series of tests determine which elements will be included in the table of contents.-->
<xsl:if test="ns:ead/ns:archdesc/ns:did">
<p class="toc"><b><a href="#a1">
<xsl:value-of select="ns:ead/ns:archdesc/ns:did/ns:head"/>
</a></b></p>
</xsl:if>

<xsl:if test="ns:ead/ns:archdesc/ns:bioghist[string-length(text()|*)!=0]">
<p class="toc" style="margin-top:-5pt">
<b>
<a href="#a2">
<xsl:value-of select="ns:ead/ns:archdesc/ns:bioghist/ns:head"/>
</a>
</b></p>
</xsl:if>

<xsl:if test="ns:ead/ns:archdesc/ns:scopecontent[string-length(text()|*)!=0]">
<p class="toc" style="margin-top:-5pt"><b>
<a href="#a3">
<xsl:value-of select="ns:ead/ns:archdesc/ns:scopecontent/ns:head"/>
</a></b></p>
</xsl:if>

<xsl:if test="ns:ead/ns:archdesc/ns:organization[string-length(text()|*)!=0]">
<p class="toc" style="margin-top:-5pt"><b>
<a href="#a4">
<xsl:value-of select="ns:ead/ns:archdesc/ns:organization/ns:head"/>
</a></b></p>
</xsl:if>

<xsl:if test="ns:ead/ns:archdesc/ns:userestrict[string-length(text()|*)!=0] | ns:ead/ns:archdesc/ns:accessrestrict[string-length(text()|*)!=0]">
<p class="toc" style="margin-top:-5pt"><b>
<a href="#a14">
<xsl:text>Restrictions</xsl:text>
</a></b></p>
</xsl:if>
<!--insert for controlaccess -->
<xsl:if test="ns:ead/ns:archdesc/ns:controlaccess[string-length(text()|*)!=0]">
<p class="toc" style="margin-top:-5pt"><b>
<a href="#a12">
<xsl:value-of select="ns:ead/ns:archdesc/ns:controlaccess/ns:head"/>
</a></b></p>
</xsl:if>

<xsl:if test="ns:ead/ns:archdesc/ns:relatedmaterial[string-length(text()|*)!=0] | ns:ead/ns:archdesc/ns:separatedmaterial[string-length(text()|*)!=0]">
<p class="toc" style="margin-top:-5pt"><b>
<a href="#a6">
Related Material
</a></b></p>
</xsl:if>

<xsl:if test="ns:ead/ns:archdesc/ns:descgrp[string-length(text()|*)!=0] | ns:ead/ns:archdesc/ns:processinfo[string-length(text()|*)!=0] |  ns:ead/ns:archdesc/ns:prefercite[string-length(text()|*)!=0] | ns:ead/ns:archdesc/ns:custodialhist[string-length(text()|*)!=0] |  ns:ead/ns:archdesc/ns:altformavailable | 
ns:ead/ns:archdesc/ns:admininfo/ns:appraisal | 
ns:ead/ns:archdesc/ns:accruals[string-length(text()|*)!=0]">
<p class="toc" style="margin-top:-5pt"><b>
<a href="#a13">
Administrative Information
</a></b></p>
</xsl:if>

<xsl:if test="ns:ead/ns:archdesc/ns:otherfindaid[string-length(text()|*)!=0]">
<p class="toc" style="margin-top:-5pt"><b>
<a href="#a8">
<xsl:value-of select="ns:ead/ns:archdesc/ns:otherfindaid/ns:head"/>
</a></b></p>
</xsl:if>

<xsl:if test="ns:ead/ns:archdesc/ns:odd[string-length(text()|*)!=0]">
<p class="toc" style="margin-top:-5pt"><b>
<a href="#a11">
<xsl:value-of select="ns:ead/ns:archdesc/ns:odd/ns:head"/>
</a></b></p>
</xsl:if>

<xsl:if test="ns:ead/ns:archdesc/ns:bibliography[string-length(text()|*)!=0]">
<p class="toc" style="margin-top:-5pt"><b>
<a href="#a10">
<xsl:value-of select="ns:ead/ns:archdesc/ns:bibliography/ns:head"/>
</a></b></p>
</xsl:if>

<xsl:if test="ns:ead/ns:archdesc/ns:index[string-length(text()|*)!=0]">
<p class="toc" style="margin-top:-5pt"><b>
<a href="#a9">
<xsl:value-of select="ns:ead/ns:archdesc/ns:index/ns:head"/>
</a></b></p>
</xsl:if>


<xsl:if test="ns:ead/ns:archdesc/ns:dsc[string-length(text()|*)!=0]">
<a href="#a23">
<p class="toc" style="margin-top:-5pt">
<b>
<xsl:value-of select="ns:ead/ns:archdesc/ns:dsc/ns:head"/>
</b></p>
</a>

<!-- Displays the title and date of each series and numbers
 them to form a hyperlink to the base document. -->

<xsl:for-each select="ns:ead/ns:archdesc/ns:dsc/ns:c01">
<p style="margin-left:8pt; margin-top:-5pt">
<font size="-1">
<a style="color:000000">
<!-- full path below? -->
<xsl:attribute name="href">
#series<xsl:number value="position()" format="1"/>
</xsl:attribute>
<xsl:choose>
<xsl:when test="ns:did/ns:unittitle/ns:unitdate">
<xsl:for-each select="ns:did/ns:unittitle">
<xsl:apply-templates select="text()|*[not(self::ns:unitdate)]"/>
<xsl:text> </xsl:text>
<xsl:apply-templates select="./ns:unitdate"/>
</xsl:for-each>
</xsl:when>
<xsl:otherwise>
<xsl:apply-templates select="ns:did/ns:unittitle"/>
<xsl:text> </xsl:text>
<xsl:apply-templates select="ns:did/ns:unitdate"/>
</xsl:otherwise>
</xsl:choose>
</a>
</font></p>

<!-- subseries toc addition-->
<xsl:for-each select="child::ns:c02[@level='subseries']">
<p style="margin-left:16pt; margin-top:-5pt">
<font size="-2">
<a style="color:000000">

<xsl:attribute name="href">
#subseries<xsl:number format="1" level="any" />
</xsl:attribute>

<xsl:choose>
<xsl:when test="ns:did/ns:unittitle/ns:unitdate">
<xsl:for-each select="ns:did/ns:unittitle">
<xsl:apply-templates select="text()|*[not(self::ns:unitdate)]"/>
<xsl:text> </xsl:text>
<xsl:apply-templates select="./ns:unitdate"/>
</xsl:for-each>
</xsl:when>
<xsl:otherwise>
<xsl:apply-templates select="ns:did/ns:unittitle"/>
<xsl:text> </xsl:text>
<xsl:apply-templates select="ns:did/ns:unitdate"/>
</xsl:otherwise>
</xsl:choose>
</a>
</font></p>
</xsl:for-each>

<!-- end subseries -->

</xsl:for-each>




</xsl:if>
</xsl:template>



<xsl:template name="body">
<xsl:variable name="file">
<xsl:value-of select="ns:ead/ns:eadheader/ns:eadid"/>

</xsl:variable>

<html>

<head>

<title>

<xsl:value-of select="ns:ead/ns:eadheader/ns:filedesc/ns:titlestmt"/>

</title>


</head>

<body bgcolor="#FFFFFF">


<xsl:call-template name="archdesc-did"/>
<xsl:call-template name="archdesc-bioghist"/>
<xsl:call-template name="archdesc-scopecontent"/>
<xsl:call-template name="archdesc-restrict"/>
<xsl:call-template name="archdesc-control"/>
<xsl:call-template name="archdesc-admininfo"/>

<xsl:call-template name="archdesc-relatedmaterial"/>
<xsl:call-template name="archdesc-otherfindaid"/>

<xsl:call-template name="archdesc-index"/>

<xsl:call-template name="archdesc-odd"/>
<!--<xsl:call-template name="head"/>-->
<xsl:call-template name="archdesc-bibliography"/>
<xsl:call-template name="archdesc-arrangement"/>
<xsl:call-template name="dsc"/>

<xsl:call-template name="end"/></body>
</html>
</xsl:template>




<!-- The following templates format the display of various RENDER attributes.-->

<xsl:template match="ns:emph[@render='bold']">
	<b>
		<xsl:apply-templates/>
	</b>
</xsl:template>

<xsl:template match="ns:emph[@render='italic']">
	<i>
		<xsl:apply-templates/>
	</i>
</xsl:template>

<xsl:template match="ns:emph[@render='underline']">
	<u>
		<xsl:apply-templates/>
	</u>
</xsl:template>

<xsl:template match="ns:emph[@render='sub']">
	<sub>
		<xsl:apply-templates/>
	</sub>
</xsl:template>

<xsl:template match="ns:emph[@render='super']">
	<super>
		<xsl:apply-templates/>
	</super>
</xsl:template>

<xsl:template match="ns:emph[@render='doublequote']">
	<xsl:text>"</xsl:text>
		<xsl:apply-templates/>
	<xsl:text>"</xsl:text>
</xsl:template>

<xsl:template match="ns:emph[@render='boldquoted']">
	<b>
		<xsl:text>"</xsl:text>
			<xsl:apply-templates/>
		<xsl:text>"</xsl:text>
	</b>
</xsl:template>

<xsl:template match="ns:emph[@render='boldunderline']">
	<b>
		<u>
			<xsl:apply-templates/>
		</u>
	</b>
</xsl:template>

<xsl:template match="ns:emph[@render='bolditalic']">
	<b>
		<i>
			<xsl:apply-templates/>
		</i>
	</b>
</xsl:template>

<xsl:template match="ns:emph[@render='boldsmcaps']">
	<font style="font-variant: small-caps">
		<b>
			<xsl:apply-templates/>
		</b>
	</font>
</xsl:template>

<xsl:template match="ns:emph[@render='smcaps']">
	<font style="font-variant: small-caps">
		<xsl:apply-templates/>
	</font>
</xsl:template>

<xsl:template match="ns:title[@render='bold']">
	<b>
		<xsl:apply-templates/>
	</b>
</xsl:template>

<xsl:template match="ns:title[@render='italic']">
	<i>
		<xsl:apply-templates/>
	</i>
</xsl:template>

<xsl:template match="ns:title[@render='underline']">
	<u>
		<xsl:apply-templates/>
	</u>
</xsl:template>

<xsl:template match="ns:title[@render='sub']">
	<sub>
		<xsl:apply-templates/>
	</sub>
</xsl:template>

<xsl:template match="ns:title[@render='super']">
	<super>
		<xsl:apply-templates/>
	</super>
</xsl:template>

<xsl:template match="ns:title[@render='quoted']">
	<xsl:text>"</xsl:text>
		<xsl:apply-templates/>
	<xsl:text>"</xsl:text>
</xsl:template>

<xsl:template match="ns:title[@render='boldquoted']">
	<b>
		<xsl:text>"</xsl:text>
			<xsl:apply-templates/>
		<xsl:text>"</xsl:text>
	</b>
</xsl:template>

<xsl:template match="ns:title[@render='boldunderline']">
	<b>
		<u>
			<xsl:apply-templates/>
		</u>
	</b>
</xsl:template>

<xsl:template match="ns:title[@render='bolditalic']">
	<b>
		<i>
			<xsl:apply-templates/>
		</i>
	</b>
</xsl:template>

<xsl:template match="ns:title[@render='boldsmcaps']">
	<font style="font-variant: small-caps">
		<b>
			<xsl:apply-templates/>
		</b>
	</font>
</xsl:template>

<xsl:template match="ns:title[@render='smcaps']">
	<font style="font-variant: small-caps">
		<xsl:apply-templates/>
	</font>
</xsl:template>

<!-- template for a line break -->

<xsl:template match="ns:lb">
<br></br>
</xsl:template>


<!-- This template converts a Ref element into an HTML anchor.-->

<xsl:template match="ns:ead/ns:archdesc//ns:ref">
<xsl:variable name="target">
<xsl:value-of select="@target"/>
</xsl:variable>
<a href="#{$target}">
<xsl:value-of select="."/>
</a>
</xsl:template>

<xsl:template match="ns:ead/ns:archdesc//ns:extref">
<xsl:variable name="href">
<xsl:value-of select="@ns2:href"/>
</xsl:variable>
<a href="{$href}" target="new">
<xsl:value-of select="."/>
</a>
</xsl:template>

<!--This template rule formats a list element.-->
<xsl:template match="*/ns:list">
<xsl:for-each select="ns:item">
<p style="margin-left: 60pt">
<xsl:apply-templates/>
</p>
</xsl:for-each>
</xsl:template>

<!--Formats a simple table. The width of each column is defined by the colwidth attribute in a colspec element.-->
<xsl:template match="*/ns:table">
<xsl:for-each select="ns:tgroup">
<table width="100%">
<tr>
<xsl:for-each select="ns:colspec">
<td width="{@colwidth}"></td>
</xsl:for-each>
</tr>
<xsl:for-each select="ns:thead">
<xsl:for-each select="ns:row">
<tr>
<xsl:for-each select="ns:entry">
<td valign="top"><b><xsl:value-of select="."/></b>
</td>
</xsl:for-each>
</tr>
</xsl:for-each>
</xsl:for-each>

<xsl:for-each select="ns:tbody">
<xsl:for-each select="ns:row">
<tr>
<xsl:for-each select="ns:entry">
<td valign="top"><xsl:value-of select="."/></td>
</xsl:for-each>
</tr>
</xsl:for-each>
</xsl:for-each>
</table>
</xsl:for-each>
</xsl:template>


<!--This template rule formats the top-level did element.-->
<xsl:template name="archdesc-did">
<xsl:variable name="file">
<xsl:value-of select="ns:ead/ns:eadheader/ns:eadid"/>
</xsl:variable>


<!--For each element of the did, this template inserts the value of the LABEL attribute or, if none is present, a default value.-->


<xsl:for-each select="ns:ead/ns:archdesc/ns:did">
<table width="100%">
<tr><td width="5%"> </td><td width="20%"> </td>
<td width="75%"> </td></tr>
<tr><td colspan="3"><h3><a name="a1">
<xsl:text>Collection Summary</xsl:text>
</a></h3> </td></tr>

<xsl:if test="ns:origination[string-length(text()|*)!=0]">
<xsl:for-each select="ns:origination">
<xsl:choose>
<xsl:when test="@label">
<tr><td> </td><td valign="top">
<b><xsl:value-of select="@label"/>:
</b></td><td>
<xsl:apply-templates select="."/>
</td></tr>
</xsl:when>
<xsl:otherwise>
<tr><td> </td><td valign="top">
<b><xsl:text>Creator: </xsl:text></b></td><td>
<xsl:apply-templates select="."/>
</td></tr>
</xsl:otherwise>
</xsl:choose>
</xsl:for-each>
</xsl:if>

<!-- Tests for and processes various permutations of unittitle and unitdate.-->
<xsl:for-each select="ns:unittitle">
<xsl:choose>
<xsl:when test="@label">
<tr><td> </td><td valign="top"><b>
<xsl:value-of select="@label"/>:
</b></td><td>
<xsl:apply-templates select="text() |* [not(self::ns:unitdate)]"/>
</td></tr>
</xsl:when>
<xsl:otherwise>
<tr><td> </td><td valign="top"><b>
<xsl:text>Title: </xsl:text>
</b></td><td>
<xsl:apply-templates select="text() |* [not(self::ns:unitdate)]"/>
</td></tr>
</xsl:otherwise>
</xsl:choose>

<xsl:if test="child::ns:unitdate">
<xsl:choose>
<xsl:when test="./ns:unitdate/@label">
<tr><td> </td><td valign="top">
<b>
<xsl:value-of select="./ns:unitdate/@label"/>
</b></td><td>
<xsl:apply-templates select="./ns:unitdate"/>
</td></tr>
</xsl:when>
<xsl:otherwise>
<tr><td> </td><td valign="top">
<b>
<xsl:text>Dates: </xsl:text>
</b></td><td>
<xsl:apply-templates select="./ns:unitdate"/>
</td></tr>
</xsl:otherwise>
</xsl:choose>
</xsl:if>
</xsl:for-each>

<!-- Processes the unit date if it is not a child of unit title but a child of did, the current context.-->
<xsl:if test="ns:unitdate">
<xsl:for-each select="ns:unitdate[string-length(text()|*)!=0]">
<xsl:choose>
<xsl:when test="./@label">
<tr><td> </td><td valign="top">
<b>
<xsl:value-of select="./@label"/>
</b></td><td>
<xsl:apply-templates select="."/>
</td></tr>
</xsl:when>
<xsl:otherwise>
<tr><td> </td><td valign="top">
<b>
<xsl:text>Dates: </xsl:text>
</b></td><td>
<xsl:apply-templates select="."/>
</td></tr>
</xsl:otherwise>
</xsl:choose>
</xsl:for-each>
</xsl:if>

<xsl:if test="ns:abstract[string-length(text()|*)!=0]">
<xsl:choose>
<xsl:when test="@label">
<tr><td> </td><td valign="top">
<b><xsl:value-of select="@label"/>
</b></td><td>
<xsl:apply-templates select="ns:abstract"/>
</td></tr>
</xsl:when>
<xsl:otherwise>
<tr><td> </td><td valign="top">
<b><xsl:text>Abstract: </xsl:text></b></td><td>
<xsl:apply-templates select="ns:abstract"/>
</td></tr>
</xsl:otherwise>
</xsl:choose>
</xsl:if>

<xsl:if test="ns:physdesc[string-length(text()|*)!=0]">
<xsl:choose>
<xsl:when test="@label">
<tr><td> </td><td valign="top">
<b><xsl:value-of select="@label"/>
</b></td><td>
<xsl:apply-templates select="ns:physdesc"/>
</td></tr>
</xsl:when>

<xsl:otherwise>
<tr><td> </td><td valign="top">
<b><xsl:text>Quantity: </xsl:text></b></td><td>
<xsl:apply-templates select="ns:physdesc"/>
</td></tr>
</xsl:otherwise>
</xsl:choose>
</xsl:if>

<xsl:if test="ns:unitid[string-length(text()|*)!=0]">
<xsl:choose>
<xsl:when test="@label">
<tr><td> </td><td valign="top">
<b><xsl:value-of select="@label"/>
</b></td><td>
<xsl:apply-templates select="ns:unitid"/>
</td></tr>
</xsl:when>

<xsl:otherwise>
<tr><td> </td><td valign="top">
<b><xsl:text>Collection Number: </xsl:text></b></td><td>
<xsl:apply-templates select="ns:unitid"/>

</td></tr>
</xsl:otherwise>
</xsl:choose>
</xsl:if>

<xsl:if test="ns:physloc[string-length(text()|*)!=0]">
<xsl:choose>
<xsl:when test="@label">
<tr><td> </td><td valign="top">
<b><xsl:value-of select="@label"/>
</b></td><td>
<xsl:apply-templates select="ns:physloc"/>
</td></tr>
</xsl:when>

<xsl:otherwise>
<tr><td> </td><td valign="top">
<b><xsl:text>Location: </xsl:text></b></td><td>
<xsl:apply-templates select="ns:physloc"/>
</td></tr>
</xsl:otherwise>
</xsl:choose>
</xsl:if>

<xsl:if test="ns:note[string-length(text()|*)!=0]">
<xsl:for-each select="ns:note">
<xsl:choose>
<xsl:when test="@type">
<tr><td> </td><td valign="top">
<b><xsl:value-of select="@type"/>
</b></td></tr>
<xsl:for-each select="ns:p">
<tr><td> </td><td valign="top">
<xsl:apply-templates/>
</td></tr>
</xsl:for-each>
</xsl:when>

<xsl:otherwise>
<tr><td> </td><td valign="top">
<b>Location:</b></td><td>
<xsl:apply-templates select="ns:note"/>
</td></tr>
</xsl:otherwise>
</xsl:choose>
</xsl:for-each>
</xsl:if>


<xsl:if test="ns:repository[string-length(text()|*)!=0]">
<xsl:choose>
<xsl:when test="@label">
<tr><td> </td><td valign="top">
<b><xsl:value-of select="@label"/>
</b></td><td>
<xsl:apply-templates select="ns:repository"/>
</td></tr>
</xsl:when>

<xsl:otherwise>
<tr><td> </td><td valign="top">
<b><xsl:text>Repository: </xsl:text></b></td><td>
<xsl:apply-templates select="ns:repository"/>
</td></tr>
</xsl:otherwise>
</xsl:choose>
</xsl:if>             
</table>


<br/><hr/>



</xsl:for-each>
</xsl:template>



<!--This template rule formats the top-level bioghist element.-->
<xsl:template name="archdesc-bioghist">
<xsl:variable name="file">
<xsl:value-of select="ns:ead/ns:eadheader/ns:eadid"/>
</xsl:variable>

<xsl:if test="ns:ead/ns:archdesc/ns:bioghist[string-length(text()|*)!=0]">
<xsl:for-each select="ns:ead/ns:archdesc/ns:bioghist">
<xsl:apply-templates/>
<p class="rtoc">
<a href="#a0">Return to the Table of Contents</a>
<hr/>

</p>





</xsl:for-each>
</xsl:if>
</xsl:template>

<xsl:template match="ns:ead/ns:archdesc/ns:bioghist/ns:head">

<h3><a name="a2">
<xsl:apply-templates/>
</a></h3>
</xsl:template>

<xsl:template match="ns:ead/ns:archdesc/ns:bioghist/ns:p">
<p style="margin-left: 30pt">
<xsl:apply-templates/>
</p>
</xsl:template>

<xsl:template match="ns:ead/ns:archdesc/ns:bioghist/ns:chronlist">
<xsl:apply-templates/>
</xsl:template>


<xsl:template match="ns:ead/ns:archdesc/ns:bioghist/ns:list">
<xsl:for-each select="ns:head">
<p style="margin-left: 30pt">
<xsl:apply-templates select="."/>
</p>
</xsl:for-each>
<xsl:for-each select="ns:item">
<p style="margin-left: 60pt">
<xsl:apply-templates select="."/>
</p>
</xsl:for-each>
</xsl:template>


<xsl:template match="ns:ead/ns:archdesc/ns:bioghist/ns:bioghist">
<h3>
<xsl:apply-templates select="ns:head"/>
</h3>
<xsl:for-each select="ns:p">
<p style="margin-left: 30pt">
<xsl:apply-templates select="."/>
</p>
</xsl:for-each>
</xsl:template>

<!--This template rule formats a chronlist element.-->
<xsl:template match="*/ns:chronlist">
<table width="100%">
<tr><td width="5%"> </td><td width="30%"> </td>
<td width="65%"> </td></tr>

<xsl:for-each select="ns:listhead">
<tr><td><b>
<xsl:apply-templates select="ns:head01"/>
</b></td>
<td><b>
<xsl:apply-templates select="ns:head02"/>
</b></td></tr>
</xsl:for-each>

<xsl:for-each select="ns:chronitem">
<tr><td></td><td valign="top">
<xsl:apply-templates select="ns:date"/>
</td>
<td valign="top">
<xsl:apply-templates select="ns:event"/>
</td></tr>
</xsl:for-each>
</table>
</xsl:template>

<!--
<xsl:template match="*/ns:dao">
<xsl:for-each select="ns:dao">
<div style="margin-left:10; ">
<span style="font-size:smaller; font-weight:bold; ">
<xsl:text>dao:</xsl:text>
</span>
<span style="font-weight:bold; ">
<xsl:text>&#160;</xsl:text>
</span>
<xsl:apply-templates/>
</div>
</xsl:for-each>
</xsl:template>
This template rule formats the dao.-->



<!--This template rule formats the scopecontent element.-->
<xsl:template name="archdesc-scopecontent">
<xsl:if test="ns:ead/ns:archdesc/ns:scopecontent[string-length(text()|*)!=0]">
<xsl:for-each select="ns:ead/ns:archdesc/ns:scopecontent"> 


<xsl:apply-templates/>
</xsl:for-each>

<xsl:call-template name="scopecontent-arrangementstatement"/>
<p class="rtoc">
<a href="#a0">Return to the Table of Contents</a>
<hr/>

</p>


</xsl:if>
</xsl:template>

<xsl:template match="ns:ead/ns:archdesc/ns:scopecontent/ns:head">

<h3><a name="a3">
<xsl:apply-templates/>
</a></h3>
</xsl:template>


<xsl:template match="ns:ead/ns:archdesc/ns:scopecontent/ns:p">
<p style="margin-left: 30pt">
<xsl:apply-templates/>
</p>
</xsl:template>

<!-- This formats a list embedded in a scope content statement.-->
<xsl:template match="ns:ead/ns:archdesc/ns:scopecontent/ns:list">
<xsl:for-each select="ns:head">
<p style="margin-left: 30pt">
<xsl:apply-templates select="."/>
</p>
</xsl:for-each>
<xsl:for-each select="ns:item">
<p style="margin-left: 60pt">
<xsl:apply-templates select="."/>
</p>
</xsl:for-each>
</xsl:template>



<!-- shows the arrangement statement -->
<xsl:template name="scopecontent-arrangementstatement">

<p style="margin-left: 30pt">
<xsl:apply-templates select="ns:p"/>
</p>
</xsl:template>




<!-- Brian - This template rule formats head element.
<xsl:template name="head">
<xsl:if test="ns:head[string-length(text()|*)!=0]">
<xsl:for-each select="ns:head">
<h3><b><xsl:apply-templates select="."/>
</b></h3>
</xsl:for-each>
</xsl:if>
</xsl:template>
-->

<!--

<xsl:template name="archdesc-arrangement">
<xsl:if test="ns:ead/ns:archdesc/ns:arrangement[string-length(text()|*)!=0]">
<xsl:for-each select="ns:ead/ns:archdesc/ns:arrangement">
<h3><a name="a8">
<b><xsl:apply-templates select="ns:head"/>
</b></a></h3>
<xsl:for-each select="ns:p">
<p style="margin-left : 30pt">
<xsl:apply-templates select="."/>
</p>
</xsl:for-each>
</xsl:for-each>
<p class="rtoc">
<a href="#a0">Return to the Table of Contents</a>
<hr/></p>


</xsl:if>
</xsl:template>
-->
<!--This template rule formats the arrangement element. -->
<xsl:template name="archdesc-arrangement">
<xsl:if test="ns:ead/ns:archdesc/ns:arrangement[string-length(text()|*)!=0]">
<xsl:for-each select="ns:ead/ns:archdesc/ns:arrangement">
<table width="100%">
<tr><td width="5%"> </td><td width="5%"> </td>
<td width="90%"> </td></tr>

<tr><td colspan="3"> <h3><a name="a5">
<xsl:apply-templates select="ns:head"/>
</a></h3>
</td></tr>
 
<xsl:for-each select="ns:p">
<tr><td> </td><td colspan="2">
<xsl:apply-templates select="."/>
</td></tr>
</xsl:for-each>

<xsl:for-each select="ns:list">
<tr><td> </td><td colspan="2">
<xsl:apply-templates select="ns:head"/>
</td></tr>
<xsl:for-each select="ns:item">
<tr><td> </td><td> </td><td colspan="1">
<a><xsl:attribute name="href">#series<xsl:number/>
</xsl:attribute>
<xsl:apply-templates select="."/>
</a>
</td></tr>
</xsl:for-each>
</xsl:for-each>

</table>
</xsl:for-each>
<p>

</p>
<hr></hr>
</xsl:if>
</xsl:template>

<!--This template rule formats the top-level relatedmaterial element.-->
<xsl:template name="archdesc-relatedmaterial">
<xsl:if test="ns:ead/ns:archdesc/ns:relatedmaterial[string-length(text()|*)!=0] | ns:ead/ns:archdesc/ns:separatedmaterial[string-length(text()|*)!=0]">
<h3><a name="a6">
<b><xsl:text>Related Material</xsl:text>
</b></a></h3>
<xsl:for-each select="ns:ead/ns:archdesc/ns:relatedmaterial | ns:ead/ns:archdesc/ns:separatedmaterial">
<xsl:apply-templates select="*[not(self::ns:head)]"/> 
</xsl:for-each>
<p class="rtoc">
<a href="#a0">Return to the Table of Contents</a>
<hr/></p>



</xsl:if>
</xsl:template>


<xsl:template match="ns:ead/ns:archdesc/ns:relatedmaterial/ns:p  | ns:ead/ns:archdesc/ns:separatedmaterial/ns:p">
<p style="margin-left : 30pt">
<xsl:apply-templates/>
</p>
</xsl:template>


<!--This template rule formats the top-level otherfindaid element.-->
<xsl:template name="archdesc-otherfindaid">
<xsl:if test="ns:ead/ns:archdesc/ns:otherfindaid[string-length(text()|*)!=0]">
<xsl:for-each select="ns:ead/ns:archdesc/ns:otherfindaid">
<h3><a name="a8">
<b><xsl:apply-templates select="ns:head"/>
</b></a></h3>
<xsl:for-each select="ns:p">
<p style="margin-left : 30pt">
<xsl:apply-templates select="."/>
</p>
</xsl:for-each>
</xsl:for-each>
<p class="rtoc">
<a href="#a0">Return to the Table of Contents</a>
<hr/></p>


</xsl:if>
</xsl:template>

<!--This template rule formats the top-level index element.-->
<xsl:template name="archdesc-index">
<xsl:if test="ns:ead/ns:archdesc/ns:index[string-length(text()|*)!=0]">
<xsl:for-each select="ns:ead/ns:archdesc/ns:index">
<h3><a name="a9">
<b><xsl:apply-templates select="ns:head"/>
</b></a></h3>
<xsl:for-each select="ns:p">
<p style="margin-left : 30pt">
<xsl:apply-templates select="."/>
</p>
</xsl:for-each>
</xsl:for-each>
<p class="rtoc">
<a href="#a0">Return to the Table of Contents</a>
<hr/>

</p>
</xsl:if>
</xsl:template>

<!--This template rule formats the top-level bibliography element.-->
<xsl:template name="archdesc-bibliography">
<xsl:if test="ns:ead/ns:archdesc/ns:bibliography[string-length(text()|*)!=0]">
<xsl:for-each select="ns:ead/ns:archdesc/ns:bibliography">
<h3><a name="a10">
<b><xsl:apply-templates select="ns:head"/>
</b></a></h3>
<xsl:for-each select="ns:p">
<xsl:for-each select="ns:bibref">
<p style="margin-left : 30pt">
<xsl:apply-templates select="."/>
</p>
</xsl:for-each>
</xsl:for-each>
</xsl:for-each>
<p class="rtoc">
<a href="#a0">Return to the Table of Contents</a>
<hr/>

</p>
</xsl:if>
</xsl:template>


<!--This template rule formats the top-level odd element.-->
<xsl:template name="archdesc-odd">
<xsl:if test="ns:ead/ns:archdesc/ns:odd[string-length(text()|*)!=0]">
<xsl:for-each select="ns:ead/ns:archdesc/ns:odd">
<h3><a name="a11">
<b><xsl:apply-templates select="ns:head"/>
</b></a></h3>
<xsl:for-each select="ns:list">
<xsl:apply-templates select="."/>
<xsl:for-each select="ns:p">
<p style="margin-left : 30pt">
<xsl:apply-templates select="."/>
</p>
</xsl:for-each>
</xsl:for-each>
</xsl:for-each>
<p class="rtoc">
<a href="#a0">Return to the Table of Contents</a>
<hr/>

</p>
</xsl:if>
</xsl:template>
<!-- insert for access points -->

<xsl:template name="archdesc-control">
<xsl:if test="ns:ead/ns:archdesc/ns:controlaccess/ns:controlaccess[string-length(text()|*)!=0]">
<xsl:for-each select="ns:ead/ns:archdesc/ns:controlaccess/ns:controlaccess">
<table width="100%">
<tr><td width="5%"> </td><td width="5%"> </td>
<td width="90%"> </td></tr>

<tr><td colspan="3"><h3><a name="a12">
<xsl:apply-templates select="ns:head"/>
</a></h3> </td></tr>

<!--<tr><td> </td><td colspan="2">
<xsl:apply-templates select="ns:p"/>
</td></tr>-->
    
<!--!tr><td colspan="3"></td></tr>-->


<xsl:for-each select="ns:subject | ns:corpname | ns:persname | ns:famname | ns:genreform | ns:title | ns:geogname | ns:occupation">
<xsl:sort select="."/>
<tr><td></td><td></td><td>
<xsl:apply-templates select="."/>
</td></tr>
</xsl:for-each>

</table>
</xsl:for-each>
<p class="rtoc">
<a href="#a0">Return to the Table of Contents</a>
<hr/>

</p>
</xsl:if>
</xsl:template>

<!--This template rule formats a top-level accessrestrict element.-->
<xsl:template name="archdesc-restrict">
<xsl:if test="ns:ead/ns:archdesc/ns:accessrestrict[string-length(text()|*)!=0] | ns:ead/ns:archdesc/ns:userestrict[string-length(text()|*)!=0]">
<h3>
<a name="a14">
<b><xsl:text>Restrictions</xsl:text>
</b></a></h3>
<xsl:for-each select="ns:ead/ns:archdesc/ns:accessrestrict">
<h4 style="margin-left : 15pt"><xsl:value-of select="ns:head"/></h4>
<xsl:for-each select="ns:p">
<p style="margin-left : 30pt">
<xsl:apply-templates select="."/>
</p>
</xsl:for-each>
</xsl:for-each>

<xsl:for-each select="ns:ead/ns:archdesc/ns:userestrict">
<h4 style="margin-left : 15pt"><xsl:value-of select="ns:head"/></h4>
<xsl:for-each select="ns:p">
<p style="margin-left : 30pt">
<xsl:apply-templates select="."/>
</p>
</xsl:for-each>
</xsl:for-each>
<p class="rtoc">
<a href="#a0">Return to the Table of Contents</a>
<hr/>

</p>
</xsl:if>
</xsl:template>


<xsl:template name="archdesc-admininfo">
<xsl:if test="ns:ead/ns:archdesc/ns:prefercite[string-length(text()|*)!=0] | ns:ead/ns:archdesc/ns:custodhist[string-length(text()|*)!=0] | ns:ead/ns:archdesc/ns:descgrp/ns:altformavail[string-length(text()|*)!=0] |
ns:ead/ns:archdesc/ns:descgrp/ns:acqinfo[string-length(text()|*)!=0] | ns:ead/ns:archdesc/ns:descgrp/ns:processinfo[string-length(text()|*)!=0] | ns:ead/ns:archdesc/ns:descgrp/ns:appraisal[string-length(text()|*)!=0] | ns:ead/ns:archdesc/ns:descgrp/ns:accruals[string-length(text()|*)!=0]">
<h3><a name="a13">
<xsl:text>Administrative Information</xsl:text>
</a></h3>
<xsl:call-template name="archdesc-custodhist"/>
<xsl:call-template name="archdesc-altform"/>
<xsl:call-template name="archdesc-prefercite"/>
<xsl:call-template name="archdesc-acqinfo"/>
<xsl:call-template name="archdesc-processinfo"/>
<xsl:call-template name="archdesc-appraisal"/>
<xsl:call-template name="archdesc-accruals"/>
<p class="rtoc">
<a href="#a0">Return to the Table of Contents</a>
<hr/>

</p>
</xsl:if>
</xsl:template>

<!--This template rule formats a top-level custodhist element.-->
<xsl:template name="archdesc-custodhist">
<xsl:if test="ns:ead/ns:archdesc/ns:custodhist[string-length(text()|*)!=0]">
<xsl:for-each select="ns:ead/ns:archdesc/ns:custodhist">
<h4 style="margin-left : 15pt">
<a name="a16">
<xsl:apply-templates select="ns:head"/>
</a></h4>
<xsl:for-each select="ns:p">
<p style="margin-left : 30pt">
<xsl:apply-templates select="."/>
</p>
</xsl:for-each>
</xsl:for-each>
</xsl:if>
</xsl:template>


<!--This template rule formats a top-level altformavailable element.-->
<xsl:template name="archdesc-altform">
<xsl:if test="ns:ead/ns:archdesc/ns:descgrp/ns:altformavailable[string-length(text()|*)!=0]">
<xsl:for-each select="ns:ead/ns:archdesc/ns:descgrp/ns:altformavailable">
<h4 style="margin-left : 15pt">
<a name="a17">
<b><xsl:apply-templates select="ns:head"/>
</b></a></h4>
<xsl:for-each select="ns:p">
<p style="margin-left : 30pt">
<xsl:apply-templates select="."/>
</p>
</xsl:for-each>
</xsl:for-each>
</xsl:if>
</xsl:template>



<!--This template rule formats a top-level prefercite element.-->
<xsl:template name="archdesc-prefercite">
<xsl:if test="ns:ead/ns:archdesc/ns:prefercite[string-length(text()|*)!=0]">
<xsl:for-each select="ns:ead/ns:archdesc/ns:prefercite">
<h4 style="margin-left : 15pt">
<a name="a18">
<xsl:apply-templates select="ns:head"/>
</a></h4>
<xsl:for-each select="ns:p">
<p style="margin-left : 30pt">
<xsl:apply-templates select="."/>
</p>
</xsl:for-each>
</xsl:for-each>
</xsl:if>
</xsl:template>


<!--This template rule formats a top-level acqinfo element.-->
<xsl:template name="archdesc-acqinfo">
<xsl:if test="ns:ead/ns:archdesc/ns:descgrp/ns:acqinfo[string-length(text()|*)!=0]">
<xsl:for-each select="ns:ead/ns:archdesc/ns:descgrp/ns:acqinfo">
<h4 style="margin-left : 15pt"> 
<a name="a19">
<xsl:apply-templates select="ns:head"/>
</a></h4>
<xsl:for-each select="ns:p">
<p style="margin-left : 30pt">
<xsl:apply-templates select="."/>
</p>
</xsl:for-each>
</xsl:for-each>
</xsl:if>
</xsl:template>

<!--This template rule formats a top-level procinfo element.-->
<xsl:template name="archdesc-processinfo">
<xsl:if test="ns:ead/ns:archdesc/ns:descgrp/ns:processinfo[string-length(text()|*)!=0]">
<xsl:for-each select="ns:ead/ns:archdesc/ns:descgrp/ns:processinfo">
<h4 style="margin-left : 15pt">
<a name="a20">
<b><xsl:apply-templates select="ns:head"/>
</b></a></h4>
<xsl:for-each select="ns:p">
<p style="margin-left : 30pt">
<xsl:apply-templates select="."/>
</p>
</xsl:for-each>
</xsl:for-each>
</xsl:if>
</xsl:template>

<!--This template rule formats a top-level appraisal element.-->
<xsl:template name="archdesc-appraisal">
<xsl:if test="ns:ead/ns:archdesc/ns:descgrp/ns:appraisal[string-length(text()|*)!=0]">
<xsl:for-each select="ns:ead/ns:archdesc/ns:descgrp/ns:appraisal">
<h4 style="margin-left : 15pt"> 
<a name="a21">
<b><xsl:apply-templates select="ns:head"/>
</b></a></h4>
<xsl:for-each select="ns:p">
<p style="margin-left : 30pt">
<xsl:apply-templates select="."/>
</p>
</xsl:for-each>
</xsl:for-each>
</xsl:if>
</xsl:template>

<!--This template rule formats a top-level accruals element.-->
<xsl:template name="archdesc-accruals">
<xsl:if test="ns:ead/ns:archdesc/ns:descgrp/ns:accruals[string-length(text()|*)!=0]">
<xsl:for-each select="ns:ead/ns:archdesc/ns:descgrp/ns:accruals">
<h4 style="margin-left : 15pt">
<a name="a22">
<b><xsl:apply-templates select="ns:head"/>
</b></a></h4>
<xsl:for-each select="ns:p">
<p style="margin-left : 25pt">
<xsl:apply-templates select="."/>
</p>
</xsl:for-each>
</xsl:for-each>
</xsl:if>
</xsl:template>



<!-- CONTAINER LIST -->
<xsl:template name="dsc-physdesc">
<xsl:if test="ns:ead/ns:archdesc/ns:dsc/../ns:did/ns:physdesc[string-length(text()|*)!=0]">
<xsl:for-each select="ns:ead/ns:archdesc/ns:dsc/../ns:did/ns:physdesc">
<xsl:for-each select="ns:physdesc">
<p style="margin-left : 25pt">
<xsl:apply-templates select="."/>
</p>
</xsl:for-each>
</xsl:for-each>
</xsl:if>
</xsl:template>

<xsl:template name="dsc">


<xsl:for-each select="ns:ead/ns:archdesc/ns:dsc">


<h3><a name="a23">


<xsl:apply-templates select="ns:head"/>

</a></h3>



<p style="margin-left: 25 pt"><i>


<xsl:apply-templates select="ns:p"/>

</i></p>



<xsl:call-template name="components-boxplusfolder"/>

</xsl:for-each>

</xsl:template>


<!-- container list controlaccess -->

<xsl:template name="dsc-control">
<xsl:if test="ns:ead/ns:archdesc/ns:dsc//ns:controlaccess[string-length(text()|*)!=0]">
<xsl:for-each select="../ns:controlaccess/ns:p">
<table width="100%">
<tr><td width="5%"> </td><td width="5%"> </td>
<td width="90%"> </td></tr>

<tr><td colspan="3"><h3><a name="a12">
<xsl:apply-templates select="ns:head"/>
</a></h3> </td></tr>

<!--<tr><td> </td><td colspan="2">
<xsl:apply-templates select="ns:p"/>
</td></tr>-->
    
<!--!tr><td colspan="3"></td></tr>-->


<xsl:for-each select="ns:subject | ns:corpname | ns:persname | ns:famname | ns:genreform | ns:title | ns:geogname | ns:occupation">
<xsl:sort select="."/>
<tr><td></td><td></td><td>
<xsl:apply-templates select="."/>
</td></tr>
</xsl:for-each>

</table>
</xsl:for-each>

</xsl:if>
</xsl:template>




<!-- start dao coding-->
<xsl:template name="dao">
<xsl:for-each select="ns:dao">
<xsl:if test="not(preceding-sibling::ns:dao)">
<xsl:for-each select="..">
<xsl:choose>
<xsl:when test="//ns:dao/@ns2id">
<span style="font-family:Arial Narrow; font-size:smaller; font-weight:bold; ">
<xsl:text> &#x00A0; &#x00A4; METS object: </xsl:text>
</span>
<xsl:for-each select="ns:dao">
<a>
<xsl:choose>
<xsl:when test="substring(string(concat('http://www.yourSite.com/',./@id)), 1, 1) = '#'">
<xsl:attribute name="href">
<xsl:value-of select="concat('http://www.yourSite.com/',./@id)"/>
</xsl:attribute>
</xsl:when>
<xsl:otherwise>
<xsl:attribute name="href">
<xsl:if test="substring(string(concat('http://www.archiviststoolkit.org/',./@id)), 2, 1) = ':'">
<xsl:text> &#x00A0; &#x00A4; file:///</xsl:text>
</xsl:if>
<xsl:value-of select="translate(string(concat('http://www.archiviststoolkit.org/',./@id)), '&#x5c;', '/')"/>
</xsl:attribute>
</xsl:otherwise>
</xsl:choose>
<xsl:for-each select="ns:daodesc">
<xsl:apply-templates/>
</xsl:for-each>
</a>
</xsl:for-each>
</xsl:when>
<xsl:otherwise/>
</xsl:choose>
<xsl:choose>
<xsl:when test="//ns:dao/@ns2:href">
<span style="font-family:Arial Narrow; font-size:smaller; font-weight:bold;  margin-left:20; color: #0000ff; ">
<xsl:text> &#x00A0; &#x00A4; Digital object: </xsl:text>
</span><br/>
<xsl:for-each select="ns:dao">
<a>
<xsl:choose>
<xsl:when test="substring(string(./@ns2:href), 1, 1) = '#'">
<xsl:attribute name="href">
<xsl:value-of select="./@ns2:href"/>
</xsl:attribute>
</xsl:when>
<xsl:otherwise>
<xsl:attribute name="href">
<xsl:if test="substring(string(./@ns2:href), 2, 1) = ':'">
<xsl:text> &#x00A0; &#x00A4; file:///</xsl:text>
</xsl:if>
<xsl:value-of select="translate(string(./@ns2:href), '&#x5c;', '/')"/>
</xsl:attribute>
</xsl:otherwise>
</xsl:choose>
<xsl:for-each select="ns:daodesc">
<span style="  margin-left:20; "><xsl:apply-templates/></span>
</xsl:for-each>
</a><br/>
</xsl:for-each>
</xsl:when>
<xsl:otherwise/>
</xsl:choose>
</xsl:for-each>
</xsl:if>
</xsl:for-each>
<div>&#x00A0;</div>
</xsl:template>
<!-- end of dao -->



<xsl:template name="components-boxplusfolder">


<xsl:choose>

<xsl:when test="ns:c01[@level='series'] | ns:c02[@level='series'] | ns:c02[@level='subseries'] | ns:c02[@level='otherlevel'] | ns:c03[@level='otherlevel']">


<!-- displays container list with series -->



<!-- Proceses each c01 series.-->



<xsl:for-each select="ns:c01">


<a><xsl:attribute name="name">series<xsl:number/>

</xsl:attribute>

</a>

<table width="525">

<tr>

<td width="20"> </td><td width="5"> </td>

<td width="20"> </td><td width="5"> </td>



<td width="20"> </td><td width="5"> </td>

<td width="20"></td><td width="5"> </td>

<td width="20"> </td><td width="5"> </td>



<td width="20"> </td><td width="5"> </td>

<td width="20"> </td><td width="5"> </td>

<td width="20"> </td><td width="5"> </td>

<td width="325"></td>



</tr>

<xsl:for-each select="ns:did">


<!-- Creates a variable called box-number whose value is equal to the value of the container element for the current component.-->

<xsl:variable name="box-number" select="ns:container[@type='box']"/>


<xsl:call-template name="showbox-c01-series-boxplusfolder"/>

</xsl:for-each>



<xsl:for-each select="ns:scopecontent | ns:bioghist | ns:note | ns:odd | ns:accessrestrict | ns:userestrict | ns:controlaccess | ns:did/ns:physdesc | ns:did/ns:note">


<xsl:for-each select="ns:p">

<tr><td></td><td colspan="16" valign="top">

<i>

<xsl:apply-templates select="."/>

</i>

<hr noshade="noshade"/>

<br/>

</td></tr>

<tr><td colspan="17"></td></tr>



</xsl:for-each>



<xsl:for-each select="*[not(self::ns:p)]">



<xsl:apply-templates/>



</xsl:for-each>


</xsl:for-each>


<!-- Proceses each c02.-->



<xsl:for-each select="ns:c02">


<xsl:choose>
<xsl:when test="@level='subseries'">
   <tr><td colspan="16"><a><xsl:attribute name="name">subseries<xsl:number level="any" format="1"/>

</xsl:attribute>

</a>
       <p class="P.seriestoc"><b><xsl:apply-templates select="ns:did/ns:unittitle"/></b></p></td></tr>
<xsl:for-each select="ns:scopecontent | ns:bioghist | ns:note | ns:odd | ns:accessrestrict | ns:userestrict | ns:controlaccess | ns:did/ns:physdesc| ns:did/ns:note">



<xsl:for-each select="ns:p">



<tr><td></td><td></td><td></td><td colspan="14" valign="top">

<i>

<xsl:apply-templates select="."/>

</i>
<hr noshade="noshade"/>
<br/>
</td></tr>



<tr><td colspan="17"></td></tr>

</xsl:for-each>
</xsl:for-each>
</xsl:when>

<!--<xsl:when test="@level='otherlevel' and not(child::ns:container)">
  <tr><td width="10%">&#x00A0;</td><td width="10%">&#x00A0;</td><td width="40%"><p><xsl:apply-templates select="ns:did/ns:unittitle"/></p></td><td width="40%">&#x00A0;</td></tr>
</xsl:when>-->

<xsl:otherwise>



<xsl:for-each select="ns:did">



<!-- Creates a variable called box-number whose value is equal to the value of the container element for the current component.-->



<xsl:variable name="box-number" select="ns:container[@type='box']"/>



<xsl:call-template name="showbox-c02-boxplusfolder"/>

</xsl:for-each>







<xsl:for-each select="ns:scopecontent | ns:bioghist | ns:note | ns:odd | ns:accessrestrict | ns:userestrict | ns:controlaccess | ns:did/ns:physdesc| ns:did/ns:note">



<xsl:for-each select="ns:p">



<tr><td></td><td></td><td></td><td colspan="14" valign="top">

<i>

<xsl:apply-templates select="."/>

</i>
<hr noshade="noshade"/>
<br/>
</td></tr>



<tr><td colspan="17"></td></tr>

</xsl:for-each>




<!-- Brian insert for note heads -->






<!-- end insert for note heads -->


<xsl:for-each select="*[not(self::ns:p)]">



<xsl:apply-templates/>



</xsl:for-each>



</xsl:for-each>

<!-- do nothing be happy -->
</xsl:otherwise>
</xsl:choose>





<!-- Processes each c03.-->



<xsl:for-each select="ns:c03">



<xsl:for-each select="ns:did">







<!-- Creates a variable called box-number whose value is equal to the value of the container element for the current component.-->



<xsl:variable name="box-number" select="ns:container[@type='box']"/>



<xsl:call-template name="showbox-c03-boxplusfolder"/>



</xsl:for-each>



<!-- Process any remaining c03 elements of the type specified.-->



<xsl:for-each select="ns:scopecontent | ns:bioghist | ns:note | ns:odd | ns:accessrestrict | ns:userestrict | ns:controlaccess | ns:did/ns:physdesc| ns:did/ns:note">



<xsl:for-each select="ns:p">



<tr><td></td><td></td><td></td><td colspan="14" valign="top">

<i>

<xsl:apply-templates select="."/>

</i>
<hr noshade="noshade"/>
<br/>
</td></tr>



<tr><td colspan="17"></td></tr>

</xsl:for-each>



<xsl:for-each select="*[not(self::ns:p)]">



<xsl:apply-templates/>



</xsl:for-each>



</xsl:for-each>




<!-- Processes each c04.-->



<xsl:for-each select="ns:c04">



<xsl:for-each select="ns:did">



<!-- Creates a variable called box-number whose value is equal to the value of the container element for the current component.-->



<xsl:variable name="box-number" select="ns:container[@type='box']"/>



<xsl:call-template name="showbox-c04-boxplusfolder"/>



</xsl:for-each>


<!-- Process any remaining c04 elements of the type specified.-->



<xsl:for-each select="ns:scopecontent | ns:bioghist | ns:note | ns:odd | ns:accessrestrict | ns:userestrict | ns:controlaccess | ns:did/ns:physdesc| ns:did/ns:note">



<xsl:for-each select="ns:p">



<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td>

<td colspan="10" valign="top">

<i>

<xsl:apply-templates select="."/>

</i>

<hr noshade="noshade"/>

<br/>

</td></tr>



<tr><td colspan="17"></td></tr>

</xsl:for-each>



<xsl:for-each select="*[not(self::ns:p)]">



<xsl:apply-templates/>



</xsl:for-each>



</xsl:for-each>







<!-- Processes each c05-->



<xsl:for-each select="ns:c05">



<xsl:for-each select="ns:did">



<!-- Creates a variable called box-number whose value is equal to the value of the container element for the current component.-->



<xsl:variable name="box-number" select="ns:container[@type='box']"/>



<xsl:call-template name="showbox-c05-boxplusfolder"/>



</xsl:for-each>


<!-- Process any remaining c05 elements of the type specified.-->



<xsl:for-each select="ns:scopecontent | ns:bioghist | ns:note | ns:odd | ns:accessrestrict | ns:userestrict | ns:controlaccess | ns:did/ns:physdesc| ns:did/ns:note">



<xsl:for-each select="ns:p">



<tr><td></td><td></td><td></td><td></td><td></td><td></td>

<td></td><td></td><td></td><td colspan="8" valign="top">

<i>

<xsl:apply-templates select="."/>

</i>

<hr noshade="noshade"/>

<br/>

</td></tr>



<tr><td colspan="17"></td></tr>

</xsl:for-each>



<xsl:for-each select="*[not(self::ns:p)]">



<xsl:apply-templates/>



</xsl:for-each>



</xsl:for-each>



<!-- Processes each c06-->



<xsl:for-each select="ns:c06">



<xsl:for-each select="ns:did">



<!-- Creates a variable called box-number whose value is equal to the value of the container element for the current component.-->



<xsl:variable name="box-number" select="ns:container[@type='box']"/>



<xsl:call-template name="showbox-c06-boxplusfolder"/>



</xsl:for-each>



<!-- Process any remaining c06 elements of the type specified.-->



<xsl:for-each select="ns:scopecontent | ns:bioghist | ns:note | ns:odd | ns:accessrestrict | ns:userestrict | ns:controlaccess | ns:did/ns:physdesc| ns:did/ns:note">



<xsl:for-each select="ns:p">



<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>

<td></td><td></td>

<td colspan="6" valign="top">

<i>

<xsl:apply-templates select="."/>

</i>

<hr noshade="noshade"/>

<br/>

</td></tr>



<tr><td colspan="17"></td></tr>

</xsl:for-each>



<xsl:for-each select="*[not(self::ns:p)]">



<xsl:apply-templates/>



</xsl:for-each>



</xsl:for-each>




<!-- Processes each c07.-->



<xsl:for-each select="ns:c07">



<xsl:for-each select="ns:did">



<!-- Creates a variable called box-number whose value is equal to the value of the container element for the current component.-->



<xsl:variable name="box-number" select="ns:container[@type='box']"/>



<xsl:call-template name="showbox-c07-boxplusfolder"/>



</xsl:for-each>



</xsl:for-each>



<!-- Process any remaining c07 elements of the type specified.-->



<xsl:for-each select="ns:scopecontent | ns:bioghist | ns:note | ns:odd | ns:accessrestrict | ns:userestrict| ns:controlaccess| ns:did/ns:physdesc">



<xsl:for-each select="ns:p">



<tr><td></td><td></td><td></td><td></td><td></td><td></td>

<td></td><td></td><td></td><td></td><td></td>

<td></td><td></td><td colspan="4" valign="top">

<i>

<xsl:apply-templates select="."/>

</i>

<hr noshade="noshade"/>

<br/>

</td></tr>



<tr><td colspan="17"></td></tr>

</xsl:for-each>



<xsl:for-each select="*[not(self::ns:p)]">



<xsl:apply-templates/>



</xsl:for-each>



</xsl:for-each>



<!-- Processes each c08.-->



<xsl:for-each select="ns:c08">



<xsl:for-each select="ns:did">



<!-- Creates a variable called box-number whose value is equal to the value of the container element for the current component.-->



<xsl:variable name="box-number" select="ns:container[@type='box']"/>



<xsl:call-template name="showbox-c08-boxplusfolder"/>



</xsl:for-each>



<!-- Process any remaining c08 elements of the type specified.-->



<xsl:for-each select="ns:scopecontent | ns:bioghist | ns:note | ns:odd | ns:accessrestrict | ns:userestrict| ns:controlaccess | ns:did/ns:physdesc">



<xsl:for-each select="ns:p">



<tr><td></td><td></td><td></td><td></td><td></td>

<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>

<td></td><td></td><td colspan="2" valign="top">

<i>

<xsl:apply-templates select="."/>

</i>

<hr noshade="noshade"/>

<br/>


</td></tr>



<tr><td colspan="17"></td></tr>

</xsl:for-each>



<xsl:for-each select="*[not(self::ns:p)]">



<xsl:apply-templates/>



</xsl:for-each>



</xsl:for-each>







</xsl:for-each>



</xsl:for-each>



</xsl:for-each>



</xsl:for-each>



</xsl:for-each>



</xsl:for-each>


<p>



</p>


<br></br>



<br></br>


</table>


</xsl:for-each>

</xsl:when>

<xsl:otherwise>


<!-- displays a container list without series -->


<xsl:for-each select="ns:c01">


<table width="525">


<tr>

<td width="20"> </td><td width="5"> </td>

<td width="20"> </td><td width="5"> </td>



<td width="20"> </td><td width="5"> </td>

<td width="20"></td><td width="5"> </td>

<td width="20"> </td><td width="5"> </td>



<td width="20"> </td><td width="5"> </td>

<td width="20"> </td><td width="5"> </td>

<td width="20"> </td><td width="5"> </td>

<td width="325"></td>



</tr>

<a><xsl:attribute name="name">series<xsl:number/>

</xsl:attribute>

</a>

<xsl:for-each select="ns:did">

<!-- Creates a variable called box-number whose value is equal to the value of the container element for the current component.-->

<xsl:variable name="box-number" select="ns:container[@type='box']"/>



<xsl:call-template name="showbox-c01-boxplusfolder"/>

</xsl:for-each>



<xsl:for-each select="ns:scopecontent | ns:bioghist | ns:note | ns:odd | ns:accessrestrict | ns:userestrict | ns:controlaccess | ns:did/ns:physdesc | ns:did/ns:note">

<xsl:for-each select="ns:p">

<tr><td></td><td colspan="16" valign="top">

<i><xsl:apply-templates select="."/></i>
<hr noshade="noshade"/>
</td></tr>

</xsl:for-each>

<xsl:for-each select="*[not(self::ns:p)]">

<xsl:apply-templates/>

</xsl:for-each>

</xsl:for-each>


<!-- Proceses each c02.-->



<xsl:for-each select="ns:c02">


<xsl:for-each select="ns:did">



<!-- Creates a variable called box-number whose value is equal to the value of the container element for the current component.-->



<xsl:variable name="box-number" select="ns:container[@type='box']"/>



<xsl:call-template name="showbox-c02-boxplusfolder"/>


</xsl:for-each>


<xsl:for-each select="ns:scopecontent | ns:bioghist | ns:note | ns:odd | ns:accessrestrict | ns:userestrict | ns:controlaccess | ns:did/ns:physdesc | ns:did/ns:note">



<xsl:for-each select="ns:p">



<tr><td></td><td></td><td></td><td colspan="14" valign="top">

<i>

<xsl:apply-templates select="."/>

</i>

<hr noshade="noshade"/>

<br/>

</td></tr>



</xsl:for-each>



<xsl:for-each select="*[not(self::ns:p)]">



<xsl:apply-templates/>




</xsl:for-each>


</xsl:for-each>







<!-- Processes each c03.-->



<xsl:for-each select="ns:c03">



<xsl:for-each select="ns:did">



<!-- Creates a variable called box-number whose value is equal to the value of the container element for the current component.-->



<xsl:variable name="box-number" select="ns:container[@type='box']"/>


<xsl:call-template name="showbox-c03-boxplusfolder"/>



</xsl:for-each>


<!-- Process any remaining c03 elements of the type specified.-->



<xsl:for-each select="ns:scopecontent | ns:bioghist | ns:note | ns:odd | ns:accessrestrict | ns:userestrict | ns:controlaccess | ns:did/ns:physdesc | ns:did/ns:note">



<xsl:for-each select="ns:p">



<tr><td></td><td></td><td></td><td></td><td></td><td colspan="12" valign="top">

<i>

<xsl:apply-templates select="."/>

</i>

<hr noshade="noshade"/>

<br/>

</td></tr>



</xsl:for-each>



<xsl:for-each select="*[not(self::ns:p)]">



<xsl:apply-templates/>



</xsl:for-each>



</xsl:for-each>


<!-- Processes each c04.-->



<xsl:for-each select="ns:c04">



<xsl:for-each select="ns:did">


<!-- Creates a variable called box-number whose value is equal to the value of the container element for the current component.-->



<xsl:variable name="box-number" select="ns:container[@type='box']"/>



<xsl:call-template name="showbox-c04-boxplusfolder"/>




</xsl:for-each>



<!-- Process any remaining c04 elements of the type specified.-->



<xsl:for-each select="ns:scopecontent | ns:bioghist | ns:note | ns:odd | ns:accessrestrict | ns:userestrict | ns:controlaccess | ns:did/ns:physdesc | ns:did/ns:note">



<xsl:for-each select="ns:p">



<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td>

<td colspan="10" valign="top">

<i>

<xsl:apply-templates select="."/>

</i>

<hr noshade="noshade"/>

<br/>

</td></tr>



</xsl:for-each>



<xsl:for-each select="*[not(self::ns:p)]">



<xsl:apply-templates/>



</xsl:for-each>



</xsl:for-each>



<!-- Processes each c05-->



<xsl:for-each select="ns:c05">



<xsl:for-each select="ns:did">


<!-- Creates a variable called box-number whose value is equal to the value of the container element for the current component.-->

<xsl:variable name="box-number" select="ns:container[@type='box']"/>


<xsl:call-template name="showbox-c05-boxplusfolder"/>



</xsl:for-each>



<!-- Process any remaining c05 elements of the type specified.-->



<xsl:for-each select="ns:scopecontent | ns:bioghist | ns:note | ns:odd | ns:accessrestrict | ns:userestrict | ns:controlaccess | ns:did/ns:physdesc | ns:did/ns:note">



<xsl:for-each select="ns:p">



<tr><td></td><td></td><td></td><td></td><td></td><td></td>

<td></td><td></td><td></td><td colspan="8" valign="top">

<i>

<xsl:apply-templates select="."/>

</i>

<hr noshade="noshade"/>

<br/>

</td></tr>



</xsl:for-each>



<xsl:for-each select="*[not(self::ns:p)]">



<xsl:apply-templates/>



</xsl:for-each>



</xsl:for-each>



<!-- Processes each c06-->



<xsl:for-each select="ns:c06">



<xsl:for-each select="ns:did">


<!-- Creates a variable called box-number whose value is equal to the value of the container element for the current component.-->



<xsl:variable name="box-number" select="ns:container[@type='box']"/>



<xsl:call-template name="showbox-c06-boxplusfolder"/>




</xsl:for-each>

<!-- Process any remaining c06 elements of the type specified.-->



<xsl:for-each select="ns:scopecontent | ns:bioghist | ns:note | ns:odd | ns:accessrestrict | ns:userestrict | ns:controlaccess | ns:did/ns:physdesc | ns:did/ns:note">



<xsl:for-each select="ns:p">



<tr><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>

<td></td><td></td>

<td colspan="6" valign="top">

<i>

<xsl:apply-templates select="."/>

</i>

<hr noshade="noshade"/>

<br/>


</td></tr>



</xsl:for-each>



<xsl:for-each select="*[not(self::ns:p)]">



<xsl:apply-templates/>



</xsl:for-each>



</xsl:for-each>







<!-- Processes each c07 -->



<xsl:for-each select="ns:c07">



<xsl:for-each select="ns:did">


<!-- Creates a variable called box-number whose value is equal to the value of the container element for the current component. -->



<xsl:variable name="box-number" select="ns:container[@type='box']"/>



<xsl:call-template name="showbox-c07-boxplusfolder"/>



</xsl:for-each>



</xsl:for-each>



<!-- Process any remaining c07 elements of the type specified.-->



<xsl:for-each select="ns:scopecontent | ns:bioghist | ns:note | ns:odd | ns:accessrestrict | ns:userestrict | ns:controlaccess | ns:did/ns:physdesc | ns:did/ns:note">



<xsl:for-each select="ns:p">



<tr><td></td><td></td><td></td><td></td><td></td><td></td>

<td></td><td></td><td></td><td></td><td></td>

<td></td><td></td><td colspan="4" valign="top">

<i>

<xsl:apply-templates select="."/>

</i>

<hr noshade="noshade"/>

<br/>

</td></tr>



</xsl:for-each>



<xsl:for-each select="*[not(self::ns:p)]">



<xsl:apply-templates/>



</xsl:for-each>



</xsl:for-each>

<!-- Processes each c08.-->



<xsl:for-each select="ns:c08">



<xsl:for-each select="ns:did">



<!-- Creates a variable called box-number whose value is equal to the value of the container element for the current component.-->



<xsl:variable name="box-number" select="ns:container[@type='box']"/>



<xsl:call-template name="showbox-c08-boxplusfolder"/>



</xsl:for-each>



<!-- Process any remaining c08 elements of the type specified.-->



<xsl:for-each select="ns:scopecontent | ns:bioghist | ns:note | ns:odd | ns:accessrestrict | ns:userestrict | ns:controlaccess | ns:did/ns:physdesc | ns:did/ns:note">



<xsl:for-each select="ns:p">



<tr><td></td><td></td><td></td><td></td><td></td>

<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>

<td></td><td></td><td colspan="2" valign="top">

<i>

<xsl:apply-templates select="."/>

</i>

<hr noshade="noshade"/>

<br/>

</td></tr>



</xsl:for-each>



<xsl:for-each select="*[not(self::ns:p)]">



<xsl:apply-templates/>



</xsl:for-each>



</xsl:for-each>



</xsl:for-each>



</xsl:for-each>



</xsl:for-each>



</xsl:for-each>



</xsl:for-each>



</xsl:for-each>



<p>



</p>



<br></br>



<br></br>


</table>


</xsl:for-each>


</xsl:otherwise>

</xsl:choose>

</xsl:template>





<!-- Box and folder number templates -->



<!-- Shows the box and folder numbers for a c01 series-->



<xsl:template name="showbox-c01-series-boxplusfolder">


<tr>



<td colspan="17" valign="top">

<h3>



<xsl:if test="ns:unitid">



<xsl:for-each select="ns:unitid">



<xsl:apply-templates/>



<xsl:text> </xsl:text>



</xsl:for-each>



</xsl:if>



<xsl:choose>



<xsl:when test="ns:unittitle/ns:unitdate">


<xsl:for-each select="ns:unittitle">


<!-- delimmitting the date with a "|"and changing color -->

<xsl:apply-templates select="text()|*[not(self::ns:unitdate)]"/>


<xsl:text>| </xsl:text>


<xsl:apply-templates select="./ns:unitdate"/>



</xsl:for-each>



</xsl:when>



<xsl:otherwise>



<xsl:apply-templates select="ns:unittitle"/>

<xsl:if test="ns:unitdate[string-length(text()|*)!=0]"> 

<xsl:text> </xsl:text>


| <font color="#993333">

<xsl:apply-templates select="ns:unitdate"/>

</font>
</xsl:if>
</xsl:otherwise>


</xsl:choose>







<xsl:for-each select="ns:physdesc">



<xsl:text> </xsl:text>



<xsl:apply-templates/>



<xsl:text> </xsl:text>



</xsl:for-each>

</h3></td>



</tr>



<xsl:if test="ns:abstract[string-length(text()|*)!=0]">



<xsl:for-each select="ns:abstract">



<tr>



<td></td><td colspan="16" valign="top">



<xsl:apply-templates select="."/>



</td></tr>



</xsl:for-each>



</xsl:if>


</xsl:template>


<!-- Shows the box and folder numbers for a c01.-->



<xsl:template name="showbox-c01-boxplusfolder">


<tr>



<td colspan="17" valign="top">



<xsl:if test="ns:unitid">



<xsl:for-each select="ns:unitid">



<xsl:apply-templates/>



<xsl:text> </xsl:text>



</xsl:for-each>



</xsl:if>







<xsl:choose>



<xsl:when test="ns:unittitle/ns:unitdate">


<xsl:for-each select="ns:unittitle">


<!-- delimmitting the date with a "|"and changing color-->

<xsl:apply-templates select="text()|*[not(self::ns:unitdate)]"/>


<xsl:text>| </xsl:text>


<xsl:apply-templates select="./ns:unitdate"/>



</xsl:for-each>



</xsl:when>



<xsl:otherwise>



<xsl:apply-templates select="ns:unittitle"/>

<xsl:if test="ns:unitdate[string-length(text()|*)!=0]"> 

<xsl:text> </xsl:text>


| <font color="#993333">

<xsl:apply-templates select="ns:unitdate"/>

</font>
</xsl:if>
</xsl:otherwise>



</xsl:choose>







<xsl:for-each select="ns:physdesc">



<xsl:text> </xsl:text>



<xsl:apply-templates/>



<xsl:text> </xsl:text>



</xsl:for-each>





<xsl:call-template name="container-type-test"/>
<xsl:call-template name="dao"/>



</td>



</tr>







<xsl:if test="ns:abstract[string-length(text()|*)!=0]">



<xsl:for-each select="ns:abstract">



<tr>



<td></td><td colspan="16" valign="top">



<xsl:apply-templates select="."/>



</td></tr>



</xsl:for-each>



</xsl:if>



</xsl:template>



<!-- Shows the box and folder numbers for a c02.-->



<xsl:template name="showbox-c02-boxplusfolder">



<tr>



<td></td><td></td><td colspan="15" valign="top">



<xsl:if test="ns:unitid">



<xsl:for-each select="ns:unitid">



<xsl:apply-templates/>



<xsl:text> </xsl:text>



</xsl:for-each>



</xsl:if>







<xsl:choose>



<xsl:when test="ns:unittitle/ns:unitdate">



<xsl:for-each select="ns:unittitle">


<!-- delimmitting the date with a "|"and changing color-->

<xsl:apply-templates select="text()|*[not(self::ns:unitdate)]"/>


<xsl:text>| </xsl:text>


<xsl:apply-templates select="./ns:unitdate"/>



</xsl:for-each>



</xsl:when>



<xsl:otherwise>



<xsl:apply-templates select="ns:unittitle"/>

<xsl:if test="ns:unitdate[string-length(text()|*)!=0]"> 

<xsl:text> </xsl:text>


| <font color="#993333">

<xsl:apply-templates select="ns:unitdate"/>

</font>
</xsl:if>
</xsl:otherwise>


</xsl:choose>







<xsl:for-each select="ns:physdesc">



<xsl:text> </xsl:text>



<xsl:apply-templates/>



<xsl:text> </xsl:text>



</xsl:for-each>





<xsl:call-template name="container-type-test"/>
<xsl:call-template name="dao"/>



</td>



</tr>







<xsl:if test="ns:abstract[string-length(text()|*)!=0]">



<xsl:for-each select="ns:abstract">



<tr>



<td></td><td></td><td></td><td colspan="14" valign="top">



<xsl:apply-templates select="."/>



</td></tr>



</xsl:for-each>



</xsl:if>



</xsl:template>




<!-- Shows the box and folder number for a c03.-->



<xsl:template name="showbox-c03-boxplusfolder">



<tr>



<td> 



</td>



<td> 



</td>



<td></td><td></td><td colspan="13" valign="top">







<xsl:if test="ns:unitid">



<xsl:for-each select="ns:unitid">



<xsl:apply-templates/>



<xsl:text> </xsl:text>



</xsl:for-each>



</xsl:if>







<xsl:choose>



<xsl:when test="ns:unittitle/ns:unitdate">



<xsl:for-each select="ns:unittitle">


<!-- delimmitting the date with a "|"and changing color-->

<xsl:apply-templates select="text()|*[not(self::ns:unitdate)]"/>


<xsl:text>| </xsl:text>


<xsl:apply-templates select="./ns:unitdate"/>



</xsl:for-each>



</xsl:when>



<xsl:otherwise>



<xsl:apply-templates select="ns:unittitle"/>

<xsl:if test="ns:unitdate[string-length(text()|*)!=0]"> 

<xsl:text> </xsl:text>


| <font color="#993333">

<xsl:apply-templates select="ns:unitdate"/>

</font>
</xsl:if>
</xsl:otherwise>



</xsl:choose>







<xsl:for-each select="ns:physdesc">



<xsl:text> </xsl:text>



<xsl:apply-templates/>



<xsl:text> </xsl:text>



</xsl:for-each>


<xsl:call-template name="container-type-test"/>
<xsl:call-template name="dao"/>



</td></tr>







<xsl:if test="ns:abstract[string-length(text()|*)!=0]">



<xsl:for-each select="ns:abstract">



<tr>



<td></td><td></td><td></td><td></td><td></td><td colspan="12" valign="top">



<xsl:apply-templates select="."/>



</td></tr>



</xsl:for-each>



</xsl:if>



</xsl:template>



<!-- Shows the box and folder number for a c04.-->



<xsl:template name="showbox-c04-boxplusfolder">



<tr>



<td> 



</td>



<td> 



</td>



<td></td><td></td><td></td><td></td><td colspan="11" valign="top">







<xsl:if test="ns:unitid">



<xsl:for-each select="ns:unitid">



<xsl:apply-templates/>



<xsl:text> </xsl:text>



</xsl:for-each>



</xsl:if>







<xsl:choose>



<xsl:when test="ns:unittitle/ns:unitdate">



<xsl:for-each select="ns:unittitle">


<!-- delimmitting the date with a "|"and changing color-->

<xsl:apply-templates select="text()|*[not(self::ns:unitdate)]"/>


<xsl:text>| </xsl:text>


<xsl:apply-templates select="./ns:unitdate"/>



</xsl:for-each>


</xsl:when>


<xsl:otherwise>



<xsl:apply-templates select="ns:unittitle"/>

<xsl:if test="ns:unitdate[string-length(text()|*)!=0]"> 

<xsl:text> </xsl:text>


| <font color="#993333">

<xsl:apply-templates select="ns:unitdate"/>

</font>
</xsl:if>
</xsl:otherwise>



</xsl:choose>







<xsl:for-each select="ns:physdesc">



<xsl:text> </xsl:text>



<xsl:apply-templates/>



</xsl:for-each>



<xsl:call-template name="container-type-test"/>
<xsl:call-template name="dao"/>


</td>



</tr>







<xsl:if test="ns:abstract[string-length(text()|*)!=0]">



<xsl:for-each select="ns:abstract">



<tr>



<td></td><td></td><td></td><td></td><td></td><td></td><td></td>

<td colspan="10" valign="top">



<xsl:apply-templates select="."/>



</td></tr>



</xsl:for-each>



</xsl:if>



</xsl:template>




<!-- Shows the box and folder number for a c05.-->



<xsl:template name="showbox-c05-boxplusfolder">




<tr>



<td> 



</td>



<td> 



</td>



<td></td><td></td><td></td><td></td><td></td><td></td>

<td colspan="9" valign="top">







<xsl:if test="ns:unitid">



<xsl:for-each select="ns:unitid">



<xsl:apply-templates/>



<xsl:text> </xsl:text>



</xsl:for-each>



</xsl:if>







<xsl:choose>



<xsl:when test="ns:unittitle/ns:unitdate">



<xsl:for-each select="ns:unittitle">


<!-- delimmitting the date with a "|"and changing color-->

<xsl:apply-templates select="text()|*[not(self::ns:unitdate)]"/>


<xsl:text>| </xsl:text>


<xsl:apply-templates select="./ns:unitdate"/>



</xsl:for-each>


</xsl:when>



<xsl:otherwise>



<xsl:apply-templates select="ns:unittitle"/>

<xsl:if test="ns:unitdate[string-length(text()|*)!=0]"> 

<xsl:text> </xsl:text>


| <font color="#993333">

<xsl:apply-templates select="ns:unitdate"/>

</font>
</xsl:if>
</xsl:otherwise>

</xsl:choose>







<xsl:for-each select="ns:physdesc">



<xsl:text> </xsl:text>



<xsl:apply-templates/>



<xsl:text> </xsl:text>



</xsl:for-each>





<xsl:call-template name="container-type-test"/>
<xsl:call-template name="dao"/>



</td>



</tr>







<xsl:if test="ns:abstract[string-length(text()|*)!=0]">



<xsl:for-each select="ns:abstract">



<tr>



<td></td><td></td><td></td><td></td><td></td><td></td><td></td>

<td></td><td></td><td colspan="8" valign="top">



<xsl:apply-templates select="."/>



</td></tr>



</xsl:for-each>



</xsl:if>



</xsl:template>




<!-- Shows the box and folder number for a c06.-->



<xsl:template name="showbox-c06-boxplusfolder">


<tr>



<td> 



</td>



<td> 



</td>



<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>

<td colspan="7" valign="top">



<xsl:if test="ns:unitid">



<xsl:for-each select="ns:unitid">



<xsl:apply-templates/>



<xsl:text> </xsl:text>



</xsl:for-each>



</xsl:if>







<xsl:choose>



<xsl:when test="ns:unittitle/ns:unitdate">



<xsl:for-each select="ns:unittitle">


<!-- delimmitting the date with a "|"and changing color-->

<xsl:apply-templates select="text()|*[not(self::ns:unitdate)]"/>


<xsl:text>| </xsl:text>


<xsl:apply-templates select="./ns:unitdate"/>



</xsl:for-each>


</xsl:when>



<xsl:otherwise>



<xsl:apply-templates select="ns:unittitle"/>

<xsl:if test="ns:unitdate[string-length(text()|*)!=0]"> 

<xsl:text> </xsl:text>


| <font color="#993333">

<xsl:apply-templates select="ns:unitdate"/>

</font>
</xsl:if>
</xsl:otherwise>


</xsl:choose>







<xsl:for-each select="ns:physdesc">



<xsl:text> </xsl:text>



<xsl:apply-templates/>



<xsl:text> </xsl:text>



</xsl:for-each>



<xsl:call-template name="container-type-test"/>
<xsl:call-template name="dao"/>



</td>



</tr>







<xsl:if test="ns:abstract[string-length(text()|*)!=0]">



<xsl:for-each select="ns:abstract">



<tr>



<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>

<td></td><td></td><td></td><td colspan="6" valign="top">



<xsl:apply-templates select="."/>



</td></tr>



</xsl:for-each>



</xsl:if>



</xsl:template>




<!-- Shows the box and folder number for a c07.-->



<xsl:template name="showbox-c07-boxplusfolder">







<tr>



<td> 



</td>



<td> 



</td>



<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>



<td colspan="5" valign="top">



<xsl:if test="ns:unitid">



<xsl:for-each select="ns:unitid">



<xsl:apply-templates/>



<xsl:text> </xsl:text>



</xsl:for-each>



</xsl:if>







<xsl:choose>



<xsl:when test="ns:unittitle/ns:unitdate">



<xsl:for-each select="ns:unittitle">


<!-- delimmitting the date with a "|"and changing color-->

<xsl:apply-templates select="text()|*[not(self::ns:unitdate)]"/>


<xsl:text>| </xsl:text>


<xsl:apply-templates select="./ns:unitdate"/>



</xsl:for-each>


</xsl:when>


<xsl:otherwise>



<xsl:apply-templates select="ns:unittitle"/>

<xsl:if test="ns:unitdate[string-length(text()|*)!=0]"> 

<xsl:text> </xsl:text>


| <font color="#993333">

<xsl:apply-templates select="ns:unitdate"/>

</font>
</xsl:if>
</xsl:otherwise>

</xsl:choose>







<xsl:for-each select="ns:physdesc">



<xsl:text> </xsl:text>



<xsl:apply-templates/>



<xsl:text> </xsl:text>



</xsl:for-each>



<xsl:call-template name="container-type-test"/>
<xsl:call-template name="dao"/>





</td>



</tr>







<xsl:if test="ns:abstract[string-length(text()|*)!=0]">



<xsl:for-each select="ns:abstract">



<tr>



<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>

<td></td><td></td><td></td><td></td><td colspan="4" valign="top">



<xsl:apply-templates select="."/>



</td></tr>



</xsl:for-each>



</xsl:if>



</xsl:template>





<!-- Shows the box and folder number for a c08.-->



<xsl:template name="showbox-c08-boxplusfolder">







<tr>



<td> 



</td>



<td> 



</td>



<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>

<td></td><td></td><td></td><td></td>



<td colspan="3" valign="top">



<xsl:if test="ns:unitid">



<xsl:for-each select="ns:unitid">



<xsl:apply-templates/>



<xsl:text> </xsl:text>



</xsl:for-each>



</xsl:if>







<xsl:choose>



<xsl:when test="ns:unittitle/ns:unitdate">



<xsl:for-each select="ns:unittitle">


<!-- delimmitting the date with a "|"and changing color-->

<xsl:apply-templates select="text()|*[not(self::ns:unitdate)]"/>


<xsl:text>| </xsl:text>


<xsl:apply-templates select="./ns:unitdate"/>



</xsl:for-each>


</xsl:when>

<xsl:otherwise>



<xsl:apply-templates select="ns:unittitle"/>

<xsl:if test="ns:unitdate[string-length(text()|*)!=0]"> 

<xsl:text> </xsl:text>


| <font color="#993333">

<xsl:apply-templates select="ns:unitdate"/>

</font>
</xsl:if>
</xsl:otherwise>

</xsl:choose>







<xsl:for-each select="ns:physdesc">



<xsl:text> </xsl:text><xsl:apply-templates/>



<xsl:text> </xsl:text>



</xsl:for-each>



<xsl:call-template name="container-type-test"/>
<xsl:call-template name="dao"/>





</td>



</tr>







<xsl:if test="ns:abstract[string-length(text()|*)!=0]">



<xsl:for-each select="ns:abstract">



<tr>



<td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>

<td></td><td></td><td></td><td></td><td></td><td colspan="2" valign="top">



<xsl:apply-templates select="."/>



</td></tr>



</xsl:for-each>



</xsl:if>



</xsl:template>





<!--template for different types of container displays-->


<xsl:template name="container-type-test">

<br/>&#x00A0;&#x00A4;
<xsl:for-each select="ns:container">
<xsl:for-each select="@type">
<span style="font-size:smaller; font-weight:bolder; ">
<xsl:text>&#160;</xsl:text>
</span>
<span style="font-size:smaller; font-weight:bold; ">
<xsl:value-of select="string(.)"/>
</span>
<span style="font-size:smaller; font-weight:bolder; ">
<xsl:text>: </xsl:text>
</span>
</xsl:for-each>
<xsl:apply-templates/>
</xsl:for-each>
<div>&#x00A0;</div>

<!--test if there is more than 1 box and folder set

<xsl:if test="ns:container[@type='box'] and container[@type='box']">

number the box and folders, then set to print them based on numbers

Creates a variable called box-number whose value is equal to

 the value of the container element for the current component.

<xsl:variable name="Box" select="ns:container[@type='box']"/><xsl:number/>

</xsl:if>-->





</xsl:template>

<xsl:template name="end">

<p align="center">
<font size="-1"> 
Copyright 2008 by SCSU Special Collections, and the 
<a href="http://www.library.southernct.edu/">Buley Library</a> 
. 
<br/> 
Please credit the SCSU Archives and Special Collections if you copy or reproduce material from this page. 
</font> 
</p> 

</xsl:template>


</xsl:stylesheet>

