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
        recordIdPart = pathSegment.replace(/\.html?$/i, '');
    }

    var safeRecordId = encodeURIComponent(recordIdPart);
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
        var label = pb.dataset.pageNumber || String(index + 1);

        pageWrapper.dataset.pageLabel = label;

        pages.push({
            wrapper: pageWrapper,
            imageSource: source,
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
        numberButtons: []
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

        pages.forEach(function(page, idx) {
            var numberButton = createNavButton(String(idx + 1), function() {
                showPageByIndex(idx);
            });
            numberButton.setAttribute('aria-label', 'Seite ' + (page.label || idx + 1));
            navControls.numberButtons.push(numberButton);
            navWrapper.appendChild(numberButton);
        });

        navControls.next = createNavButton('>', function() {
            showPageByIndex(currentPageIndex + 1);
        });
        navWrapper.appendChild(navControls.next);

        navControls.last = createNavButton('>>', function() {
            showPageByIndex(pages.length - 1);
        });
        navWrapper.appendChild(navControls.last);
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

    function updateNavState() {
        if (!navContainer) {
            return;
        }

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