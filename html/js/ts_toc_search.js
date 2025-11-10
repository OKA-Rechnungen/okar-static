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
    // ignore url parsing issues
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
  if (label === 'signature') {
    return 'Signatur';
  }
  if (label === 'year') {
    return 'Jahr';
  }
  if (label === 'kaemmerer') {
    return 'Kämmerer';
  }
  if (label === 'beilage_present') {
    return 'Beilage';
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

function parsePageNumber(id) {
  var match = /[?&]p=(\d+)/.exec(String(id || ''));
  if (!match) {
    return Number.MAX_SAFE_INTEGER;
  }
  var parsed = parseInt(match[1], 10);
  if (Number.isNaN(parsed)) {
    return Number.MAX_SAFE_INTEGER;
  }
  return parsed;
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
  return recId.replace(/\.xml$/i, '');
}

var search = instantsearch({
  indexName: project_collection_name,
  searchClient: typesenseInstantsearchAdapter.searchClient,
  initialUiState: initialUiState,
});

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

      var wrapper = document.createElement('div');
      wrapper.className = 'form-check';
      wrapper.appendChild(checkbox);
      wrapper.appendChild(label);
      container.appendChild(wrapper);

      checkbox.addEventListener('change', function (event) {
        searchState.fuzzySearch = Boolean(event.target.checked);
        helper.setQueryParameter('typoTolerance', searchState.fuzzySearch ? 'true' : 'false');
        helper.search();
      });
    },
  },

  instantsearch.widgets.searchBox({
    container: '#searchbox',
    placeholder: 'Suche in den Editionseinheiten',
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

  instantsearch.widgets.hits({
    container: '#hits',
    templates: {
      empty: 'Keine Resultate für <q>{{ query }}</q>',
      item: [
        '<article class="ts-hit-item">',
        '  <h5 class="ts-hit-title"><a href="{{link}}" target="_blank">{{{display_title_highlight}}}</a></h5>',
        '  <div class="ts-hit-body row g-3 align-items-start">',
        '    {{#thumbnail}}',
        '    <div class="col-12 col-md-12 col-lg-12 ts-hit-thumbnail">',
        '      <a href="{{link}}" target="_blank" aria-label="Seitenvorschau in neuem Tab öffnen">',
        '        <img src="{{thumbnail}}" alt="Seitenvorschau" loading="lazy" class="img-fluid rounded shadow-sm" />',
        '      </a>',
        '    </div>',
        '    {{/thumbnail}}',
        '    <div class="col ts-hit-text">',
        '      {{#beilage_text}}<p class="mt-3 mb-0"><strong>Beilage:</strong> {{beilage_text}}</p>{{/beilage_text}}',
        '    </div>',
        '  </div>',
        '</article>',
      ].join('\n'),
    },
    transformItems: function (items) {
      var helper = search && search.helper ? search.helper : null;
      var fallbackQuery = '';
      if (helper && helper.state && typeof helper.state.query === 'string') {
        fallbackQuery = helper.state.query.trim();
      }

      var seenByRecId = Object.create(null);
      var orderedRecIds = [];

      items.forEach(function (item) {
        var recId = item.rec_id || '';
        if (!recId) {
          return;
        }
        if (!seenByRecId[recId]) {
          seenByRecId[recId] = item;
          orderedRecIds.push(recId);
          return;
        }
        var currentBest = seenByRecId[recId];
        var currentPage = parsePageNumber(currentBest.id);
        var candidatePage = parsePageNumber(item.id);
        if (currentPage === 1) {
          return;
        }
        if (candidatePage === 1 || candidatePage < currentPage) {
          seenByRecId[recId] = item;
        }
      });

      return orderedRecIds.map(function (recId) {
        var sourceItem = seenByRecId[recId];
        var resolvedLink = recId.replace(/\.xml$/i, '.html');
        if (resolvedLink.indexOf('?') === -1) {
          resolvedLink += '?p=1';
        }

        var highlightTitle = '';
        if (
          sourceItem._highlightResult &&
          sourceItem._highlightResult.title &&
          typeof sourceItem._highlightResult.title.value === 'string'
        ) {
          highlightTitle = sourceItem._highlightResult.title.value;
        }
        if (!highlightTitle && fallbackQuery && fallbackQuery.length > 0) {
          highlightTitle = stripPageSuffix(sourceItem.title || '');
        }

        var plainTitle = stripPageSuffix(sourceItem.title || '');
        if (!plainTitle) {
          plainTitle = fallbackTitle(recId);
        }

        var displayHighlight = stripPageSuffix(highlightTitle);
        if (!displayHighlight) {
          displayHighlight = plainTitle;
        }

        return Object.assign({}, sourceItem, {
          link: resolvedLink,
          display_title_highlight: displayHighlight,
          display_title_plain: plainTitle,
        });
      });
    },
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
    templates: { header: 'Signatur' },
  })(instantsearch.widgets.refinementList)({
    container: '#refinement-list-signature',
    attribute: 'signature',
    cssClasses: {
      list: 'list-unstyled',
      label: 'form-check form-check-inline align-items-start',
      checkbox: 'form-check-input',
      labelText: 'form-check-label',
    },
  }),

  instantsearch.widgets.panel({
    templates: { header: 'Jahr' },
  })(instantsearch.widgets.rangeSlider)({
    container: '#refinement-range-year',
    attribute: 'year',
    tooltips: {
      format: function (rawValue) {
        return getYear(rawValue);
      },
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
  })(instantsearch.widgets.refinementList)({
    container: '#refinement-list-beilage',
    attribute: 'beilage_present',
    transformItems: function (items) {
      return items.map(function (item) {
        return Object.assign({}, item, {
          label: formatBeilageValue(item.value),
          value: item.value,
        });
      });
    },
    cssClasses: {
      list: 'list-unstyled',
      label: 'form-check form-check-inline align-items-start',
      checkbox: 'form-check-input',
      labelText: 'form-check-label',
    },
  }),

  instantsearch.widgets.configure({
    hitsPerPage: 12,
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
