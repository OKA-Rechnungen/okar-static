'use strict';

var project_collection_name = 'OKAR';
var typesenseInstantsearchAdapter = new TypesenseInstantSearchAdapter({
  server: {
    apiKey: 'GXo33l5N2v9XbHXodWfAv68CvQLWLPWe',
    nodes: [
      {
        host: 'typesense.acdh-dev.oeaw.ac.at',
        port: '443',
        protocol: 'https',
      },
    ],
  },
  additionalSearchParameters: {
    query_by: 'title,full_text,rec_id',
    highlight_full_fields: 'title',
    filter_by: 'record_kind:=toc',
    sort_by: 'rec_id:asc',
  },
});

function renameLabel(label) {
  if (label === 'signature') return 'Signatur';
  if (label === 'year') return 'Jahr';
  if (label === 'kaemmerer') return 'Kämmerer';
  if (label === 'beilage_present') return 'Beilage';
  return label;
}

function formatBeilageValue(value) {
  var normalized = typeof value === 'boolean' ? value : String(value).toLowerCase() === 'true';
  return normalized ? 'vorhanden' : 'nicht vorhanden';
}

function parsePageNumber(id) {
  var match = /[?&]p=(\d+)/.exec(String(id || ''));
  if (!match) return Number.MAX_SAFE_INTEGER;
  var parsed = parseInt(match[1], 10);
  return Number.isNaN(parsed) ? Number.MAX_SAFE_INTEGER : parsed;
}

function stripPageSuffix(text) {
  if (!text) return '';
  return String(text).replace(/\s*·\s*Seite[\s\S]*$/i, '').trim();
}

function fallbackTitle(recId) {
  if (!recId) return '';
  return recId.replace(/\.xml$/i, '');
}

function getYear(value) {
  if (/^-?\d+(\.\d+)?$/.test(String(value))) {
    return String(Math.trunc(Number(value)));
  }
  return value || '';
}

var tocDebugEnabled = /[?&]debugToc=1(?:&|$)/.test(window.location.search) || window.localStorage.getItem('okar_toc_debug') === '1';
var tocDebugState = {
  renderCount: 0,
  lastRawHitsCount: 0,
  lastProcessedHitsCount: 0,
};

function ensureTocDebugPanel() {
  if (!tocDebugEnabled) return null;
  var panel = document.getElementById('toc-debug-panel');
  if (panel) return panel;

  panel = document.createElement('pre');
  panel.id = 'toc-debug-panel';
  panel.style.position = 'fixed';
  panel.style.left = '0';
  panel.style.right = '0';
  panel.style.bottom = '0';
  panel.style.maxHeight = '35vh';
  panel.style.overflow = 'auto';
  panel.style.margin = '0';
  panel.style.padding = '0.5rem 0.75rem';
  panel.style.background = 'rgba(0, 0, 0, 0.88)';
  panel.style.color = '#b9f6ca';
  panel.style.font = '12px/1.4 monospace';
  panel.style.zIndex = '99999';
  panel.style.whiteSpace = 'pre-wrap';
  panel.style.pointerEvents = 'none';
  panel.textContent = 'TOC debug enabled\n';
  document.body.appendChild(panel);
  return panel;
}

function tocDebugLog(message, payload) {
  if (!tocDebugEnabled) return;
  var stamp = new Date().toISOString().split('T')[1].replace('Z', '');
  if (payload !== undefined) {
    console.log('[toc-debug][' + stamp + '] ' + message, payload);
  } else {
    console.log('[toc-debug][' + stamp + '] ' + message);
  }

  var panel = ensureTocDebugPanel();
  if (!panel) return;
  var line = '[' + stamp + '] ' + message;
  if (payload !== undefined) {
    try {
      line += ' ' + JSON.stringify(payload);
    } catch (err) {
      line += ' [payload not serializable]';
    }
  }
  panel.textContent += line + '\n';
  if (panel.textContent.length > 50000) {
    panel.textContent = panel.textContent.slice(-45000);
  }
  panel.scrollTop = panel.scrollHeight;
}

function getGridColumnCount() {
  var listEl = document.querySelector('.ais-InfiniteHits-list');
  if (!listEl) return 0;
  var template = window.getComputedStyle(listEl).gridTemplateColumns || '';
  if (!template) return 0;
  return template.split(' ').filter(function(token) { return token && token !== '/'; }).length;
}

function logGridPlacement(sourceLabel) {
  if (!tocDebugEnabled) return;
  var listEl = document.querySelector('.ais-InfiniteHits-list');
  if (!listEl) {
    tocDebugLog(sourceLabel + ' grid-state', { listPresent: false });
    return;
  }
  var items = listEl.querySelectorAll('.ais-InfiniteHits-item').length;
  var columns = getGridColumnCount();
  var lastRowFill = columns > 0 ? (items % columns || columns) : 0;
  var rows = columns > 0 ? Math.ceil(items / columns) : 0;
  tocDebugLog(sourceLabel + ' grid-state', {
    listPresent: true,
    items: items,
    columns: columns,
    rows: rows,
    lastRowFill: lastRowFill,
  });
}

var search = instantsearch({
  indexName: project_collection_name,
  searchClient: typesenseInstantsearchAdapter.searchClient,
});

// Custom infiniteHits using connector
var infiniteHitsShowMore = null;
var infiniteHitsIsLastPage = true;
var tocLoadState = {
  targetVisibleCount: 20,
  awaitingShowMoreResult: false,
  lastRequestedRawHits: 0,
  lastRawHitsCount: 0,
  lastProcessedHits: [],
  lastContainer: null,
};

function renderProcessedHits(container, processedHits, visibleCount) {
  var visibleHits = processedHits.slice(0, visibleCount);
  var hitsHtml = visibleHits.length === 0
    ? '<div class="ais-InfiniteHits-empty">Keine Resultate für diese Suche</div>'
    : '<ol class="ais-InfiniteHits-list">' + visibleHits.map(function(hit) {
        return '<li class="ais-InfiniteHits-item">' +
          '<a class="toc-hit-card-link" href="' + hit.link + '" aria-label="Details zu ' + hit.display_title_plain + '">' +
          '<div class="toc-hit-card">' +
              (hit.thumbnail ? '<img class="toc-hit-image" src="' + hit.thumbnail + '" alt="Seitenvorschau" loading="lazy" />' : '<div class="toc-hit-placeholder"></div>') +
          '</div>' +
          '<div class="toc-hit-overlay">' +
            '<h4 class="toc-hit-title">' + hit.display_title_highlight + '</h4>' +
            '<ul class="toc-hit-list">' +
              '<li><span class="toc-hit-label">SIGNATUR</span><span class="toc-hit-value">' + (hit.signature || '–') + '</span></li>' +
              '<li><span class="toc-hit-label">JAHR</span><span class="toc-hit-value">' + (hit.year || '–') + '</span></li>' +
              '<li><span class="toc-hit-label">KÄMMERER</span><span class="toc-hit-value">' + (Array.isArray(hit.kaemmerer) ? hit.kaemmerer.join(', ') : hit.kaemmerer || '–') + '</span></li>' +
              (hit.beilage_text ? '<li><span class="toc-hit-label">BEILAGE</span><span class="toc-hit-value">' + hit.beilage_text + '</span></li>' : '') +
            '</ul>' +
          '</div>' +
          '</a>' +
        '</li>';
      }).join('') + '</ol>';

  container.innerHTML = '<div class="ais-InfiniteHits">' + hitsHtml + '</div>';
  window.dispatchEvent(new CustomEvent('infiniteHitsRendered'));
  window.requestAnimationFrame(function() {
    logGridPlacement('post-render');
  });
}

function requestShowMoreIfNeeded(showMore, currentRawHitsCount) {
  if (!showMore || infiniteHitsIsLastPage || tocLoadState.awaitingShowMoreResult) return false;
  tocLoadState.awaitingShowMoreResult = true;
  tocLoadState.lastRequestedRawHits = currentRawHitsCount;
  showMore();
  return true;
}

var connectInfiniteHits = instantsearch.connectors.connectInfiniteHits;

var renderInfiniteHits = function(renderOptions, isFirstRender) {
  var hits = renderOptions.hits;
  var showMore = renderOptions.showMore;
  var isLastPage = renderOptions.isLastPage;
  var results = renderOptions.results;
  var widgetParams = renderOptions.widgetParams;
  var container = document.querySelector(widgetParams.container);

  infiniteHitsShowMore = showMore;
  infiniteHitsIsLastPage = isLastPage;

  if (!container) return;

  if (hits.length < tocLoadState.lastRawHitsCount) {
    tocLoadState.targetVisibleCount = 20;
    tocLoadState.awaitingShowMoreResult = false;
    tocLoadState.lastRequestedRawHits = 0;
    tocDebugLog('state reset on new result set', {
      previousRawHits: tocLoadState.lastRawHitsCount,
      currentRawHits: hits.length,
    });
  }

  if (tocLoadState.awaitingShowMoreResult && (hits.length > tocLoadState.lastRequestedRawHits || isLastPage)) {
    tocLoadState.awaitingShowMoreResult = false;
  }

  // Deduplicate by rec_id, keep the best page
  var seenByRecId = Object.create(null);
  var orderedRecIds = [];
  var duplicateRecIds = Object.create(null);

  hits.forEach(function(item) {
    var recId = item.rec_id || '';
    if (!recId) return;
    if (!seenByRecId[recId]) {
      seenByRecId[recId] = item;
      orderedRecIds.push(recId);
      return;
    }
    duplicateRecIds[recId] = (duplicateRecIds[recId] || 1) + 1;
    var currentBest = seenByRecId[recId];
    var currentPage = parsePageNumber(currentBest.id);
    var candidatePage = parsePageNumber(item.id);
    if (currentPage === 1) return;
    if (candidatePage === 1 || candidatePage < currentPage) {
      seenByRecId[recId] = item;
    }
  });

  var processedHits = orderedRecIds.map(function(recId) {
    var sourceItem = seenByRecId[recId];
    var resolvedLink = sourceItem.href || recId.replace(/\.xml$/i, '.html');
    if (resolvedLink.indexOf('?') === -1) resolvedLink += '?p=1';

    var highlightTitle = '';
    if (sourceItem._highlightResult && sourceItem._highlightResult.title && typeof sourceItem._highlightResult.title.value === 'string') {
      highlightTitle = sourceItem._highlightResult.title.value;
    }

    var plainTitle = stripPageSuffix(sourceItem.title || '');
    if (!plainTitle) plainTitle = fallbackTitle(recId);

    var displayHighlight = stripPageSuffix(highlightTitle);
    if (!displayHighlight) displayHighlight = plainTitle;

    return {
      link: resolvedLink,
      display_title_highlight: displayHighlight,
      display_title_plain: plainTitle,
      thumbnail: sourceItem.thumbnail || '',
      beilage_text: sourceItem.beilage_text || '',
      year: sourceItem.year || '',
      kaemmerer: sourceItem.kaemmerer || '',
      signature: sourceItem.signature || ''
    };
  });

  tocDebugState.renderCount += 1;
  var duplicateEntries = Object.keys(duplicateRecIds).map(function(recId) {
    return { rec_id: recId, occurrences: duplicateRecIds[recId] };
  }).sort(function(a, b) {
    return b.occurrences - a.occurrences;
  });

  tocDebugLog('render #' + tocDebugState.renderCount, {
    isFirstRender: isFirstRender,
    resultPage: results && typeof results.page === 'number' ? results.page : null,
    resultNbPages: results && typeof results.nbPages === 'number' ? results.nbPages : null,
    resultHitsPerPage: results && typeof results.hitsPerPage === 'number' ? results.hitsPerPage : null,
    resultNbHits: results && typeof results.nbHits === 'number' ? results.nbHits : null,
    connectorIsLastPage: isLastPage,
    rawHitsCount: hits.length,
    rawHitsDelta: hits.length - tocDebugState.lastRawHitsCount,
    uniqueRecIdsCount: orderedRecIds.length,
    processedHitsCount: processedHits.length,
    processedHitsDelta: processedHits.length - tocDebugState.lastProcessedHitsCount,
    duplicateRecIdsCount: duplicateEntries.length,
    topDuplicateRecIds: duplicateEntries.slice(0, 5),
    firstThreeRecIds: orderedRecIds.slice(0, 3),
    lastThreeRecIds: orderedRecIds.slice(Math.max(orderedRecIds.length - 3, 0)),
  });
  tocDebugState.lastRawHitsCount = hits.length;
  tocDebugState.lastProcessedHitsCount = processedHits.length;

  tocLoadState.lastRawHitsCount = hits.length;
  tocLoadState.lastProcessedHits = processedHits;
  tocLoadState.lastContainer = container;

  var visibleCount = Math.min(tocLoadState.targetVisibleCount, processedHits.length);
  renderProcessedHits(container, processedHits, visibleCount);

  if (processedHits.length < tocLoadState.targetVisibleCount && !isLastPage) {
    requestShowMoreIfNeeded(showMore, hits.length);
  }
};

var customInfiniteHits = connectInfiniteHits(renderInfiniteHits);

search.addWidgets([
  instantsearch.widgets.stats({
    container: '#yearCount',
    templates: {
      text: function(data) {
        return String(data.nbHits);
      },
    },
  }),

  instantsearch.widgets.rangeSlider({
    container: '#yearSlider',
    attribute: 'year',
    tooltips: {
      format: function(rawValue) {
        return getYear(rawValue);
      },
    },
  }),

  customInfiniteHits({
    container: '#hits',
  }),

  instantsearch.widgets.clearRefinements({
    container: '#clear-refinements',
    templates: {
      resetLabel: 'Filter zurücksetzen',
    },
  }),

  instantsearch.widgets.refinementList({
    container: '#refinement-list-kaemmerer',
    attribute: 'kaemmerer',
    sortBy: ['name:asc', 'count:desc'],
    limit: 50,
    searchable: false,
  }),

  instantsearch.widgets.toggleRefinement({
    container: '#refinement-list-beilage',
    attribute: 'beilage_present',
    on: true,
    templates: {
      labelText: function() {
        return 'Nur Einträge mit Beilage anzeigen';
      },
    },
  }),

  instantsearch.widgets.configure({
    hitsPerPage: 20,
  }),
]);

search.start();

// Detail view toggle
(function initDetailViewToggle() {
  var toggle = document.getElementById('detailViewToggle');
  var hitsContainer = document.getElementById('hits');
  if (!toggle || !hitsContainer) return;

  function syncDetailView(isActive) {
    hitsContainer.classList.toggle('detail-view', isActive);
    toggle.setAttribute('aria-pressed', isActive ? 'true' : 'false');
    toggle.textContent = isActive ? 'Vorschau' : 'Detailansicht';
  }

  syncDetailView(false);

  toggle.addEventListener('click', function() {
    var isActive = toggle.getAttribute('aria-pressed') === 'true';
    syncDetailView(!isActive);
  });
})();

// Load More button
(function initLoadMoreButton() {
  var paginationEl = document.getElementById('pagination');
  if (!paginationEl) return;

  var loadMoreWrapper = document.createElement('div');
  loadMoreWrapper.className = 'load-more-wrapper';
  loadMoreWrapper.style.display = 'none';

  var loadMoreBtn = document.createElement('button');
  loadMoreBtn.type = 'button';
  loadMoreBtn.className = 'square-btn load-more-btn semitrans';
  loadMoreBtn.innerHTML = '<i class="bi bi-chevron-double-down" aria-hidden="true"></i>';
  loadMoreBtn.addEventListener('click', function() {
    tocLoadState.targetVisibleCount += 20;
    tocDebugLog('load-more click', {
      beforeDisplayedItems: document.querySelectorAll('.ais-InfiniteHits-item').length,
      beforeIsLastPage: infiniteHitsIsLastPage,
      hasShowMoreHandler: Boolean(infiniteHitsShowMore),
      targetVisibleCount: tocLoadState.targetVisibleCount,
    });

    if (tocLoadState.lastContainer && tocLoadState.lastProcessedHits.length >= tocLoadState.targetVisibleCount) {
      renderProcessedHits(
        tocLoadState.lastContainer,
        tocLoadState.lastProcessedHits,
        tocLoadState.targetVisibleCount
      );
      return;
    }

    requestShowMoreIfNeeded(infiniteHitsShowMore, tocLoadState.lastRawHitsCount);
  });

  var label = document.createElement('span');
  label.className = 'load-more-label';
  label.textContent = 'MEHR LADEN';

  loadMoreWrapper.appendChild(loadMoreBtn);
  loadMoreWrapper.appendChild(label);
  paginationEl.appendChild(loadMoreWrapper);

  function updateButtonVisibility() {
    var displayedHits = document.querySelectorAll('.ais-InfiniteHits-item').length;
    var statsEl = document.querySelector('#yearCount .ais-Stats-text');
    var totalHits = statsEl ? parseInt(statsEl.textContent, 10) : 0;

    var hasMore = displayedHits > 0 && !infiniteHitsIsLastPage;
    loadMoreBtn.disabled = !hasMore;
    loadMoreWrapper.style.display = hasMore ? '' : 'none';

    tocDebugLog('load-more visibility update', {
      displayedHits: displayedHits,
      totalHits: totalHits,
      connectorIsLastPage: infiniteHitsIsLastPage,
      hasMore: hasMore,
      buttonDisabled: loadMoreBtn.disabled,
      buttonVisible: loadMoreWrapper.style.display !== 'none',
    });
  }

  window.addEventListener('infiniteHitsRendered', updateButtonVisibility);

  var hitsEl = document.getElementById('hits');
  if (hitsEl) {
    var observer = new MutationObserver(updateButtonVisibility);
    observer.observe(hitsEl, { childList: true, subtree: true });
  }

  setTimeout(updateButtonVisibility, 500);
  setTimeout(updateButtonVisibility, 1000);
  setTimeout(updateButtonVisibility, 2000);
})();

// Scroll to top button
(function initScrollToTop() {
  var scrollBtn = document.getElementById('scrollToTopBtn');
  var siteTopInner = document.querySelector('.site-top-inner');
  var main = document.querySelector('main');
  if (!scrollBtn || !siteTopInner) return;

  var baseBottom = 0;
  var baseRight = 0;

  var topObserver = new IntersectionObserver(
    function(entries) {
      entries.forEach(function(entry) {
        scrollBtn.classList.toggle('visible', !entry.isIntersecting);
      });
    },
    { threshold: 0 }
  );

  topObserver.observe(siteTopInner);

  function updateScrollButtonPosition() {
    if (main) {
      var mainRect = main.getBoundingClientRect();
      var rightOffset = Math.max(baseRight, window.innerWidth - mainRect.right + baseRight);
      scrollBtn.style.right = rightOffset + 'px';

      var gapBelowMain = Math.max(0, window.innerHeight - mainRect.bottom);
      scrollBtn.style.bottom = (baseBottom + gapBelowMain) + 'px';
      return;
    }
    scrollBtn.style.right = baseRight + 'px';
    scrollBtn.style.bottom = baseBottom + 'px';
  }

  updateScrollButtonPosition();
  window.addEventListener('scroll', updateScrollButtonPosition, { passive: true });
  window.addEventListener('resize', updateScrollButtonPosition, { passive: true });

  scrollBtn.addEventListener('click', function() {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
})();

// Sync search query to navbar input if present
if (initialQuery) {
  var navbarSearchInput = document.getElementById('navbar-search');
  if (navbarSearchInput && !navbarSearchInput.value) {
    navbarSearchInput.value = initialQuery;
  }
}
