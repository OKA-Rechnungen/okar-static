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

    function normalizeImageSource(source, context) {
        if (typeof source !== 'string' || !source) {
            return source;
        }

        var pathParts = source.split('/');
        var filename = pathParts.pop() || '';
        if (!filename) {
            return source;
        }

        var dotIndex = filename.lastIndexOf('.');
        var namePart = dotIndex === -1 ? filename : filename.slice(0, dotIndex);
        var extension = dotIndex === -1 ? '' : filename.slice(dotIndex);

        var lastUnderscore = namePart.lastIndexOf('_');
        var normalizedName;

        if (lastUnderscore === -1) {
            normalizedName = namePart.replace(/_/g, '-');
        } else {
            var prefix = namePart.slice(0, lastUnderscore);
            var suffix = namePart.slice(lastUnderscore);
            normalizedName = prefix.replace(/_/g, '-') + suffix;
        }

        var recordId = context && context.recordId ? String(context.recordId).trim() : '';

        if (recordId) {
            var originalStartsWithRecordId = namePart.indexOf(recordId) === 0;
            var digitsOnly = /^\d+$/.test(normalizedName);

            if (!originalStartsWithRecordId && digitsOnly) {
                var paddedDigits = normalizedName.padStart(Math.max(normalizedName.length, 5), '0');
                normalizedName = recordId + '_' + paddedDigits;
            }
        }

        pathParts.push(normalizedName + extension);
        return pathParts.join('/');
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
    var normalizedSource = normalizeImageSource(source, { recordId: recordIdBase });
        if (normalizedSource !== source) {
            pb.dataset.originalSource = source;
            pb.setAttribute('source', normalizedSource);
        }
        var label = pb.dataset.pageNumber || String(index + 1);

        pageWrapper.dataset.pageLabel = label;

        pages.push({
            wrapper: pageWrapper,
            imageSource: normalizedSource,
            label: label
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
        return `https://viewer.acdh.oeaw.ac.at/viewer/api/v1/records/${safeRecordId}/files/images/${safeSource}/full/!400,400/0/default.jpg`;
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
        }

        pages[index].wrapper.style.display = 'block';
        pages[index].wrapper.setAttribute('aria-hidden', 'false');

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
})();