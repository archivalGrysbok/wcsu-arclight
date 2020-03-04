Blacklight.onLoad(function () {
  'use strict';

  var onlineContentTabSelector = '[data-arclight-online-content-tab="true"]';
  var oEmbedViewerSelector = '[data-arclight-oembed="true"]';

  $(onlineContentTabSelector).on('shown.bs.tab', function () {
    var $viewerElements = $(oEmbedViewerSelector);
    if ($viewerElements.length === 0) {
      return;
    }

    $viewerElements.each(function (i, element) {
      var $el = $(element);
      var loadedAttr = $el.attr('loaded');
      var data = $el.data();
      var resourceUrl = data.arclightOembedUrl;
      if (loadedAttr && loadedAttr === 'loaded') {
        return;
      }

      $.ajax({
        url: resourceUrl,
        dataType: 'html'
      }).done(function (response) {
        var links = $('<div>' + response.match(/<link .*>/g).join('') + '</div>'); // Parse out link elements so image assets are not loaded
        var oEmbedEndPoint = links.find('link[rel="alternate"][type="application/json+oembed"]').prop('href');

        if (!oEmbedEndPoint || oEmbedEndPoint.length === 0) {
          return;
        }

        $.ajax({
          url: oEmbedEndPoint
        }).done(function (oEmbedResponse) {
          if (oEmbedResponse.html) {
            $el.hide()
               .html(oEmbedResponse.html)
               .fadeIn(500);
            $el.attr('loaded', 'loaded');
          }
        });
      });
    });
  });
});
