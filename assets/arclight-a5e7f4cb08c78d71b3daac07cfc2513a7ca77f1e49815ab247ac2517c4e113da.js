Blacklight.onLoad(function () {
  'use strict';

  $('.al-sticky-sidebar').Stickyfill();
  $('body').scrollspy({ target: '.al-sidebar-navigation-context' });
});
(function (global) {
  var CollectionNavigation;

  CollectionNavigation = {
    init: function (el, page = 1) {
      var $el = $(el);
      var data = $el.data();
      // Add a placeholder so flashes of text are not as significant
      var placeholder = '<div class="al-hierarchy-placeholder">' +
                          '<h3 class="col-md-9"></h3>' +
                          '<p class="col-md-6"></p>' +
                          '<p class="col-md-12"></p>' +
                          '<p class="col-md-3"></p>' +
                        '</div>';
      placeholder = new Array(3).join(placeholder);
      $el.html(placeholder);
      $.ajax({
        url: data.arclight.path,
        data: {
          'f[component_level_isim][]': data.arclight.level,
          'f[has_online_content_ssim][]': data.arclight.access,
          'f[collection_sim][]': data.arclight.name,
          'f[parent_ssim][]': data.arclight.parent,
          page: page,
          search_field: data.arclight.search_field,
          view: data.arclight.view || 'hierarchy'
        }
      }).done(function (response) {
        var resp = $.parseHTML(response);
        var $doc = $(resp);
        var showDocs = $doc.find('article.document');
        var newDocs = $doc.find('#documents');
        var sortPerPage = $doc.find('#sortAndPerPage');
        var pageEntries = sortPerPage.find('.page-entries');
        var numberEntries = parseInt(pageEntries.find('strong').last().text().replace(/,/g, ''), 10);

        // Hide these until we re-enable in the future
        sortPerPage.find('.result-type-group').hide();
        sortPerPage.find('.search-widgets').hide();

        if (!isNaN(numberEntries)) {
          $('[data-arclight-online-content-tab-count]').html(
            $(
              '<span class="badge badge-pill badge-secondary al-online-content-badge">'
                + numberEntries
                + '<span class="sr-only">components</span></span>'
            )
          );
        }

        sortPerPage.find('a').on('click', function (e) {
          var pages = [];
          var $target = $(e.target);
          e.preventDefault();
          pages = /page=(\d+)&/.exec($target.attr('href'));
          if (pages) {
            CollectionNavigation.init($el, pages[1]);
          } else {
            // Case where the "first" page
            CollectionNavigation.init($el);
          }
        });

        $el.hide().html('').append(sortPerPage).append(newDocs)
          .fadeIn(500);
        if (showDocs.length > 0) {
          $el.trigger('navigation.contains.elements');
        }
        Blacklight.doBookmarkToggleBehavior();
      });
    }
  };

  global.CollectionNavigation = CollectionNavigation;
}(this));

Blacklight.onLoad(function () {
  'use strict';

  $('.al-contents').each(function (i, element) {
    CollectionNavigation.init(element); // eslint-disable-line no-undef
  });

  $('.al-contents').on('navigation.contains.elements', function (e) {
    var toEnable = $('[data-hierarchy-enable-me]');
    var srOnly = $('h2[data-sr-enable-me]');
    toEnable.removeClass('disabled');
    toEnable.text(srOnly.data('hasContents'));
    srOnly.text(srOnly.data('hasContents'));

    $(e.target).find('.collapse').on('show.bs.collapse', function (ee) {
      var $newTarget = $(ee.target);
      $newTarget.find('.al-contents').each(function (i, element) {
        CollectionNavigation.init(element); // eslint-disable-line no-undef
        // Turn off additional ajax requests on show
        $newTarget.off('show.bs.collapse');
      });
    });
  });
});
class NavigationDocument {
  constructor(el) {
    this.el = $(el);
  }

  get id() {
    return this.el.find('[data-document-id]').data().documentId;
  }

  setAsHighlighted() {
    this.el.find('li.al-collection-context').addClass('al-hierarchy-highlight');
  }

  collapse() {
    this.el.find('li.al-collection-context').addClass('collapsed');
  }

  render() {
    return this.el.html();
  }
}

/**
 * Models the "Expand"/"Collapse" button, and provides an onClick event handler
 * for the jQuery element
 * @class
 */
class ExpandButton {
  /**
   * This retrieves the <li> elements which are hidden/rendered in response to
   *   clicking the <button> element
   * @param {jQuery} $li - the <button> element
   * @return {jQuery} - a jQuery object containing the targeted <li>
   */
  findSiblings() {
    const $siblings = this.$el.parent().children('li');
    return $siblings.slice(0, -1);
  }

  /**
   * This adds a "collapsed" class to all of the <li> children, as well as
   *   updates the text for the <button> element
   * @param {Event} event - the event propagated in response to clicking on the
   *   <button> element
   */
  handleClick() {
    const $targeted = this.findSiblings();

    $targeted.toggleClass('collapsed');
    this.$el.toggleClass('collapsed');

    const containerText = this.$el.hasClass('collapsed') ? this.collapseText : this.expandText;
    this.$el.text(containerText);
  }

  /**
   * @constructor
   */
  constructor(data) {
    this.collapseText = data.collapse;
    this.expandText = data.expand;

    this.$el = $(`<button class="my-3 btn btn-secondary btn-sm">${this.expandText}</button>`);
    this.handleClick = this.handleClick.bind(this);
    this.$el.click(this.handleClick);
  }
}

/**
 * Modeling <button> Elements which hide or retrieve <li> elements for sibling
 *   documents nested within the <li> elements of the <ul> tree
 * @class
 */
class NestedExpandButton extends ExpandButton {
  /**
   * This retrieves the <li> elements which are hidden/rendered in response to
   *   clicking the <button> element
   * @param {jQuery} $li - the <button> element
   * @return {jQuery} - a jQuery object containing the targeted <li>
   */
  findSiblings() {
    const highlighted = this.$el.siblings('.al-hierarchy-highlight');
    const $siblings = highlighted.prevAll('.al-collection-context');
    return $siblings.slice(0, -1);
  }
}

/**
 * Models the placeholder display elements for content loading from AJAX
 *   requests
 * @class
 */
class Placeholder {
  /*
   * Builds the element set which contains the placeholder markup
   *   classes
   */
  /* eslint-disable class-methods-use-this */
  buildElement() {
    const elementMarkup = '<div class="al-hierarchy-placeholder">' +
      '<h3 class="col-md-9"></h3>' +
      '<p class="col-md-6"></p>' +
      '<p class="col-md-12"></p>' +
      '<p class="col-md-3"></p>' +
      '</div>';
    const markup = Array(3).join(elementMarkup);

    return $(markup);
  }
  /* eslint-enable class-methods-use-this */

  /*
   * @constructor
   */
  constructor() {
    this.$el = this.buildElement();
  }
}

class ContextNavigation {
  constructor(el, originalParents = null, originalDocument = null) {
    this.el = $(el);
    this.data = this.el.data();
    this.parentLi = this.el.parent();
    this.eadid = this.data.arclight.eadid;
    this.originalParents = originalParents || this.data.arclight.originalParents;
    this.originalDocument = originalDocument || this.data.arclight.originalDocument;
    this.ul = $('<ul class="al-context-nav-parent"></ul>');
  }

  // Gets the targetId to select, based off of parents and current level
  get targetId() {
    return `${this.eadid}${this.originalParents[this.data.arclight.level]}`;
  }

  get requestParent() {
    if (this.originalParents && this.originalParents[this.data.arclight.level - 1]) {
      return this.originalParents[this.data.arclight.level - 1];
    }
    return this.data.arclight.originalDocument.replace(this.eadid, '');
  }

  getData() {
    const that = this;
    // Add a placeholder so flashes of text are not as significant
    const placeholder = new Placeholder();
    this.el.after(placeholder.$el);
    $.ajax({
      url: this.data.arclight.path,
      data: {
        'f[component_level_isim][]': this.data.arclight.level,
        'f[has_online_content_ssim][]': this.data.arclight.access,
        'f[collection_sim][]': this.data.arclight.name,
        'f[parent_ssi][]': this.requestParent,
        search_field: this.data.arclight.search_field,
        original_parents: this.data.arclight.originalParents,
        original_document: this.originalDocument,
        view: 'collection_context'
      }
    }).done((response) => that.updateView(response));
  }

  /**
   * Constructs a <ul> container element with an ElementButton instance appended
   * within it
   * @returns {jQuery}
   */
  buildExpandList() {
    const $ul = $('<ul></ul>');
    $ul.addClass('pl-0');
    $ul.addClass('prev-siblings');
    const button = new ExpandButton(this.data);
    $ul.append(button.$el);
    return $ul;
  }

  /**
   * Highlights the <li> element for the current Document and appends <li> the
   *   sibling documents for a given Document element
   * @param {NavigationDocument[]} newDocs - the NavigationDocument objects for
   *   each resulting Solr Document
   * @param {number} originalDocumentIndex
   */
  updateSiblings(newDocs, originalDocumentIndex) {
    newDocs[originalDocumentIndex].setAsHighlighted();

    // Hide all but the first previous sibling
    const prevSiblingDocs = newDocs.slice(0, originalDocumentIndex);
    let nextSiblingDocs = [];

    if (prevSiblingDocs.length > 1 && originalDocumentIndex > 0) {
      const hiddenPrevSiblingDocs = prevSiblingDocs.slice(0, -1);
      hiddenPrevSiblingDocs.forEach(siblingDoc => {
        siblingDoc.collapse();
      });

      const prevSiblingList = this.buildExpandList();
      const renderedPrevSiblingItems = prevSiblingDocs.map(doc => doc.render()).join('');

      prevSiblingList.append(renderedPrevSiblingItems);
      this.ul.append(prevSiblingList);

      nextSiblingDocs = newDocs.slice(originalDocumentIndex);
    } else {
      nextSiblingDocs = newDocs;
    }

    const renderedNextSiblingItems = nextSiblingDocs.map(newDoc => newDoc.render()).join('');

    // Insert the rendered sibling documents before the <li> elements
    this.ul.append(renderedNextSiblingItems);
    this.el.html(this.ul);
  }

  /**
   * Inserts <li> elements for parents (e. g. components or collections) for the
   *   current Document and appends <li> for each of these
   * @param {NavigationDocument[]} newDocs - the NavigationDocument objects for
   *   each resulting Solr Document
   */
  updateParents(newDocs) {
    const that = this;
    // Case where this is a parent list and needs to be filed correctly
    //
    // Otherwise, retrieve the parent...
    let newDocIndex = newDocs.findIndex(doc => doc.id === this.targetId);

    if (newDocIndex === -1) {
      const renderedDocs = newDocs.map(newDoc => newDoc.render()).join('');
      this.ul.append(renderedDocs);
      this.el.html(this.ul);
      return;
    }
    // Update the docs before the item
    // Retrieves the documents up to and including the "new document"
    const beforeDocs = newDocs.slice(0, newDocIndex);
    let prevParentList = null;
    let renderedBeforeDocs;
    if (beforeDocs.length > 1) {
      beforeDocs.forEach(function (parentDoc) {
        parentDoc.collapse();
      });
      renderedBeforeDocs = beforeDocs.map(newDoc => newDoc.render()).join('');
      prevParentList = this.buildExpandList();
      prevParentList.append(renderedBeforeDocs);
    } else {
      renderedBeforeDocs = beforeDocs.map(newDoc => newDoc.render()).join('');
    }

    // Silly but works for now
    this.ul.append(prevParentList || renderedBeforeDocs);

    let itemDoc = newDocs.slice(newDocIndex, newDocIndex + 1);
    let renderedItemDoc = itemDoc.map(doc => doc.render()).join('');

    // Update the item
    const $itemDoc = $(renderedItemDoc);
    this.ul.append($itemDoc);

    // Update the docs after the item
    const afterDocs = newDocs.slice(newDocIndex + 1, newDocs.length);
    const renderedAfterDocs = afterDocs.map(newDoc => newDoc.render()).join('');

    // Insert the documents after the current
    this.ul.append(renderedAfterDocs);
    this.el.html(this.ul);

    // Initialize additional things
    $itemDoc.find('.context-navigator').each(function (i, e) {
      const contextNavigation = new ContextNavigation(
        e, that.originalParents, that.originalDocument
      );
      contextNavigation.getData();
    });
  }


  /**
   * Update the ancestors for <li> elements
   * @param {jQuery} $li - the <li> element for the current, highlighted
   *   Document in the <ul> context list of collections, components, and
   *   containers
   */
  /* eslint-disable class-methods-use-this */
  updateListSiblings($li) {
    const prevSiblings = $li.prevAll('.al-collection-context');
    if (prevSiblings.length > 1) {
      const hiddenNextSiblings = prevSiblings.slice(0, -1);
      hiddenNextSiblings.toggleClass('collapsed');

      const button = new NestedExpandButton();

      const lastHiddenNextSibling = hiddenNextSiblings[hiddenNextSiblings.length - 1];
      button.$el.insertAfter(lastHiddenNextSibling);
    }
  }
  /* eslint-enable class-methods-use-this */

  /**
   * This updates the elements in the View DOM using an AJAX response containing
   *   the HTML of a server-rendered View template.
   * It is this which is primarily used to populate the <ul> element with
   *   children for the navigation context, containing <li> elements for
   *   collections, components, and containers.
   * @param {string} response - the AJAX response body
   */
  updateView(response) {
    const that = this;
    var resp = $.parseHTML(response);
    var $doc = $(resp);
    var newDocs = $doc.find('#documents')
      .find('article')
      .toArray().map(el => new NavigationDocument(el));

    // See if the original document is located in the returned documents
    const originalDocumentIndex = newDocs
      .findIndex(doc => doc.id === that.originalDocument);
    that.parentLi.find('.al-hierarchy-placeholder').remove();

    // If the original document in the results, update it. If not update with a
    // more complex procedure
    if (originalDocumentIndex !== -1) {
      this.updateSiblings(newDocs, originalDocumentIndex);
    } else {
      this.updateParents(
        newDocs,
        that.data.arclight.originalParents,
        that.data.arclight.parent,
        that.parentLi
      );
    }
    this.el.parent().data('resolved', true);
    this.addListenersForPlusMinus();
    this.enablebuttons();
    Blacklight.doBookmarkToggleBehavior();
    this.el.trigger('navigation.contains.elements');
  }

  // eslint-disable-next-line class-methods-use-this
  enablebuttons() {
    var toEnable = $('[data-hierarchy-enable-me]');
    var srOnly = $('h2[data-sr-enable-me]');
    toEnable.removeClass('disabled');
    toEnable.text(srOnly.data('hasContents'));
    srOnly.text(srOnly.data('hasContents'));
  }

  addListenersForPlusMinus() {
    const that = this;
    this.ul.find('.al-toggle-view-children').on('click', (e) => {
      e.preventDefault();
      const targetArea = $($(e.target).attr('href'));
      if (!targetArea.data().resolved) {
        targetArea.find('.context-navigator').each((i, ee) => {
          const contextNavigation = new ContextNavigation(
            ee, that.originalParents, that.originalDocument
          );
          contextNavigation.getData();
        });
      }
    });
  }
}

/**
 * Integrate the behavior into the DOM using the Blacklight#onLoad callback
 *
 */
Blacklight.onLoad(function () {
  $('.context-navigator').each(function (i, e) {
    const contextNavigation = new ContextNavigation(e);
    contextNavigation.getData();
  });
});
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
/*
 * jQuery Responsive Truncator Plugin
 *
 * https://github.com/jkeck/responsiveTruncator
 *
 * VERSION 0.0.2
 *
**/

(function( $ ){
  $.fn.responsiveTruncate = function(options){
		var $this = this;
		$(window).bind("resize", function(){
			removeTruncation($this);
			addTruncation($this);
		});
		
 		addTruncation($this);

	  function addTruncation(el){
		  el.each(function(){
			  if($(".responsiveTruncate", $(this)).length == 0){
				  var parent = $(this);
				  var fontSize = $(this).css('font-size');
				  var lineHeight = $(this).css("line-height") ? $(this).css("line-height").replace('px','') : Math.floor(parseInt(fontSize.replace('px','')) * 1.5);
					var total_lines = Math.ceil(parent.height() / lineHeight);
					var settings = $.extend({
						'lines'  : 3,
						'height' : null,
						'more'   : 'more',
						'less'   : 'less'
					}, options);
					var truncate_height;
					if(settings.height){
						truncate_height = settings.height;
					}else{
					  truncate_height = (lineHeight * settings.lines);	
					}
				  if(parent.height() > truncate_height) {
					  var orig_content = parent.html();
						parent.html("<div style='height: " + truncate_height + "px; overflow: hidden;' class='responsiveTruncate'></div>");
						var truncate = $(".responsiveTruncate", parent);
						truncate.html(orig_content);
						truncate.after("<a class='responsiveTruncatorToggle' href='#'>" + settings.more + "</a>");
						var toggle_link = $(".responsiveTruncatorToggle", parent);
						toggle_link.click(function(){
						  var text = toggle_link.text() == settings.more ? settings.less : settings.more;
							toggle_link.text(text);
							if(truncate.height() <= truncate_height){
								truncate.css({height: '100%'})
							}else{
								truncate.css({height: truncate_height})
							}
							return false;
						});
				  }
			  }
		  });
	  }
	
	  function removeTruncation(el){
		  el.each(function(){
			  if($(".responsiveTruncate", $(this)).length > 0){
				  $(this).html($(".responsiveTruncate", $(this)).html());
				  $(".responsiveTruncatorToggle", $(this)).remove();
			  }
		  });
	  }
  };
})( jQuery );






// Vendor Scripts

;
/*!
 * Stickyfill -- `position: sticky` polyfill
 * v. 1.1.4 | https://github.com/wilddeer/stickyfill
 * Copyright Oleg Korsunsky | http://wd.dizaina.net/
 *
 * MIT License
 */

(function(doc, win) {
    var watchArray = [],
        scroll,
        initialized = false,
        html = doc.documentElement,
        noop = function() {},
        checkTimer,

        //visibility API strings
        hiddenPropertyName = 'hidden',
        visibilityChangeEventName = 'visibilitychange';

    //fallback to prefixed names in old webkit browsers
    if (doc.webkitHidden !== undefined) {
        hiddenPropertyName = 'webkitHidden';
        visibilityChangeEventName = 'webkitvisibilitychange';
    }

    //test getComputedStyle
    if (!win.getComputedStyle) {
        seppuku();
    }

    //test for native support
    var prefixes = ['', '-webkit-', '-moz-', '-ms-'],
        block = document.createElement('div');

    for (var i = prefixes.length - 1; i >= 0; i--) {
        try {
            block.style.position = prefixes[i] + 'sticky';
        }
        catch(e) {}
        if (block.style.position != '') {
            seppuku();
        }
    }

    updateScrollPos();

    //commit seppuku!
    function seppuku() {
        init = add = rebuild = pause = stop = kill = noop;
    }

    function mergeObjects(targetObj, sourceObject) {
        for (var key in sourceObject) {
            if (sourceObject.hasOwnProperty(key)) {
                targetObj[key] = sourceObject[key];
            }
        }
    }

    function parseNumeric(val) {
        return parseFloat(val) || 0;
    }

    function updateScrollPos() {
        scroll = {
            top: win.pageYOffset,
            left: win.pageXOffset
        };
    }

    function onScroll() {
        if (win.pageXOffset != scroll.left) {
            updateScrollPos();
            rebuild();
            return;
        }
        
        if (win.pageYOffset != scroll.top) {
            updateScrollPos();
            recalcAllPos();
        }
    }

    //fixes flickering
    function onWheel(event) {
        setTimeout(function() {
            if (win.pageYOffset != scroll.top) {
                scroll.top = win.pageYOffset;
                recalcAllPos();
            }
        }, 0);
    }

    function recalcAllPos() {
        for (var i = watchArray.length - 1; i >= 0; i--) {
            recalcElementPos(watchArray[i]);
        }
    }

    function recalcElementPos(el) {
        if (!el.inited) return;

        var currentMode = (scroll.top <= el.limit.start? 0: scroll.top >= el.limit.end? 2: 1);

        if (el.mode != currentMode) {
            switchElementMode(el, currentMode);
        }
    }

    //checks whether stickies start or stop positions have changed
    function fastCheck() {
        for (var i = watchArray.length - 1; i >= 0; i--) {
            if (!watchArray[i].inited) continue;

            var deltaTop = Math.abs(getDocOffsetTop(watchArray[i].clone) - watchArray[i].docOffsetTop),
                deltaHeight = Math.abs(watchArray[i].parent.node.offsetHeight - watchArray[i].parent.height);

            if (deltaTop >= 2 || deltaHeight >= 2) return false;
        }
        return true;
    }

    function initElement(el) {
        if (isNaN(parseFloat(el.computed.top)) || el.isCell || el.computed.display == 'none') return;

        el.inited = true;

        if (!el.clone) clone(el);
        if (el.parent.computed.position != 'absolute' &&
            el.parent.computed.position != 'relative') el.parent.node.style.position = 'relative';

        recalcElementPos(el);

        el.parent.height = el.parent.node.offsetHeight;
        el.docOffsetTop = getDocOffsetTop(el.clone);
    }

    function deinitElement(el) {
        var deinitParent = true;

        el.clone && killClone(el);
        mergeObjects(el.node.style, el.css);

        //check whether element's parent is used by other stickies
        for (var i = watchArray.length - 1; i >= 0; i--) {
            if (watchArray[i].node !== el.node && watchArray[i].parent.node === el.parent.node) {
                deinitParent = false;
                break;
            }
        };

        if (deinitParent) el.parent.node.style.position = el.parent.css.position;
        el.mode = -1;
    }

    function initAll() {
        for (var i = watchArray.length - 1; i >= 0; i--) {
            initElement(watchArray[i]);
        }
    }

    function deinitAll() {
        for (var i = watchArray.length - 1; i >= 0; i--) {
            deinitElement(watchArray[i]);
        }
    }

    function switchElementMode(el, mode) {
        var nodeStyle = el.node.style;

        switch (mode) {
            case 0:
                nodeStyle.position = 'absolute';
                nodeStyle.left = el.offset.left + 'px';
                nodeStyle.right = el.offset.right + 'px';
                nodeStyle.top = el.offset.top + 'px';
                nodeStyle.bottom = 'auto';
                nodeStyle.width = 'auto';
                nodeStyle.marginLeft = 0;
                nodeStyle.marginRight = 0;
                nodeStyle.marginTop = 0;
                break;

            case 1:
                nodeStyle.position = 'fixed';
                nodeStyle.left = el.box.left + 'px';
                nodeStyle.right = el.box.right + 'px';
                nodeStyle.top = el.css.top;
                nodeStyle.bottom = 'auto';
                nodeStyle.width = 'auto';
                nodeStyle.marginLeft = 0;
                nodeStyle.marginRight = 0;
                nodeStyle.marginTop = 0;
                break;

            case 2:
                nodeStyle.position = 'absolute';
                nodeStyle.left = el.offset.left + 'px';
                nodeStyle.right = el.offset.right + 'px';
                nodeStyle.top = 'auto';
                nodeStyle.bottom = 0;
                nodeStyle.width = 'auto';
                nodeStyle.marginLeft = 0;
                nodeStyle.marginRight = 0;
                break;
        }

        el.mode = mode;
    }

    function clone(el) {
        el.clone = document.createElement('div');

        var refElement = el.node.nextSibling || el.node,
            cloneStyle = el.clone.style;

        cloneStyle.height = el.height + 'px';
        cloneStyle.width = el.width + 'px';
        cloneStyle.marginTop = el.computed.marginTop;
        cloneStyle.marginBottom = el.computed.marginBottom;
        cloneStyle.marginLeft = el.computed.marginLeft;
        cloneStyle.marginRight = el.computed.marginRight;
        cloneStyle.padding = cloneStyle.border = cloneStyle.borderSpacing = 0;
        cloneStyle.fontSize = '1em';
        cloneStyle.position = 'static';
        cloneStyle.cssFloat = el.computed.cssFloat;

        el.node.parentNode.insertBefore(el.clone, refElement);
    }

    function killClone(el) {
        el.clone.parentNode.removeChild(el.clone);
        el.clone = undefined;
    }

    function getElementParams(node) {
        var computedStyle = getComputedStyle(node),
            parentNode = node.parentNode,
            parentComputedStyle = getComputedStyle(parentNode),
            cachedPosition = node.style.position;

        node.style.position = 'relative';

        var computed = {
                top: computedStyle.top,
                marginTop: computedStyle.marginTop,
                marginBottom: computedStyle.marginBottom,
                marginLeft: computedStyle.marginLeft,
                marginRight: computedStyle.marginRight,
                cssFloat: computedStyle.cssFloat,
                display: computedStyle.display
            },
            numeric = {
                top: parseNumeric(computedStyle.top),
                marginBottom: parseNumeric(computedStyle.marginBottom),
                paddingLeft: parseNumeric(computedStyle.paddingLeft),
                paddingRight: parseNumeric(computedStyle.paddingRight),
                borderLeftWidth: parseNumeric(computedStyle.borderLeftWidth),
                borderRightWidth: parseNumeric(computedStyle.borderRightWidth)
            };

        node.style.position = cachedPosition;

        var css = {
                position: node.style.position,
                top: node.style.top,
                bottom: node.style.bottom,
                left: node.style.left,
                right: node.style.right,
                width: node.style.width,
                marginTop: node.style.marginTop,
                marginLeft: node.style.marginLeft,
                marginRight: node.style.marginRight
            },
            nodeOffset = getElementOffset(node),
            parentOffset = getElementOffset(parentNode),
            
            parent = {
                node: parentNode,
                css: {
                    position: parentNode.style.position
                },
                computed: {
                    position: parentComputedStyle.position
                },
                numeric: {
                    borderLeftWidth: parseNumeric(parentComputedStyle.borderLeftWidth),
                    borderRightWidth: parseNumeric(parentComputedStyle.borderRightWidth),
                    borderTopWidth: parseNumeric(parentComputedStyle.borderTopWidth),
                    borderBottomWidth: parseNumeric(parentComputedStyle.borderBottomWidth)
                }
            },

            el = {
                node: node,
                box: {
                    left: nodeOffset.win.left,
                    right: html.clientWidth - nodeOffset.win.right
                },
                offset: {
                    top: nodeOffset.win.top - parentOffset.win.top - parent.numeric.borderTopWidth,
                    left: nodeOffset.win.left - parentOffset.win.left - parent.numeric.borderLeftWidth,
                    right: -nodeOffset.win.right + parentOffset.win.right - parent.numeric.borderRightWidth
                },
                css: css,
                isCell: computedStyle.display == 'table-cell',
                computed: computed,
                numeric: numeric,
                width: nodeOffset.win.right - nodeOffset.win.left,
                height: nodeOffset.win.bottom - nodeOffset.win.top,
                mode: -1,
                inited: false,
                parent: parent,
                limit: {
                    start: nodeOffset.doc.top - numeric.top,
                    end: parentOffset.doc.top + parentNode.offsetHeight - parent.numeric.borderBottomWidth -
                        node.offsetHeight - numeric.top - numeric.marginBottom
                }
            };

        return el;
    }

    function getDocOffsetTop(node) {
        var docOffsetTop = 0;

        while (node) {
            docOffsetTop += node.offsetTop;
            node = node.offsetParent;
        }

        return docOffsetTop;
    }

    function getElementOffset(node) {
        var box = node.getBoundingClientRect();

            return {
                doc: {
                    top: box.top + win.pageYOffset,
                    left: box.left + win.pageXOffset
                },
                win: box
            };
    }

    function startFastCheckTimer() {
        checkTimer = setInterval(function() {
            !fastCheck() && rebuild();
        }, 500);
    }

    function stopFastCheckTimer() {
        clearInterval(checkTimer);
    }

    function handlePageVisibilityChange() {
        if (!initialized) return;

        if (document[hiddenPropertyName]) {
            stopFastCheckTimer();
        }
        else {
            startFastCheckTimer();
        }
    }

    function init() {
        if (initialized) return;

        updateScrollPos();
        initAll();

        win.addEventListener('scroll', onScroll);
        win.addEventListener('wheel', onWheel);

        //watch for width changes
        win.addEventListener('resize', rebuild);
        win.addEventListener('orientationchange', rebuild);

        //watch for page visibility
        doc.addEventListener(visibilityChangeEventName, handlePageVisibilityChange);

        startFastCheckTimer();

        initialized = true;
    }

    function rebuild() {
        if (!initialized) return;

        deinitAll();
        
        for (var i = watchArray.length - 1; i >= 0; i--) {
            watchArray[i] = getElementParams(watchArray[i].node);
        }
        
        initAll();
    }

    function pause() {
        win.removeEventListener('scroll', onScroll);
        win.removeEventListener('wheel', onWheel);
        win.removeEventListener('resize', rebuild);
        win.removeEventListener('orientationchange', rebuild);
        doc.removeEventListener(visibilityChangeEventName, handlePageVisibilityChange);

        stopFastCheckTimer();

        initialized = false;
    }

    function stop() {
        pause();
        deinitAll(); 
    }

    function kill() {
        stop();

        //empty the array without loosing the references,
        //the most performant method according to http://jsperf.com/empty-javascript-array
        while (watchArray.length) {
            watchArray.pop();
        }
    }

    function add(node) {
        //check if Stickyfill is already applied to the node
        for (var i = watchArray.length - 1; i >= 0; i--) {
            if (watchArray[i].node === node) return;
        };

        var el = getElementParams(node);

        watchArray.push(el);

        if (!initialized) {
            init();
        }
        else {
            initElement(el);
        }
    }

    function remove(node) {
        for (var i = watchArray.length - 1; i >= 0; i--) {
            if (watchArray[i].node === node) {
                deinitElement(watchArray[i]);
                watchArray.splice(i, 1);
            }
        };
    }

    //expose Stickyfill
    win.Stickyfill = {
        stickies: watchArray,
        add: add,
        remove: remove,
        init: init,
        rebuild: rebuild,
        pause: pause,
        stop: stop,
        kill: kill
    };
})(document, window);


//if jQuery is available -- create a plugin
if (window.jQuery) {
    (function($) {
        $.fn.Stickyfill = function(options) {
            this.each(function() {
                Stickyfill.add(this);
            });

            return this;
        };
    })(window.jQuery);
}
;


