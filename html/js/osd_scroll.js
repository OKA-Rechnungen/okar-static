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

    var pages = [];

    function buildTranscriptRow(wrapper) {
        if (!wrapper) {
            return null;
        }

        var children = Array.prototype.slice.call(wrapper.children || []);
        var abBlocks = children.filter(function(node) {
            return node.nodeType === 1 && node.classList.contains('ab');
        });

        if (!abBlocks.length) {
            return null;
        }

        var row = document.createElement('div');
        row.className = 'row transcript-row g-4';
        row.style.display = 'none';

        var visibleCount = abBlocks.length;
        var multiColumn = visibleCount === 2;
        var columnClass = multiColumn ? 'col-12 col-lg-6 transcript-column' : 'col-12 transcript-column';

        abBlocks.forEach(function(abBlock) {
            var column = document.createElement('div');
            column.className = columnClass;
            column.appendChild(abBlock);
            row.appendChild(column);
        });

        var anchor = wrapper.querySelector('span.pb');
        if (anchor && anchor.nextSibling) {
            wrapper.insertBefore(row, anchor.nextSibling);
        } else {
            wrapper.appendChild(row);
        }

        return row;
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

        var source = pb.getAttribute('source') || '';
        var normalizedSource = normalizeImageSource(source, { recordId: recordIdBase, pageIndex: index + 1 });
        if (normalizedSource !== source) {
            pb.dataset.originalSource = source;
            pb.setAttribute('source', normalizedSource);
        }
        var label = pb.dataset.pageNumber || String(index + 1);

        pageWrapper.dataset.pageLabel = label;

        var transcriptRow = buildTranscriptRow(pageWrapper);

        pages.push({
            wrapper: pageWrapper,
            imageSource: normalizedSource,
            label: label,
            row: transcriptRow
        });
    });

    contentRoot.innerHTML = '';

    pages.forEach(function(page) {
        page.wrapper.style.display = 'none';
        page.wrapper.setAttribute('aria-hidden', 'true');
        contentRoot.appendChild(page.wrapper);
    });

    var navControls = {
        first: null,
        prev: null,
        next: null,
        last: null,
        numberButtons: [],
        numberContainer: null
    };

    var navContainer = null;
    var navWrapper = null;

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

        navControls.first = createNavButton('<<', function() {
            showPageByIndex(0);
        });
        navWrapper.appendChild(navControls.first);

        navControls.prev = createNavButton('<', function() {
            showPageByIndex(currentPageIndex - 1);
        });
        navWrapper.appendChild(navControls.prev);

        navControls.numberContainer = document.createElement('div');
        navControls.numberContainer.className = 'page-number-container d-flex flex-wrap align-items-center gap-2';
        navWrapper.appendChild(navControls.numberContainer);

        navControls.numberButtons = pages.map(function(page, idx) {
            var numberButton = createNavButton(String(idx + 1), function() {
                showPageByIndex(idx);
            });
            numberButton.setAttribute('aria-label', 'Seite ' + (page.label || idx + 1));
            numberButton.dataset.pageIndex = String(idx);
            return numberButton;
        });

        navControls.next = createNavButton('>', function() {
            showPageByIndex(currentPageIndex + 1);
        });
        navWrapper.appendChild(navControls.next);

        navControls.last = createNavButton('>>', function() {
            showPageByIndex(pages.length - 1);
        });
        navWrapper.appendChild(navControls.last);
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
            showNavigator: true
        });
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
        var maxButtons = 10;
        if (totalPages <= maxButtons) {
            return Array.from({ length: totalPages }, function(_, i) { return i; });
        }

        var effectiveIndex = currentIndex >= 0 ? currentIndex : 0;
        var tailCount = Math.min(2, totalPages);
        var blockSize = Math.max(maxButtons - tailCount, 0);
        if (blockSize === 0) {
            return Array.from({ length: totalPages }, function(_, i) { return i; });
        }

        var ranges = [];

        if (effectiveIndex <= 4) {
            var blockEnd = Math.min(blockSize - 1, totalPages - 1);
            ranges.push({ start: 0, end: blockEnd });
            var tailStart = Math.max(totalPages - tailCount, blockEnd + 1);
            if (tailStart <= totalPages - 1) {
                ranges.push({ start: tailStart, end: totalPages - 1 });
            }
        } else if (effectiveIndex >= totalPages - 5) {
            var headEnd = Math.min(1, totalPages - 1);
            if (headEnd >= 0) {
                ranges.push({ start: 0, end: headEnd });
            }
            var blockStart = Math.max(totalPages - blockSize, 0);
            ranges.push({ start: blockStart, end: totalPages - 1 });
        } else {
            var tailStartMiddle = Math.max(totalPages - tailCount, 0);
            var start = effectiveIndex - (blockSize - 2);
            if (start < 0) {
                start = 0;
            }
            var end = start + blockSize - 1;
            if (end >= tailStartMiddle) {
                end = tailStartMiddle - 1;
                start = Math.max(0, end - blockSize + 1);
            }
            ranges.push({ start: start, end: end });
            if (tailStartMiddle <= totalPages - 1) {
                ranges.push({ start: tailStartMiddle, end: totalPages - 1 });
            }
        }

        ranges = ranges.filter(function(range) { return range.start <= range.end; });
        ranges.sort(function(a, b) { return a.start - b.start; });

        var merged = [];
        ranges.forEach(function(range) {
            if (!merged.length) {
                merged.push({ start: range.start, end: range.end });
                return;
            }
            var last = merged[merged.length - 1];
            if (range.start <= last.end + 1) {
                last.end = Math.max(last.end, range.end);
            } else {
                merged.push({ start: range.start, end: range.end });
            }
        });

        var items = [];
        var prevEnd = null;
        merged.forEach(function(range) {
            if (prevEnd !== null && range.start > prevEnd + 1) {
                items.push('ellipsis');
            }
            for (var i = range.start; i <= range.end; i++) {
                items.push(i);
            }
            prevEnd = range.end;
        });

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

        var atStart = currentPageIndex === 0;
        var atEnd = currentPageIndex === pages.length - 1;

        if (navControls.first) {
            navControls.first.disabled = atStart;
        }

        if (navControls.prev) {
            navControls.prev.disabled = atStart;
        }

        if (navControls.next) {
            navControls.next.disabled = atEnd;
        }

        if (navControls.last) {
            navControls.last.disabled = atEnd;
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

        pages[index].wrapper.style.display = 'block';
        pages[index].wrapper.setAttribute('aria-hidden', 'false');
        if (pages[index].row) {
            pages[index].row.style.display = '';
        }

        currentPageIndex = index;

        loadOsdImage(pages[index].imageSource);
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