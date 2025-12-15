/*
##################################################################
Single page transcript navigation with OpenSeadragon image sync.
##################################################################
*/
(function() {
    var screenHeight = window.innerHeight || screen.height || 800;
    var osdContainer = document.getElementById('container_facs_1');
    var facsimileWrapper = document.getElementsByClassName('facsimiles')[0];
    var sectionContainer = document.getElementById('section');
    var viewerWrapper = document.getElementById('viewer');

    if (osdContainer) {
        osdContainer.style.height = `${String(screenHeight / 2)}px`;
    }

    if (facsimileWrapper && sectionContainer && viewerWrapper) {
        var sectionWidth = sectionContainer.clientWidth;
        var viewerWidth = facsimileWrapper.classList.contains('fade') ? sectionWidth / 2 : sectionWidth - 25;
        viewerWrapper.style.width = `${String(Math.max(viewerWidth, 0))}px`;
    }

    var transcript = document.getElementById('transcript');
    if (!transcript) {
        return;
    }

    var pbElements = Array.from(transcript.querySelectorAll('span.pb'));
    if (!pbElements.length) {
        return;
    }

    var textContainer = document.getElementById('text-resize');
    var pageTitle = document.title || '';
    var recordIdPart = '';

    if (pageTitle.indexOf('_') !== -1) {
        recordIdPart = pageTitle.split('_').slice(1).join('_').trim();
    }

    if (!recordIdPart) {
        var pathSegment = (window.location.pathname || '').split('/').pop() || '';
        recordIdPart = pathSegment.replace(/\.html?$/i, '').trim();
    }

    recordIdPart = recordIdPart.trim();

    var safeRecordId = encodeURIComponent(recordIdPart);
    var recordIdBase = recordIdPart ? recordIdPart.trim() : '';
    var contentRoot = pbElements[0].parentNode;

    if (!contentRoot) {
        return;
    }

    var introFragment = document.createDocumentFragment();
    var walker = contentRoot.firstChild;
    var firstPb = pbElements[0];

    while (walker && walker !== firstPb) {
        var introNext = walker.nextSibling;
        introFragment.appendChild(walker);
        walker = introNext;
    }

    var DEBUG_LAG_LOG = false;

    function logDebug(message, meta) {
        if (!DEBUG_LAG_LOG || typeof console === 'undefined') {
            return;
        }
        var payload = meta ? Object.assign({ t: Date.now() }, meta) : { t: Date.now() };
        console.debug('[osd_scroll]', message, payload);
    }

    var pages = [];
    var facsimileDataPromise = null;
    var facsimileData = null;
    var highlightOverlayElement = null;
    var regionOverlayElements = [];
    var activeHighlight = { regionId: null, region: null, target: null };
    var lastTranscriptRegionHighlightId = null;
    var highlightNeedsUpdate = false;
    var currentSurfaceId = null;
    var regionLagMarks = Object.create(null);
    var lastOverlayHoverRegionId = null;
    var lastOverlayHoverTs = 0;
    var clearHighlightTimer = null;

    function isLineRegion(regionId) {
        if (typeof regionId !== 'string') {
            return false;
        }
        if (regionId.indexOf('_tl_') !== -1) {
            return true;
        }
        return regionId.toLowerCase().indexOf('line') !== -1;
    }

    function isLineTarget(element) {
        return !!(element && element.classList && element.classList.contains('facsimile-line'));
    }

    function markLag(regionId, key) {
        if (!regionId) {
            return;
        }
        if (!regionLagMarks[regionId]) {
            regionLagMarks[regionId] = {};
        }
        regionLagMarks[regionId][key] = Date.now();
    }

    function extractRegionIdFromElement(element) {
        if (!element) {
            return null;
        }
        var rawValue = element.getAttribute('data-facs') || '';
        if (!rawValue) {
            return null;
        }
        var tokens = rawValue.split(/\s+/).filter(function(token) {
            return token.length > 0;
        });
        if (!tokens.length) {
            return null;
        }
        var cleaned = tokens[0].replace(/^#/, '');
        return cleaned || null;
    }

    function extractSurfaceIdFromWrapper(wrapper) {
        if (!wrapper) {
            return null;
        }

        var facsElement = wrapper.querySelector('[data-facs]');
        if (facsElement) {
            var regionId = extractRegionIdFromElement(facsElement);
            if (regionId) {
                var parts = regionId.split('_');
                if (parts.length >= 2) {
                    return parts[0] + '_' + parts[1];
                }
                var match = regionId.match(/^(facs_\d+)/);
                if (match) {
                    return match[1];
                }
            }
        }

        var pbAnchor = wrapper.querySelector('span.pb');
        if (pbAnchor) {
            var pageLabel = pbAnchor.getAttribute('data-page-number');
            if (pageLabel && /^\d+$/.test(pageLabel)) {
                return 'facs_' + pageLabel;
            }
        }

        return null;
    }

    function setActiveHighlightTarget(element) {
        if (activeHighlight.target === element) {
            return;
        }
        if (activeHighlight.target) {
            activeHighlight.target.classList.remove('facs-highlight-target');
        }
        activeHighlight.target = element || null;
        if (element) {
            element.classList.add('facs-highlight-target');
        }
    }

    function removeOverlayElement() {
        if (osdViewer && highlightOverlayElement) {
            try {
                osdViewer.removeOverlay(highlightOverlayElement);
            } catch (error) {
                // intended no-op
            }
        }
    }

    function toArray(nodeList) {
        return Array.prototype.slice.call(nodeList || []);
    }

    function getXmlId(node) {
        if (!node) {
            return null;
        }
        return node.getAttribute('xml:id')
            || node.getAttributeNS('http://www.w3.org/XML/1998/namespace', 'id')
            || node.getAttribute('id')
            || null;
    }

    function parseFacsimileDocument(xmlDoc) {
        var surfaces = new Map();
        var regions = new Map();
        if (!xmlDoc) {
            return { surfaces: surfaces, regions: regions };
        }

        var surfaceNodes = xmlDoc.querySelectorAll('surface');
        if (!surfaceNodes || !surfaceNodes.length) {
            surfaceNodes = xmlDoc.getElementsByTagNameNS('*', 'surface');
        }

        toArray(surfaceNodes).forEach(function(surfaceNode) {
            var surfaceId = getXmlId(surfaceNode);
            if (!surfaceId) {
                return;
            }

            var ulx = parseFloat(surfaceNode.getAttribute('ulx')) || 0;
            var uly = parseFloat(surfaceNode.getAttribute('uly')) || 0;
            var lrx = parseFloat(surfaceNode.getAttribute('lrx'));
            var lry = parseFloat(surfaceNode.getAttribute('lry'));

            if (!isFinite(lrx) || !isFinite(lry)) {
                return;
            }

            var width = lrx - ulx;
            var height = lry - uly;
            if (!(width > 0) || !(height > 0)) {
                return;
            }

            surfaces.set(surfaceId, {
                id: surfaceId,
                width: width,
                height: height,
                originX: ulx,
                originY: uly
            });

            var zoneNodes = surfaceNode.querySelectorAll('zone');
            if (!zoneNodes || !zoneNodes.length) {
                zoneNodes = surfaceNode.getElementsByTagNameNS('*', 'zone');
            }

            toArray(zoneNodes).forEach(function(zoneNode) {
                var zoneId = getXmlId(zoneNode);
                if (!zoneId) {
                    return;
                }

                var points = [];
                var pointsAttr = zoneNode.getAttribute('points');
                if (pointsAttr) {
                    pointsAttr.trim().split(/\s+/).forEach(function(pair) {
                        var parts = pair.split(',');
                        if (parts.length === 2) {
                            var px = parseFloat(parts[0]);
                            var py = parseFloat(parts[1]);
                            if (isFinite(px) && isFinite(py)) {
                                points.push({
                                    x: px - ulx,
                                    y: py - uly
                                });
                            }
                        }
                    });
                }

                if (!points.length) {
                    var zoneUlx = parseFloat(zoneNode.getAttribute('ulx'));
                    var zoneUly = parseFloat(zoneNode.getAttribute('uly'));
                    var zoneLrx = parseFloat(zoneNode.getAttribute('lrx'));
                    var zoneLry = parseFloat(zoneNode.getAttribute('lry'));

                    if (isFinite(zoneUlx) && isFinite(zoneUly) && isFinite(zoneLrx) && isFinite(zoneLry)) {
                        points.push({ x: zoneUlx - ulx, y: zoneUly - uly });
                        points.push({ x: zoneLrx - ulx, y: zoneUly - uly });
                        points.push({ x: zoneLrx - ulx, y: zoneLry - uly });
                        points.push({ x: zoneUlx - ulx, y: zoneLry - uly });
                    }
                }

                if (!points.length) {
                    return;
                }

                var bounds = {
                    minX: Infinity,
                    minY: Infinity,
                    maxX: -Infinity,
                    maxY: -Infinity
                };

                points.forEach(function(point) {
                    bounds.minX = Math.min(bounds.minX, point.x);
                    bounds.minY = Math.min(bounds.minY, point.y);
                    bounds.maxX = Math.max(bounds.maxX, point.x);
                    bounds.maxY = Math.max(bounds.maxY, point.y);
                });

                bounds.width = bounds.maxX - bounds.minX;
                bounds.height = bounds.maxY - bounds.minY;

                if (!(bounds.width > 0) || !(bounds.height > 0)) {
                    return;
                }

                regions.set(zoneId, {
                    id: zoneId,
                    surfaceId: surfaceId,
                    bounds: bounds,
                    points: points
                });
            });
        });

        return {
            surfaces: surfaces,
            regions: regions
        };
    }

    function ensureFacsimileData() {
        if (facsimileData) {
            return Promise.resolve(facsimileData);
        }
        if (facsimileDataPromise) {
            return facsimileDataPromise;
        }
        if (!recordIdBase) {
            facsimileDataPromise = Promise.resolve(null);
            return facsimileDataPromise;
        }

        var xmlPath = recordIdBase + '.xml';
        logDebug('ensureFacsimileData: fetch start', { xmlPath: xmlPath });
        facsimileDataPromise = fetch(xmlPath).then(function(response) {
            if (!response.ok) {
                throw new Error('HTTP ' + response.status);
            }
            return response.text();
        }).then(function(xmlText) {
            var parser = new DOMParser();
            var xmlDoc = parser.parseFromString(xmlText, 'application/xml');
            if (!xmlDoc || xmlDoc.getElementsByTagName('parsererror').length) {
                throw new Error('Invalid facsimile XML');
            }
            facsimileData = parseFacsimileDocument(xmlDoc);
            logDebug('ensureFacsimileData: parsed', {
                surfaces: facsimileData.surfaces.size,
                regions: facsimileData.regions.size
            });
            return facsimileData;
        }).catch(function(error) {
            console.warn('Unable to load facsimile regions', error);
            facsimileData = null;
            logDebug('ensureFacsimileData: error', { error: String(error) });
            return null;
        });

        return facsimileDataPromise;
    }

    function applyHighlightOverlay() {
        if (!osdViewer || !activeHighlight.region) {
            return;
        }

        if (currentSurfaceId && activeHighlight.region.surfaceId && currentSurfaceId !== activeHighlight.region.surfaceId) {
            logDebug('applyHighlightOverlay: skip surface mismatch', {
                regionId: activeHighlight.region.id,
                currentSurfaceId: currentSurfaceId,
                regionSurfaceId: activeHighlight.region.surfaceId
            });
            removeOverlayElement();
            highlightNeedsUpdate = false;
            return;
        }

        var tiledImage = osdViewer.world.getItemAt(0);
        if (!tiledImage) {
            logDebug('applyHighlightOverlay: no tiled image', { regionId: activeHighlight.region.id });
            highlightNeedsUpdate = true;
            return;
        }

        if (!facsimileData || !facsimileData.surfaces) {
            logDebug('applyHighlightOverlay: missing facsimile data', { regionId: activeHighlight.region.id });
            highlightNeedsUpdate = true;
            return;
        }

        var surfaceInfo = facsimileData.surfaces.get(activeHighlight.region.surfaceId);
        if (!surfaceInfo) {
            logDebug('applyHighlightOverlay: missing surface info', { regionId: activeHighlight.region.id, surfaceId: activeHighlight.region.surfaceId });
            highlightNeedsUpdate = false;
            return;
        }

        var contentSize = tiledImage.getContentSize();
        if (!contentSize || !contentSize.x || !contentSize.y) {
            logDebug('applyHighlightOverlay: missing content size', { regionId: activeHighlight.region.id });
            highlightNeedsUpdate = true;
            return;
        }

        var scaleX = contentSize.x / surfaceInfo.width;
        var scaleY = contentSize.y / surfaceInfo.height;

        var viewportRect = osdViewer.viewport.imageToViewportRectangle(
            activeHighlight.region.bounds.minX * scaleX,
            activeHighlight.region.bounds.minY * scaleY,
            activeHighlight.region.bounds.width * scaleX,
            activeHighlight.region.bounds.height * scaleY
        );

        if (!highlightOverlayElement) {
            highlightOverlayElement = document.createElement('div');
            highlightOverlayElement.className = 'facsimile-highlight-overlay';
            highlightOverlayElement.style.pointerEvents = 'none';
        }

        var perfStart = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();

        osdViewer.addOverlay({
            element: highlightOverlayElement,
            location: viewportRect,
            placement: OpenSeadragon.Placement.TOP_LEFT
        });

        var perfEnd = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        var addOverlayMs = perfEnd - perfStart;

        var overlaysTotal = regionOverlayElements ? regionOverlayElements.length : 0;

        var lagMarks = regionLagMarks[activeHighlight.region.id] || {};
        var sinceRequest = lagMarks.requestStart ? Date.now() - lagMarks.requestStart : null;
        var sinceHover = lagMarks.hover ? Date.now() - lagMarks.hover : null;

        logDebug('applyHighlightOverlay', {
            regionId: activeHighlight.region.id,
            surfaceId: activeHighlight.region.surfaceId,
            rect: {
                x: activeHighlight.region.bounds.minX,
                y: activeHighlight.region.bounds.minY,
                w: activeHighlight.region.bounds.width,
                h: activeHighlight.region.bounds.height
            }
        });
        highlightNeedsUpdate = false;
    }

    function clearHighlight() {
        activeHighlight.regionId = null;
        activeHighlight.region = null;
        highlightNeedsUpdate = false;
        removeOverlayElement();
        setActiveHighlightTarget(null);
        clearTranscriptRegionHighlight();
    }

    function scheduleClearHighlight(delayMs) {
        if (clearHighlightTimer) {
            window.clearTimeout(clearHighlightTimer);
            clearHighlightTimer = null;
        }
        clearHighlightTimer = window.setTimeout(function() {
            clearHighlight();
            clearHighlightTimer = null;
        }, delayMs);
    }

    function requestHighlight(regionId, targetElement) {
        if (!regionId) {
            return;
        }
        if (!isLineRegion(regionId) && !(targetElement && isLineTarget(targetElement))) {
            logDebug('requestHighlight: skip non-line region', { regionId: regionId });
            return;
        }

        var sameTarget = targetElement && activeHighlight.target === targetElement;
        var sameRegionReady = activeHighlight.regionId === regionId && activeHighlight.region;

        if (sameRegionReady && (sameTarget || !targetElement) && !highlightNeedsUpdate) {
            logDebug('requestHighlight: skip (same region/target)', { regionId: regionId });
            return;
        }

        if (targetElement) {
            setActiveHighlightTarget(targetElement);
        }

        if (!sameRegionReady) {
            removeOverlayElement();
            activeHighlight.regionId = regionId;
            activeHighlight.region = null;
            highlightNeedsUpdate = true;
            markLag(regionId, 'requestStart');
            var hoverLag = regionLagMarks[regionId] && regionLagMarks[regionId].hover ? Date.now() - regionLagMarks[regionId].hover : null;
            logDebug('requestHighlight: start', { regionId: regionId, surfaceId: currentSurfaceId });
        }

        ensureFacsimileData().then(function(store) {
            if (activeHighlight.regionId !== regionId) {
                logDebug('requestHighlight: abandon (active changed)', { regionId: regionId });
                return;
            }
            if (!store || !store.regions) {
                logDebug('requestHighlight: missing store/regions', { regionId: regionId });
                return;
            }
            var region = store.regions.get(regionId);
            if (!region) {
                logDebug('requestHighlight: region not found', { regionId: regionId });
                return;
            }
            if (currentSurfaceId && region.surfaceId && currentSurfaceId !== region.surfaceId) {
                logDebug('requestHighlight: surface mismatch', { regionId: regionId, currentSurfaceId: currentSurfaceId, regionSurfaceId: region.surfaceId });
                return;
            }
            facsimileData = store;
            activeHighlight.region = region;
            var requestLag = regionLagMarks[regionId] && regionLagMarks[regionId].requestStart ? Date.now() - regionLagMarks[regionId].requestStart : null;
            logDebug('requestHighlight: region ready', { regionId: regionId, surfaceId: region.surfaceId });
            applyHighlightOverlay();
            if (highlightNeedsUpdate) {
                if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
                    window.requestAnimationFrame(applyHighlightOverlay);
                } else if (typeof window !== 'undefined' && typeof window.setTimeout === 'function') {
                    window.setTimeout(applyHighlightOverlay, 16);
                }
            }
        });
    }

    function handleFacsimilePointerEnter(event) {
        var target = event.currentTarget;
        if (!target) {
            return;
        }

        var regionId = target.dataset.facsRegionId || extractRegionIdFromElement(target);
        if (!regionId) {
            return;
        }
        if (!isLineRegion(regionId) && !isLineTarget(target)) {
            logDebug('hover transcript target: skip non-line region', { regionId: regionId });
            return;
        }
        markLag(regionId, 'hover');
        logDebug('hover transcript target', { regionId: regionId });
        target.dataset.facsRegionId = regionId;

        if (clearHighlightTimer) {
            window.clearTimeout(clearHighlightTimer);
            clearHighlightTimer = null;
        }

        if (activeHighlight.regionId === regionId && activeHighlight.target === target && activeHighlight.region) {
            logDebug('hover transcript target: already active', { regionId: regionId });
            if (highlightNeedsUpdate) {
                applyHighlightOverlay();
            }
            return;
        }

        if (activeHighlight.regionId === regionId && activeHighlight.region && !highlightNeedsUpdate) {
            logDebug('hover transcript target: already active (other target)', { regionId: regionId });
            return;
        }

        requestHighlight(regionId, target);
    }

    function handleFacsimilePointerLeave(event) {
        var target = event.currentTarget;
        if (target && activeHighlight.target === target) {
            scheduleClearHighlight(3000);
        }
    }

    function setupFacsimileTargets() {
        if (!transcript) {
            return;
        }

        var targets = transcript.querySelectorAll('[data-facs]');
        if (!targets || !targets.length) {
            return;
        }

        var facsTargetsByRegion = new Map();

        targets.forEach(function(target) {
            if (target.dataset.facsHighlightBound === 'true') {
                return;
            }
            var regionId = extractRegionIdFromElement(target);
            if (!regionId) {
                return;
            }
            target.dataset.facsRegionId = regionId;
            target.dataset.facsHighlightBound = 'true';
            if (!facsTargetsByRegion.has(regionId)) {
                facsTargetsByRegion.set(regionId, []);
            }
            facsTargetsByRegion.get(regionId).push(target);
            target.addEventListener('pointerenter', handleFacsimilePointerEnter);
            target.addEventListener('pointerleave', handleFacsimilePointerLeave);
            target.addEventListener('pointercancel', handleFacsimilePointerLeave);
            target.addEventListener('pointerdown', handleFacsimilePointerEnter);
            target.addEventListener('focus', handleFacsimilePointerEnter, true);
            target.addEventListener('blur', handleFacsimilePointerLeave, true);
        });

        window.okarTranscript = window.okarTranscript || {};
        window.okarTranscript.facsTargetsByRegion = facsTargetsByRegion;
    }

    function clearTranscriptRegionHighlight() {
        if (!lastTranscriptRegionHighlightId || !window.okarTranscript || !window.okarTranscript.facsTargetsByRegion) {
            return;
        }
        var prevTargets = window.okarTranscript.facsTargetsByRegion.get(lastTranscriptRegionHighlightId);
        if (prevTargets && prevTargets.length) {
            prevTargets.forEach(function(target) {
                target.classList.remove('facs-highlight-target');
            });
        }
        lastTranscriptRegionHighlightId = null;
    }

    function highlightTranscriptForRegion(regionId) {
        if (!regionId || !window.okarTranscript || !window.okarTranscript.facsTargetsByRegion) {
            return;
        }
        if (regionId === lastTranscriptRegionHighlightId) {
            return;
        }
        clearTranscriptRegionHighlight();
        var targets = window.okarTranscript.facsTargetsByRegion.get(regionId);
        if (!targets || !targets.length) {
            return;
        }
        if (!isLineRegion(regionId)) {
            logDebug('highlightTranscriptForRegion: skip non-line region', { regionId: regionId });
            return;
        }
        var spanTargets = targets.filter(function(target) {
            var tag = (target.tagName || '').toLowerCase();
            return tag === 'span';
        });
        if (!spanTargets.length) {
            logDebug('highlightTranscriptForRegion: no spans, skip highlight', { regionId: regionId, totalTargets: targets.length });
            return;
        }
        logDebug('highlightTranscriptForRegion: apply spans only', { regionId: regionId, spans: spanTargets.length, totalTargets: targets.length });
        spanTargets.forEach(function(target) {
            target.classList.add('facs-highlight-target');
        });
        lastTranscriptRegionHighlightId = regionId;
    }

    function buildTranscriptRow(wrapper, abBlocks) {
        if (!wrapper) {
            return null;
        }

        if (!abBlocks || !abBlocks.length) {
            var children = Array.prototype.slice.call(wrapper.children || []);
            abBlocks = children.filter(function(node) {
                return node.nodeType === 1 && node.classList.contains('ab');
            });
        }

        if (!abBlocks.length) {
            return null;
        }

        var row = document.createElement('div');
        row.className = 'row transcript-row g-4';
        row.style.display = 'none';

        var visibleCount = abBlocks.length;

        if (visibleCount === 1) {
            var singleAb = abBlocks[0];

            var leftColumn = document.createElement('div');
            leftColumn.className = 'col-12 col-lg-6 transcript-column transcript-column-left';

            var rightColumn = document.createElement('div');
            rightColumn.className = 'col-12 col-lg-6 transcript-column transcript-column-right';

            // Default: place single-ab pages in the second (right) column.
            rightColumn.appendChild(singleAb);

            row.appendChild(leftColumn);
            row.appendChild(rightColumn);

            row.dataset.singleAbColumns = 'true';
        } else {
            var multiColumn = visibleCount === 2;
            var columnClass = multiColumn ? 'col-12 col-lg-6 transcript-column' : 'col-12 transcript-column';

            abBlocks.forEach(function(abBlock) {
                var column = document.createElement('div');
                column.className = columnClass;
                column.appendChild(abBlock);
                row.appendChild(column);
            });
        }

        var anchor = wrapper.querySelector('span.pb');
        if (anchor && anchor.nextSibling) {
            wrapper.insertBefore(row, anchor.nextSibling);
        } else {
            wrapper.appendChild(row);
        }

        return row;
    }

    function computeAbLayoutInfoForPage(page) {
        if (!page || !page.wrapper || !facsimileData || !facsimileData.regions || !facsimileData.surfaces) {
            return null;
        }

        var facsElements = page.wrapper.querySelectorAll('[data-facs]');
        if (!facsElements || !facsElements.length) {
            return null;
        }

        var seen = Object.create(null);
        var regionsForPage = [];
        var pageSurfaceId = page.surfaceId || null;

        facsElements.forEach(function(element) {
            var regionId = element.dataset.facsRegionId || extractRegionIdFromElement(element);
            if (!regionId || seen[regionId]) {
                return;
            }
            seen[regionId] = true;

            if (!facsimileData.regions) {
                return;
            }

            var region = facsimileData.regions.get(regionId);
            if (!region) {
                return;
            }

            if (pageSurfaceId && region.surfaceId && region.surfaceId !== pageSurfaceId) {
                return;
            }

            regionsForPage.push(region);
        });

        if (!regionsForPage.length) {
            return null;
        }

        var totalWeightedCenter = 0;
        var totalWeight = 0;
        var referenceSurfaceWidth = null;

        regionsForPage.forEach(function(region) {
            var bounds = region.bounds;
            if (!bounds || !(bounds.width > 0) || !(bounds.height > 0)) {
                return;
            }

            var surface = facsimileData.surfaces.get(region.surfaceId);
            if (!surface) {
                return;
            }

            if (referenceSurfaceWidth === null) {
                referenceSurfaceWidth = surface.width;
            }

            var centerX = (bounds.minX + bounds.maxX) / 2;
            var area = bounds.width * bounds.height;
            totalWeightedCenter += centerX * area;
            totalWeight += area;
        });

        if (!totalWeight || !referenceSurfaceWidth) {
            return null;
        }

        var meanCenterX = totalWeightedCenter / totalWeight;
        var preferredColumn = meanCenterX < referenceSurfaceWidth / 2 ? 'left' : 'right';

        return {
            meanCenterX: meanCenterX,
            surfaceWidth: referenceSurfaceWidth,
            preferredColumn: preferredColumn
        };
    }

    function setSingleAbColumnPosition(page, position) {
        if (!page || !page.row) {
            return;
        }

        var row = page.row;
        if (row.dataset.singleAbColumns !== 'true') {
            return;
        }

        var leftColumn = row.querySelector('.transcript-column-left');
        var rightColumn = row.querySelector('.transcript-column-right');
        if (!leftColumn || !rightColumn) {
            return;
        }

        var abBlock = row.querySelector('.ab');
        if (!abBlock) {
            return;
        }

        var targetColumn = position === 'left' ? leftColumn : rightColumn;
        if (targetColumn.contains(abBlock)) {
            return;
        }

        if (abBlock.parentNode && abBlock.parentNode !== targetColumn) {
            abBlock.parentNode.removeChild(abBlock);
        }
        targetColumn.appendChild(abBlock);
    }

    function adjustSingleAbColumnPlacement() {
        if (!facsimileData || !facsimileData.surfaces || !facsimileData.regions) {
            return;
        }

        pages.forEach(function(page) {
            if (!page || !page.isSingleAb || !page.row) {
                return;
            }

            var layoutInfo = computeAbLayoutInfoForPage(page);
            var preferred = (layoutInfo && layoutInfo.preferredColumn) ? layoutInfo.preferredColumn : 'right';
            setSingleAbColumnPosition(page, preferred);
        });
    }

    function resolvePageIndexFromElement(element) {
        if (!element) {
            return -1;
        }

        var current = element;
        while (current && current !== transcript) {
            if (current.classList && current.classList.contains('transcript-page')) {
                var indexValue = current.dataset.pageIndex;
                if (indexValue) {
                    var parsed = parseInt(indexValue, 10);
                    if (!Number.isNaN(parsed)) {
                        return parsed - 1;
                    }
                }
                break;
            }
            current = current.parentNode;
        }

        return -1;
    }

    function normalizeImageSource(source, context) {
        var recordId = context && context.recordId ? String(context.recordId).trim() : '';
        var pageIndex = context && typeof context.pageIndex === 'number' ? context.pageIndex : null;

        if (!recordId || pageIndex === null) {
            return source;
        }

        var extension = '';
        if (typeof source === 'string' && source) {
            var parts = source.split('/');
            var filename = parts.pop() || '';
            var dotIndex = filename.lastIndexOf('.');
            if (dotIndex !== -1) {
                extension = filename.slice(dotIndex).toLowerCase();
            }
        }

        if (!extension) {
            extension = '.tif';
        }

        var padded = String(pageIndex).padStart(5, '0');
        return recordId + '_' + padded + extension;
    }

    pbElements.forEach(function(pb, index) {
        var pageWrapper = document.createElement('div');
        pageWrapper.className = 'transcript-page';
        pageWrapper.dataset.pageIndex = String(index + 1);

        if (index === 0 && introFragment.childNodes.length) {
            pageWrapper.appendChild(introFragment);
        }

        var nextPb = pbElements[index + 1] || null;
        var node = pb.nextSibling;

        pageWrapper.appendChild(pb);
        pb.hidden = true;

        while (node && node !== nextPb) {
            var nextNode = node.nextSibling;
            pageWrapper.appendChild(node);
            node = nextNode;
        }

        var abBlocks = Array.prototype.slice.call(pageWrapper.querySelectorAll('.ab'));

        var source = pb.getAttribute('source') || '';
        var normalizedSource = normalizeImageSource(source, { recordId: recordIdBase, pageIndex: index + 1 });
        if (normalizedSource !== source) {
            pb.dataset.originalSource = source;
            pb.setAttribute('source', normalizedSource);
        }
        var label = pb.dataset.pageNumber || String(index + 1);

        pageWrapper.dataset.pageLabel = label;

        var transcriptRow = buildTranscriptRow(pageWrapper, abBlocks);
        var surfaceId = extractSurfaceIdFromWrapper(pageWrapper);

        pages.push({
            wrapper: pageWrapper,
            imageSource: normalizedSource,
            label: label,
            row: transcriptRow,
            surfaceId: surfaceId,
            isSingleAb: abBlocks.length === 1
        });
    });

    contentRoot.innerHTML = '';

    pages.forEach(function(page) {
        page.wrapper.style.display = 'none';
        page.wrapper.setAttribute('aria-hidden', 'true');
        contentRoot.appendChild(page.wrapper);
    });

    setupFacsimileTargets();

    ensureFacsimileData().then(function(store) {
        if (!store) {
            return;
        }
        facsimileData = store;
        adjustSingleAbColumnPlacement();
        rebuildRegionOverlays();
    });

    var navControls = {
        start: null,
        first: null,
        prev: null,
        next: null,
        last: null,
        end: null,
        pageInput: null,
        pageInputWrapper: null,
        pageTotalLabel: null,
        numberButtons: [],
        numberContainer: null
    };

    var navContainer = null;
    var navWrapper = null;
    var pageInputStyleInjected = false;

    function createNavButton(label, onClick) {
        var button = document.createElement('button');
        button.type = 'button';
        button.className = 'btn btn-sm btn-outline-secondary';
        button.textContent = label;
        button.addEventListener('click', onClick);
        return button;
    }

    var navInsertTarget = null;

    if (textContainer && textContainer.contains(transcript)) {
        navInsertTarget = textContainer;
    } else if (transcript.parentNode) {
        navInsertTarget = transcript.parentNode;
    }

    if (navInsertTarget) {
        navContainer = document.createElement('nav');
        navContainer.className = 'page-navigation d-flex flex-wrap align-items-center gap-2 mb-3';
        navContainer.setAttribute('aria-label', 'Seiten-Navigation');

        navWrapper = document.createElement('div');
        navWrapper.className = 'd-flex flex-wrap align-items-center gap-2';
        navContainer.appendChild(navWrapper);

        navInsertTarget.insertBefore(navContainer, transcript);

        navControls.start = createNavButton('⏮︎', function() {
            showPageByIndex(0);
        });
        navWrapper.appendChild(navControls.start);

        navControls.first = createNavButton('⏪︎', function() {
            showPageByIndex(currentPageIndex - 10);
        });
        navWrapper.appendChild(navControls.first);

        navControls.prev = createNavButton('◀︎', function() {
            showPageByIndex(currentPageIndex - 1);
        });
        navWrapper.appendChild(navControls.prev);

        navControls.numberContainer = document.createElement('div');
        navControls.numberContainer.className = 'page-number-container d-flex flex-wrap align-items-center gap-2';
        navWrapper.appendChild(navControls.numberContainer);

        var pageInputWrapper = document.createElement('div');
        pageInputWrapper.className = 'd-flex align-items-center gap-1';

        var pageInputLabel = document.createElement('label');
        pageInputLabel.className = 'visually-hidden';
        pageInputLabel.setAttribute('for', 'okar-page-jump');
        pageInputLabel.textContent = 'Seite eingeben';
        pageInputWrapper.appendChild(pageInputLabel);

        navControls.pageInput = document.createElement('input');
        navControls.pageInput.type = 'number';
        navControls.pageInput.min = '1';
        navControls.pageInput.max = String(pages.length);
        navControls.pageInput.value = String(currentPageIndex + 1);
        navControls.pageInput.id = 'okar-page-jump';
        navControls.pageInput.className = 'form-control form-control-sm';
        navControls.pageInput.style.width = '3.25rem';
        navControls.pageInput.setAttribute('aria-label', 'Seite wählen');
        navControls.pageInput.inputMode = 'numeric';
        navControls.pageInput.step = '1';

        if (!pageInputStyleInjected) {
            var styleEl = document.createElement('style');
            styleEl.textContent = '.page-input-no-spin { -moz-appearance: textfield; appearance: textfield; } .page-input-no-spin::-webkit-outer-spin-button, .page-input-no-spin::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }';
            document.head.appendChild(styleEl);
            pageInputStyleInjected = true;
        }
        navControls.pageInput.classList.add('page-input-no-spin');

        var handlePageInput = function() {
            var value = parseInt(navControls.pageInput.value, 10);
            if (Number.isNaN(value)) {
                navControls.pageInput.value = String(currentPageIndex + 1);
                return;
            }
            value = Math.min(Math.max(value, 1), pages.length);
            showPageByNumber(value);
        };

        navControls.pageInput.addEventListener('change', handlePageInput);
        navControls.pageInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                handlePageInput();
            }
        });

        pageInputWrapper.appendChild(navControls.pageInput);

        navControls.pageTotalLabel = document.createElement('span');
        navControls.pageTotalLabel.className = 'text-muted small';
        navControls.pageTotalLabel.textContent = '/ ' + pages.length;
        pageInputWrapper.appendChild(navControls.pageTotalLabel);

        navControls.pageInputWrapper = pageInputWrapper;

        navControls.numberButtons = pages.map(function(page, idx) {
            var numberButton = createNavButton(String(idx + 1), function() {
                showPageByIndex(idx);
            });
            numberButton.setAttribute('aria-label', 'Seite ' + (page.label || idx + 1));
            numberButton.dataset.pageIndex = String(idx);
            return numberButton;
        });

        navControls.next = createNavButton('▶︎', function() {
            showPageByIndex(currentPageIndex + 1);
        });
        navWrapper.appendChild(navControls.next);

        navControls.last = createNavButton('⏩︎', function() {
            showPageByIndex(currentPageIndex + 10);
        });
        navWrapper.appendChild(navControls.last);

        navControls.end = createNavButton('⏭︎', function() {
            showPageByIndex(pages.length - 1);
        });
        navWrapper.appendChild(navControls.end);
    } else {
        navControls.numberButtons = [];
    }

    var osdViewer = null;
    var currentImageSource = null;

    if (osdContainer && typeof OpenSeadragon !== 'undefined') {
        osdViewer = OpenSeadragon({
            id: 'container_facs_1',
            prefixUrl: 'https://cdnjs.cloudflare.com/ajax/libs/openseadragon/4.0.0/images/',
            sequenceMode: false,
            showNavigator: true,
            crossOriginPolicy: 'Anonymous',
            ajaxWithCredentials: false
        });

        osdViewer.addHandler('open', function() {
            ensureFacsimileData().then(function() {
                rebuildRegionOverlays();
            });

            if (!activeHighlight.region) {
                return;
            }
            highlightNeedsUpdate = true;
            if (typeof window !== 'undefined' && typeof window.requestAnimationFrame === 'function') {
                window.requestAnimationFrame(applyHighlightOverlay);
            } else {
                applyHighlightOverlay();
            }
        });
    }

    function clearRegionOverlays() {
        if (!osdViewer || !regionOverlayElements.length) {
            regionOverlayElements = [];
            return;
        }

        regionOverlayElements.forEach(function(overlayEl) {
            try {
                osdViewer.removeOverlay(overlayEl);
            } catch (error) {
                // no-op
            }
        });
        regionOverlayElements = [];
    }

    function handleRegionOverlayEnter(event) {
        var el = event.currentTarget;
        if (!el) {
            return;
        }
        var regionId = el.dataset.regionId;
        if (!regionId) {
            return;
        }
        if (!isLineRegion(regionId)) {
            logDebug('hover facsimile overlay: skip non-line region', { regionId: regionId });
            return;
        }
        markLag(regionId, 'hover');
        logDebug('hover facsimile overlay', { regionId: regionId });
        if (clearHighlightTimer) {
            window.clearTimeout(clearHighlightTimer);
            clearHighlightTimer = null;
        }
        lastOverlayHoverRegionId = regionId;
        lastOverlayHoverTs = Date.now();
        highlightTranscriptForRegion(regionId);
        if (activeHighlight.regionId === regionId && activeHighlight.region && !highlightNeedsUpdate) {
            logDebug('hover facsimile overlay: already active', { regionId: regionId });
            return;
        }
        if (activeHighlight.regionId === regionId && activeHighlight.region) {
            if (highlightNeedsUpdate) {
                applyHighlightOverlay();
            }
            return;
        }
        requestHighlight(regionId, null);
    }

    function handleRegionOverlayLeave(event) {
        var el = event && event.currentTarget;
        var regionId = el && el.dataset ? el.dataset.regionId : null;
        if (regionId && regionId !== activeHighlight.regionId) {
            return;
        }
        scheduleClearHighlight(3000);
    }

    function rebuildRegionOverlays() {
        clearRegionOverlays();

        if (!osdViewer || !facsimileData || !facsimileData.regions || !currentSurfaceId) {
            return;
        }

        var tiledImage = osdViewer.world.getItemAt(0);
        if (!tiledImage) {
            return;
        }

        var surfaceInfo = facsimileData.surfaces && facsimileData.surfaces.get(currentSurfaceId);
        if (!surfaceInfo) {
            return;
        }

        var contentSize = tiledImage.getContentSize();
        if (!contentSize || !contentSize.x || !contentSize.y) {
            return;
        }

        var scaleX = contentSize.x / surfaceInfo.width;
        var scaleY = contentSize.y / surfaceInfo.height;

        var created = 0;

        facsimileData.regions.forEach(function(region) {
            if (!region || region.surfaceId !== currentSurfaceId || !region.bounds) {
                return;
            }

            var viewportRect = osdViewer.viewport.imageToViewportRectangle(
                region.bounds.minX * scaleX,
                region.bounds.minY * scaleY,
                region.bounds.width * scaleX,
                region.bounds.height * scaleY
            );

            var overlay = document.createElement('div');
            overlay.className = 'facsimile-region-overlay';
            overlay.dataset.regionId = region.id;
            overlay.addEventListener('pointerenter', handleRegionOverlayEnter);
            overlay.addEventListener('pointerleave', handleRegionOverlayLeave);
            overlay.addEventListener('pointercancel', handleRegionOverlayLeave);

            osdViewer.addOverlay({
                element: overlay,
                location: viewportRect,
                placement: OpenSeadragon.Placement.TOP_LEFT
            });

            regionOverlayElements.push(overlay);
            created += 1;
        });

        logDebug('rebuildRegionOverlays', { surfaceId: currentSurfaceId, overlays: created });
    }

    function buildIiifUrl(source) {
        if (!source || !safeRecordId) {
            return '';
        }

        var safeSource = encodeURIComponent(source);
    return `https://viewer.acdh.oeaw.ac.at/viewer/api/v1/records/${safeRecordId}/files/images/${safeSource}/full/full/0/default.jpg`;
    }

    function loadOsdImage(source) {
        if (!osdViewer) {
            return;
        }

        if (!source) {
            osdViewer.close();
            currentImageSource = null;
            return;
        }

        if (currentImageSource === source) {
            return;
        }

        var imageUrl = buildIiifUrl(source);

        if (!imageUrl) {
            osdViewer.close();
            currentImageSource = null;
            return;
        }

        currentImageSource = source;
        osdViewer.open({
            type: 'image',
            url: imageUrl
        });
    }

    function updateUrl(pageNumber) {
        if (!window.history || !window.history.replaceState) {
            return;
        }

        var url = new URL(window.location.href);

        if (pageNumber === 1) {
            url.searchParams.delete('p');
        } else {
            url.searchParams.set('p', pageNumber);
        }

        window.history.replaceState({}, '', url);
    }

    var currentPageIndex = -1;

    function buildVisiblePageItems(totalPages, currentIndex) {
        var effectiveIndex = currentIndex >= 0 ? currentIndex : 0;
        var start = Math.max(0, effectiveIndex - 3);
        var end = Math.min(totalPages - 1, effectiveIndex + 3);

        var items = [];
        for (var i = start; i <= end; i++) {
            items.push(i);
        }

        return items;
    }

    function renderNumberButtons() {
        if (!navControls.numberContainer || !navControls.numberButtons.length) {
            return;
        }

        var items = buildVisiblePageItems(pages.length, currentPageIndex);
        var container = navControls.numberContainer;
        container.innerHTML = '';

        items.forEach(function(item) {
            if (item === 'ellipsis') {
                var ellipsis = document.createElement('span');
                ellipsis.className = 'pagination-ellipsis text-muted';
                ellipsis.textContent = '…';
                container.appendChild(ellipsis);
            } else if (item === currentPageIndex && navControls.pageInputWrapper) {
                container.appendChild(navControls.pageInputWrapper);
            } else {
                var button = navControls.numberButtons[item];
                if (button) {
                    container.appendChild(button);
                }
            }
        });
    }

    function updateNavState() {
        if (!navContainer) {
            return;
        }

        renderNumberButtons();

        var visibleItems = buildVisiblePageItems(pages.length, currentPageIndex);
        var atStart = currentPageIndex === 0;
        var atEnd = currentPageIndex === pages.length - 1;

        if (navControls.start) {
            var startVisible = visibleItems.indexOf(0) !== -1;
            navControls.start.style.display = startVisible ? 'none' : '';
            navControls.start.disabled = startVisible;
        }

        if (navControls.first) {
            var hasTenBack = currentPageIndex >= 10;
            navControls.first.style.display = hasTenBack ? '' : 'none';
            navControls.first.disabled = !hasTenBack;
        }

        if (navControls.prev) {
            navControls.prev.style.display = atStart ? 'none' : '';
            navControls.prev.disabled = atStart;
        }

        if (navControls.next) {
            navControls.next.style.display = atEnd ? 'none' : '';
            navControls.next.disabled = atEnd;
        }

        if (navControls.last) {
            var remainingAhead = pages.length - currentPageIndex - 1;
            var hasTenAhead = remainingAhead >= 10;
            navControls.last.style.display = hasTenAhead ? '' : 'none';
            navControls.last.disabled = !hasTenAhead;
        }

        if (navControls.end) {
            var endVisible = visibleItems.indexOf(pages.length - 1) !== -1;
            navControls.end.style.display = endVisible ? 'none' : '';
            navControls.end.disabled = endVisible;
        }

        if (navControls.pageInput) {
            navControls.pageInput.max = String(pages.length);
            navControls.pageInput.value = String(currentPageIndex + 1);
        }

        if (navControls.pageTotalLabel) {
            navControls.pageTotalLabel.textContent = '/ ' + pages.length;
        }

        navControls.numberButtons.forEach(function(btn, idx) {
            if (idx === currentPageIndex) {
                btn.classList.remove('btn-outline-secondary');
                btn.classList.add('btn-secondary');
                btn.setAttribute('aria-current', 'page');
            } else {
                btn.classList.remove('btn-secondary');
                btn.classList.add('btn-outline-secondary');
                btn.removeAttribute('aria-current');
            }
        });
    }

    function showPageByIndex(index, options) {
        if (typeof index !== 'number') {
            index = parseInt(index, 10);
        }

        if (Number.isNaN(index)) {
            index = 0;
        }

        index = Math.min(Math.max(index, 0), pages.length - 1);

        if (currentPageIndex === index && (!options || options.force !== true)) {
            return;
        }

        if (currentPageIndex !== -1) {
            pages[currentPageIndex].wrapper.style.display = 'none';
            pages[currentPageIndex].wrapper.setAttribute('aria-hidden', 'true');
            if (pages[currentPageIndex].row) {
                pages[currentPageIndex].row.style.display = 'none';
            }
        }

        clearHighlight();

        pages[index].wrapper.style.display = 'block';
        pages[index].wrapper.setAttribute('aria-hidden', 'false');
        if (pages[index].row) {
            pages[index].row.style.display = '';
        }

        currentPageIndex = index;
        currentSurfaceId = pages[index].surfaceId || null;

        logDebug('showPageByIndex', { index: index, surfaceId: currentSurfaceId, imageSource: pages[index].imageSource });

        loadOsdImage(pages[index].imageSource);
        ensureFacsimileData().then(function() {
            rebuildRegionOverlays();
        });
        updateNavState();

        if (!options || options.updateHistory !== false) {
            updateUrl(index + 1);
        }

        if (textContainer) {
            textContainer.scrollTop = 0;
        } else {
            window.scrollTo(0, 0);
        }
    }

    function showPageForElement(element, options) {
        var index = resolvePageIndexFromElement(element);
        if (index === -1) {
            return;
        }
        showPageByIndex(index, options);
    }

    function showPageByNumber(pageNumber, options) {
        if (typeof pageNumber !== 'number') {
            pageNumber = parseInt(pageNumber, 10);
        }
        if (Number.isNaN(pageNumber) || pageNumber < 1) {
            pageNumber = 1;
        }
        showPageByIndex(pageNumber - 1, options);
    }

    var params = new URLSearchParams(window.location.search);
    var requestedPage = parseInt(params.get('p'), 10);
    var initialIndex = Number.isNaN(requestedPage) ? 0 : requestedPage - 1;

    initialIndex = Math.min(Math.max(initialIndex, 0), pages.length - 1);

    showPageByIndex(initialIndex, { updateHistory: false, force: true });

    window.addEventListener('popstate', function() {
        var popParams = new URLSearchParams(window.location.search);
        var popRequested = parseInt(popParams.get('p'), 10);
        var popIndex = Number.isNaN(popRequested) ? 0 : popRequested - 1;
        popIndex = Math.min(Math.max(popIndex, 0), pages.length - 1);
        showPageByIndex(popIndex, { updateHistory: false, force: true });
    });

    window.okarTranscript = window.okarTranscript || {};
    window.okarTranscript.showPageByIndex = function(index, options) {
        showPageByIndex(index, options);
    };
    window.okarTranscript.showPageByNumber = function(pageNumber, options) {
        showPageByNumber(pageNumber, options);
    };
    window.okarTranscript.showPageForElement = function(element, options) {
        showPageForElement(element, options);
    };
    window.okarTranscript.getActivePageNumber = function() {
        return currentPageIndex + 1;
    };
    window.okarTranscript.resolvePageIndexFromElement = function(element) {
        return resolvePageIndexFromElement(element);
    };
})();