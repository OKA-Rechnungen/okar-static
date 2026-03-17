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
    query_by: 'title,full_text',
    highlight_full_fields: 'title',
    group_by: 'rec_id',
    group_limit: 1,
    sort_by: 'title:asc',
  },
});

function getInitialQueryFromUrl() {
  try {
    var url = new URL(window.location.href);
    var value = url.searchParams.get('q');
    if (typeof value === 'string') {
      return value.trim();
    }
  } catch (error) {
    // ignore url parsing issues
  }
  return '';
}

var initialQuery = getInitialQueryFromUrl();
var initialUiState = {};
if (initialQuery) {
  initialUiState[project_collection_name] = { query: initialQuery };
}

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

var search = instantsearch({
  indexName: project_collection_name,
  searchClient: typesenseInstantsearchAdapter.searchClient,
  initialUiState: initialUiState,
});

// Custom infiniteHits using connector
var infiniteHitsShowMore = null;
var infiniteHitsIsLastPage = true;

var connectInfiniteHits = instantsearch.connectors.connectInfiniteHits;

var renderInfiniteHits = function(renderOptions, isFirstRender) {
  var hits = renderOptions.hits;
  var showMore = renderOptions.showMore;
  var isLastPage = renderOptions.isLastPage;
  var widgetParams = renderOptions.widgetParams;
  var container = document.querySelector(widgetParams.container);

  infiniteHitsShowMore = showMore;
  infiniteHitsIsLastPage = isLastPage;

  if (!container) return;

  // Deduplicate by rec_id, keep the best page
  var seenByRecId = Object.create(null);
  var orderedRecIds = [];

  hits.forEach(function(item) {
    var recId = item.rec_id || '';
    if (!recId) return;
    if (!seenByRecId[recId]) {
      seenByRecId[recId] = item;
      orderedRecIds.push(recId);
      return;
    }
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
    var resolvedLink = recId.replace(/\.xml$/i, '.html');
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

  var hitsHtml = processedHits.length === 0
    ? '<div class="ais-InfiniteHits-empty">Keine Resultate für diese Suche</div>'
    : '<ol class="ais-InfiniteHits-list">' + processedHits.map(function(hit) {
        var titleUpper = String(hit.display_title_plain).toLocaleUpperCase('de-DE');
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
  toggle.addEventListener('change', function() {
    hitsContainer.classList.toggle('detail-view', toggle.checked);
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
  loadMoreBtn.className = 'site-button load-more-btn';
  /* loadMoreBtn.innerHTML = '⏬' */
	/*'<i class="bi bi-chevron-double-down" aria-hidden="true"></i>'; */
  loadMoreBtn.addEventListener('click', function() {
    if (infiniteHitsShowMore) infiniteHitsShowMore();
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
