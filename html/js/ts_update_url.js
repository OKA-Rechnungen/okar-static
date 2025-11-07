var tsInput = null;

function findInstantSearchInput() {
  return document.querySelector('#searchbox input[type="search"], .ais-SearchBox-input');
}

function updateHeaderUrl() {
  if (!tsInput) {
    return;
  }

  setTimeout(function () {
    var urlToUpdate = document.querySelectorAll('.ais-Hits-item h5 a');
    var tsInputVal = tsInput ? tsInput.value : '';
    var encodedMark = encodeURIComponent(tsInputVal || '');

    urlToUpdate.forEach(function (el) {
      var urlToUpdateHref = el.getAttribute('href');
      if (!urlToUpdateHref) {
        return;
      }
      if (urlToUpdateHref.includes('mark=')) {
        var newUrlMarked = urlToUpdateHref.replace(/([?&]mark=)[^&]*/g, '$1' + encodedMark);
        el.setAttribute('href', newUrlMarked);
      } else {
        var separator = urlToUpdateHref.indexOf('?') === -1 ? '?' : '&';
        var newUrl = urlToUpdateHref + separator + 'mark=' + encodedMark;
        el.setAttribute('href', newUrl);
      }
    });

    listenToPagination();
  }, 500);
}

function listenToPagination() {
  setTimeout(function () {
    var tsPagination = document.querySelectorAll('.ais-Pagination-link');
    [].forEach.call(tsPagination, function (opt) {
      opt.removeEventListener('click', updateHeaderUrl);
      opt.addEventListener('click', updateHeaderUrl);
    });
  }, 100);
}

function initTsInput() {
  tsInput = findInstantSearchInput();
  if (!tsInput) {
    setTimeout(initTsInput, 200);
    return;
  }

  tsInput.addEventListener('input', updateHeaderUrl);
  listenToPagination();
}

initTsInput();
