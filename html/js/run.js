var editor = new LoadEditor({
    aot: {
      title: "Text Annotations",
      variants: [
        {
          opt: "ef",
          opt_slider: "entities-features-slider",
          title: "All",
          color: "red",
          html_class: "undefined",
          css_class: "undefined",
          chg_citation: "citation-url",
          hide: {
            hidden: false,
            class: "undefined",
          },
          features: {
            all: true,
            class: "features-1",
          },
        },
        {
          opt: "prs",
          color: "blue",
          title: "Persons",
          html_class: "persons",
          css_class: "pers",
          hide: {
            hidden: false,
            class: "persons .entity",
          },
          chg_citation: "citation-url",
          features: {
            all: false,
            class: "features-1",
          },
        },
        {
          opt: "plc",
          color: "green",
          title: "Places",
          html_class: "places",
          css_class: "plc",
          hide: {
            hidden: false,
            class: "places .entity",
          },
          chg_citation: "citation-url",
          features: {
            all: false,
            class: "features-1",
          },
        },
        {
          opt: "org",
          color: "yellow",
          title: "Organizations",
          html_class: "orgs",
          css_class: "org",
          hide: {
            hidden: false,
            class: "orgs .entity",
          },
          chg_citation: "citation-url",
          features: {
            all: false,
            class: "features-1",
          },
        },
        {
          opt: "wrk",
          color: "lila",
          title: "Works",
          html_class: "works",
          css_class: "wrk",
          chg_citation: "citation-url",
          hide: {
            hidden: false,
            class: "wrk .entity",
          },
          features: {
            all: false,
            class: "features-1",
          },
        }
      ],
      span_element: {
        css_class: "badge-item",
      },
      active_class: "activated",
      rendered_element: {
        label_class: "switch",
        slider_class: "i-slider round",
      },
    },
    ff: {
      name: "Change font family",
      variants: [
        {
          opt: "ff",
          title: "Font Family",
          urlparam: "ff",
          chg_citation: "citation-url",
          fonts: {
            default: "default",
            font1: "Times-New-Roman",
            font2: "Courier-New",
            font3: "Arial-serif",
          },
          paragraph: ".yes-index",
          p_class: "",
          css_class: "",
        },
      ],
      active_class: "active",
      html_class: "form-select",
    },
    fs: {
      name: "Create full size mode",
      variants: [
        {
          opt: "fls",
          title: "Full screen on/off",
          urlparam: "fullscreen",
          chg_citation: "citation-url",
          hide: "hide-reading",
          to_hide: "fade",
        },
      ],
      active_class: "active",
      render_class: "nav-link btn btn-round",
      render_svg:
        "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor' class='bi bi-fullscreen' viewBox='0 0 16 16'><path d='M1.5 1a.5.5 0 0 0-.5.5v4a.5.5 0 0 1-1 0v-4A1.5 1.5 0 0 1 1.5 0h4a.5.5 0 0 1 0 1h-4zM10 .5a.5.5 0 0 1 .5-.5h4A1.5 1.5 0 0 1 16 1.5v4a.5.5 0 0 1-1 0v-4a.5.5 0 0 0-.5-.5h-4a.5.5 0 0 1-.5-.5zM.5 10a.5.5 0 0 1 .5.5v4a.5.5 0 0 0 .5.5h4a.5.5 0 0 1 0 1h-4A1.5 1.5 0 0 1 0 14.5v-4a.5.5 0 0 1 .5-.5zm15 0a.5.5 0 0 1 .5.5v4a1.5 1.5 0 0 1-1.5 1.5h-4a.5.5 0 0 1 0-1h4a.5.5 0 0 0 .5-.5v-4a.5.5 0 0 1 .5-.5z'/></svg>",
    },
    fos: {
      name: "Change font size",
      variants: [
        {
          opt: "fs",
          title: "Font Size",
          urlparam: "fs",
          chg_citation: "citation-url",
          sizes: {
            default: "default",
            font_size_14: "14",
            font_size_18: "18",
            font_size_22: "22",
            font_size_26: "26",
          },
          paragraph: ".yes-index",
          p_class: "",
          css_class: "font-size-",
        },
      ],
      active_class: "active",
      html_class: "form-select",
    },
    is: {
      name: "Facsimiles On/Off",
      variants: [
        {
          opt: "es",
          title: "Facsimiles On/Off",
          urlparam: "img",
          chg_citation: "citation-url",
          fade: "fade",
          column_small: {
            class: "col-md-6",
            percent: "50",
          },
          column_full: {
            class: "col-md-12",
            percent: "100",
          },
          hide: {
            hidden: true,
            class_to_hide: "facsimiles",
            class_to_show: "text",
            class_parent: "transcript",
            resize: "resize-hide",
          },
          image_size: "400px",
        },
      ],
      active_class: "active",
      rendered_element: {
        a_class: "nav-link btn btn-round",
        svg: "<svg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='currentColor' class='bi bi-image' viewBox='0 0 16 16'><path d='M6.002 5.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0z'/><path d='M2.002 1a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V3a2 2 0 0 0-2-2h-12zm12 1a1 1 0 0 1 1 1v6.5l-3.777-1.947a.5.5 0 0 0-.577.093l-3.71 3.71-2.66-1.772a.5.5 0 0 0-.63.062L1.002 12V3a1 1 0 0 1 1-1h12z'/></svg>",
      },
    },
    wr: false,
    up: true,
  });

  (function () {
    var trigger = document.getElementById('milestone-nav-btn');
    var list = document.getElementById('milestone-nav-list');
    var emptyState = document.getElementById('milestone-empty-state');
    var transcript = document.getElementById('transcript');

    if (!trigger || !list || !transcript) {
      return;
    }

    var milestones = Array.prototype.slice.call(
      transcript.querySelectorAll('.milestone-anchor[data-page-number]') || []
    );

    if (!milestones.length) {
      trigger.disabled = true;
      trigger.classList.add('disabled');
      trigger.removeAttribute('data-bs-toggle');
      trigger.removeAttribute('data-bs-target');
      if (emptyState) {
        emptyState.style.display = 'block';
      }
      return;
    }

    trigger.disabled = false;
    trigger.classList.remove('disabled');
    trigger.setAttribute('data-bs-toggle', 'modal');
    trigger.setAttribute('data-bs-target', '#milestoneModal');

    var typeLabels = {
      'section': 'Abschnitt',
      'summary': 'Zusammenfassung'
    };

    function buildLabel(node) {
      var subtype = node.getAttribute('data-subtype') || '';
      var type = node.getAttribute('data-type') || '';
      if (subtype) {
        return subtype;
      } else if (type) {
        return typeLabels[type.toLowerCase()] || type;
      }
      return '';
    }

    function buildTargetUrl(pageNumber) {
      var url = new URL(window.location.href);
      url.searchParams.set('p', String(pageNumber));
      return url.toString();
    }

    milestones.forEach(function (node) {
      var pageNumber = node.getAttribute('data-page-number');
      if (!pageNumber) {
        return;
      }
      var subtype = (node.getAttribute('data-subtype') || '').toLowerCase();
      if (subtype === 'ende') {
        return;
      }

      var item = document.createElement('button');
      item.type = 'button';
      item.className = 'list-group-item list-group-item-action d-flex justify-content-between align-items-start';
      item.dataset.pageNumber = pageNumber;

      var body = document.createElement('div');
      body.className = 'ms-2 me-auto';

      var title = document.createElement('div');
      title.className = 'fw-bold';
      title.textContent = buildLabel(node) || 'Abschnitt';
      body.appendChild(title);

      var foliation = node.getAttribute('data-n') || pageNumber;
      var badge = document.createElement('span');
      badge.className = 'badge bg-secondary rounded-pill';
      badge.textContent = foliation;

      item.appendChild(body);
      item.appendChild(badge);

      item.addEventListener('click', function () {
        window.location.assign(buildTargetUrl(pageNumber));
      });

      list.appendChild(item);
    });
  })();

  (function () {
    var container = document.querySelector('#transcript');
    if (!container) {
      return;
    }

    var BAND_SEARCH_DEBUG = true;

    var form = document.querySelector('.navbar-search-form');
    var input = document.getElementById('navbar-search');
    var status = document.getElementById('band-search-status');
    var scopeCheckbox = document.getElementById('band-search-scope');
    var navControls = document.getElementById('band-search-nav-controls');
    var prevButton = document.getElementById('band-search-prev');
    var nextButton = document.getElementById('band-search-next');

    if (!form || !input) {
      return;
    }

    var bandScopeWrapper = scopeCheckbox ? scopeCheckbox.closest('.navbar-band-scope') : null;
    if (bandScopeWrapper) bandScopeWrapper.classList.add('visible');
    if (navControls) navControls.classList.add('visible');

    var matches = [];
    var activeIndex = -1;
    var lastSearchKey = '';
    var pageMatchCache = Object.create(null);

    function isBandScopeEnabled() {
      return !scopeCheckbox || scopeCheckbox.checked;
    }

    function updateBandScopeUi() {
      if (!scopeCheckbox || !navControls) {
        return;
      }
      navControls.classList.toggle('d-none', !scopeCheckbox.checked);
      if (prevButton) {
        prevButton.disabled = !scopeCheckbox.checked;
      }
      if (nextButton) {
        nextButton.disabled = !scopeCheckbox.checked;
      }
      if (BAND_SEARCH_DEBUG) {
        console.debug('[band-search] updateBandScopeUi', {
          checked: scopeCheckbox.checked,
          navHidden: navControls.classList.contains('d-none'),
          prevDisabled: prevButton ? prevButton.disabled : null,
          nextDisabled: nextButton ? nextButton.disabled : null,
        });
      }
    }

    function normalizeTerms(value) {
      if (!value) {
        return [];
      }
      return value
        .split(/\s+/)
        .map(function (term) {
          return term
            .trim()
            .replace(/[\u201c\u201d\u201e\u201f\u00ab\u00bb\u2039\u203a]/g, '')
            .replace(/^['"“”‚‛‘’]+|['"“”‚‛‘’]+$/g, '');
        })
        .filter(function (term) {
          return term.length > 0;
        });
    }

    function escapeRegExp(value) {
      return value.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&');
    }

    function buildPattern(terms) {
      if (!terms || !terms.length) {
        return null;
      }
      return new RegExp(
        '('
          + terms
            .map(function (term) {
              return escapeRegExp(term);
            })
            .join('|')
          + ')',
        'gi'
      );
    }

    function unwrapNode(node) {
      if (!node || !node.parentNode) {
        return;
      }
      var parent = node.parentNode;
      while (node.firstChild) {
        parent.insertBefore(node.firstChild, node);
      }
      parent.removeChild(node);
      parent.normalize();
    }

    function clearHighlights() {
      Array.prototype.slice.call(container.querySelectorAll('mark.search-highlight')).forEach(function (markNode) {
        unwrapNode(markNode);
      });
      matches = [];
      activeIndex = -1;
      if (status) {
        status.textContent = '0/0';
      }
      lastSearchKey = '';
    }

    function updateStatus() {
      if (status) {
        status.textContent = matches.length ? String(activeIndex + 1) + '/' + String(matches.length) : '0/0';
      }
    }

    function activateMatch(index) {
      if (!matches.length) {
        updateStatus();
        return;
      }

      if (typeof index !== 'number' || Number.isNaN(index)) {
        index = 0;
      }

      activeIndex = (index % matches.length + matches.length) % matches.length;

      matches.forEach(function (node) {
        node.classList.remove('search-highlight-active');
      });

      var activeMatch = matches[activeIndex];
      if (!activeMatch) {
        updateStatus();
        return;
      }

      activeMatch.classList.add('search-highlight-active');

      if (window.okarTranscript && typeof window.okarTranscript.showPageForElement === 'function') {
        window.okarTranscript.showPageForElement(activeMatch);
      }

      if (typeof activeMatch.scrollIntoView === 'function') {
        var schedule = window.requestAnimationFrame || function (fn) {
          return window.setTimeout(fn, 16);
        };
        schedule(function () {
          activeMatch.scrollIntoView({ behavior: 'smooth', block: 'center' });
        });
      }

      updateStatus();
    }

    function applyHighlights(terms) {
      var pattern = buildPattern(terms);
      if (!pattern) {
        return false;
      }

      var textNodes = [];

      var walker = document.createTreeWalker(
        container,
        NodeFilter.SHOW_TEXT,
        {
          acceptNode: function (node) {
            if (!node.parentNode || node.parentNode.closest('mark.search-highlight')) {
              return NodeFilter.FILTER_REJECT;
            }
            // Reset regex state for each text node; global regex + test() is stateful.
            pattern.lastIndex = 0;
            if (!node.nodeValue || !pattern.test(node.nodeValue)) {
              return NodeFilter.FILTER_REJECT;
            }
            pattern.lastIndex = 0;
            return NodeFilter.FILTER_ACCEPT;
          },
        }
      );

      var candidate;
      while ((candidate = walker.nextNode())) {
        textNodes.push(candidate);
      }

      var matchFound = false;
      textNodes.forEach(function (current) {
        if (!current.parentNode) {
          return;
        }
        var originalText = current.nodeValue;
        pattern.lastIndex = 0;
        var fragment = document.createDocumentFragment();
        var lastIndex = 0;
        var match;

        while ((match = pattern.exec(originalText)) !== null) {
          matchFound = true;
          if (match.index > lastIndex) {
            fragment.appendChild(document.createTextNode(originalText.slice(lastIndex, match.index)));
          }
          var markNode = document.createElement('mark');
          markNode.className = 'search-highlight';
          markNode.textContent = match[0];
          fragment.appendChild(markNode);
          lastIndex = match.index + match[0].length;
        }

        if (lastIndex < originalText.length) {
          fragment.appendChild(document.createTextNode(originalText.slice(lastIndex)));
        }

        current.parentNode.replaceChild(fragment, current);
      });

      if (!matchFound) {
        return false;
      }

      matches = Array.prototype.slice.call(container.querySelectorAll('mark.search-highlight'));
      return matches.length > 0;
    }

    function runBandSearch(options) {
      options = options || {};
      var rawTerm = (input ? input.value : '').trim();

      if (!rawTerm) {
        clearHighlights();
        return;
      }

      var onlyCurrentBand = isBandScopeEnabled();
      if (!onlyCurrentBand) {
        clearHighlights();
        return false;
      }

      var terms = normalizeTerms(rawTerm);
      var searchKey = terms.join(' ').toLowerCase();
      if (!terms.length) {
        clearHighlights();
        return;
      }

      var shouldAdvance = options.advanceIfSame === true && matches.length > 0 && searchKey && searchKey === lastSearchKey;
      if (shouldAdvance) {
        activateMatch(activeIndex + 1);
        return true;
      }

      clearHighlights();
      if (!applyHighlights(terms)) {
        updateStatus();
        return true;
      }

      lastSearchKey = searchKey;
      activateMatch(0);
      return true;
    }

    function navigateBandSearch(direction) {
      if (BAND_SEARCH_DEBUG) {
        console.debug('[band-search] navigateBandSearch start', {
          direction: direction,
          scopeEnabled: isBandScopeEnabled(),
          inputValue: input ? input.value : '',
          matches: matches.length,
          activeIndex: activeIndex,
          lastSearchKey: lastSearchKey,
        });
      }

      if (!isBandScopeEnabled()) {
        clearHighlights();
        if (BAND_SEARCH_DEBUG) {
          console.debug('[band-search] abort: scope disabled');
        }
        return;
      }

      var rawTerm = (input ? input.value : '').trim();
      if (!rawTerm) {
        clearHighlights();
        if (BAND_SEARCH_DEBUG) {
          console.debug('[band-search] abort: empty term');
        }
        return;
      }

      var terms = normalizeTerms(rawTerm);
      var searchKey = terms.join(' ').toLowerCase();
      if (!terms.length) {
        clearHighlights();
        if (BAND_SEARCH_DEBUG) {
          console.debug('[band-search] abort: no normalized terms');
        }
        return;
      }

      if (!matches.length || !searchKey || searchKey !== lastSearchKey) {
        clearHighlights();
        if (!applyHighlights(terms)) {
          updateStatus();
          if (BAND_SEARCH_DEBUG) {
            console.debug('[band-search] no highlights found for terms', terms);
          }
          return;
        }
        lastSearchKey = searchKey;
        if (BAND_SEARCH_DEBUG) {
          console.debug('[band-search] highlights applied', {
            searchKey: searchKey,
            matches: matches.length,
            initialIndex: direction < 0 ? matches.length - 1 : 0,
          });
        }
        activateMatch(direction < 0 ? matches.length - 1 : 0);
        return;
      }

      if (matches.length <= 1) {
        navigateAcrossPages(direction, rawTerm);
        return;
      }

      if (BAND_SEARCH_DEBUG) {
        console.debug('[band-search] stepping existing matches', {
          from: activeIndex,
          to: activeIndex + direction,
          matches: matches.length,
        });
      }
      activateMatch(activeIndex + direction);
    }

    function getCurrentPageFromUrl() {
      var params = new URLSearchParams(window.location.search);
      var raw = params.get('p');
      var num = raw ? parseInt(raw, 10) : NaN;
      return Number.isFinite(num) && num > 0 ? num : 1;
    }

    function findPagesWithTerm(term, htmlText) {
      var lower = String(term || '').toLowerCase();
      if (!lower) {
        return [];
      }

      var pageRegex = /<span[^>]*class="pb[^\"]*"[^>]*data-page-number="(\d+)"[^>]*><\/span>/gi;
      var anchors = [];
      var match;
      while ((match = pageRegex.exec(htmlText)) !== null) {
        anchors.push({
          page: parseInt(match[1], 10),
          start: pageRegex.lastIndex,
          markerIndex: match.index,
        });
      }

      if (!anchors.length) {
        return [];
      }

      var pages = [];
      for (var i = 0; i < anchors.length; i += 1) {
        var sectionStart = anchors[i].start;
        var sectionEnd = i + 1 < anchors.length ? anchors[i + 1].markerIndex : htmlText.length;
        var section = htmlText.slice(sectionStart, sectionEnd).toLowerCase();
        if (section.indexOf(lower) !== -1) {
          pages.push(anchors[i].page);
        }
      }

      return pages;
    }

    function resolveNextPage(pages, currentPage, direction) {
      if (!pages.length) {
        return null;
      }

      var sorted = pages
        .filter(function (n) { return Number.isFinite(n); })
        .sort(function (a, b) { return a - b; });

      if (!sorted.length) {
        return null;
      }

      if (direction > 0) {
        for (var i = 0; i < sorted.length; i += 1) {
          if (sorted[i] > currentPage) {
            return sorted[i];
          }
        }
        return sorted[0];
      }

      for (var j = sorted.length - 1; j >= 0; j -= 1) {
        if (sorted[j] < currentPage) {
          return sorted[j];
        }
      }
      return sorted[sorted.length - 1];
    }

    function navigateAcrossPages(direction, rawTerm) {
      var term = String(rawTerm || '').trim();
      if (!term) {
        return;
      }

      var cacheKey = term.toLowerCase();
      var currentPage = getCurrentPageFromUrl();

      function jumpWithPages(pages) {
        var targetPage = resolveNextPage(pages, currentPage, direction);
        if (!targetPage || targetPage === currentPage) {
          if (BAND_SEARCH_DEBUG) {
            console.debug('[band-search] page-jump skipped', {
              currentPage: currentPage,
              pages: pages,
              direction: direction,
            });
          }
          return;
        }

        var nextUrl = new URL(window.location.href);
        nextUrl.searchParams.set('p', String(targetPage));
        nextUrl.searchParams.set('mark', term);
        if (BAND_SEARCH_DEBUG) {
          console.debug('[band-search] page-jump', {
            from: currentPage,
            to: targetPage,
            direction: direction,
            term: term,
          });
        }
        window.location.assign(nextUrl.toString());
      }

      if (pageMatchCache[cacheKey]) {
        jumpWithPages(pageMatchCache[cacheKey]);
        return;
      }

      fetch(window.location.pathname, { cache: 'no-store' })
        .then(function (response) {
          return response.text();
        })
        .then(function (htmlText) {
          var pages = findPagesWithTerm(term, htmlText);
          pageMatchCache[cacheKey] = pages;
          if (BAND_SEARCH_DEBUG) {
            console.debug('[band-search] page-cache built', {
              term: term,
              pages: pages,
            });
          }
          jumpWithPages(pages);
        })
        .catch(function (error) {
          if (BAND_SEARCH_DEBUG) {
            console.debug('[band-search] page-jump fetch failed', error);
          }
        });
    }

    form.addEventListener('submit', function (event) {
      var shouldHandleInBand = isBandScopeEnabled();
      if (!shouldHandleInBand) {
        clearHighlights();
        return;
      }
      event.preventDefault();
      runBandSearch({ advanceIfSame: true });
    });

    if (scopeCheckbox) {
      scopeCheckbox.addEventListener('change', function () {
        updateBandScopeUi();
        if (!scopeCheckbox.checked) {
          clearHighlights();
        }
      });
      updateBandScopeUi();
    }

    // Delegation keeps controls clickable if the navbar is re-rendered.
    document.addEventListener('click', function (event) {
      if (event.target && event.target.closest('#band-search-prev')) {
        event.preventDefault();
        if (BAND_SEARCH_DEBUG) {
          console.debug('[band-search] delegated prev click', {
            target: event.target ? event.target.tagName : null,
            id: event.target ? event.target.id : null,
            className: event.target ? event.target.className : null,
          });
        }
        navigateBandSearch(-1);
      }
      if (event.target && event.target.closest('#band-search-next')) {
        event.preventDefault();
        if (BAND_SEARCH_DEBUG) {
          console.debug('[band-search] delegated next click', {
            target: event.target ? event.target.tagName : null,
            id: event.target ? event.target.id : null,
            className: event.target ? event.target.className : null,
          });
        }
        navigateBandSearch(1);
      }
    });

    updateStatus();

    var params = new URLSearchParams(window.location.search);
    var rawMark = params.get('mark');
    var hasExplicitPageParam = params.has('p');
    if (rawMark && input) {
      input.value = rawMark;

      if (!applyHighlights(normalizeTerms(rawMark))) {
        var observer = new MutationObserver(function () {
          clearHighlights();
          if (applyHighlights(normalizeTerms(rawMark))) {
            lastSearchKey = normalizeTerms(rawMark).join(' ').toLowerCase();
            if (!hasExplicitPageParam) {
              activateMatch(0);
            } else {
              updateStatus();
            }
            observer.disconnect();
          }
        });

        observer.observe(container, {
          childList: true,
          subtree: true,
        });

        window.setTimeout(function () {
          clearHighlights();
          if (applyHighlights(normalizeTerms(rawMark))) {
            lastSearchKey = normalizeTerms(rawMark).join(' ').toLowerCase();
            if (!hasExplicitPageParam) {
              activateMatch(0);
            } else {
              updateStatus();
            }
            observer.disconnect();
          }
        }, 250);
      } else {
        lastSearchKey = normalizeTerms(rawMark).join(' ').toLowerCase();
        if (!hasExplicitPageParam) {
          activateMatch(0);
        } else {
          updateStatus();
        }
      }
    }
  })();
