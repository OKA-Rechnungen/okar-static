<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns="http://www.w3.org/1999/xhtml"
   xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
   xmlns:xs="http://www.w3.org/2001/XMLSchema" exclude-result-prefixes="#all" version="2.0">
   <xsl:template match="/" name="html_footer">
      <xsl:param name="show_full_footer" as="xs:boolean" select="false()"/>
      <footer class="footer mt-auto py-3">
         <xsl:if test="$show_full_footer">
            <div class="container" id="footer-full-content" tabindex="-1">
               <div class="row">
                  <div class="col-md-7 col-12 footer-row row">
                     <div class="footer-row">
                        <span class="texts mobile-0">Kontakt</span>
                     </div>
                     <div class="col-5 row">
                        <div class="col-md-4 col-12 text-center">
                           <a href="https://www.oeaw.ac.at/acdh">
                              <img src="images/logo_acdh.svg" class="mobile-50w" alt="Austrian Centre for Digital Humanities" title="Austrian Centre for Digital Humanities"/>
                           </a>
                        </div>
                        <div class="col-md-8 col-0 text text-left mobile-0">
                           <p>
                              <b>Austrian Centre<br/>for Digital Humanities</b>
                              <br/>
                                 Bäckerstraße 13, 1010 Wien<br/>
                              <i class="bi bi-telephone" aria-hidden="true"/>
                              <span class="visually-hidden">Telefon</span>&#160;<a href="tel:+431515812200">+43 1 51581-2200</a>
                              <br/>
                              <i class="bi bi-envelope-at" aria-hidden="true" />
                              <span class="visually-hidden">E-Mail</span>&#160;<a href="mailto:acdh-office@oeaw.ac.at">acdh-office@oeaw.ac.at</a>
                           </p>
                        </div>
                     </div>
                     <div class="col-4">
                        <a href="http://www.oeaw.ac.at/oesterreichische-akademie-der-wissenschaften/">
                           <img src="images/logo_oeaw.svg" class="mobile-50w" alt="Österreichische Akademie der Wissenschaften" title="Österreichische Akademie der Wissenschaften"/>
                        </a>
                     </div>
                     <div class="col-3">
                        <a href="https://www.wien.gv.at">
                           <img src="images/logo_stadtwien.png" class="mobile-50w" max-height="100%" title="Stadt Wien – Wiener Stadt- und Landesarchiv" alt="WStLA"/>
                        </a>
                     </div>
                  </div>
                  <div class="col-md-5 col-12 footer-row row">
                     <div class="footer-row">
                        <span class="texts mobile-0">Förderung</span>
                     </div>
                     <div class="col-6 vfill">
                        <a href="https://www.bmkoes.gv.at/">
                           <img src="images/logo_bmkoes.svg" max-height="100%" class="mobile-50w" title="Finanziert vom Bundeministeirum für Kunst, Kultur, öffentlichen Dienst und Sport" alt="Finanziert vom Bundeministeirum für Kunst, Kultur, öffentlichen Dienst und Sport"/>
                        </a>
                     </div>
                     <div class="col-6 vfill">
                        <a href="https://next-generation-eu.europa.eu/index_de">
                           <img src="images/logo_eu.png" max-height="100%" class="mobile-50w" title="Finanziert von der Europäischen Union – NextGenerationEU" alt="Finanziert von der Europäischen Union – NextGenerationEU"/>
                        </a>
                     </div>
                  </div>
               </div>
            </div>
         </xsl:if>
         <div class="footer-imprint-bar hide-reading" id="wrapper-footer-secondary" style="text-align:center; padding:0.4rem 0; font-size: 0.9rem;"> © 2026 ÖAW | <a href="imprint.html">Impressum</a> |         <a href="{$github_url}">
            <i class="bi bi-github" title="GitHub" alt="GitHub" aria-hidden="true">
               <span class="visually-hidden">GitHub</span>
            </i></a>
         </div>
      </footer>
      <!-- <script src="https://code.jquery.com/jquery-3.6.3.min.js" integrity="sha256-pvPw+upLPUjgMXY0G+8O0xUf+/Im1MZjXxxgOcBQBXU=" crossorigin="anonymous"></script> -->
      <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
   </xsl:template>
</xsl:stylesheet>