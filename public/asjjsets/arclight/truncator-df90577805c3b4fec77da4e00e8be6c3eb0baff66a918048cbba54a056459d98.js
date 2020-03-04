Blacklight.onLoad(function () {
  'use strict';

  // Any element on page load
  $('[data-arclight-truncate="true"]').each(function (i, e) {
    $(e).responsiveTruncate({
      more: "view more ▶",
      less: "view less ▼"
    });
  });

  // When elements get loaded from hierarchy
  $('.al-contents, .context-navigator').on('navigation.contains.elements', function (e) {
    $('a[data-toggle="tab"]').on('shown.bs.tab', function () {
      $('[data-arclight-truncate="true"]').each(function (_, el) {
        $(el).responsiveTruncate({
          more: "view more ▶",
          less: "view less ▼"
        });
      });
    });
    $(e.target).find('[data-arclight-truncate="true"]').each(function (_, el) {
      $(el).responsiveTruncate({
        more: "view more ▶",
        less: "view less ▼"
      });
    });
  });
});
