<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet 
   xmlns="http://www.w3.org/1999/xhtml"
   xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
   xmlns:xs="http://www.w3.org/2001/XMLSchema"
   exclude-result-prefixes="#all"
   version="2.0">
   <xsl:template match="/" name="html_footer">
      <footer class="footer mt-auto py-3">
         <div class="wrapper" id="wrapper-footer-full">
            <div class="container" id="footer-full-content" tabindex="-1">
               <div class="footer-separator">
                  <span class="texts">KONTAKT</span>
                  <hr/>
               </div>
               <div class="row">
                  <div class="col-lg-1 col-md-auto col-sm-2 col-xs-6 ml-auto text-center">
                     <div class="py-3">
                        <a href="https://www.oeaw.ac.at/acdh"><img src="images/logo_acdh.png" width="40" alt="Austrian Centre for Digital Humanities" title="Austrian Centre for Digital Humanities"/></a>
                     </div>
                     <div class="py-3">
                        <a href="http://www.oeaw.ac.at/oesterreichische-akademie-der-wissenschaften/"><img src="images/logo_oeaw.png" width="60" alt="Österreichische Akademie der Wissenschaften" title="Österreichische Akademie der Wissenschaften"/></a>
                     </div>
                  </div>
                  <div class="col-lg-4 col-md-3 col-sm-3 texts">
                        <p>
                           ACDH-CH OEAW<br/>
                           Austrian Centre for Digital Humanities and Cultural Heritage<br/>
                           Österreichische Akademie der Wissenschaften
                        </p>
                        <p>
                           Bäckerstraße 13, 1010 Wien
                        </p>
                        <p class="link-in-footer">
                           <i class="bi bi-telephone" aria-hidden="true"/><span class="visually-hidden">Telefon</span>&#160;<a href="tel:+431515812200">+43 1 51581-2200</a><br/>
                           <i class="bi bi-envelope-at" aria-hidden="true" /><span class="visually-hidden">E-Mail</span>&#160;<a href="mailto:acdh-ch-helpdesk@oeaw.ac.at">acdh-ch-helpdesk@oeaw.ac.at</a>
                        </p>
                  </div>
                  <div class="col-lg-2 col-md-3 col-sm-3 text-center">
                         <h5 class="font-weight-bold hide-mobile align-left">PARTNER::</h5>
			<figure>
                     <a href="https://www.wien.gv.at"><img src="images/logo_stadtwien.png" title="Stadt Wien – Wiener Stadt- und Landesarchiv" height="50" alt=""/></a>
    			</figure><br/>
                       <figure>
                         <a href="https://www.transkribus.org/"><img src="images/logo_transkribus.png" title="Transkribus" height="50" alt=""/></a>
                         </figure>
                  </div>
                  <div class="col-lg-3 col-md-4 col-sm-4 ml-auto">
                     <h5 class="font-weight-bold hide-mobile align-left">FÖRDERUNG:</h5>
                     <figure>
                        <a href="https://www.bmkoes.gv.at/"><img src="images/logo_bmkoes.svg" height="50" title="Finanziert vom Bundeministeirum für Kunst, Kultur, öffentlichen Dienst und Sport" alt="Finanziert vom Bundeministeirum für Kunst, Kultur, öffentlichen Dienst und Sport"/></a>
                    </figure><br/>
                     <figure>
                        <a href="https://next-generation-eu.europa.eu/index_de"><img src="images/logo_eu.png" height="50" title="Finanziert von der Europäischen Union – NextGenerationEU" alt="Finanziert von der Europäischen Union – NextGenerationEU"/></a>
                    </figure>
                  </div>
               </div>
            </div>
         </div>
         <div class="footer-imprint-bar hide-reading" id="wrapper-footer-secondary"
         style="text-align:center; padding:0.4rem 0; font-size: 0.9rem;"> © 2025 OEAW | <a href="imprint.html">Impressum</a> |  <a href="{$github_url}"><i class="bi bi-github" title="GitHub" alt="GitHub" aria-hidden="true"><span class="visually-hidden">GitHub</span></i></a>
         </div>
        </footer>
         
        <!-- <script src="https://code.jquery.com/jquery-3.6.3.min.js" integrity="sha256-pvPw+upLPUjgMXY0G+8O0xUf+/Im1MZjXxxgOcBQBXU=" crossorigin="anonymous"></script> -->
        <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.2/dist/js/bootstrap.bundle.min.js" integrity="sha384-C6RzsynM9kWDrMNeT87bh95OGNyZPhcTNXj1NW7RuBCsyN/o0jlpcV8Qyq46cDfL" crossorigin="anonymous"></script>
    </xsl:template>
</xsl:stylesheet>
