'use strict';

var project_collection_name = 'OKAR';
var SEARCH_QUERY_FIELDS = 'full_text,title,rec_id';
var SEARCH_NUM_TYPOS_OFF = '0,0,0';
var SEARCH_NUM_TYPOS_ON = '2,2,2';
var rawSearchClient = null;
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
    query_by: SEARCH_QUERY_FIELDS,
    highlight_full_fields: 'full_text,title',
    filter_by: 'record_kind:=page',
    sort_by: 'title:asc,rec_id:asc',
  },
});

rawSearchClient = typesenseInstantsearchAdapter.searchClient;

var searchState = { fuzzySearch: false };

function shouldForceExactSingleTokenQuery(query) {
  var trimmed = String(query || '').trim();
  if (!trimmed) {
    return false;
  }
  if (trimmed.indexOf('"') !== -1) {
    return false;
  }
  return !/\s/.test(trimmed);
}

function buildOutboundQuery(query) {
  var trimmed = String(query || '').trim();
  if (!trimmed) {
    return trimmed;
  }
  if (searchState.fuzzySearch) {
    return trimmed;
  }
  if (shouldForceExactSingleTokenQuery(trimmed)) {
    return '"' + trimmed + '"';
  }
  return trimmed;
}

var searchClient = {
  search: function (requests) {
    var rewrittenRequests = (requests || []).map(function (request) {
      var params = Object.assign({}, request.params || {});
      if (typeof params.query === 'string') {
        params.query = buildOutboundQuery(params.query);
      }
      return Object.assign({}, request, { params: params });
    });
    return rawSearchClient.search(rewrittenRequests);
  },
};

function getInitialQueryFromUrl() {
  try {
    var url = new URL(window.location.href);
    var value = url.searchParams.get('q');
    if (typeof value === 'string') {
      return value.trim();
    }
  } catch (error) {
    // Ignore URL parsing issues and fall back to empty query.
  }
  return '';
}

var initialQuery = getInitialQueryFromUrl();
var initialUiState = {};
if (initialQuery) {
  initialUiState[project_collection_name] = { query: initialQuery };
}

function hasActiveRefinements(state) {
  var disjunctive = state.disjunctiveFacetsRefinements || {};
  var conjunctive = state.facetsRefinements || {};
  var numeric = state.numericRefinements || {};
  var hierarchical = state.hierarchicalFacetsRefinements || {};

  var hasDisjunctive = Object.keys(disjunctive).some(function (key) {
    return disjunctive[key] && disjunctive[key].length > 0;
  });
  var hasConjunctive = Object.keys(conjunctive).some(function (key) {
    return conjunctive[key] && conjunctive[key].length > 0;
  });
  var hasNumeric = Object.keys(numeric).some(function (key) {
    return Object.keys(numeric[key] || {}).length > 0;
  });
  var hasHierarchical = Object.keys(hierarchical).length > 0;

  return hasDisjunctive || hasConjunctive || hasNumeric || hasHierarchical;
}

function isNumeric(value) {
  return /^-?\d+(\.\d+)?$/.test(String(value));
}

function getYear(value) {
  if (isNumeric(value)) {
    return String(Math.trunc(Number(value)));
  }
  return value || '';
}

function renameLabel(label) {
  if (label === 'year') {
    return 'Jahr';
  }
  if (label === 'kaemmerer') {
    return 'Kämmerer';
  }
  if (label === 'beilage_present') {
    return 'Inhalt';
  }
  return label;
}

function formatBeilageValue(value) {
  var normalized;
  if (typeof value === 'boolean') {
    normalized = value;
  } else {
    normalized = String(value).toLowerCase() === 'true';
  }
  return normalized ? 'vorhanden' : 'nicht vorhanden';
}

function stripPageSuffix(text) {
  if (!text) {
    return '';
  }
  return String(text).replace(/\s*·\s*Seite[\s\S]*$/i, '').trim();
}

function fallbackTitle(recId) {
  if (!recId) {
    return '';
  }
  return String(recId).replace(/\.xml$/i, '');
}

var search = instantsearch({
  indexName: project_collection_name,
  searchClient: searchClient,
  // Don't run a search on empty query by default, but ensure that a query
  // provided via the URL (search.html?q=...) actually triggers a search.
  searchFunction: function (helper) {
    var query = helper.state.query || '';
    if (!query.trim() && initialQuery && initialQuery.trim()) {
      helper.setQuery(initialQuery).search();
      return;
    }
    if (query.trim().length > 0 || hasActiveRefinements(helper.state)) {
      helper.search();
    }
  },
  initialUiState: initialUiState,
});

function escapeHtml(text) {
  return String(text || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function escapeAttr(text) {
  return escapeHtml(text);
}

function parsePageFromLink(link) {
  var match = /[?&]p=(\d+)/.exec(String(link || ''));
  if (!match) {
    return '';
  }
  return match[1] || '';
}

function getSnippetHtml(item) {
  if (
    item &&
    item._snippetResult &&
    item._snippetResult.full_text &&
    typeof item._snippetResult.full_text.value === 'string'
  ) {
    return item._snippetResult.full_text.value;
  }
  if (item && item.highlight && item.highlight.full_text && typeof item.highlight.full_text.value === 'string') {
    return item.highlight.full_text.value;
  }
  return '';
}

function transformSearchHits(items) {
  var helper = search && search.helper ? search.helper : null;
  var fallbackQuery = '';
  if (helper && helper.state && typeof helper.state.query === 'string') {
    fallbackQuery = helper.state.query.trim();
  }

  function normalizeSnippet(raw) {
    if (!raw) {
      return '';
    }
    var text = String(raw)
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .trim()
      .toLowerCase();
    return text;
  }

  var uniqueItems = [];
  var seenSnippetsPerRecord = Object.create(null);

  (items || []).forEach(function (item) {
    var recordKey = item.rec_id || item.id || '';
    if (!recordKey) {
      uniqueItems.push(item);
      return;
    }

    var snippetSource = getSnippetHtml(item) || item.full_text || '';
    var snippetKey = normalizeSnippet(snippetSource);
    if (!snippetKey) {
      uniqueItems.push(item);
      return;
    }

    if (!seenSnippetsPerRecord[recordKey]) {
      seenSnippetsPerRecord[recordKey] = Object.create(null);
    }

    if (seenSnippetsPerRecord[recordKey][snippetKey]) {
      return;
    }

    seenSnippetsPerRecord[recordKey][snippetKey] = true;
    uniqueItems.push(item);
  });

  function collectMatchedWords(result) {
    if (!result) {
      return [];
    }
    var words = [];
    if (Array.isArray(result.matchedWords)) {
      words = words.concat(result.matchedWords);
    }
    if (Array.isArray(result.matched_tokens)) {
      words = words.concat(result.matched_tokens);
    }
    return words;
  }

  function dedupeTerms(terms) {
    var seen = Object.create(null);
    return terms
      .map(function (term) {
        return String(term || '').trim();
      })
      .filter(function (term) {
        if (!term) {
          return false;
        }
        var key = term.toLowerCase();
        if (seen[key]) {
          return false;
        }
        seen[key] = true;
        return true;
      });
  }

  var withLinks = uniqueItems.map(function (item) {
    var markTerms = [];
    if (item._snippetResult) {
      if (item._snippetResult.full_text) {
        markTerms = markTerms.concat(collectMatchedWords(item._snippetResult.full_text));
      }
      if (item._snippetResult.title) {
        markTerms = markTerms.concat(collectMatchedWords(item._snippetResult.title));
      }
    }
    if (!markTerms.length && item.highlight) {
      if (item.highlight.full_text) {
        markTerms = markTerms.concat(collectMatchedWords(item.highlight.full_text));
      }
      if (item.highlight.title) {
        markTerms = markTerms.concat(collectMatchedWords(item.highlight.title));
      }
    }
    if (!markTerms.length && fallbackQuery) {
      markTerms = fallbackQuery.split(/\s+/);
    }

    var uniqTerms = dedupeTerms(markTerms);
    var markValue = uniqTerms.join(' ');

    var link = item.href || item.id;
    if (markValue) {
      var separator = link.indexOf('?') === -1 ? '?' : '&';
      link = link + separator + 'mark=' + encodeURIComponent(markValue);
    }

    return Object.assign({}, item, { link: link });
  });

  // Volltextsuche: deduplication now handled server-side via group_by.
  return withLinks;
}

var connectInfiniteHits = instantsearch.connectors.connectInfiniteHits;
var searchInfiniteHitsShowMore = null;
var searchInfiniteHitsIsLastPage = true;

var renderHitsTable = function (renderOptions, isFirstRender) {
  var container = document.querySelector(renderOptions.widgetParams.container);
  if (!container) {
    return;
  }

   searchInfiniteHitsShowMore = renderOptions.showMore;
   searchInfiniteHitsIsLastPage = renderOptions.isLastPage;

  var query = '';
  if (renderOptions && renderOptions.results && typeof renderOptions.results.query === 'string') {
    query = renderOptions.results.query;
  }
  if (!query && renderOptions && renderOptions.instantSearchInstance && renderOptions.instantSearchInstance.helper) {
    query = renderOptions.instantSearchInstance.helper.state.query || '';
  }
  if (!query) {
    query = initialQuery || '';
  }
  var hits = transformSearchHits(renderOptions.hits || []);

  if (!hits.length) {
    container.innerHTML = 'Keine Resultate für <q>' + escapeHtml(query) + '</q>';
    window.dispatchEvent(new CustomEvent('searchHitsRendered'));
    return;
  }

  var rowsHtml = hits
    .map(function (hit) {
      var link = hit.link || hit.id || '';
      var page = parsePageFromLink(link);
      var documentTitle = stripPageSuffix(hit.title || '') || fallbackTitle(hit.rec_id || '');
      var snippetHtml = getSnippetHtml(hit);

      return (
        '<tr>' +
        '<td class="ts-results-doc"><a href="' +
        escapeAttr(link) +
        '" target="_blank" rel="noopener">' +
        escapeHtml(documentTitle) +
        '</a></td>' +
        '<td class="ts-results-page">' +
        (page ? escapeHtml(page) : '–') +
        '</td>' +
        '<td class="ts-results-hit">' +
        (snippetHtml || '') +
        '</td>' +
        '</tr>'
      );
    })
    .join('');

  container.innerHTML =
    '<div class="table-responsive">' +
    '<table class="table table-hover ts-results-table">' +
    '<thead><tr><th>Dokument</th><th>Seite</th><th>Treffer</th></tr></thead>' +
    '<tbody>' +
    rowsHtml +
    '</tbody></table></div>';

  window.dispatchEvent(new CustomEvent('searchHitsRendered'));
};

var customHitsTable = connectInfiniteHits(renderHitsTable);

search.addWidgets([
  {
    init: function (initOptions) {
      var container = document.querySelector('#fuzzy-toggle');
      if (!container) {
        return;
      }
      var helper = initOptions.helper;
      var checkbox = document.createElement('input');
      checkbox.type = 'checkbox';
      checkbox.id = 'fuzzy-search';
      checkbox.className = 'form-check-input';
      checkbox.checked = searchState.fuzzySearch;

      var label = document.createElement('label');
      label.htmlFor = 'fuzzy-search';
      label.className = 'form-check-label';
      label.textContent = 'Unscharfe Suche aktivieren';

      var hint = document.createElement('div');
      hint.className = 'form-text';
      hint.textContent = 'Toleriert Tippfehler und ähnliche Schreibweisen.';

      var wrapper = document.createElement('div');
      wrapper.className = 'form-check';
      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);
      wrapper.appendChild(hint);
      container.appendChild(wrapper);

      checkbox.addEventListener('change', function (event) {
        searchState.fuzzySearch = Boolean(event.target.checked);
        helper.setQueryParameter('numTypos', searchState.fuzzySearch ? SEARCH_NUM_TYPOS_ON : SEARCH_NUM_TYPOS_OFF);
        var hasQuery = (helper.state.query || '').trim().length > 0;
        if (hasQuery || hasActiveRefinements(helper.state)) {
          helper.search();
        }
      });
    },
  },

  instantsearch.widgets.searchBox({
    container: '#searchbox',
    placeholder: 'Suche…',
    autofocus: false,
    showReset: false,
    showSubmit: false,
    showLoadingIndicator: false,
    cssClasses: {
      form: 'w-100',
      input: 'form-control form-control-sm navbar-search',
      submit: 'btn btn-outline-secondary',
      reset: 'btn btn-outline-secondary',
    },
  }),

  instantsearch.widgets.searchBox({
    container: '#searchbox-mobile',
    placeholder: 'Textsuche',
    autofocus: false,
    showReset: true,
    showSubmit: true,
    showLoadingIndicator: false,
    cssClasses: {
      form: 'w-100',
      input: 'form-control',
      submit: 'btn btn-outline-secondary',
      reset: 'btn btn-outline-secondary',
    },
  }),

  instantsearch.widgets.stats({
    container: '#stats-container',
    templates: {
      text: function (data) {
        if (data.hasNoResults) {
          return 'Keine Treffer gefunden.';
        }
        return data.nbHits + ' Treffer in ' + data.processingTimeMS + ' ms';
      },
    },
  }),

  instantsearch.widgets.clearRefinements({
    container: '#clear-refinements',
    templates: {
      resetLabel: 'Filter zurücksetzen',
    },
    cssClasses: {
      button: 'btn btn-outline-secondary btn-sm',
    },
  }),

  customHitsTable({
    container: '#hits',
  }),

  instantsearch.widgets.rangeSlider({
    container: '#refinement-range-year',
    attribute: 'year',
    tooltips: {
      format: function(rawValue) { return getYear(rawValue); },
    },
  }),

  instantsearch.widgets.panel({
    templates: { header: 'Kämmerer' },
  })(instantsearch.widgets.refinementList)({
    container: '#refinement-list-kaemmerer',
    attribute: 'kaemmerer',
    operator: 'and',
    cssClasses: {
      list: 'list-unstyled',
      label: 'form-check form-check-inline align-items-start',
      checkbox: 'form-check-input',
      labelText: 'form-check-label',
    },
  }),

  instantsearch.widgets.panel({
    templates: { header: 'Beilage' },
  })(instantsearch.widgets.toggleRefinement)({
    container: '#refinement-list-beilage',
    attribute: 'beilage_present',
    on: true,
    templates: {
      labelText: function () {
        return 'Nur Einträge mit Beilage anzeigen';
      },
    },
    cssClasses: {
      root: 'form-check',
      label: 'form-check-label d-flex align-items-center gap-2',
      checkbox: 'form-check-input',
      labelText: 'mb-0',
      count: 'd-none',
    },
  }),

  instantsearch.widgets.configure({
    hitsPerPage: 20,
    attributesToSnippet: ['full_text:50'],
    snippetEllipsisText: '...',
    numTypos: SEARCH_NUM_TYPOS_OFF,
  }),
]);

search.start();

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
    if (!searchInfiniteHitsShowMore || searchInfiniteHitsIsLastPage) {
      return;
    }
    loadMoreBtn.disabled = true;
    searchInfiniteHitsShowMore();
  });

  var label = document.createElement('span');
  label.className = 'load-more-label';
  label.textContent = 'MEHR LADEN';

  loadMoreWrapper.appendChild(loadMoreBtn);
  loadMoreWrapper.appendChild(label);
  paginationEl.innerHTML = '';
  paginationEl.appendChild(loadMoreWrapper);

  function updateButtonVisibility() {
    var displayedHits = document.querySelectorAll('#hits tbody tr').length;
    var hasMore = displayedHits > 0 && !searchInfiniteHitsIsLastPage;
    loadMoreBtn.disabled = !hasMore;
    loadMoreWrapper.style.display = hasMore ? '' : 'none';
  }

  window.addEventListener('searchHitsRendered', updateButtonVisibility);

  var hitsEl = document.getElementById('hits');
  if (hitsEl) {
    var observer = new MutationObserver(updateButtonVisibility);
    observer.observe(hitsEl, { childList: true, subtree: true });
  }

  setTimeout(updateButtonVisibility, 300);
  setTimeout(updateButtonVisibility, 800);
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

if (initialQuery) {
  var navbarSearchInput = document.getElementById('navbar-search');
  if (navbarSearchInput && !navbarSearchInput.value) {
    navbarSearchInput.value = initialQuery;
  }
}
