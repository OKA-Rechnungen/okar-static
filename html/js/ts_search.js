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
    query_by: 'full_text,title,rec_id',
    highlight_full_fields: 'full_text,title',
    sort_by: 'title:asc,rec_id:asc',
  },
});

var searchState = { fuzzySearch: false };

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
  searchClient: typesenseInstantsearchAdapter.searchClient,
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

    var link = item.id;
    if (markValue) {
      var separator = link.indexOf('?') === -1 ? '?' : '&';
      link = link + separator + 'mark=' + encodeURIComponent(markValue);
    }

    return Object.assign({}, item, { link: link });
  });

  // Volltextsuche: avoid multiple rows per document by default.
  // Keep the first (best-ranked) hit per rec_id.
  var seenRecIds = Object.create(null);
  var dedupedByDocument = [];
  withLinks.forEach(function (item) {
    var recId = item.rec_id || '';
    if (!recId) {
      dedupedByDocument.push(item);
      return;
    }
    if (seenRecIds[recId]) {
      return;
    }
    seenRecIds[recId] = true;
    dedupedByDocument.push(item);
  });

  return dedupedByDocument;
}

var connectHits = instantsearch.connectors.connectHits;

var renderHitsTable = function (renderOptions, isFirstRender) {
  var container = document.querySelector(renderOptions.widgetParams.container);
  if (!container) {
    return;
  }

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
};

var customHitsTable = connectHits(renderHitsTable);

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
        helper.setQueryParameter('typoTolerance', searchState.fuzzySearch ? 'true' : 'false');
        var hasQuery = (helper.state.query || '').trim().length > 0;
        if (hasQuery || hasActiveRefinements(helper.state)) {
          helper.search();
        }
      });
    },
  },

  instantsearch.widgets.searchBox({
    container: '#searchbox',
    placeholder: 'Suche im Volltext',
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

  instantsearch.widgets.currentRefinements({
    container: '#current-refinements',
    cssClasses: {
      delete: 'btn-close',
    },
    transformItems: function (items) {
      return items.map(function (item) {
        var refinements = (item.refinements || []).map(function (ref) {
          if (item.attribute === 'beilage_present') {
            return Object.assign({}, ref, {
              label: formatBeilageValue(ref.value),
            });
          }
          return ref;
        });
        return Object.assign({}, item, {
          label: renameLabel(item.label),
          refinements: refinements,
        });
      });
    },
  }),

  customHitsTable({
    container: '#hits',
  }),

  instantsearch.widgets.pagination({
    container: '#pagination',
    padding: 2,
    cssClasses: {
      list: 'pagination mb-0',
      item: 'page-item',
      link: 'page-link',
    },
  }),

  instantsearch.widgets.panel({
    templates: { header: 'Jahr' },
  })(instantsearch.widgets.rangeInput)({
    container: '#refinement-range-year',
    attribute: 'year',
    templates: {
      separatorText: 'bis',
      submitText: 'Anwenden',
    },
    cssClasses: {
      form: 'd-flex align-items-center gap-2',
      input: 'form-control',
      separator: 'text-muted small',
      submit: 'btn btn-outline-secondary btn-sm',
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
    hitsPerPage: 12,
    attributesToSnippet: ['full_text:50'],
    snippetEllipsisText: '...',
    typoTolerance: 'false',
  }),
]);

search.start();

if (initialQuery) {
  var navbarSearchInput = document.getElementById('navbar-search');
  if (navbarSearchInput && !navbarSearchInput.value) {
    navbarSearchInput.value = initialQuery;
  }
}
