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
    group_by: 'rec_id',
    // Fetch multiple pages per record so we can avoid using the cover (p=1)
    // as thumbnail if later pages exist.
    group_limit: 50,
    sort_by: 'title:asc',
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

function isBetterTocPage(candidatePage, currentPage) {
  // Prefer inside pages over the cover (p=1), then choose the smallest page.
  var candidate = Number.isFinite(candidatePage) ? candidatePage : Number.MAX_SAFE_INTEGER;
  var current = Number.isFinite(currentPage) ? currentPage : Number.MAX_SAFE_INTEGER;

  var candidateIsCover = candidate <= 1;
  var currentIsCover = current <= 1;

  if (candidateIsCover !== currentIsCover) {
    return !candidateIsCover;
  }

  return candidate < current;
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

function createOkarPaginationWidget(containerSelector) {
  var nav = {
    container: null,
    wrapper: null,
    numberContainer: null,
    pageInputWrapper: null,
    pageInput: null,
    pageTotalLabel: null,
    start: null,
    first: null,
    prev: null,
    next: null,
    last: null,
    end: null,
    refine: null,
    currentIndex: 0,
    totalPages: 0,
  };

  function ensureNoSpinStyles() {
    if (document.getElementById('okar-page-input-style')) {
      return;
    }
    var styleEl = document.createElement('style');
    styleEl.id = 'okar-page-input-style';
    styleEl.textContent =
      '.page-input-no-spin { -moz-appearance: textfield; appearance: textfield; } ' +
      '.page-input-no-spin::-webkit-outer-spin-button, .page-input-no-spin::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }';
    document.head.appendChild(styleEl);
  }

  function createNavButton(label, onClick) {
    var button = document.createElement('button');
    button.type = 'button';
    button.className = 'btn btn-sm btn-outline-secondary';
    button.textContent = label;
    button.addEventListener('click', onClick);
    return button;
  }

  function showPageByIndex(targetIndex) {
    if (typeof nav.refine !== 'function') {
      return;
    }
    var clamped = Math.min(Math.max(targetIndex, 0), Math.max(nav.totalPages - 1, 0));
    nav.refine(clamped);

    // Ensure newly rendered hit links get mark= applied.
    if (typeof window !== 'undefined' && typeof window.updateHeaderUrl === 'function') {
      window.updateHeaderUrl();
    }
  }

  function renderNumberButtons() {
    if (!nav.numberContainer) {
      return;
    }

    var container = nav.numberContainer;
    container.innerHTML = '';
    if (nav.pageInputWrapper) {
      container.appendChild(nav.pageInputWrapper);
    }
  }

  function updateNavState() {
    if (!nav.container) {
      return;
    }

    var totalPages = nav.totalPages;
    var currentIndex = nav.currentIndex;
    var atStart = currentIndex <= 0;
    var atEnd = totalPages <= 1 || currentIndex >= totalPages - 1;

    renderNumberButtons();

    if (nav.start) {
      nav.start.disabled = atStart;
    }

    if (nav.first) {
      nav.first.disabled = atStart;
    }

    if (nav.prev) {
      nav.prev.disabled = atStart;
    }

    if (nav.next) {
      nav.next.disabled = atEnd;
    }

    if (nav.last) {
      nav.last.disabled = atEnd;
    }

    if (nav.end) {
      nav.end.disabled = atEnd;
    }

    if (nav.pageInput) {
      nav.pageInput.max = String(Math.max(totalPages, 1));
      nav.pageInput.value = String(currentIndex + 1);
    }

    if (nav.pageTotalLabel) {
      nav.pageTotalLabel.textContent = '/ ' + String(Math.max(totalPages, 0));
    }
  }

  function ensureStructure(root) {
    if (nav.container) {
      return;
    }
    ensureNoSpinStyles();

    nav.container = document.createElement('nav');
    nav.container.className =
      'page-navigation d-flex flex-wrap align-items-center justify-content-center gap-2 mb-3 w-100 text-center';
    nav.container.setAttribute('aria-label', 'Seiten-Navigation');

    nav.wrapper = document.createElement('div');
    nav.wrapper.className = 'd-flex flex-wrap align-items-center justify-content-center gap-2';
    nav.container.appendChild(nav.wrapper);

    nav.start = createNavButton('⏮︎', function () {
      showPageByIndex(0);
    });
    nav.wrapper.appendChild(nav.start);

    nav.first = createNavButton('⏪︎', function () {
      showPageByIndex(nav.currentIndex - 10);
    });
    nav.wrapper.appendChild(nav.first);

    nav.prev = createNavButton('◀︎', function () {
      showPageByIndex(nav.currentIndex - 1);
    });
    nav.wrapper.appendChild(nav.prev);

    nav.numberContainer = document.createElement('div');
    nav.numberContainer.className = 'page-number-container d-flex flex-wrap align-items-center gap-2';
    nav.wrapper.appendChild(nav.numberContainer);

    nav.pageInputWrapper = document.createElement('div');
    nav.pageInputWrapper.className = 'd-flex align-items-center gap-1';

    var pageInputLabel = document.createElement('label');
    pageInputLabel.className = 'visually-hidden';
    pageInputLabel.setAttribute('for', 'okar-page-jump');
    pageInputLabel.textContent = 'Seite eingeben';
    nav.pageInputWrapper.appendChild(pageInputLabel);

    nav.pageInput = document.createElement('input');
    nav.pageInput.type = 'number';
    nav.pageInput.min = '1';
    nav.pageInput.max = '1';
    nav.pageInput.value = '1';
    nav.pageInput.id = 'okar-page-jump';
    nav.pageInput.className = 'form-control form-control-sm page-input-no-spin';
    nav.pageInput.style.width = '3.25rem';
    nav.pageInput.setAttribute('aria-label', 'Seite wählen');
    nav.pageInput.inputMode = 'numeric';
    nav.pageInput.step = '1';

    function handlePageInput() {
      var value = parseInt(nav.pageInput.value, 10);
      if (Number.isNaN(value)) {
        nav.pageInput.value = String(nav.currentIndex + 1);
        return;
      }
      value = Math.min(Math.max(value, 1), Math.max(nav.totalPages, 1));
      showPageByIndex(value - 1);
    }

    nav.pageInput.addEventListener('change', handlePageInput);
    nav.pageInput.addEventListener('keydown', function (event) {
      if (event.key === 'Enter') {
        handlePageInput();
      }
    });

    nav.pageInputWrapper.appendChild(nav.pageInput);

    nav.pageTotalLabel = document.createElement('span');
    nav.pageTotalLabel.className = 'text-muted small';
    nav.pageTotalLabel.textContent = '/ 0';
    nav.pageInputWrapper.appendChild(nav.pageTotalLabel);

    nav.next = createNavButton('▶︎', function () {
      showPageByIndex(nav.currentIndex + 1);
    });
    nav.wrapper.appendChild(nav.next);

    nav.last = createNavButton('⏩︎', function () {
      showPageByIndex(nav.currentIndex + 10);
    });
    nav.wrapper.appendChild(nav.last);

    nav.end = createNavButton('⏭︎', function () {
      showPageByIndex(nav.totalPages - 1);
    });
    nav.wrapper.appendChild(nav.end);

    root.innerHTML = '';
    root.appendChild(nav.container);
  }

  var widget = instantsearch.connectors.connectPagination(function (renderOptions, isFirstRender) {
    var root =
      typeof containerSelector === 'string'
        ? document.querySelector(containerSelector)
        : containerSelector;
    if (!root) {
      return;
    }

    if (isFirstRender) {
      ensureStructure(root);
    }

    nav.refine = renderOptions.refine;
    nav.totalPages = renderOptions.nbPages || 0;
    nav.currentIndex = Math.max(renderOptions.currentRefinement || 0, 0);

    // Hide the whole control when there is nothing to paginate.
    if (nav.container) {
      nav.container.style.display = nav.totalPages > 1 ? '' : 'none';
    }

    updateNavState();
  });

  return widget({});
}

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
        '  <h5 class="ts-hit-title"><a href="{{link}}">{{{display_title_highlight}}}</a></h5>',
        '  <div class="ts-hit-body row g-3 align-items-start">',
        '    {{#thumbnail}}',
        '    <div class="col-12 col-md-12 col-lg-12 ts-hit-thumbnail">',
        '      <a href="{{link}}" aria-label="Seitenvorschau öffnen">',
        '        <img src="{{thumbnail}}" alt="Seitenvorschau" loading="lazy" class="img-fluid rounded shadow-sm" />',
        '      </a>',
        '    </div>',
        '    {{/thumbnail}}',
        '    <div class="col ts-hit-text">',
        '      {{#beilage_text}}<p class="mt-3 mb-0"><strong>Inhalt:</strong> {{beilage_text}}</p>{{/beilage_text}}',
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
        if (isBetterTocPage(candidatePage, currentPage)) {
          seenByRecId[recId] = item;
        }
      });

      return orderedRecIds.map(function (recId) {
        var sourceItem = seenByRecId[recId];
        var resolvedLink = sourceItem && sourceItem.id ? String(sourceItem.id) : '';
        if (!resolvedLink) {
          resolvedLink = recId.replace(/\.xml$/i, '.html') + '?p=2';
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

        var displayYear = getYear(sourceItem.year);
        if (displayYear) {
          plainTitle = 'Oberkammeramtsrechnung | ' + displayYear;
        }

        var displayHighlight = stripPageSuffix(highlightTitle);
        if (!displayHighlight) {
          displayHighlight = plainTitle;
        }

        if (displayYear) {
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

  createOkarPaginationWidget('#pagination'),

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
    templates: { header: 'Inhalt' },
  })(instantsearch.widgets.toggleRefinement)({
    container: '#refinement-list-beilage',
    attribute: 'beilage_present',
    on: true,
    templates: {
      labelText: function () {
        return 'Nur Einträge mit Inhalt anzeigen';
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
