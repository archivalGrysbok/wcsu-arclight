/** ## jquery.flot.canvaswrapper

This plugin contains the function for creating and manipulating both the canvas
layers and svg layers.

The Canvas object is a wrapper around an HTML5 canvas tag.
The constructor Canvas(cls, container) takes as parameters cls,
the list of classes to apply to the canvas adnd the containter,
element onto which to append the canvas. The canvas operations
don't work unless the canvas is attached to the DOM.

### jquery.canvaswrapper.js API functions
*/


(function($) {
    var Canvas = function(cls, container) {
        var element = container.getElementsByClassName(cls)[0];

        if (!element) {
            element = document.createElement('canvas');
            element.className = cls;
            element.style.direction = 'ltr';
            element.style.position = 'absolute';
            element.style.left = '0px';
            element.style.top = '0px';

            container.appendChild(element);

            // If HTML5 Canvas isn't available, throw

            if (!element.getContext) {
                throw new Error('Canvas is not available.');
            }
        }

        this.element = element;

        var context = this.context = element.getContext('2d');
        this.pixelRatio = $.plot.browser.getPixelRatio(context);

        // Size the canvas to match the internal dimensions of its container
        var width = $(container).width();
        var height = $(container).height();
        this.resize(width, height);

        // Collection of HTML div layers for text overlaid onto the canvas

        this.SVGContainer = null;
        this.SVG = {};

        // Cache of text fragments and metrics, so we can avoid expensively
        // re-calculating them when the plot is re-rendered in a loop.

        this._textCache = {};
    }

    /**
    - resize(width, height)

     Resizes the canvas to the given dimensions.
     The width represents the new width of the canvas, meanwhile the height
     is the new height of the canvas, both of them in pixels.
    */

    Canvas.prototype.resize = function(width, height) {
        var minSize = 10;
        width = width < minSize ? minSize : width;
        height = height < minSize ? minSize : height;

        var element = this.element,
            context = this.context,
            pixelRatio = this.pixelRatio;

        // Resize the canvas, increasing its density based on the display's
        // pixel ratio; basically giving it more pixels without increasing the
        // size of its element, to take advantage of the fact that retina
        // displays have that many more pixels in the same advertised space.

        // Resizing should reset the state (excanvas seems to be buggy though)

        if (this.width !== width) {
            element.width = width * pixelRatio;
            element.style.width = width + 'px';
            this.width = width;
        }

        if (this.height !== height) {
            element.height = height * pixelRatio;
            element.style.height = height + 'px';
            this.height = height;
        }

        // Save the context, so we can reset in case we get replotted.  The
        // restore ensure that we're really back at the initial state, and
        // should be safe even if we haven't saved the initial state yet.

        context.restore();
        context.save();

        // Scale the coordinate space to match the display density; so even though we
        // may have twice as many pixels, we still want lines and other drawing to
        // appear at the same size; the extra pixels will just make them crisper.

        context.scale(pixelRatio, pixelRatio);
    };

    /**
    - clear()

     Clears the entire canvas area, not including any overlaid HTML text
    */
    Canvas.prototype.clear = function() {
        this.context.clearRect(0, 0, this.width, this.height);
    };

    /**
    - render()

     Finishes rendering the canvas, including managing the text overlay.
    */
    Canvas.prototype.render = function() {
        var cache = this._textCache;

        // For each text layer, add elements marked as active that haven't
        // already been rendered, and remove those that are no longer active.

        for (var layerKey in cache) {
            if (hasOwnProperty.call(cache, layerKey)) {
                var layer = this.getSVGLayer(layerKey),
                    layerCache = cache[layerKey];

                var display = layer.style.display;
                layer.style.display = 'none';

                for (var styleKey in layerCache) {
                    if (hasOwnProperty.call(layerCache, styleKey)) {
                        var styleCache = layerCache[styleKey];
                        for (var key in styleCache) {
                            if (hasOwnProperty.call(styleCache, key)) {
                                var val = styleCache[key],
                                    positions = val.positions;

                                for (var i = 0, position; positions[i]; i++) {
                                    position = positions[i];
                                    if (position.active) {
                                        if (!position.rendered) {
                                            layer.appendChild(position.element);
                                            position.rendered = true;
                                        }
                                    } else {
                                        positions.splice(i--, 1);
                                        if (position.rendered) {
                                            while (position.element.firstChild) {
                                                position.element.removeChild(position.element.firstChild);
                                            }
                                            position.element.parentNode.removeChild(position.element);
                                        }
                                    }
                                }

                                if (positions.length === 0) {
                                    if (val.measured) {
                                        val.measured = false;
                                    } else {
                                        delete styleCache[key];
                                    }
                                }
                            }
                        }
                    }
                }

                layer.style.display = display;
            }
        }
    };

    /**
    - getSVGLayer(classes)

     Creates (if necessary) and returns the SVG overlay container.
     The classes string represents the string of space-separated CSS classes
     used to uniquely identify the text layer. It return the svg-layer div.
    */
    Canvas.prototype.getSVGLayer = function(classes) {
        var layer = this.SVG[classes];

        // Create the SVG layer if it doesn't exist

        if (!layer) {
            // Create the svg layer container, if it doesn't exist

            var svgElement;

            if (!this.SVGContainer) {
                this.SVGContainer = document.createElement('div');
                this.SVGContainer.className = 'flot-svg';
                this.SVGContainer.style.position = 'absolute';
                this.SVGContainer.style.top = '0px';
                this.SVGContainer.style.left = '0px';
                this.SVGContainer.style.height = '100%';
                this.SVGContainer.style.width = '100%';
                this.SVGContainer.style.pointerEvents = 'none';
                this.element.parentNode.appendChild(this.SVGContainer);

                svgElement = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
                svgElement.style.width = '100%';
                svgElement.style.height = '100%';

                this.SVGContainer.appendChild(svgElement);
            } else {
                svgElement = this.SVGContainer.firstChild;
            }

            layer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
            layer.setAttribute('class', classes);
            layer.style.position = 'absolute';
            layer.style.top = '0px';
            layer.style.left = '0px';
            layer.style.bottom = '0px';
            layer.style.right = '0px';
            svgElement.appendChild(layer);
            this.SVG[classes] = layer;
        }

        return layer;
    };

    /**
    - getTextInfo(layer, text, font, angle, width)

     Creates (if necessary) and returns a text info object.
     The object looks like this:
     ```js
     {
         width //Width of the text's wrapper div.
         height //Height of the text's wrapper div.
         element //The HTML div containing the text.
         positions //Array of positions at which this text is drawn.
      }
      ```
      The positions array contains objects that look like this:
      ```js
      {
         active //Flag indicating whether the text should be visible.
         rendered //Flag indicating whether the text is currently visible.
         element //The HTML div containing the text.
         text //The actual text and is identical with element[0].textContent.
         x //X coordinate at which to draw the text.
         y //Y coordinate at which to draw the text.
      }
      ```
      Each position after the first receives a clone of the original element.
      The idea is that that the width, height, and general 'identity' of the
      text is constant no matter where it is placed; the placements are a
      secondary property.

      Canvas maintains a cache of recently-used text info objects; getTextInfo
      either returns the cached element or creates a new entry.

     The layer parameter is string of space-separated CSS classes uniquely
     identifying the layer containing this text.
     Text is the text string to retrieve info for.
     Font is either a string of space-separated CSS classes or a font-spec object,
     defining the text's font and style.
     Angle is the angle at which to rotate the text, in degrees. Angle is currently unused,
     it will be implemented in the future.
     The last parameter is the Maximum width of the text before it wraps.
     The method returns a text info object.
    */
    Canvas.prototype.getTextInfo = function(layer, text, font, angle, width) {
        var textStyle, layerCache, styleCache, info;

        // Cast the value to a string, in case we were given a number or such

        text = '' + text;

        // If the font is a font-spec object, generate a CSS font definition

        if (typeof font === 'object') {
            textStyle = font.style + ' ' + font.variant + ' ' + font.weight + ' ' + font.size + 'px/' + font.lineHeight + 'px ' + font.family;
        } else {
            textStyle = font;
        }

        // Retrieve (or create) the cache for the text's layer and styles

        layerCache = this._textCache[layer];

        if (layerCache == null) {
            layerCache = this._textCache[layer] = {};
        }

        styleCache = layerCache[textStyle];

        if (styleCache == null) {
            styleCache = layerCache[textStyle] = {};
        }

        var key = generateKey(text);
        info = styleCache[key];

        // If we can't find a matching element in our cache, create a new one

        if (!info) {
            var element = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            if (text.indexOf('<br>') !== -1) {
                addTspanElements(text, element, -9999);
            } else {
                var textNode = document.createTextNode(text);
                element.appendChild(textNode);
            }

            element.style.position = 'absolute';
            element.style.maxWidth = width;
            element.setAttributeNS(null, 'x', -9999);
            element.setAttributeNS(null, 'y', -9999);

            if (typeof font === 'object') {
                element.style.font = textStyle;
                element.style.fill = font.fill;
            } else if (typeof font === 'string') {
                element.setAttribute('class', font);
            }

            this.getSVGLayer(layer).appendChild(element);
            var elementRect = element.getBBox();

            info = styleCache[key] = {
                width: elementRect.width,
                height: elementRect.height,
                measured: true,
                element: element,
                positions: []
            };

            //remove elements from dom
            while (element.firstChild) {
                element.removeChild(element.firstChild);
            }
            element.parentNode.removeChild(element);
        }

        info.measured = true;
        return info;
    };

    function updateTransforms (element, transforms) {
        element.transform.baseVal.clear();
        if (transforms) {
            transforms.forEach(function(t) {
                element.transform.baseVal.appendItem(t);
            });
        }
    }

    /**
    - addText (layer, x, y, text, font, angle, width, halign, valign, transforms)

     Adds a text string to the canvas text overlay.
     The text isn't drawn immediately; it is marked as rendering, which will
     result in its addition to the canvas on the next render pass.

     The layer is string of space-separated CSS classes uniquely
     identifying the layer containing this text.
     X and Y represents the X and Y coordinate at which to draw the text.
     and text is the string to draw
    */
    Canvas.prototype.addText = function(layer, x, y, text, font, angle, width, halign, valign, transforms) {
        var info = this.getTextInfo(layer, text, font, angle, width),
            positions = info.positions;

        // Tweak the div's position to match the text's alignment

        if (halign === 'center') {
            x -= info.width / 2;
        } else if (halign === 'right') {
            x -= info.width;
        }

        if (valign === 'middle') {
            y -= info.height / 2;
        } else if (valign === 'bottom') {
            y -= info.height;
        }

        y += 0.75 * info.height;


        // Determine whether this text already exists at this position.
        // If so, mark it for inclusion in the next render pass.

        for (var i = 0, position; positions[i]; i++) {
            position = positions[i];
            if (position.x === x && position.y === y && position.text === text) {
                position.active = true;
                // update the transforms
                updateTransforms(position.element, transforms);

                return;
            } else if (position.active === false) {
                position.active = true;
                position.text = text;
                if (text.indexOf('<br>') !== -1) {
                    y -= 0.25 * info.height;
                    addTspanElements(text, position.element, x);
                } else {
                    position.element.textContent = text;
                }
                position.element.setAttributeNS(null, 'x', x);
                position.element.setAttributeNS(null, 'y', y);
                position.x = x;
                position.y = y;
                // update the transforms
                updateTransforms(position.element, transforms);

                return;
            }
        }

        // If the text doesn't exist at this position, create a new entry

        // For the very first position we'll re-use the original element,
        // while for subsequent ones we'll clone it.

        position = {
            active: true,
            rendered: false,
            element: positions.length ? info.element.cloneNode() : info.element,
            text: text,
            x: x,
            y: y
        };

        positions.push(position);

        if (text.indexOf('<br>') !== -1) {
            y -= 0.25 * info.height;
            addTspanElements(text, position.element, x);
        } else {
            position.element.textContent = text;
        }

        // Move the element to its final position within the container
        position.element.setAttributeNS(null, 'x', x);
        position.element.setAttributeNS(null, 'y', y);
        position.element.style.textAlign = halign;
        // update the transforms
        updateTransforms(position.element, transforms);
   };

    var addTspanElements = function(text, element, x) {
        var lines = text.split('<br>'),
            tspan, i, offset;

        for (i = 0; i < lines.length; i++) {
            if (!element.childNodes[i]) {
                tspan = document.createElementNS('http://www.w3.org/2000/svg', 'tspan');
                element.appendChild(tspan);
            } else {
                tspan = element.childNodes[i];
            }
            tspan.textContent = lines[i];
            offset = i * 1 + 'em';
            tspan.setAttributeNS(null, 'dy', offset);
            tspan.setAttributeNS(null, 'x', x);
        }
    }

    /**
    - removeText (layer, x, y, text, font, angle)

      The function removes one or more text strings from the canvas text overlay.
      If no parameters are given, all text within the layer is removed.

      Note that the text is not immediately removed; it is simply marked as
      inactive, which will result in its removal on the next render pass.
      This avoids the performance penalty for 'clear and redraw' behavior,
      where we potentially get rid of all text on a layer, but will likely
      add back most or all of it later, as when redrawing axes, for example.

      The layer is a string of space-separated CSS classes uniquely
      identifying the layer containing this text. The following parameter are
      X and Y coordinate of the text.
      Text is the string to remove, while the font is either a string of space-separated CSS
      classes or a font-spec object, defining the text's font and style.
     */
    Canvas.prototype.removeText = function(layer, x, y, text, font, angle) {
        var info, htmlYCoord;
        if (text == null) {
            var layerCache = this._textCache[layer];
            if (layerCache != null) {
                for (var styleKey in layerCache) {
                    if (hasOwnProperty.call(layerCache, styleKey)) {
                        var styleCache = layerCache[styleKey];
                        for (var key in styleCache) {
                            if (hasOwnProperty.call(styleCache, key)) {
                                var positions = styleCache[key].positions;
                                positions.forEach(function(position) {
                                    position.active = false;
                                });
                            }
                        }
                    }
                }
            }
        } else {
            info = this.getTextInfo(layer, text, font, angle);
            positions = info.positions;
            positions.forEach(function(position) {
                htmlYCoord = y + 0.75 * info.height;
                if (position.x === x && position.y === htmlYCoord && position.text === text) {
                    position.active = false;
                }
            });
        }
    };

    /**
    - clearCache()

     Clears the cache used to speed up the text size measurements.
     As an (unfortunate) side effect all text within the text Layer is removed.
     Use this function before plot.setupGrid() and plot.draw() if the plot just
     became visible or the styles changed.
    */
    Canvas.prototype.clearCache = function() {
        var cache = this._textCache;
        for (var layerKey in cache) {
            if (hasOwnProperty.call(cache, layerKey)) {
                var layer = this.getSVGLayer(layerKey);
                while (layer.firstChild) {
                    layer.removeChild(layer.firstChild);
                }
            }
        };

        this._textCache = {};
    };

    function generateKey(text) {
        return text.replace(/0|1|2|3|4|5|6|7|8|9/g, '0');
    }

    if (!window.Flot) {
        window.Flot = {};
    }

    window.Flot.Canvas = Canvas;
})(jQuery);
/* Plugin for jQuery for working with colors.
 *
 * Version 1.1.
 *
 * Inspiration from jQuery color animation plugin by John Resig.
 *
 * Released under the MIT license by Ole Laursen, October 2009.
 *
 * Examples:
 *
 *   $.color.parse("#fff").scale('rgb', 0.25).add('a', -0.5).toString()
 *   var c = $.color.extract($("#mydiv"), 'background-color');
 *   console.log(c.r, c.g, c.b, c.a);
 *   $.color.make(100, 50, 25, 0.4).toString() // returns "rgba(100,50,25,0.4)"
 *
 * Note that .scale() and .add() return the same modified object
 * instead of making a new one.
 *
 * V. 1.1: Fix error handling so e.g. parsing an empty string does
 * produce a color rather than just crashing.
 */


(function($) {
    $.color = {};

    // construct color object with some convenient chainable helpers
    $.color.make = function (r, g, b, a) {
        var o = {};
        o.r = r || 0;
        o.g = g || 0;
        o.b = b || 0;
        o.a = a != null ? a : 1;

        o.add = function (c, d) {
            for (var i = 0; i < c.length; ++i) {
                o[c.charAt(i)] += d;
            }

            return o.normalize();
        };

        o.scale = function (c, f) {
            for (var i = 0; i < c.length; ++i) {
                o[c.charAt(i)] *= f;
            }

            return o.normalize();
        };

        o.toString = function () {
            if (o.a >= 1.0) {
                return "rgb(" + [o.r, o.g, o.b].join(",") + ")";
            } else {
                return "rgba(" + [o.r, o.g, o.b, o.a].join(",") + ")";
            }
        };

        o.normalize = function () {
            function clamp(min, value, max) {
                return value < min ? min : (value > max ? max : value);
            }

            o.r = clamp(0, parseInt(o.r), 255);
            o.g = clamp(0, parseInt(o.g), 255);
            o.b = clamp(0, parseInt(o.b), 255);
            o.a = clamp(0, o.a, 1);
            return o;
        };

        o.clone = function () {
            return $.color.make(o.r, o.b, o.g, o.a);
        };

        return o.normalize();
    }

    // extract CSS color property from element, going up in the DOM
    // if it's "transparent"
    $.color.extract = function (elem, css) {
        var c;

        do {
            c = elem.css(css).toLowerCase();
            // keep going until we find an element that has color, or
            // we hit the body or root (have no parent)
            if (c !== '' && c !== 'transparent') {
                break;
            }

            elem = elem.parent();
        } while (elem.length && !$.nodeName(elem.get(0), "body"));

        // catch Safari's way of signalling transparent
        if (c === "rgba(0, 0, 0, 0)") {
            c = "transparent";
        }

        return $.color.parse(c);
    }

    // parse CSS color string (like "rgb(10, 32, 43)" or "#fff"),
    // returns color object, if parsing failed, you get black (0, 0,
    // 0) out
    $.color.parse = function (str) {
        var res, m = $.color.make;

        // Look for rgb(num,num,num)
        res = /rgb\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*\)/.exec(str);
        if (res) {
            return m(parseInt(res[1], 10), parseInt(res[2], 10), parseInt(res[3], 10));
        }

        // Look for rgba(num,num,num,num)
        res = /rgba\(\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]{1,3})\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\)/.exec(str)
        if (res) {
            return m(parseInt(res[1], 10), parseInt(res[2], 10), parseInt(res[3], 10), parseFloat(res[4]));
        }

        // Look for rgb(num%,num%,num%)
        res = /rgb\(\s*([0-9]+(?:\.[0-9]+)?)%\s*,\s*([0-9]+(?:\.[0-9]+)?)%\s*,\s*([0-9]+(?:\.[0-9]+)?)%\s*\)/.exec(str);
        if (res) {
            return m(parseFloat(res[1]) * 2.55, parseFloat(res[2]) * 2.55, parseFloat(res[3]) * 2.55);
        }

        // Look for rgba(num%,num%,num%,num)
        res = /rgba\(\s*([0-9]+(?:\.[0-9]+)?)%\s*,\s*([0-9]+(?:\.[0-9]+)?)%\s*,\s*([0-9]+(?:\.[0-9]+)?)%\s*,\s*([0-9]+(?:\.[0-9]+)?)\s*\)/.exec(str);
        if (res) {
            return m(parseFloat(res[1]) * 2.55, parseFloat(res[2]) * 2.55, parseFloat(res[3]) * 2.55, parseFloat(res[4]));
        }

        // Look for #a0b1c2
        res = /#([a-fA-F0-9]{2})([a-fA-F0-9]{2})([a-fA-F0-9]{2})/.exec(str);
        if (res) {
            return m(parseInt(res[1], 16), parseInt(res[2], 16), parseInt(res[3], 16));
        }

        // Look for #fff
        res = /#([a-fA-F0-9])([a-fA-F0-9])([a-fA-F0-9])/.exec(str);
        if (res) {
            return m(parseInt(res[1] + res[1], 16), parseInt(res[2] + res[2], 16), parseInt(res[3] + res[3], 16));
        }

        // Otherwise, we're most likely dealing with a named color
        var name = $.trim(str).toLowerCase();
        if (name === "transparent") {
            return m(255, 255, 255, 0);
        } else {
            // default to black
            res = lookupColors[name] || [0, 0, 0];
            return m(res[0], res[1], res[2]);
        }
    }

    var lookupColors = {
        aqua: [0, 255, 255],
        azure: [240, 255, 255],
        beige: [245, 245, 220],
        black: [0, 0, 0],
        blue: [0, 0, 255],
        brown: [165, 42, 42],
        cyan: [0, 255, 255],
        darkblue: [0, 0, 139],
        darkcyan: [0, 139, 139],
        darkgrey: [169, 169, 169],
        darkgreen: [0, 100, 0],
        darkkhaki: [189, 183, 107],
        darkmagenta: [139, 0, 139],
        darkolivegreen: [85, 107, 47],
        darkorange: [255, 140, 0],
        darkorchid: [153, 50, 204],
        darkred: [139, 0, 0],
        darksalmon: [233, 150, 122],
        darkviolet: [148, 0, 211],
        fuchsia: [255, 0, 255],
        gold: [255, 215, 0],
        green: [0, 128, 0],
        indigo: [75, 0, 130],
        khaki: [240, 230, 140],
        lightblue: [173, 216, 230],
        lightcyan: [224, 255, 255],
        lightgreen: [144, 238, 144],
        lightgrey: [211, 211, 211],
        lightpink: [255, 182, 193],
        lightyellow: [255, 255, 224],
        lime: [0, 255, 0],
        magenta: [255, 0, 255],
        maroon: [128, 0, 0],
        navy: [0, 0, 128],
        olive: [128, 128, 0],
        orange: [255, 165, 0],
        pink: [255, 192, 203],
        purple: [128, 0, 128],
        violet: [128, 0, 128],
        red: [255, 0, 0],
        silver: [192, 192, 192],
        white: [255, 255, 255],
        yellow: [255, 255, 0]
    };
})(jQuery);
/* Javascript plotting library for jQuery, version 3.0.0.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

*/

// the actual Flot code
(function($) {
    "use strict";

    var Canvas = window.Flot.Canvas;

    function defaultTickGenerator(axis) {
        var ticks = [],
            start = $.plot.saturated.saturate($.plot.saturated.floorInBase(axis.min, axis.tickSize)),
            i = 0,
            v = Number.NaN,
            prev;

        if (start === -Number.MAX_VALUE) {
            ticks.push(start);
            start = $.plot.saturated.floorInBase(axis.min + axis.tickSize, axis.tickSize);
        }

        do {
            prev = v;
            //v = start + i * axis.tickSize;
            v = $.plot.saturated.multiplyAdd(axis.tickSize, i, start);
            ticks.push(v);
            ++i;
        } while (v < axis.max && v !== prev);

        return ticks;
    }

    function defaultTickFormatter(value, axis, precision) {
        var oldTickDecimals = axis.tickDecimals,
            expPosition = ("" + value).indexOf("e");

        if (expPosition !== -1) {
            return expRepTickFormatter(value, axis, precision);
        }

        if (precision > 0) {
            axis.tickDecimals = precision;
        }

        var factor = axis.tickDecimals ? parseFloat('1e' + axis.tickDecimals) : 1,
            formatted = "" + Math.round(value * factor) / factor;

        // If tickDecimals was specified, ensure that we have exactly that
        // much precision; otherwise default to the value's own precision.
        if (axis.tickDecimals != null) {
            var decimal = formatted.indexOf("."),
                decimalPrecision = decimal === -1 ? 0 : formatted.length - decimal - 1;
            if (decimalPrecision < axis.tickDecimals) {
                var decimals = ("" + factor).substr(1, axis.tickDecimals - decimalPrecision);
                formatted = (decimalPrecision ? formatted : formatted + ".") + decimals;
            }
        }

        axis.tickDecimals = oldTickDecimals;
        return formatted;
    };

    function expRepTickFormatter(value, axis, precision) {
        var expPosition = ("" + value).indexOf("e"),
            exponentValue = parseInt(("" + value).substr(expPosition + 1)),
            tenExponent = expPosition !== -1 ? exponentValue : (value > 0 ? Math.floor(Math.log(value) / Math.LN10) : 0),
            roundWith = parseFloat('1e' + tenExponent),
            x = value / roundWith;

        if (precision) {
            var updatedPrecision = recomputePrecision(value, precision);
            return (value / roundWith).toFixed(updatedPrecision) + 'e' + tenExponent;
        }

        if (axis.tickDecimals > 0) {
            return x.toFixed(recomputePrecision(value, axis.tickDecimals)) + 'e' + tenExponent;
        }
        return x.toFixed() + 'e' + tenExponent;
    }

    function recomputePrecision(num, precision) {
        //for numbers close to zero, the precision from flot will be a big number
        //while for big numbers, the precision will be negative
        var log10Value = Math.log(Math.abs(num)) * Math.LOG10E,
            newPrecision = Math.abs(log10Value + precision);

        return newPrecision <= 20 ? Math.floor(newPrecision) : 20;
    }

    ///////////////////////////////////////////////////////////////////////////
    // The top-level container for the entire plot.
    function Plot(placeholder, data_, options_, plugins) {
        // data is on the form:
        //   [ series1, series2 ... ]
        // where series is either just the data as [ [x1, y1], [x2, y2], ... ]
        // or { data: [ [x1, y1], [x2, y2], ... ], label: "some label", ... }

        var series = [],
            options = {
                // the color theme used for graphs
                colors: ["#edc240", "#afd8f8", "#cb4b4b", "#4da74d", "#9440ed"],
                xaxis: {
                    show: null, // null = auto-detect, true = always, false = never
                    position: "bottom", // or "top"
                    mode: null, // null or "time"
                    font: null, // null (derived from CSS in placeholder) or object like { size: 11, lineHeight: 13, style: "italic", weight: "bold", family: "sans-serif", variant: "small-caps" }
                    color: null, // base color, labels, ticks
                    tickColor: null, // possibly different color of ticks, e.g. "rgba(0,0,0,0.15)"
                    transform: null, // null or f: number -> number to transform axis
                    inverseTransform: null, // if transform is set, this should be the inverse function
                    min: null, // min. value to show, null means set automatically
                    max: null, // max. value to show, null means set automatically
                    autoScaleMargin: null, // margin in % to add if autoScale option is on "loose" mode,
                    autoScale: "exact", // Available modes: "none", "loose", "exact", "sliding-window"
                    windowSize: null, // null or number. This is the size of sliding-window.
                    growOnly: null, // grow only, useful for smoother auto-scale, the scales will grow to accomodate data but won't shrink back.
                    ticks: null, // either [1, 3] or [[1, "a"], 3] or (fn: axis info -> ticks) or app. number of ticks for auto-ticks
                    tickFormatter: null, // fn: number -> string
                    showTickLabels: "major", // "none", "endpoints", "major", "all"
                    labelWidth: null, // size of tick labels in pixels
                    labelHeight: null,
                    reserveSpace: null, // whether to reserve space even if axis isn't shown
                    tickLength: null, // size in pixels of major tick marks
                    showMinorTicks: null, // true = show minor tick marks, false = hide minor tick marks
                    showTicks: null, // true = show tick marks, false = hide all tick marks
                    gridLines: null, // true = show grid lines, false = hide grid lines
                    alignTicksWithAxis: null, // axis number or null for no sync
                    tickDecimals: null, // no. of decimals, null means auto
                    tickSize: null, // number or [number, "unit"]
                    minTickSize: null, // number or [number, "unit"]
                    offset: { below: 0, above: 0 }, // the plot drawing offset. this is calculated by the flot.navigate for each axis
                    boxPosition: { centerX: 0, centerY: 0 } //position of the axis on the corresponding axis box
                },
                yaxis: {
                    autoScaleMargin: 0.02, // margin in % to add if autoScale option is on "loose" mode
                    autoScale: "loose", // Available modes: "none", "loose", "exact"
                    growOnly: null, // grow only, useful for smoother auto-scale, the scales will grow to accomodate data but won't shrink back.
                    position: "left", // or "right"
                    showTickLabels: "major", // "none", "endpoints", "major", "all"
                    offset: { below: 0, above: 0 }, // the plot drawing offset. this is calculated by the flot.navigate for each axis
                    boxPosition: { centerX: 0, centerY: 0 } //position of the axis on the corresponding axis box
                },
                xaxes: [],
                yaxes: [],
                series: {
                    points: {
                        show: false,
                        radius: 3,
                        lineWidth: 2, // in pixels
                        fill: true,
                        fillColor: "#ffffff",
                        symbol: 'circle' // or callback
                    },
                    lines: {
                        // we don't put in show: false so we can see
                        // whether lines were actively disabled
                        lineWidth: 1, // in pixels
                        fill: false,
                        fillColor: null,
                        steps: false
                        // Omit 'zero', so we can later default its value to
                        // match that of the 'fill' option.
                    },
                    bars: {
                        show: false,
                        lineWidth: 2, // in pixels
                        // barWidth: number or [number, absolute]
                        // when 'absolute' is false, 'number' is relative to the minimum distance between points for the series
                        // when 'absolute' is true, 'number' is considered to be in units of the x-axis
                        horizontal: false,
                        barWidth: 0.8,
                        fill: true,
                        fillColor: null,
                        align: "left", // "left", "right", or "center"
                        zero: true
                    },
                    shadowSize: 3,
                    highlightColor: null
                },
                grid: {
                    show: true,
                    aboveData: false,
                    color: "#545454", // primary color used for outline and labels
                    backgroundColor: null, // null for transparent, else color
                    borderColor: null, // set if different from the grid color
                    tickColor: null, // color for the ticks, e.g. "rgba(0,0,0,0.15)"
                    margin: 0, // distance from the canvas edge to the grid
                    labelMargin: 5, // in pixels
                    axisMargin: 8, // in pixels
                    borderWidth: 1, // in pixels
                    minBorderMargin: null, // in pixels, null means taken from points radius
                    markings: null, // array of ranges or fn: axes -> array of ranges
                    markingsColor: "#f4f4f4",
                    markingsLineWidth: 2,
                    // interactive stuff
                    clickable: false,
                    hoverable: false,
                    autoHighlight: true, // highlight in case mouse is near
                    mouseActiveRadius: 15 // how far the mouse can be away to activate an item
                },
                interaction: {
                    redrawOverlayInterval: 1000 / 60 // time between updates, -1 means in same flow
                },
                hooks: {}
            },
            surface = null, // the canvas for the plot itself
            overlay = null, // canvas for interactive stuff on top of plot
            eventHolder = null, // jQuery object that events should be bound to
            ctx = null,
            octx = null,
            xaxes = [],
            yaxes = [],
            plotOffset = {
                left: 0,
                right: 0,
                top: 0,
                bottom: 0
            },
            plotWidth = 0,
            plotHeight = 0,
            hooks = {
                processOptions: [],
                processRawData: [],
                processDatapoints: [],
                processOffset: [],
                setupGrid: [],
                adjustSeriesDataRange: [],
                setRange: [],
                drawBackground: [],
                drawSeries: [],
                drawAxis: [],
                draw: [],
                findNearbyItems: [],
                axisReserveSpace: [],
                bindEvents: [],
                drawOverlay: [],
                resize: [],
                shutdown: []
            },
            plot = this;

        var eventManager = {};

        // interactive features

        var redrawTimeout = null;

        // public functions
        plot.setData = setData;
        plot.setupGrid = setupGrid;
        plot.draw = draw;
        plot.getPlaceholder = function() {
            return placeholder;
        };
        plot.getCanvas = function() {
            return surface.element;
        };
        plot.getSurface = function() {
            return surface;
        };
        plot.getEventHolder = function() {
            return eventHolder[0];
        };
        plot.getPlotOffset = function() {
            return plotOffset;
        };
        plot.width = function() {
            return plotWidth;
        };
        plot.height = function() {
            return plotHeight;
        };
        plot.offset = function() {
            var o = eventHolder.offset();
            o.left += plotOffset.left;
            o.top += plotOffset.top;
            return o;
        };
        plot.getData = function() {
            return series;
        };
        plot.getAxes = function() {
            var res = {};
            $.each(xaxes.concat(yaxes), function(_, axis) {
                if (axis) {
                    res[axis.direction + (axis.n !== 1 ? axis.n : "") + "axis"] = axis;
                }
            });
            return res;
        };
        plot.getXAxes = function() {
            return xaxes;
        };
        plot.getYAxes = function() {
            return yaxes;
        };
        plot.c2p = canvasToCartesianAxisCoords;
        plot.p2c = cartesianAxisToCanvasCoords;
        plot.getOptions = function() {
            return options;
        };
        plot.triggerRedrawOverlay = triggerRedrawOverlay;
        plot.pointOffset = function(point) {
            return {
                left: parseInt(xaxes[axisNumber(point, "x") - 1].p2c(+point.x) + plotOffset.left, 10),
                top: parseInt(yaxes[axisNumber(point, "y") - 1].p2c(+point.y) + plotOffset.top, 10)
            };
        };
        plot.shutdown = shutdown;
        plot.destroy = function() {
            shutdown();
            placeholder.removeData("plot").empty();

            series = [];
            options = null;
            surface = null;
            overlay = null;
            eventHolder = null;
            ctx = null;
            octx = null;
            xaxes = [];
            yaxes = [];
            hooks = null;
            plot = null;
        };

        plot.resize = function() {
            var width = placeholder.width(),
                height = placeholder.height();
            surface.resize(width, height);
            overlay.resize(width, height);

            executeHooks(hooks.resize, [width, height]);
        };

        plot.clearTextCache = function () {
            surface.clearCache();
            overlay.clearCache();
        };

        plot.autoScaleAxis = autoScaleAxis;
        plot.computeRangeForDataSeries = computeRangeForDataSeries;
        plot.adjustSeriesDataRange = adjustSeriesDataRange;
        plot.findNearbyItem = findNearbyItem;
        plot.findNearbyItems = findNearbyItems;
        plot.findNearbyInterpolationPoint = findNearbyInterpolationPoint;
        plot.computeValuePrecision = computeValuePrecision;
        plot.computeTickSize = computeTickSize;
        plot.addEventHandler = addEventHandler;

        // public attributes
        plot.hooks = hooks;

        // initialize
        var MINOR_TICKS_COUNT_CONSTANT = $.plot.uiConstants.MINOR_TICKS_COUNT_CONSTANT;
        var TICK_LENGTH_CONSTANT = $.plot.uiConstants.TICK_LENGTH_CONSTANT;
        initPlugins(plot);
        setupCanvases();
        parseOptions(options_);
        setData(data_);
        setupGrid(true);
        draw();
        bindEvents();

        function executeHooks(hook, args) {
            args = [plot].concat(args);
            for (var i = 0; i < hook.length; ++i) {
                hook[i].apply(this, args);
            }
        }

        function initPlugins() {
            // References to key classes, allowing plugins to modify them

            var classes = {
                Canvas: Canvas
            };

            for (var i = 0; i < plugins.length; ++i) {
                var p = plugins[i];
                p.init(plot, classes);
                if (p.options) {
                    $.extend(true, options, p.options);
                }
            }
        }

        function parseOptions(opts) {
            $.extend(true, options, opts);

            // $.extend merges arrays, rather than replacing them.  When less
            // colors are provided than the size of the default palette, we
            // end up with those colors plus the remaining defaults, which is
            // not expected behavior; avoid it by replacing them here.

            if (opts && opts.colors) {
                options.colors = opts.colors;
            }

            if (options.xaxis.color == null) {
                options.xaxis.color = $.color.parse(options.grid.color).scale('a', 0.22).toString();
            }

            if (options.yaxis.color == null) {
                options.yaxis.color = $.color.parse(options.grid.color).scale('a', 0.22).toString();
            }

            if (options.xaxis.tickColor == null) {
                // grid.tickColor for back-compatibility
                options.xaxis.tickColor = options.grid.tickColor || options.xaxis.color;
            }

            if (options.yaxis.tickColor == null) {
                // grid.tickColor for back-compatibility
                options.yaxis.tickColor = options.grid.tickColor || options.yaxis.color;
            }

            if (options.grid.borderColor == null) {
                options.grid.borderColor = options.grid.color;
            }

            if (options.grid.tickColor == null) {
                options.grid.tickColor = $.color.parse(options.grid.color).scale('a', 0.22).toString();
            }

            // Fill in defaults for axis options, including any unspecified
            // font-spec fields, if a font-spec was provided.

            // If no x/y axis options were provided, create one of each anyway,
            // since the rest of the code assumes that they exist.

            var i, axisOptions, axisCount,
                fontSize = placeholder.css("font-size"),
                fontSizeDefault = fontSize ? +fontSize.replace("px", "") : 13,
                fontDefaults = {
                    style: placeholder.css("font-style"),
                    size: Math.round(0.8 * fontSizeDefault),
                    variant: placeholder.css("font-variant"),
                    weight: placeholder.css("font-weight"),
                    family: placeholder.css("font-family")
                };

            axisCount = options.xaxes.length || 1;
            for (i = 0; i < axisCount; ++i) {
                axisOptions = options.xaxes[i];
                if (axisOptions && !axisOptions.tickColor) {
                    axisOptions.tickColor = axisOptions.color;
                }

                axisOptions = $.extend(true, {}, options.xaxis, axisOptions);
                options.xaxes[i] = axisOptions;

                if (axisOptions.font) {
                    axisOptions.font = $.extend({}, fontDefaults, axisOptions.font);
                    if (!axisOptions.font.color) {
                        axisOptions.font.color = axisOptions.color;
                    }
                    if (!axisOptions.font.lineHeight) {
                        axisOptions.font.lineHeight = Math.round(axisOptions.font.size * 1.15);
                    }
                }
            }

            axisCount = options.yaxes.length || 1;
            for (i = 0; i < axisCount; ++i) {
                axisOptions = options.yaxes[i];
                if (axisOptions && !axisOptions.tickColor) {
                    axisOptions.tickColor = axisOptions.color;
                }

                axisOptions = $.extend(true, {}, options.yaxis, axisOptions);
                options.yaxes[i] = axisOptions;

                if (axisOptions.font) {
                    axisOptions.font = $.extend({}, fontDefaults, axisOptions.font);
                    if (!axisOptions.font.color) {
                        axisOptions.font.color = axisOptions.color;
                    }
                    if (!axisOptions.font.lineHeight) {
                        axisOptions.font.lineHeight = Math.round(axisOptions.font.size * 1.15);
                    }
                }
            }

            // save options on axes for future reference
            for (i = 0; i < options.xaxes.length; ++i) {
                getOrCreateAxis(xaxes, i + 1).options = options.xaxes[i];
            }

            for (i = 0; i < options.yaxes.length; ++i) {
                getOrCreateAxis(yaxes, i + 1).options = options.yaxes[i];
            }

            //process boxPosition options used for axis.box size
            $.each(allAxes(), function(_, axis) {
                axis.boxPosition = axis.options.boxPosition || {centerX: 0, centerY: 0};
            });

            // add hooks from options
            for (var n in hooks) {
                if (options.hooks[n] && options.hooks[n].length) {
                    hooks[n] = hooks[n].concat(options.hooks[n]);
                }
            }

            executeHooks(hooks.processOptions, [options]);
        }

        function setData(d) {
            var oldseries = series;
            series = parseData(d);
            fillInSeriesOptions();
            processData(oldseries);
        }

        function parseData(d) {
            var res = [];
            for (var i = 0; i < d.length; ++i) {
                var s = $.extend(true, {}, options.series);

                if (d[i].data != null) {
                    s.data = d[i].data; // move the data instead of deep-copy
                    delete d[i].data;

                    $.extend(true, s, d[i]);

                    d[i].data = s.data;
                } else {
                    s.data = d[i];
                }

                res.push(s);
            }

            return res;
        }

        function axisNumber(obj, coord) {
            var a = obj[coord + "axis"];
            if (typeof a === "object") {
                // if we got a real axis, extract number
                a = a.n;
            }

            if (typeof a !== "number") {
                a = 1; // default to first axis
            }

            return a;
        }

        function allAxes() {
            // return flat array without annoying null entries
            return xaxes.concat(yaxes).filter(function(a) {
                return a;
            });
        }

        // canvas to axis for cartesian axes
        function canvasToCartesianAxisCoords(pos) {
            // return an object with x/y corresponding to all used axes
            var res = {},
                i, axis;
            for (i = 0; i < xaxes.length; ++i) {
                axis = xaxes[i];
                if (axis && axis.used) {
                    res["x" + axis.n] = axis.c2p(pos.left);
                }
            }

            for (i = 0; i < yaxes.length; ++i) {
                axis = yaxes[i];
                if (axis && axis.used) {
                    res["y" + axis.n] = axis.c2p(pos.top);
                }
            }

            if (res.x1 !== undefined) {
                res.x = res.x1;
            }

            if (res.y1 !== undefined) {
                res.y = res.y1;
            }

            return res;
        }

        // axis to canvas for cartesian axes
        function cartesianAxisToCanvasCoords(pos) {
            // get canvas coords from the first pair of x/y found in pos
            var res = {},
                i, axis, key;

            for (i = 0; i < xaxes.length; ++i) {
                axis = xaxes[i];
                if (axis && axis.used) {
                    key = "x" + axis.n;
                    if (pos[key] == null && axis.n === 1) {
                        key = "x";
                    }

                    if (pos[key] != null) {
                        res.left = axis.p2c(pos[key]);
                        break;
                    }
                }
            }

            for (i = 0; i < yaxes.length; ++i) {
                axis = yaxes[i];
                if (axis && axis.used) {
                    key = "y" + axis.n;
                    if (pos[key] == null && axis.n === 1) {
                        key = "y";
                    }

                    if (pos[key] != null) {
                        res.top = axis.p2c(pos[key]);
                        break;
                    }
                }
            }

            return res;
        }

        function getOrCreateAxis(axes, number) {
            if (!axes[number - 1]) {
                axes[number - 1] = {
                    n: number, // save the number for future reference
                    direction: axes === xaxes ? "x" : "y",
                    options: $.extend(true, {}, axes === xaxes ? options.xaxis : options.yaxis)
                };
            }

            return axes[number - 1];
        }

        function fillInSeriesOptions() {
            var neededColors = series.length,
                maxIndex = -1,
                i;

            // Subtract the number of series that already have fixed colors or
            // color indexes from the number that we still need to generate.

            for (i = 0; i < series.length; ++i) {
                var sc = series[i].color;
                if (sc != null) {
                    neededColors--;
                    if (typeof sc === "number" && sc > maxIndex) {
                        maxIndex = sc;
                    }
                }
            }

            // If any of the series have fixed color indexes, then we need to
            // generate at least as many colors as the highest index.

            if (neededColors <= maxIndex) {
                neededColors = maxIndex + 1;
            }

            // Generate all the colors, using first the option colors and then
            // variations on those colors once they're exhausted.

            var c, colors = [],
                colorPool = options.colors,
                colorPoolSize = colorPool.length,
                variation = 0,
                definedColors = Math.max(0, series.length - neededColors);

            for (i = 0; i < neededColors; i++) {
                c = $.color.parse(colorPool[(definedColors + i) % colorPoolSize] || "#666");

                // Each time we exhaust the colors in the pool we adjust
                // a scaling factor used to produce more variations on
                // those colors. The factor alternates negative/positive
                // to produce lighter/darker colors.

                // Reset the variation after every few cycles, or else
                // it will end up producing only white or black colors.

                if (i % colorPoolSize === 0 && i) {
                    if (variation >= 0) {
                        if (variation < 0.5) {
                            variation = -variation - 0.2;
                        } else variation = 0;
                    } else variation = -variation;
                }

                colors[i] = c.scale('rgb', 1 + variation);
            }

            // Finalize the series options, filling in their colors

            var colori = 0,
                s;
            for (i = 0; i < series.length; ++i) {
                s = series[i];

                // assign colors
                if (s.color == null) {
                    s.color = colors[colori].toString();
                    ++colori;
                } else if (typeof s.color === "number") {
                    s.color = colors[s.color].toString();
                }

                // turn on lines automatically in case nothing is set
                if (s.lines.show == null) {
                    var v, show = true;
                    for (v in s) {
                        if (s[v] && s[v].show) {
                            show = false;
                            break;
                        }
                    }

                    if (show) {
                        s.lines.show = true;
                    }
                }

                // If nothing was provided for lines.zero, default it to match
                // lines.fill, since areas by default should extend to zero.

                if (s.lines.zero == null) {
                    s.lines.zero = !!s.lines.fill;
                }

                // setup axes
                s.xaxis = getOrCreateAxis(xaxes, axisNumber(s, "x"));
                s.yaxis = getOrCreateAxis(yaxes, axisNumber(s, "y"));
            }
        }

        function processData(prevSeries) {
            var topSentry = Number.POSITIVE_INFINITY,
                bottomSentry = Number.NEGATIVE_INFINITY,
                i, j, k, m,
                s, points, ps, val, f, p,
                data, format;

            function updateAxis(axis, min, max) {
                if (min < axis.datamin && min !== -Infinity) {
                    axis.datamin = min;
                }

                if (max > axis.datamax && max !== Infinity) {
                    axis.datamax = max;
                }
            }

            function reusePoints(prevSeries, i) {
                if (prevSeries && prevSeries[i] && prevSeries[i].datapoints && prevSeries[i].datapoints.points) {
                    return prevSeries[i].datapoints.points;
                }

                return [];
            }

            $.each(allAxes(), function(_, axis) {
                // init axis
                if (axis.options.growOnly !== true) {
                    axis.datamin = topSentry;
                    axis.datamax = bottomSentry;
                } else {
                    if (axis.datamin === undefined) {
                        axis.datamin = topSentry;
                    }
                    if (axis.datamax === undefined) {
                        axis.datamax = bottomSentry;
                    }
                }
                axis.used = false;
            });

            for (i = 0; i < series.length; ++i) {
                s = series[i];
                s.datapoints = {
                    points: []
                };

                if (s.datapoints.points.length === 0) {
                    s.datapoints.points = reusePoints(prevSeries, i);
                }

                executeHooks(hooks.processRawData, [s, s.data, s.datapoints]);
            }

            // first pass: clean and copy data
            for (i = 0; i < series.length; ++i) {
                s = series[i];

                data = s.data;
                format = s.datapoints.format;

                if (!format) {
                    format = [];
                    // find out how to copy
                    format.push({
                        x: true,
                        y: false,
                        number: true,
                        required: true,
                        computeRange: s.xaxis.options.autoScale !== 'none',
                        defaultValue: null
                    });

                    format.push({
                        x: false,
                        y: true,
                        number: true,
                        required: true,
                        computeRange: s.yaxis.options.autoScale !== 'none',
                        defaultValue: null
                    });

                    if (s.stack || s.bars.show || (s.lines.show && s.lines.fill)) {
                        var expectedPs = s.datapoints.pointsize != null ? s.datapoints.pointsize : (s.data && s.data[0] && s.data[0].length ? s.data[0].length : 3);
                        if (expectedPs > 2) {
                            format.push({
                                x: false,
                                y: true,
                                number: true,
                                required: false,
                                computeRange: s.yaxis.options.autoScale !== 'none',
                                defaultValue: 0
                            });
                        }
                    }

                    s.datapoints.format = format;
                }

                s.xaxis.used = s.yaxis.used = true;

                if (s.datapoints.pointsize != null) continue; // already filled in

                s.datapoints.pointsize = format.length;
                ps = s.datapoints.pointsize;
                points = s.datapoints.points;

                var insertSteps = s.lines.show && s.lines.steps;

                for (j = k = 0; j < data.length; ++j, k += ps) {
                    p = data[j];

                    var nullify = p == null;
                    if (!nullify) {
                        for (m = 0; m < ps; ++m) {
                            val = p[m];
                            f = format[m];

                            if (f) {
                                if (f.number && val != null) {
                                    val = +val; // convert to number
                                    if (isNaN(val)) {
                                        val = null;
                                    }
                                }

                                if (val == null) {
                                    if (f.required) nullify = true;

                                    if (f.defaultValue != null) val = f.defaultValue;
                                }
                            }

                            points[k + m] = val;
                        }
                    }

                    if (nullify) {
                        for (m = 0; m < ps; ++m) {
                            val = points[k + m];
                            if (val != null) {
                                f = format[m];
                                // extract min/max info
                                if (f.computeRange) {
                                    if (f.x) {
                                        updateAxis(s.xaxis, val, val);
                                    }
                                    if (f.y) {
                                        updateAxis(s.yaxis, val, val);
                                    }
                                }
                            }
                            points[k + m] = null;
                        }
                    }
                }

                points.length = k; //trims the internal buffer to the correct length
            }

            // give the hooks a chance to run
            for (i = 0; i < series.length; ++i) {
                s = series[i];

                executeHooks(hooks.processDatapoints, [s, s.datapoints]);
            }

            // second pass: find datamax/datamin for auto-scaling
            for (i = 0; i < series.length; ++i) {
                s = series[i];
                format = s.datapoints.format;

                if (format.every(function (f) { return !f.computeRange; })) {
                    continue;
                }

                var range = plot.adjustSeriesDataRange(s,
                    plot.computeRangeForDataSeries(s));

                executeHooks(hooks.adjustSeriesDataRange, [s, range]);

                updateAxis(s.xaxis, range.xmin, range.xmax);
                updateAxis(s.yaxis, range.ymin, range.ymax);
            }

            $.each(allAxes(), function(_, axis) {
                if (axis.datamin === topSentry) {
                    axis.datamin = null;
                }

                if (axis.datamax === bottomSentry) {
                    axis.datamax = null;
                }
            });
        }

        function setupCanvases() {
            // Make sure the placeholder is clear of everything except canvases
            // from a previous plot in this container that we'll try to re-use.

            placeholder.css("padding", 0) // padding messes up the positioning
                .children().filter(function() {
                    return !$(this).hasClass("flot-overlay") && !$(this).hasClass('flot-base');
                }).remove();

            if (placeholder.css("position") === 'static') {
                placeholder.css("position", "relative"); // for positioning labels and overlay
            }

            surface = new Canvas("flot-base", placeholder[0]);
            overlay = new Canvas("flot-overlay", placeholder[0]); // overlay canvas for interactive features

            ctx = surface.context;
            octx = overlay.context;

            // define which element we're listening for events on
            eventHolder = $(overlay.element).unbind();

            // If we're re-using a plot object, shut down the old one

            var existing = placeholder.data("plot");

            if (existing) {
                existing.shutdown();
                overlay.clear();
            }

            // save in case we get replotted
            placeholder.data("plot", plot);
        }

        function bindEvents() {
            executeHooks(hooks.bindEvents, [eventHolder]);
        }

        function addEventHandler(event, handler, eventHolder, priority) {
            var key = eventHolder + event;
            var eventList = eventManager[key] || [];

            eventList.push({"event": event, "handler": handler, "eventHolder": eventHolder, "priority": priority});
            eventList.sort((a, b) => b.priority - a.priority );
            eventList.forEach( eventData => {
                eventData.eventHolder.unbind(eventData.event, eventData.handler);
                eventData.eventHolder.bind(eventData.event, eventData.handler);
            });

            eventManager[key] = eventList;
        }

        function shutdown() {
            if (redrawTimeout) {
                clearTimeout(redrawTimeout);
            }

            executeHooks(hooks.shutdown, [eventHolder]);
        }

        function setTransformationHelpers(axis) {
            // set helper functions on the axis, assumes plot area
            // has been computed already

            function identity(x) {
                return x;
            }

            var s, m, t = axis.options.transform || identity,
                it = axis.options.inverseTransform;

            // precompute how much the axis is scaling a point
            // in canvas space
            if (axis.direction === "x") {
                if (isFinite(t(axis.max) - t(axis.min))) {
                    s = axis.scale = plotWidth / Math.abs(t(axis.max) - t(axis.min));
                } else {
                    s = axis.scale = 1 / Math.abs($.plot.saturated.delta(t(axis.min), t(axis.max), plotWidth));
                }
                m = Math.min(t(axis.max), t(axis.min));
            } else {
                if (isFinite(t(axis.max) - t(axis.min))) {
                    s = axis.scale = plotHeight / Math.abs(t(axis.max) - t(axis.min));
                } else {
                    s = axis.scale = 1 / Math.abs($.plot.saturated.delta(t(axis.min), t(axis.max), plotHeight));
                }
                s = -s;
                m = Math.max(t(axis.max), t(axis.min));
            }

            // data point to canvas coordinate
            if (t === identity) {
                // slight optimization
                axis.p2c = function(p) {
                    if (isFinite(p - m)) {
                        return (p - m) * s;
                    } else {
                        return (p / 4 - m / 4) * s * 4;
                    }
                };
            } else {
                axis.p2c = function(p) {
                    var tp = t(p);

                    if (isFinite(tp - m)) {
                        return (tp - m) * s;
                    } else {
                        return (tp / 4 - m / 4) * s * 4;
                    }
                };
            }

            // canvas coordinate to data point
            if (!it) {
                axis.c2p = function(c) {
                    return m + c / s;
                };
            } else {
                axis.c2p = function(c) {
                    return it(m + c / s);
                };
            }
        }

        function measureTickLabels(axis) {
            var opts = axis.options,
                ticks = opts.showTickLabels !== 'none' && axis.ticks ? axis.ticks : [],
                showMajorTickLabels = opts.showTickLabels === 'major' || opts.showTickLabels === 'all',
                showEndpointsTickLabels = opts.showTickLabels === 'endpoints' || opts.showTickLabels === 'all',
                labelWidth = opts.labelWidth || 0,
                labelHeight = opts.labelHeight || 0,
                legacyStyles = axis.direction + "Axis " + axis.direction + axis.n + "Axis",
                layer = "flot-" + axis.direction + "-axis flot-" + axis.direction + axis.n + "-axis " + legacyStyles,
                font = opts.font || "flot-tick-label tickLabel";

            for (var i = 0; i < ticks.length; ++i) {
                var t = ticks[i];
                var label = t.label;

                if (!t.label ||
                    (showMajorTickLabels === false && i > 0 && i < ticks.length - 1) ||
                    (showEndpointsTickLabels === false && (i === 0 || i === ticks.length - 1))) {
                    continue;
                }

                if (typeof t.label === 'object') {
                    label = t.label.name;
                }

                var info = surface.getTextInfo(layer, label, font);

                labelWidth = Math.max(labelWidth, info.width);
                labelHeight = Math.max(labelHeight, info.height);
            }

            axis.labelWidth = opts.labelWidth || labelWidth;
            axis.labelHeight = opts.labelHeight || labelHeight;
        }

        function allocateAxisBoxFirstPhase(axis) {
            // find the bounding box of the axis by looking at label
            // widths/heights and ticks, make room by diminishing the
            // plotOffset; this first phase only looks at one
            // dimension per axis, the other dimension depends on the
            // other axes so will have to wait

            // here reserve additional space
            executeHooks(hooks.axisReserveSpace, [axis]);

            var lw = axis.labelWidth,
                lh = axis.labelHeight,
                pos = axis.options.position,
                isXAxis = axis.direction === "x",
                tickLength = axis.options.tickLength,
                showTicks = axis.options.showTicks,
                showMinorTicks = axis.options.showMinorTicks,
                gridLines = axis.options.gridLines,
                axisMargin = options.grid.axisMargin,
                padding = options.grid.labelMargin,
                innermost = true,
                outermost = true,
                found = false;

            // Determine the axis's position in its direction and on its side

            $.each(isXAxis ? xaxes : yaxes, function(i, a) {
                if (a && (a.show || a.reserveSpace)) {
                    if (a === axis) {
                        found = true;
                    } else if (a.options.position === pos) {
                        if (found) {
                            outermost = false;
                        } else {
                            innermost = false;
                        }
                    }
                }
            });

            // The outermost axis on each side has no margin
            if (outermost) {
                axisMargin = 0;
            }

            // Set the default tickLength if necessary
            if (tickLength == null) {
                tickLength = TICK_LENGTH_CONSTANT;
            }

            // By default, major tick marks are visible
            if (showTicks == null) {
                showTicks = true;
            }

            // By default, minor tick marks are visible
            if (showMinorTicks == null) {
                showMinorTicks = true;
            }

            // By default, grid lines are visible
            if (gridLines == null) {
                if (innermost) {
                    gridLines = true;
                } else {
                    gridLines = false;
                }
            }

            if (!isNaN(+tickLength)) {
                padding += showTicks ? +tickLength : 0;
            }

            if (isXAxis) {
                lh += padding;

                if (pos === "bottom") {
                    plotOffset.bottom += lh + axisMargin;
                    axis.box = {
                        top: surface.height - plotOffset.bottom,
                        height: lh
                    };
                } else {
                    axis.box = {
                        top: plotOffset.top + axisMargin,
                        height: lh
                    };
                    plotOffset.top += lh + axisMargin;
                }
            } else {
                lw += padding;

                if (pos === "left") {
                    axis.box = {
                        left: plotOffset.left + axisMargin,
                        width: lw
                    };
                    plotOffset.left += lw + axisMargin;
                } else {
                    plotOffset.right += lw + axisMargin;
                    axis.box = {
                        left: surface.width - plotOffset.right,
                        width: lw
                    };
                }
            }

            // save for future reference
            axis.position = pos;
            axis.tickLength = tickLength;
            axis.showMinorTicks = showMinorTicks;
            axis.showTicks = showTicks;
            axis.gridLines = gridLines;
            axis.box.padding = padding;
            axis.innermost = innermost;
        }

        function allocateAxisBoxSecondPhase(axis) {
            // now that all axis boxes have been placed in one
            // dimension, we can set the remaining dimension coordinates
            if (axis.direction === "x") {
                axis.box.left = plotOffset.left - axis.labelWidth / 2;
                axis.box.width = surface.width - plotOffset.left - plotOffset.right + axis.labelWidth;
            } else {
                axis.box.top = plotOffset.top - axis.labelHeight / 2;
                axis.box.height = surface.height - plotOffset.bottom - plotOffset.top + axis.labelHeight;
            }
        }

        function adjustLayoutForThingsStickingOut() {
            // possibly adjust plot offset to ensure everything stays
            // inside the canvas and isn't clipped off

            var minMargin = options.grid.minBorderMargin,
                i;

            // check stuff from the plot (FIXME: this should just read
            // a value from the series, otherwise it's impossible to
            // customize)
            if (minMargin == null) {
                minMargin = 0;
                for (i = 0; i < series.length; ++i) {
                    minMargin = Math.max(minMargin, 2 * (series[i].points.radius + series[i].points.lineWidth / 2));
                }
            }

            var a, offset = {},
                margins = {
                    left: minMargin,
                    right: minMargin,
                    top: minMargin,
                    bottom: minMargin
                };

            // check axis labels, note we don't check the actual
            // labels but instead use the overall width/height to not
            // jump as much around with replots
            $.each(allAxes(), function(_, axis) {
                if (axis.reserveSpace && axis.ticks && axis.ticks.length) {
                    if (axis.direction === "x") {
                        margins.left = Math.max(margins.left, axis.labelWidth / 2);
                        margins.right = Math.max(margins.right, axis.labelWidth / 2);
                    } else {
                        margins.bottom = Math.max(margins.bottom, axis.labelHeight / 2);
                        margins.top = Math.max(margins.top, axis.labelHeight / 2);
                    }
                }
            });

            for (a in margins) {
                offset[a] = margins[a] - plotOffset[a];
            }
            $.each(xaxes.concat(yaxes), function(_, axis) {
                alignAxisWithGrid(axis, offset, function (offset) {
                    return offset > 0;
                });
            });

            plotOffset.left = Math.ceil(Math.max(margins.left, plotOffset.left));
            plotOffset.right = Math.ceil(Math.max(margins.right, plotOffset.right));
            plotOffset.top = Math.ceil(Math.max(margins.top, plotOffset.top));
            plotOffset.bottom = Math.ceil(Math.max(margins.bottom, plotOffset.bottom));
        }

        function alignAxisWithGrid(axis, offset, isValid) {
            if (axis.direction === "x") {
                if (axis.position === "bottom" && isValid(offset.bottom)) {
                    axis.box.top -= Math.ceil(offset.bottom);
                }
                if (axis.position === "top" && isValid(offset.top)) {
                    axis.box.top += Math.ceil(offset.top);
                }
            } else {
                if (axis.position === "left" && isValid(offset.left)) {
                    axis.box.left += Math.ceil(offset.left);
                }
                if (axis.position === "right" && isValid(offset.right)) {
                    axis.box.left -= Math.ceil(offset.right);
                }
            }
        }

        function setupGrid(autoScale) {
            var i, a, axes = allAxes(),
                showGrid = options.grid.show;

            // Initialize the plot's offset from the edge of the canvas

            for (a in plotOffset) {
                plotOffset[a] = 0;
            }

            executeHooks(hooks.processOffset, [plotOffset]);

            // If the grid is visible, add its border width to the offset
            for (a in plotOffset) {
                if (typeof (options.grid.borderWidth) === "object") {
                    plotOffset[a] += showGrid ? options.grid.borderWidth[a] : 0;
                } else {
                    plotOffset[a] += showGrid ? options.grid.borderWidth : 0;
                }
            }

            $.each(axes, function(_, axis) {
                var axisOpts = axis.options;
                axis.show = axisOpts.show == null ? axis.used : axisOpts.show;
                axis.reserveSpace = axisOpts.reserveSpace == null ? axis.show : axisOpts.reserveSpace;
                setupTickFormatter(axis);
                executeHooks(hooks.setRange, [axis, autoScale]);
                setRange(axis, autoScale);
            });

            if (showGrid) {
                plotWidth = surface.width - plotOffset.left - plotOffset.right;
                plotHeight = surface.height - plotOffset.bottom - plotOffset.top;

                var allocatedAxes = $.grep(axes, function(axis) {
                    return axis.show || axis.reserveSpace;
                });

                $.each(allocatedAxes, function(_, axis) {
                    // make the ticks
                    setupTickGeneration(axis);
                    setMajorTicks(axis);
                    snapRangeToTicks(axis, axis.ticks, series);

                    //for computing the endpoints precision, transformationHelpers are needed
                    setTransformationHelpers(axis);
                    setEndpointTicks(axis, series);

                    // find labelWidth/Height for axis
                    measureTickLabels(axis);
                });

                // with all dimensions calculated, we can compute the
                // axis bounding boxes, start from the outside
                // (reverse order)
                for (i = allocatedAxes.length - 1; i >= 0; --i) {
                    allocateAxisBoxFirstPhase(allocatedAxes[i]);
                }

                // make sure we've got enough space for things that
                // might stick out
                adjustLayoutForThingsStickingOut();

                $.each(allocatedAxes, function(_, axis) {
                    allocateAxisBoxSecondPhase(axis);
                });
            }

            //adjust axis and plotOffset according to grid.margins
            if (options.grid.margin) {
                for (a in plotOffset) {
                    var margin = options.grid.margin || 0;
                    plotOffset[a] += typeof margin === "number" ? margin : (margin[a] || 0);
                }
                $.each(xaxes.concat(yaxes), function(_, axis) {
                    alignAxisWithGrid(axis, options.grid.margin, function(offset) {
                        return offset !== undefined && offset !== null;
                    });
                });
            }

            //after adjusting the axis, plot width and height will be modified
            plotWidth = surface.width - plotOffset.left - plotOffset.right;
            plotHeight = surface.height - plotOffset.bottom - plotOffset.top;

            // now we got the proper plot dimensions, we can compute the scaling
            $.each(axes, function(_, axis) {
                setTransformationHelpers(axis);
            });

            if (showGrid) {
                drawAxisLabels();
            }

            executeHooks(hooks.setupGrid, []);
        }

        function widenMinMax(minimum, maximum) {
            var min = (minimum === undefined ? null : minimum);
            var max = (maximum === undefined ? null : maximum);
            var delta = max - min;
            if (delta === 0.0) {
                // degenerate case
                var widen = max === 0 ? 1 : 0.01;
                var wmin = null;
                if (min == null) {
                    wmin -= widen;
                }

                // always widen max if we couldn't widen min to ensure we
                // don't fall into min == max which doesn't work
                if (max == null || min != null) {
                    max += widen;
                }

                if (wmin != null) {
                    min = wmin;
                }
            }

            return {
                min: min,
                max: max
            };
        }

        function autoScaleAxis(axis) {
            var opts = axis.options,
                min = opts.min,
                max = opts.max,
                datamin = axis.datamin,
                datamax = axis.datamax,
                delta;

            switch (opts.autoScale) {
                case "none":
                    min = +(opts.min != null ? opts.min : datamin);
                    max = +(opts.max != null ? opts.max : datamax);
                    break;
                case "loose":
                    if (datamin != null && datamax != null) {
                        min = datamin;
                        max = datamax;
                        delta = $.plot.saturated.saturate(max - min);
                        var margin = ((typeof opts.autoScaleMargin === 'number') ? opts.autoScaleMargin : 0.02);
                        min = $.plot.saturated.saturate(min - delta * margin);
                        max = $.plot.saturated.saturate(max + delta * margin);

                        // make sure we don't go below zero if all values are positive
                        if (min < 0 && datamin >= 0) {
                            min = 0;
                        }
                    } else {
                        min = opts.min;
                        max = opts.max;
                    }
                    break;
                case "exact":
                    min = (datamin != null ? datamin : opts.min);
                    max = (datamax != null ? datamax : opts.max);
                    break;
                case "sliding-window":
                    if (datamax > max) {
                        // move the window to fit the new data,
                        // keeping the axis range constant
                        max = datamax;
                        min = Math.max(datamax - (opts.windowSize || 100), min);
                    }
                    break;
            }

            var widenedMinMax = widenMinMax(min, max);
            min = widenedMinMax.min;
            max = widenedMinMax.max;

            // grow loose or grow exact supported
            if (opts.growOnly === true && opts.autoScale !== "none" && opts.autoScale !== "sliding-window") {
                min = (min < datamin) ? min : (datamin !== null ? datamin : min);
                max = (max > datamax) ? max : (datamax !== null ? datamax : max);
            }

            axis.autoScaledMin = min;
            axis.autoScaledMax = max;
        }

        function setRange(axis, autoScale) {
            var min = typeof axis.options.min === 'number' ? axis.options.min : axis.min,
                max = typeof axis.options.max === 'number' ? axis.options.max : axis.max,
                plotOffset = axis.options.offset;

            if (autoScale) {
                autoScaleAxis(axis);
                min = axis.autoScaledMin;
                max = axis.autoScaledMax;
            }

            min = (min != null ? min : -1) + (plotOffset.below || 0);
            max = (max != null ? max : 1) + (plotOffset.above || 0);

            if (min > max) {
                var tmp = min;
                min = max;
                max = tmp;
                axis.options.offset = { above: 0, below: 0 };
            }

            axis.min = $.plot.saturated.saturate(min);
            axis.max = $.plot.saturated.saturate(max);
        }

        function computeValuePrecision (min, max, direction, ticks, tickDecimals) {
            var noTicks = fixupNumberOfTicks(direction, surface, ticks);

            var delta = $.plot.saturated.delta(min, max, noTicks),
                dec = -Math.floor(Math.log(delta) / Math.LN10);

            //if it is called with tickDecimals, then the precision should not be greather then that
            if (tickDecimals && dec > tickDecimals) {
                dec = tickDecimals;
            }

            var magn = parseFloat('1e' + (-dec)),
                norm = delta / magn;

            if (norm > 2.25 && norm < 3 && (dec + 1) <= tickDecimals) {
                //we need an extra decimals when tickSize is 2.5
                ++dec;
            }

            return isFinite(dec) ? dec : 0;
        };

        function computeTickSize (min, max, noTicks, tickDecimals) {
            var delta = $.plot.saturated.delta(min, max, noTicks),
                dec = -Math.floor(Math.log(delta) / Math.LN10);

            //if it is called with tickDecimals, then the precision should not be greather then that
            if (tickDecimals && dec > tickDecimals) {
                dec = tickDecimals;
            }

            var magn = parseFloat('1e' + (-dec)),
                norm = delta / magn, // norm is between 1.0 and 10.0
                size;

            if (norm < 1.5) {
                size = 1;
            } else if (norm < 3) {
                size = 2;
                if (norm > 2.25 && (tickDecimals == null || (dec + 1) <= tickDecimals)) {
                    size = 2.5;
                }
            } else if (norm < 7.5) {
                size = 5;
            } else {
                size = 10;
            }

            size *= magn;
            return size;
        }

        function getAxisTickSize(min, max, direction, options, tickDecimals) {
            var noTicks;

            if (typeof options.ticks === "number" && options.ticks > 0) {
                noTicks = options.ticks;
            } else {
            // heuristic based on the model a*sqrt(x) fitted to
            // some data points that seemed reasonable
                noTicks = 0.3 * Math.sqrt(direction === "x" ? surface.width : surface.height);
            }

            var size = computeTickSize(min, max, noTicks, tickDecimals);

            if (options.minTickSize != null && size < options.minTickSize) {
                size = options.minTickSize;
            }

            return options.tickSize || size;
        };

        function fixupNumberOfTicks(direction, surface, ticksOption) {
            var noTicks;

            if (typeof ticksOption === "number" && ticksOption > 0) {
                noTicks = ticksOption;
            } else {
                noTicks = 0.3 * Math.sqrt(direction === "x" ? surface.width : surface.height);
            }

            return noTicks;
        }

        function setupTickFormatter(axis) {
            var opts = axis.options;
            if (!axis.tickFormatter) {
                if (typeof opts.tickFormatter === 'function') {
                    axis.tickFormatter = function() {
                        var args = Array.prototype.slice.call(arguments);
                        return "" + opts.tickFormatter.apply(null, args);
                    };
                } else {
                    axis.tickFormatter = defaultTickFormatter;
                }
            }
        }

        function setupTickGeneration(axis) {
            var opts = axis.options;
            var noTicks;

            noTicks = fixupNumberOfTicks(axis.direction, surface, opts.ticks);

            axis.delta = $.plot.saturated.delta(axis.min, axis.max, noTicks);
            var precision = plot.computeValuePrecision(axis.min, axis.max, axis.direction, noTicks, opts.tickDecimals);

            axis.tickDecimals = Math.max(0, opts.tickDecimals != null ? opts.tickDecimals : precision);
            axis.tickSize = getAxisTickSize(axis.min, axis.max, axis.direction, opts, opts.tickDecimals);

            // Flot supports base-10 axes; any other mode else is handled by a plug-in,
            // like flot.time.js.

            if (!axis.tickGenerator) {
                if (typeof opts.tickGenerator === 'function') {
                    axis.tickGenerator = opts.tickGenerator;
                } else {
                    axis.tickGenerator = defaultTickGenerator;
                }
            }

            if (opts.alignTicksWithAxis != null) {
                var otherAxis = (axis.direction === "x" ? xaxes : yaxes)[opts.alignTicksWithAxis - 1];
                if (otherAxis && otherAxis.used && otherAxis !== axis) {
                    // consider snapping min/max to outermost nice ticks
                    var niceTicks = axis.tickGenerator(axis, plot);
                    if (niceTicks.length > 0) {
                        if (opts.min == null) {
                            axis.min = Math.min(axis.min, niceTicks[0]);
                        }

                        if (opts.max == null && niceTicks.length > 1) {
                            axis.max = Math.max(axis.max, niceTicks[niceTicks.length - 1]);
                        }
                    }

                    axis.tickGenerator = function(axis) {
                        // copy ticks, scaled to this axis
                        var ticks = [],
                            v, i;
                        for (i = 0; i < otherAxis.ticks.length; ++i) {
                            v = (otherAxis.ticks[i].v - otherAxis.min) / (otherAxis.max - otherAxis.min);
                            v = axis.min + v * (axis.max - axis.min);
                            ticks.push(v);
                        }
                        return ticks;
                    };

                    // we might need an extra decimal since forced
                    // ticks don't necessarily fit naturally
                    if (!axis.mode && opts.tickDecimals == null) {
                        var extraDec = Math.max(0, -Math.floor(Math.log(axis.delta) / Math.LN10) + 1),
                            ts = axis.tickGenerator(axis, plot);

                        // only proceed if the tick interval rounded
                        // with an extra decimal doesn't give us a
                        // zero at end
                        if (!(ts.length > 1 && /\..*0$/.test((ts[1] - ts[0]).toFixed(extraDec)))) {
                            axis.tickDecimals = extraDec;
                        }
                    }
                }
            }
        }

        function setMajorTicks(axis) {
            var oticks = axis.options.ticks,
                ticks = [];
            if (oticks == null || (typeof oticks === "number" && oticks > 0)) {
                ticks = axis.tickGenerator(axis, plot);
            } else if (oticks) {
                if ($.isFunction(oticks)) {
                // generate the ticks
                    ticks = oticks(axis);
                } else {
                    ticks = oticks;
                }
            }

            // clean up/labelify the supplied ticks, copy them over
            var i, v;
            axis.ticks = [];
            for (i = 0; i < ticks.length; ++i) {
                var label = null;
                var t = ticks[i];
                if (typeof t === "object") {
                    v = +t[0];
                    if (t.length > 1) {
                        label = t[1];
                    }
                } else {
                    v = +t;
                }

                if (!isNaN(v)) {
                    axis.ticks.push(
                        newTick(v, label, axis, 'major'));
                }
            }
        }

        function newTick(v, label, axis, type) {
            if (label === null) {
                switch (type) {
                    case 'min':
                    case 'max':
                        //improving the precision of endpoints
                        var precision = getEndpointPrecision(v, axis);
                        label = isFinite(precision) ? axis.tickFormatter(v, axis, precision, plot) : axis.tickFormatter(v, axis, precision, plot);
                        break;
                    case 'major':
                        label = axis.tickFormatter(v, axis, undefined, plot);
                }
            }
            return {
                v: v,
                label: label
            };
        }

        function snapRangeToTicks(axis, ticks, series) {
            var anyDataInSeries = function(series) {
                return series.some(e => e.datapoints.points.length > 0);
            }

            if (axis.options.autoScale === "loose" && ticks.length > 0 && anyDataInSeries(series)) {
                // snap to ticks
                axis.min = Math.min(axis.min, ticks[0].v);
                axis.max = Math.max(axis.max, ticks[ticks.length - 1].v);
            }
        }

        function getEndpointPrecision(value, axis) {
            var canvas1 = Math.floor(axis.p2c(value)),
                canvas2 = axis.direction === "x" ? canvas1 + 1 : canvas1 - 1,
                point1 = axis.c2p(canvas1),
                point2 = axis.c2p(canvas2),
                precision = computeValuePrecision(point1, point2, axis.direction, 1);

            return precision;
        }

        function setEndpointTicks(axis, series) {
            if (isValidEndpointTick(axis, series)) {
                axis.ticks.unshift(newTick(axis.min, null, axis, 'min'));
                axis.ticks.push(newTick(axis.max, null, axis, 'max'));
            }
        }

        function isValidEndpointTick(axis, series) {
            if (axis.options.showTickLabels === 'endpoints') {
                return true;
            }
            if (axis.options.showTickLabels === 'all') {
                var associatedSeries = series.filter(function(s) {
                        return s.xaxis === axis;
                    }),
                    notAllBarSeries = associatedSeries.some(function(s) {
                        return !s.bars.show;
                    });
                return associatedSeries.length === 0 || notAllBarSeries;
            }
            if (axis.options.showTickLabels === 'major' || axis.options.showTickLabels === 'none') {
                return false;
            }
        }

        function draw() {
            surface.clear();
            executeHooks(hooks.drawBackground, [ctx]);

            var grid = options.grid;

            // draw background, if any
            if (grid.show && grid.backgroundColor) {
                drawBackground();
            }

            if (grid.show && !grid.aboveData) {
                drawGrid();
            }

            for (var i = 0; i < series.length; ++i) {
                executeHooks(hooks.drawSeries, [ctx, series[i], i, getColorOrGradient]);
                drawSeries(series[i]);
            }

            executeHooks(hooks.draw, [ctx]);

            if (grid.show && grid.aboveData) {
                drawGrid();
            }

            surface.render();

            // A draw implies that either the axes or data have changed, so we
            // should probably update the overlay highlights as well.
            triggerRedrawOverlay();
        }

        function extractRange(ranges, coord) {
            var axis, from, to, key, axes = allAxes();

            for (var i = 0; i < axes.length; ++i) {
                axis = axes[i];
                if (axis.direction === coord) {
                    key = coord + axis.n + "axis";
                    if (!ranges[key] && axis.n === 1) {
                        // support x1axis as xaxis
                        key = coord + "axis";
                    }

                    if (ranges[key]) {
                        from = ranges[key].from;
                        to = ranges[key].to;
                        break;
                    }
                }
            }

            // backwards-compat stuff - to be removed in future
            if (!ranges[key]) {
                axis = coord === "x" ? xaxes[0] : yaxes[0];
                from = ranges[coord + "1"];
                to = ranges[coord + "2"];
            }

            // auto-reverse as an added bonus
            if (from != null && to != null && from > to) {
                var tmp = from;
                from = to;
                to = tmp;
            }

            return {
                from: from,
                to: to,
                axis: axis
            };
        }

        function drawBackground() {
            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);

            ctx.fillStyle = getColorOrGradient(options.grid.backgroundColor, plotHeight, 0, "rgba(255, 255, 255, 0)");
            ctx.fillRect(0, 0, plotWidth, plotHeight);
            ctx.restore();
        }

        function drawMarkings() {
            // draw markings
            var markings = options.grid.markings,
                axes;

            if (markings) {
                if ($.isFunction(markings)) {
                    axes = plot.getAxes();
                    // xmin etc. is backwards compatibility, to be
                    // removed in the future
                    axes.xmin = axes.xaxis.min;
                    axes.xmax = axes.xaxis.max;
                    axes.ymin = axes.yaxis.min;
                    axes.ymax = axes.yaxis.max;

                    markings = markings(axes);
                }

                var i;
                for (i = 0; i < markings.length; ++i) {
                    var m = markings[i],
                        xrange = extractRange(m, "x"),
                        yrange = extractRange(m, "y");

                    // fill in missing
                    if (xrange.from == null) {
                        xrange.from = xrange.axis.min;
                    }

                    if (xrange.to == null) {
                        xrange.to = xrange.axis.max;
                    }

                    if (yrange.from == null) {
                        yrange.from = yrange.axis.min;
                    }

                    if (yrange.to == null) {
                        yrange.to = yrange.axis.max;
                    }

                    // clip
                    if (xrange.to < xrange.axis.min || xrange.from > xrange.axis.max ||
                        yrange.to < yrange.axis.min || yrange.from > yrange.axis.max) {
                        continue;
                    }

                    xrange.from = Math.max(xrange.from, xrange.axis.min);
                    xrange.to = Math.min(xrange.to, xrange.axis.max);
                    yrange.from = Math.max(yrange.from, yrange.axis.min);
                    yrange.to = Math.min(yrange.to, yrange.axis.max);

                    var xequal = xrange.from === xrange.to,
                        yequal = yrange.from === yrange.to;

                    if (xequal && yequal) {
                        continue;
                    }

                    // then draw
                    xrange.from = Math.floor(xrange.axis.p2c(xrange.from));
                    xrange.to = Math.floor(xrange.axis.p2c(xrange.to));
                    yrange.from = Math.floor(yrange.axis.p2c(yrange.from));
                    yrange.to = Math.floor(yrange.axis.p2c(yrange.to));

                    if (xequal || yequal) {
                        var lineWidth = m.lineWidth || options.grid.markingsLineWidth,
                            subPixel = lineWidth % 2 ? 0.5 : 0;
                        ctx.beginPath();
                        ctx.strokeStyle = m.color || options.grid.markingsColor;
                        ctx.lineWidth = lineWidth;
                        if (xequal) {
                            ctx.moveTo(xrange.to + subPixel, yrange.from);
                            ctx.lineTo(xrange.to + subPixel, yrange.to);
                        } else {
                            ctx.moveTo(xrange.from, yrange.to + subPixel);
                            ctx.lineTo(xrange.to, yrange.to + subPixel);
                        }
                        ctx.stroke();
                    } else {
                        ctx.fillStyle = m.color || options.grid.markingsColor;
                        ctx.fillRect(xrange.from, yrange.to,
                            xrange.to - xrange.from,
                            yrange.from - yrange.to);
                    }
                }
            }
        }

        function findEdges(axis) {
            var box = axis.box,
                x = 0,
                y = 0;

            // find the edges
            if (axis.direction === "x") {
                x = 0;
                y = box.top - plotOffset.top + (axis.position === "top" ? box.height : 0);
            } else {
                y = 0;
                x = box.left - plotOffset.left + (axis.position === "left" ? box.width : 0) + axis.boxPosition.centerX;
            }

            return {
                x: x,
                y: y
            };
        };

        function alignPosition(lineWidth, pos) {
            return ((lineWidth % 2) !== 0) ? Math.floor(pos) + 0.5 : pos;
        };

        function drawTickBar(axis) {
            ctx.lineWidth = 1;
            var edges = findEdges(axis),
                x = edges.x,
                y = edges.y;

            // draw tick bar
            if (axis.show) {
                var xoff = 0,
                    yoff = 0;

                ctx.strokeStyle = axis.options.color;
                ctx.beginPath();
                if (axis.direction === "x") {
                    xoff = plotWidth + 1;
                } else {
                    yoff = plotHeight + 1;
                }

                if (axis.direction === "x") {
                    y = alignPosition(ctx.lineWidth, y);
                } else {
                    x = alignPosition(ctx.lineWidth, x);
                }

                ctx.moveTo(x, y);
                ctx.lineTo(x + xoff, y + yoff);
                ctx.stroke();
            }
        };

        function drawTickMarks(axis) {
            var t = axis.tickLength,
                minorTicks = axis.showMinorTicks,
                minorTicksNr = MINOR_TICKS_COUNT_CONSTANT,
                edges = findEdges(axis),
                x = edges.x,
                y = edges.y,
                i = 0;

            // draw major tick marks
            ctx.strokeStyle = axis.options.color;
            ctx.beginPath();

            for (i = 0; i < axis.ticks.length; ++i) {
                var v = axis.ticks[i].v,
                    xoff = 0,
                    yoff = 0,
                    xminor = 0,
                    yminor = 0,
                    j;

                if (!isNaN(v) && v >= axis.min && v <= axis.max) {
                    if (axis.direction === "x") {
                        x = axis.p2c(v);
                        yoff = t;

                        if (axis.position === "top") {
                            yoff = -yoff;
                        }
                    } else {
                        y = axis.p2c(v);
                        xoff = t;

                        if (axis.position === "left") {
                            xoff = -xoff;
                        }
                    }

                    if (axis.direction === "x") {
                        x = alignPosition(ctx.lineWidth, x);
                    } else {
                        y = alignPosition(ctx.lineWidth, y);
                    }

                    ctx.moveTo(x, y);
                    ctx.lineTo(x + xoff, y + yoff);
                }

                //draw minor tick marks
                if (minorTicks === true && i < axis.ticks.length - 1) {
                    var v1 = axis.ticks[i].v,
                        v2 = axis.ticks[i + 1].v,
                        step = (v2 - v1) / (minorTicksNr + 1);

                    for (j = 1; j <= minorTicksNr; j++) {
                        // compute minor tick position
                        if (axis.direction === "x") {
                            yminor = t / 2; // minor ticks are half length
                            x = alignPosition(ctx.lineWidth, axis.p2c(v1 + j * step))

                            if (axis.position === "top") {
                                yminor = -yminor;
                            }

                            // don't go over the plot borders
                            if ((x < 0) || (x > plotWidth)) {
                                continue;
                            }
                        } else {
                            xminor = t / 2; // minor ticks are half length
                            y = alignPosition(ctx.lineWidth, axis.p2c(v1 + j * step));

                            if (axis.position === "left") {
                                xminor = -xminor;
                            }

                            // don't go over the plot borders
                            if ((y < 0) || (y > plotHeight)) {
                                continue;
                            }
                        }

                        ctx.moveTo(x, y);
                        ctx.lineTo(x + xminor, y + yminor);
                    }
                }
            }

            ctx.stroke();
        };

        function drawGridLines(axis) {
            // check if the line will be overlapped with a border
            var overlappedWithBorder = function (value) {
                var bw = options.grid.borderWidth;
                return (((typeof bw === "object" && bw[axis.position] > 0) || bw > 0) && (value === axis.min || value === axis.max));
            };

            ctx.strokeStyle = options.grid.tickColor;
            ctx.beginPath();
            var i;
            for (i = 0; i < axis.ticks.length; ++i) {
                var v = axis.ticks[i].v,
                    xoff = 0,
                    yoff = 0,
                    x = 0,
                    y = 0;

                if (isNaN(v) || v < axis.min || v > axis.max) continue;

                // skip those lying on the axes if we got a border
                if (overlappedWithBorder(v)) continue;

                if (axis.direction === "x") {
                    x = axis.p2c(v);
                    y = plotHeight;
                    yoff = -plotHeight;
                } else {
                    x = 0;
                    y = axis.p2c(v);
                    xoff = plotWidth;
                }

                if (axis.direction === "x") {
                    x = alignPosition(ctx.lineWidth, x);
                } else {
                    y = alignPosition(ctx.lineWidth, y);
                }

                ctx.moveTo(x, y);
                ctx.lineTo(x + xoff, y + yoff);
            }

            ctx.stroke();
        };

        function drawBorder() {
            // If either borderWidth or borderColor is an object, then draw the border
            // line by line instead of as one rectangle
            var bw = options.grid.borderWidth,
                bc = options.grid.borderColor;

            if (typeof bw === "object" || typeof bc === "object") {
                if (typeof bw !== "object") {
                    bw = {
                        top: bw,
                        right: bw,
                        bottom: bw,
                        left: bw
                    };
                }
                if (typeof bc !== "object") {
                    bc = {
                        top: bc,
                        right: bc,
                        bottom: bc,
                        left: bc
                    };
                }

                if (bw.top > 0) {
                    ctx.strokeStyle = bc.top;
                    ctx.lineWidth = bw.top;
                    ctx.beginPath();
                    ctx.moveTo(0 - bw.left, 0 - bw.top / 2);
                    ctx.lineTo(plotWidth, 0 - bw.top / 2);
                    ctx.stroke();
                }

                if (bw.right > 0) {
                    ctx.strokeStyle = bc.right;
                    ctx.lineWidth = bw.right;
                    ctx.beginPath();
                    ctx.moveTo(plotWidth + bw.right / 2, 0 - bw.top);
                    ctx.lineTo(plotWidth + bw.right / 2, plotHeight);
                    ctx.stroke();
                }

                if (bw.bottom > 0) {
                    ctx.strokeStyle = bc.bottom;
                    ctx.lineWidth = bw.bottom;
                    ctx.beginPath();
                    ctx.moveTo(plotWidth + bw.right, plotHeight + bw.bottom / 2);
                    ctx.lineTo(0, plotHeight + bw.bottom / 2);
                    ctx.stroke();
                }

                if (bw.left > 0) {
                    ctx.strokeStyle = bc.left;
                    ctx.lineWidth = bw.left;
                    ctx.beginPath();
                    ctx.moveTo(0 - bw.left / 2, plotHeight + bw.bottom);
                    ctx.lineTo(0 - bw.left / 2, 0);
                    ctx.stroke();
                }
            } else {
                ctx.lineWidth = bw;
                ctx.strokeStyle = options.grid.borderColor;
                ctx.strokeRect(-bw / 2, -bw / 2, plotWidth + bw, plotHeight + bw);
            }
        };

        function drawGrid() {
            var axes, bw;

            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);

            drawMarkings();

            axes = allAxes();
            bw = options.grid.borderWidth;

            for (var j = 0; j < axes.length; ++j) {
                var axis = axes[j];

                if (!axis.show) {
                    continue;
                }

                drawTickBar(axis);
                if (axis.showTicks === true) {
                    drawTickMarks(axis);
                }

                if (axis.gridLines === true) {
                    drawGridLines(axis, bw);
                }
            }

            // draw border
            if (bw) {
                drawBorder();
            }

            ctx.restore();
        }

        function drawAxisLabels() {
            $.each(allAxes(), function(_, axis) {
                var box = axis.box,
                    legacyStyles = axis.direction + "Axis " + axis.direction + axis.n + "Axis",
                    layer = "flot-" + axis.direction + "-axis flot-" + axis.direction + axis.n + "-axis " + legacyStyles,
                    font = axis.options.font || "flot-tick-label tickLabel",
                    i, x, y, halign, valign, info,
                    margin = 3,
                    nullBox = {x: NaN, y: NaN, width: NaN, height: NaN}, newLabelBox, labelBoxes = [],
                    overlapping = function(x11, y11, x12, y12, x21, y21, x22, y22) {
                        return ((x11 <= x21 && x21 <= x12) || (x21 <= x11 && x11 <= x22)) &&
                               ((y11 <= y21 && y21 <= y12) || (y21 <= y11 && y11 <= y22));
                    },
                    overlapsOtherLabels = function(newLabelBox, previousLabelBoxes) {
                        return previousLabelBoxes.some(function(labelBox) {
                            return overlapping(
                                newLabelBox.x, newLabelBox.y, newLabelBox.x + newLabelBox.width, newLabelBox.y + newLabelBox.height,
                                labelBox.x, labelBox.y, labelBox.x + labelBox.width, labelBox.y + labelBox.height);
                        });
                    },
                    drawAxisLabel = function (tick, labelBoxes) {
                        if (!tick || !tick.label || tick.v < axis.min || tick.v > axis.max) {
                            return nullBox;
                        }

                        info = surface.getTextInfo(layer, tick.label, font);

                        if (axis.direction === "x") {
                            halign = "center";
                            x = plotOffset.left + axis.p2c(tick.v);
                            if (axis.position === "bottom") {
                                y = box.top + box.padding - axis.boxPosition.centerY;
                            } else {
                                y = box.top + box.height - box.padding + axis.boxPosition.centerY;
                                valign = "bottom";
                            }
                            newLabelBox = {x: x - info.width / 2 - margin, y: y - margin, width: info.width + 2 * margin, height: info.height + 2 * margin};
                        } else {
                            valign = "middle";
                            y = plotOffset.top + axis.p2c(tick.v);
                            if (axis.position === "left") {
                                x = box.left + box.width - box.padding - axis.boxPosition.centerX;
                                halign = "right";
                            } else {
                                x = box.left + box.padding + axis.boxPosition.centerX;
                            }
                            newLabelBox = {x: x - info.width / 2 - margin, y: y - margin, width: info.width + 2 * margin, height: info.height + 2 * margin};
                        }

                        if (overlapsOtherLabels(newLabelBox, labelBoxes)) {
                            return nullBox;
                        }

                        surface.addText(layer, x, y, tick.label, font, null, null, halign, valign);

                        return newLabelBox;
                    };

                // Remove text before checking for axis.show and ticks.length;
                // otherwise plugins, like flot-tickrotor, that draw their own
                // tick labels will end up with both theirs and the defaults.

                surface.removeText(layer);

                executeHooks(hooks.drawAxis, [axis, surface]);

                if (!axis.show) {
                    return;
                }

                switch (axis.options.showTickLabels) {
                    case 'none':
                        break;
                    case 'endpoints':
                        labelBoxes.push(drawAxisLabel(axis.ticks[0], labelBoxes));
                        labelBoxes.push(drawAxisLabel(axis.ticks[axis.ticks.length - 1], labelBoxes));
                        break;
                    case 'major':
                        labelBoxes.push(drawAxisLabel(axis.ticks[0], labelBoxes));
                        labelBoxes.push(drawAxisLabel(axis.ticks[axis.ticks.length - 1], labelBoxes));
                        for (i = 1; i < axis.ticks.length - 1; ++i) {
                            labelBoxes.push(drawAxisLabel(axis.ticks[i], labelBoxes));
                        }
                        break;
                    case 'all':
                        labelBoxes.push(drawAxisLabel(axis.ticks[0], []));
                        labelBoxes.push(drawAxisLabel(axis.ticks[axis.ticks.length - 1], labelBoxes));
                        for (i = 1; i < axis.ticks.length - 1; ++i) {
                            labelBoxes.push(drawAxisLabel(axis.ticks[i], labelBoxes));
                        }
                        break;
                }
            });
        }

        function drawSeries(series) {
            if (series.lines.show) {
                $.plot.drawSeries.drawSeriesLines(series, ctx, plotOffset, plotWidth, plotHeight, plot.drawSymbol, getColorOrGradient);
            }

            if (series.bars.show) {
                $.plot.drawSeries.drawSeriesBars(series, ctx, plotOffset, plotWidth, plotHeight, plot.drawSymbol, getColorOrGradient);
            }

            if (series.points.show) {
                $.plot.drawSeries.drawSeriesPoints(series, ctx, plotOffset, plotWidth, plotHeight, plot.drawSymbol, getColorOrGradient);
            }
        }

        function computeRangeForDataSeries(series, force, isValid) {
            var points = series.datapoints.points,
                ps = series.datapoints.pointsize,
                format = series.datapoints.format,
                topSentry = Number.POSITIVE_INFINITY,
                bottomSentry = Number.NEGATIVE_INFINITY,
                range = {
                    xmin: topSentry,
                    ymin: topSentry,
                    xmax: bottomSentry,
                    ymax: bottomSentry
                };

            for (var j = 0; j < points.length; j += ps) {
                if (points[j] === null) {
                    continue;
                }

                if (typeof (isValid) === 'function' && !isValid(points[j])) {
                    continue;
                }

                for (var m = 0; m < ps; ++m) {
                    var val = points[j + m],
                        f = format[m];
                    if (f === null || f === undefined) {
                        continue;
                    }

                    if (typeof (isValid) === 'function' && !isValid(val)) {
                        continue;
                    }

                    if ((!force && !f.computeRange) || val === Infinity || val === -Infinity) {
                        continue;
                    }

                    if (f.x === true) {
                        if (val < range.xmin) {
                            range.xmin = val;
                        }

                        if (val > range.xmax) {
                            range.xmax = val;
                        }
                    }

                    if (f.y === true) {
                        if (val < range.ymin) {
                            range.ymin = val;
                        }

                        if (val > range.ymax) {
                            range.ymax = val;
                        }
                    }
                }
            }

            return range;
        };

        function adjustSeriesDataRange(series, range) {
            if (series.bars.show) {
                // make sure we got room for the bar on the dancing floor
                var delta;

                // update bar width if needed
                var useAbsoluteBarWidth = series.bars.barWidth[1];
                if (series.datapoints && series.datapoints.points && !useAbsoluteBarWidth) {
                    computeBarWidth(series);
                }

                var barWidth = series.bars.barWidth[0] || series.bars.barWidth;
                switch (series.bars.align) {
                    case "left":
                        delta = 0;
                        break;
                    case "right":
                        delta = -barWidth;
                        break;
                    default:
                        delta = -barWidth / 2;
                }

                if (series.bars.horizontal) {
                    range.ymin += delta;
                    range.ymax += delta + barWidth;
                }
                else {
                    range.xmin += delta;
                    range.xmax += delta + barWidth;
                }
            }

            if ((series.bars.show && series.bars.zero) || (series.lines.show && series.lines.zero)) {
                var ps = series.datapoints.pointsize;

                // make sure the 0 point is included in the computed y range when requested
                if (ps <= 2) {
                    /*if ps > 0 the points were already taken into account for autoScale */
                    range.ymin = Math.min(0, range.ymin);
                    range.ymax = Math.max(0, range.ymax);
                }
            }

            return range;
        };

        function computeBarWidth(series) {
            var xValues = [];
            var pointsize = series.datapoints.pointsize, minDistance = Number.MAX_VALUE;

            if (series.datapoints.points.length <= pointsize) {
                minDistance = 1;
            }

            var start = series.bars.horizontal ? 1 : 0;
            for (var j = start; j < series.datapoints.points.length; j += pointsize) {
                if (isFinite(series.datapoints.points[j]) && series.datapoints.points[j] !== null) {
                    xValues.push(series.datapoints.points[j]);
                }
            }

            function onlyUnique(value, index, self) {
                return self.indexOf(value) === index;
            }

            xValues = xValues.filter( onlyUnique );
            xValues.sort(function(a, b){return a - b});

            for (var j = 1; j < xValues.length; j++) {
                var distance = Math.abs(xValues[j] - xValues[j - 1]);
                if (distance < minDistance && isFinite(distance)) {
                    minDistance = distance;
                }
            }

            if (typeof series.bars.barWidth === "number") {
                series.bars.barWidth = series.bars.barWidth * minDistance;
            } else {
                series.bars.barWidth[0] = series.bars.barWidth[0] * minDistance;
            }
        }

        function findNearbyItems(mouseX, mouseY, seriesFilter, radius, computeDistance) {
            var items = findItems(mouseX, mouseY, seriesFilter, radius, computeDistance);
            for (var i = 0; i < series.length; ++i) {
                if (seriesFilter(i)) {
                    executeHooks(hooks.findNearbyItems, [mouseX, mouseY, series, i, radius, computeDistance, items]);
                }
            }

            return items.sort((a, b) => { 
                if (b.distance === undefined) {
                    return -1;
                } else if (a.distance === undefined && b.distance !== undefined) {
                    return 1;
                }

                return a.distance - b.distance ;
            });
        }

        function findNearbyItem(mouseX, mouseY, seriesFilter, radius, computeDistance) {
            var items = findNearbyItems(mouseX, mouseY, seriesFilter, radius, computeDistance);
            return items[0] !== undefined ? items[0] : null;
         }

        // returns the data item the mouse is over/ the cursor is closest to, or null if none is found
        function findItems(mouseX, mouseY, seriesFilter, radius, computeDistance) {
            var i, foundItems = [],
                items = [],
                smallestDistance = radius * radius + 1;

            for (i = series.length - 1; i >= 0; --i) {
                if (!seriesFilter(i)) continue;

                var s = series[i];
                if (!s.datapoints) return;

                var foundPoint = false;
                if (s.lines.show || s.points.show) {
                    var found = findNearbyPoint(s, mouseX, mouseY, radius, computeDistance);
                    if (found) {
                        items.push({ seriesIndex: i, dataIndex: found.dataIndex, distance: found.distance });
                        foundPoint = true;
                    }
                }

                if (s.bars.show && !foundPoint) { // no other point can be nearby
                    var foundIndex = findNearbyBar(s, mouseX, mouseY);
                    if (foundIndex >= 0) {
                        items.push({ seriesIndex: i, dataIndex: foundIndex, distance: smallestDistance });
                    }
                }
            }

            for (i = 0; i < items.length; i++) {
                var seriesIndex = items[i].seriesIndex;
                var dataIndex = items[i].dataIndex;
                var smallestDistance = items[i].distance;
                var ps = series[seriesIndex].datapoints.pointsize;

                foundItems.push({
                    datapoint: series[seriesIndex].datapoints.points.slice(dataIndex * ps, (dataIndex + 1) * ps),
                    dataIndex: dataIndex,
                    series: series[seriesIndex],
                    seriesIndex: seriesIndex,
                    distance: Math.sqrt(smallestDistance)
                });
            }

            return foundItems;
        }

        function findNearbyPoint (series, mouseX, mouseY, maxDistance, computeDistance) {
            var mx = series.xaxis.c2p(mouseX),
                my = series.yaxis.c2p(mouseY),
                maxx = maxDistance / series.xaxis.scale,
                maxy = maxDistance / series.yaxis.scale,
                points = series.datapoints.points,
                ps = series.datapoints.pointsize,
                smallestDistance = Number.POSITIVE_INFINITY;

            // with inverse transforms, we can't use the maxx/maxy
            // optimization, sadly
            if (series.xaxis.options.inverseTransform) {
                maxx = Number.MAX_VALUE;
            }

            if (series.yaxis.options.inverseTransform) {
                maxy = Number.MAX_VALUE;
            }

            var found = null;
            for (var j = 0; j < points.length; j += ps) {
                var x = points[j];
                var y = points[j + 1];
                if (x == null) {
                    continue;
                }

                if (x - mx > maxx || x - mx < -maxx ||
                    y - my > maxy || y - my < -maxy) {
                    continue;
                }

                // We have to calculate distances in pixels, not in
                // data units, because the scales of the axes may be different
                var dx = Math.abs(series.xaxis.p2c(x) - mouseX);
                var dy = Math.abs(series.yaxis.p2c(y) - mouseY);
                var dist = computeDistance ? computeDistance(dx, dy) : dx * dx + dy * dy;

                // use <= to ensure last point takes precedence
                // (last generally means on top of)
                if (dist < smallestDistance) {
                    smallestDistance = dist;
                    found = { dataIndex: j / ps, distance: dist };
                }
            }

            return found;
        }

        function findNearbyBar (series, mouseX, mouseY) {
            var barLeft, barRight,
                barWidth = series.bars.barWidth[0] || series.bars.barWidth,
                mx = series.xaxis.c2p(mouseX),
                my = series.yaxis.c2p(mouseY),
                points = series.datapoints.points,
                ps = series.datapoints.pointsize;

            switch (series.bars.align) {
                case "left":
                    barLeft = 0;
                    break;
                case "right":
                    barLeft = -barWidth;
                    break;
                default:
                    barLeft = -barWidth / 2;
            }

            barRight = barLeft + barWidth;

            var fillTowards = series.bars.fillTowards || 0;
            var defaultBottom = fillTowards > series.yaxis.min ? Math.min(series.yaxis.max, fillTowards) : series.yaxis.min;

            var foundIndex = -1;
            for (var j = 0; j < points.length; j += ps) {
                var x = points[j], y = points[j + 1];
                if (x == null)
                    continue;

                var bottom = ps === 3 ? points[j + 2] : defaultBottom;
                // for a bar graph, the cursor must be inside the bar
                if (series.bars.horizontal ?
                    (mx <= Math.max(bottom, x) && mx >= Math.min(bottom, x) &&
                        my >= y + barLeft && my <= y + barRight) :
                    (mx >= x + barLeft && mx <= x + barRight &&
                        my >= Math.min(bottom, y) && my <= Math.max(bottom, y)))
                        foundIndex = j / ps;
            }

            return foundIndex;
        }

        function findNearbyInterpolationPoint(posX, posY, seriesFilter) {
            var i, j, dist, dx, dy, ps,
                item,
                smallestDistance = Number.MAX_VALUE;

            for (i = 0; i < series.length; ++i) {
                if (!seriesFilter(i)) {
                    continue;
                }
                var points = series[i].datapoints.points;
                ps = series[i].datapoints.pointsize;

                // if the data is coming from positive -> negative, reverse the comparison
                const comparer = points[points.length - ps] < points[0]
                    ? function (x1, x2) { return x1 > x2 }
                    : function (x1, x2) { return x2 > x1 };

                // do not interpolate outside the bounds of the data.
                if (comparer(posX, points[0])) {
                    continue;
                }

                // Find the nearest points, x-wise
                for (j = ps; j < points.length; j += ps) {
                    if (comparer(posX, points[j])) {
                        break;
                    }
                }

                // Now Interpolate
                var y,
                    p1x = points[j - ps],
                    p1y = points[j - ps + 1],
                    p2x = points[j],
                    p2y = points[j + 1];

                if ((p1x === undefined) || (p2x === undefined) ||
                    (p1y === undefined) || (p2y === undefined)) {
                    continue;
                }

                if (p1x === p2x) {
                    y = p2y
                } else {
                    y = p1y + (p2y - p1y) * (posX - p1x) / (p2x - p1x);
                }

                posY = y;

                dx = Math.abs(series[i].xaxis.p2c(p2x) - posX);
                dy = Math.abs(series[i].yaxis.p2c(p2y) - posY);
                dist = dx * dx + dy * dy;

                if (dist < smallestDistance) {
                    smallestDistance = dist;
                    item = [posX, posY, i, j];
                }
            }

            if (item) {
                i = item[2];
                j = item[3];
                ps = series[i].datapoints.pointsize;
                points = series[i].datapoints.points;
                p1x = points[j - ps];
                p1y = points[j - ps + 1];
                p2x = points[j];
                p2y = points[j + 1];

                return {
                    datapoint: [item[0], item[1]],
                    leftPoint: [p1x, p1y],
                    rightPoint: [p2x, p2y],
                    seriesIndex: i
                };
            }

            return null;
        }

        function triggerRedrawOverlay() {
            var t = options.interaction.redrawOverlayInterval;
            if (t === -1) { // skip event queue
                drawOverlay();
                return;
            }

            if (!redrawTimeout) {
                redrawTimeout = setTimeout(function() {
                    drawOverlay(plot);
                }, t);
            }
        }

        function drawOverlay(plot) {
            redrawTimeout = null;

            if (!octx) {
                return;
            }
            overlay.clear();
            executeHooks(hooks.drawOverlay, [octx, overlay]);
            var event = new CustomEvent('onDrawingDone');
            plot.getEventHolder().dispatchEvent(event);
            plot.getPlaceholder().trigger('drawingdone');
        }

        function getColorOrGradient(spec, bottom, top, defaultColor) {
            if (typeof spec === "string") {
                return spec;
            } else {
                // assume this is a gradient spec; IE currently only
                // supports a simple vertical gradient properly, so that's
                // what we support too
                var gradient = ctx.createLinearGradient(0, top, 0, bottom);

                for (var i = 0, l = spec.colors.length; i < l; ++i) {
                    var c = spec.colors[i];
                    if (typeof c !== "string") {
                        var co = $.color.parse(defaultColor);
                        if (c.brightness != null) {
                            co = co.scale('rgb', c.brightness);
                        }

                        if (c.opacity != null) {
                            co.a *= c.opacity;
                        }

                        c = co.toString();
                    }
                    gradient.addColorStop(i / (l - 1), c);
                }

                return gradient;
            }
        }
    }

    // Add the plot function to the top level of the jQuery object

    $.plot = function(placeholder, data, options) {
        var plot = new Plot($(placeholder), data, options, $.plot.plugins);
        return plot;
    };

    $.plot.version = "3.0.0";

    $.plot.plugins = [];

    // Also add the plot function as a chainable property
    $.fn.plot = function(data, options) {
        return this.each(function() {
            $.plot(this, data, options);
        });
    };

    $.plot.linearTickGenerator = defaultTickGenerator;
    $.plot.defaultTickFormatter = defaultTickFormatter;
    $.plot.expRepTickFormatter = expRepTickFormatter;
})(jQuery);
/** ## jquery.flot.browser.js

This plugin is used to make available some browser-related utility functions.

### Methods
*/


(function ($) {
    'use strict';

    var browser = {
        /**
        - getPageXY(e)

         Calculates the pageX and pageY using the screenX, screenY properties of the event
         and the scrolling of the page. This is needed because the pageX and pageY
         properties of the event are not correct while running tests in Edge. */
        getPageXY: function (e) {
            // This code is inspired from https://stackoverflow.com/a/3464890
            var doc = document.documentElement,
                pageX = e.clientX + (window.pageXOffset || doc.scrollLeft) - (doc.clientLeft || 0),
                pageY = e.clientY + (window.pageYOffset || doc.scrollTop) - (doc.clientTop || 0);
            return { X: pageX, Y: pageY };
        },

        /**
        - getPixelRatio(context)

         This function returns the current pixel ratio defined by the product of desktop
         zoom and page zoom.
         Additional info: https://www.html5rocks.com/en/tutorials/canvas/hidpi/
        */
        getPixelRatio: function(context) {
            var devicePixelRatio = window.devicePixelRatio || 1,
                backingStoreRatio =
                context.webkitBackingStorePixelRatio ||
                context.mozBackingStorePixelRatio ||
                context.msBackingStorePixelRatio ||
                context.oBackingStorePixelRatio ||
                context.backingStorePixelRatio || 1;
            return devicePixelRatio / backingStoreRatio;
        },

        /**
        - isSafari, isMobileSafari, isOpera, isFirefox, isIE, isEdge, isChrome, isBlink

         This is a collection of functions, used to check if the code is running in a
         particular browser or Javascript engine.
        */
        isSafari: function() {
            // *** https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
            // Safari 3.0+ "[object HTMLElementConstructor]"
            return /constructor/i.test(window.top.HTMLElement) || (function (p) { return p.toString() === "[object SafariRemoteNotification]"; })(!window.top['safari'] || (typeof window.top.safari !== 'undefined' && window.top.safari.pushNotification));
        },

        isMobileSafari: function() {
            //isMobileSafari adapted from https://stackoverflow.com/questions/3007480/determine-if-user-navigated-from-mobile-safari
            return navigator.userAgent.match(/(iPod|iPhone|iPad)/) && navigator.userAgent.match(/AppleWebKit/);
        },

        isOpera: function() {
            // *** https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
            //Opera 8.0+
            return (!!window.opr && !!opr.addons) || !!window.opera || navigator.userAgent.indexOf(' OPR/') >= 0;
        },

        isFirefox: function() {
            // *** https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
            // Firefox 1.0+
            return typeof InstallTrigger !== 'undefined';
        },

        isIE: function() {
            // *** https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
            // Internet Explorer 6-11
            return /*@cc_on!@*/false || !!document.documentMode;
        },

        isEdge: function() {
            // *** https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
            // Edge 20+
            return !browser.isIE() && !!window.StyleMedia;
        },

        isChrome: function() {
            // *** https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
            // Chrome 1+
            return !!window.chrome && !!window.chrome.webstore;
        },

        isBlink: function() {
            // *** https://stackoverflow.com/questions/9847580/how-to-detect-safari-chrome-ie-firefox-and-opera-browser
            return (browser.isChrome() || browser.isOpera()) && !!window.CSS;
        }
    };

    $.plot.browser = browser;
})(jQuery);
(function ($) {
    'use strict';
    var saturated = {
        saturate: function (a) {
            if (a === Infinity) {
                return Number.MAX_VALUE;
            }

            if (a === -Infinity) {
                return -Number.MAX_VALUE;
            }

            return a;
        },
        delta: function(min, max, noTicks) {
            return ((max - min) / noTicks) === Infinity ? (max / noTicks - min / noTicks) : (max - min) / noTicks
        },
        multiply: function (a, b) {
            return saturated.saturate(a * b);
        },
        // returns c * bInt * a. Beahves properly in the case where c is negative
        // and bInt * a is bigger that Number.MAX_VALUE (Infinity)
        multiplyAdd: function (a, bInt, c) {
            if (isFinite(a * bInt)) {
                return saturated.saturate(a * bInt + c);
            } else {
                var result = c;

                for (var i = 0; i < bInt; i++) {
                    result += a;
                }

                return saturated.saturate(result);
            }
        },
        // round to nearby lower multiple of base
        floorInBase: function(n, base) {
            return base * Math.floor(n / base);
        }
    };

    $.plot.saturated = saturated;
})(jQuery);
/**
## jquery.flot.drawSeries.js

This plugin is used by flot for drawing lines, plots, bars or area.

### Public methods
*/


(function($) {
    "use strict";

    function DrawSeries() {
        function plotLine(datapoints, xoffset, yoffset, axisx, axisy, ctx, steps) {
            var points = datapoints.points,
                ps = datapoints.pointsize,
                prevx = null,
                prevy = null;
            var x1 = 0.0,
                y1 = 0.0,
                x2 = 0.0,
                y2 = 0.0,
                mx = null,
                my = null,
                i = 0;

            ctx.beginPath();
            for (i = ps; i < points.length; i += ps) {
                x1 = points[i - ps];
                y1 = points[i - ps + 1];
                x2 = points[i];
                y2 = points[i + 1];

                if (x1 === null || x2 === null) {
                    mx = null;
                    my = null;
                    continue;
                }

                if (isNaN(x1) || isNaN(x2) || isNaN(y1) || isNaN(y2)) {
                    prevx = null;
                    prevy = null;
                    continue;
                }

                if(steps){
                    if (mx !== null && my !== null) {
                        // if middle point exists, transfer p2 -> p1 and p1 -> mp
                        x2 = x1;
                        y2 = y1;
                        x1 = mx;
                        y1 = my;

                        // 'remove' middle point
                        mx = null;
                        my = null;

                        // subtract pointsize from i to have current point p1 handled again
                        i -= ps;
                    } else if (y1 !== y2 && x1 !== x2) {
                        // create a middle point
                        y2 = y1;
                        mx = x2;
                        my = y1;
                    }
                }

                // clip with ymin
                if (y1 <= y2 && y1 < axisy.min) {
                    if (y2 < axisy.min) {
                        // line segment is outside
                        continue;
                    }
                    // compute new intersection point
                    x1 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
                    y1 = axisy.min;
                } else if (y2 <= y1 && y2 < axisy.min) {
                    if (y1 < axisy.min) {
                        continue;
                    }

                    x2 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
                    y2 = axisy.min;
                }

                // clip with ymax
                if (y1 >= y2 && y1 > axisy.max) {
                    if (y2 > axisy.max) {
                        continue;
                    }

                    x1 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
                    y1 = axisy.max;
                } else if (y2 >= y1 && y2 > axisy.max) {
                    if (y1 > axisy.max) {
                        continue;
                    }

                    x2 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
                    y2 = axisy.max;
                }

                // clip with xmin
                if (x1 <= x2 && x1 < axisx.min) {
                    if (x2 < axisx.min) {
                        continue;
                    }

                    y1 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
                    x1 = axisx.min;
                } else if (x2 <= x1 && x2 < axisx.min) {
                    if (x1 < axisx.min) {
                        continue;
                    }

                    y2 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
                    x2 = axisx.min;
                }

                // clip with xmax
                if (x1 >= x2 && x1 > axisx.max) {
                    if (x2 > axisx.max) {
                        continue;
                    }

                    y1 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
                    x1 = axisx.max;
                } else if (x2 >= x1 && x2 > axisx.max) {
                    if (x1 > axisx.max) {
                        continue;
                    }

                    y2 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
                    x2 = axisx.max;
                }

                if (x1 !== prevx || y1 !== prevy) {
                    ctx.moveTo(axisx.p2c(x1) + xoffset, axisy.p2c(y1) + yoffset);
                }

                prevx = x2;
                prevy = y2;
                ctx.lineTo(axisx.p2c(x2) + xoffset, axisy.p2c(y2) + yoffset);
            }
            ctx.stroke();
        }

        function plotLineArea(datapoints, axisx, axisy, fillTowards, ctx, steps) {
            var points = datapoints.points,
                ps = datapoints.pointsize,
                bottom = fillTowards > axisy.min ? Math.min(axisy.max, fillTowards) : axisy.min,
                i = 0,
                ypos = 1,
                areaOpen = false,
                segmentStart = 0,
                segmentEnd = 0,
                mx = null,
                my = null;

            // we process each segment in two turns, first forward
            // direction to sketch out top, then once we hit the
            // end we go backwards to sketch the bottom
            while (true) {
                if (ps > 0 && i > points.length + ps) {
                    break;
                }

                i += ps; // ps is negative if going backwards

                var x1 = points[i - ps],
                    y1 = points[i - ps + ypos],
                    x2 = points[i],
                    y2 = points[i + ypos];

                if (ps === -2) {
                    /* going backwards and no value for the bottom provided in the series*/
                    y1 = y2 = bottom;
                }

                if (areaOpen) {
                    if (ps > 0 && x1 != null && x2 == null) {
                        // at turning point
                        segmentEnd = i;
                        ps = -ps;
                        ypos = 2;
                        continue;
                    }

                    if (ps < 0 && i === segmentStart + ps) {
                        // done with the reverse sweep
                        ctx.fill();
                        areaOpen = false;
                        ps = -ps;
                        ypos = 1;
                        i = segmentStart = segmentEnd + ps;
                        continue;
                    }
                }

                if (x1 == null || x2 == null) {
                    mx = null;
                    my = null;
                    continue;
                }

                if(steps){
                    if (mx !== null && my !== null) {
                        // if middle point exists, transfer p2 -> p1 and p1 -> mp
                        x2 = x1;
                        y2 = y1;
                        x1 = mx;
                        y1 = my;

                        // 'remove' middle point
                        mx = null;
                        my = null;

                        // subtract pointsize from i to have current point p1 handled again
                        i -= ps;
                    } else if (y1 !== y2 && x1 !== x2) {
                        // create a middle point
                        y2 = y1;
                        mx = x2;
                        my = y1;
                    }
                }

                // clip x values

                // clip with xmin
                if (x1 <= x2 && x1 < axisx.min) {
                    if (x2 < axisx.min) {
                        continue;
                    }

                    y1 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
                    x1 = axisx.min;
                } else if (x2 <= x1 && x2 < axisx.min) {
                    if (x1 < axisx.min) {
                        continue;
                    }

                    y2 = (axisx.min - x1) / (x2 - x1) * (y2 - y1) + y1;
                    x2 = axisx.min;
                }

                // clip with xmax
                if (x1 >= x2 && x1 > axisx.max) {
                    if (x2 > axisx.max) {
                        continue;
                    }

                    y1 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
                    x1 = axisx.max;
                } else if (x2 >= x1 && x2 > axisx.max) {
                    if (x1 > axisx.max) {
                        continue;
                    }

                    y2 = (axisx.max - x1) / (x2 - x1) * (y2 - y1) + y1;
                    x2 = axisx.max;
                }

                if (!areaOpen) {
                    // open area
                    ctx.beginPath();
                    ctx.moveTo(axisx.p2c(x1), axisy.p2c(bottom));
                    areaOpen = true;
                }

                // now first check the case where both is outside
                if (y1 >= axisy.max && y2 >= axisy.max) {
                    ctx.lineTo(axisx.p2c(x1), axisy.p2c(axisy.max));
                    ctx.lineTo(axisx.p2c(x2), axisy.p2c(axisy.max));
                    continue;
                } else if (y1 <= axisy.min && y2 <= axisy.min) {
                    ctx.lineTo(axisx.p2c(x1), axisy.p2c(axisy.min));
                    ctx.lineTo(axisx.p2c(x2), axisy.p2c(axisy.min));
                    continue;
                }

                // else it's a bit more complicated, there might
                // be a flat maxed out rectangle first, then a
                // triangular cutout or reverse; to find these
                // keep track of the current x values
                var x1old = x1,
                    x2old = x2;

                // clip the y values, without shortcutting, we
                // go through all cases in turn

                // clip with ymin
                if (y1 <= y2 && y1 < axisy.min && y2 >= axisy.min) {
                    x1 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
                    y1 = axisy.min;
                } else if (y2 <= y1 && y2 < axisy.min && y1 >= axisy.min) {
                    x2 = (axisy.min - y1) / (y2 - y1) * (x2 - x1) + x1;
                    y2 = axisy.min;
                }

                // clip with ymax
                if (y1 >= y2 && y1 > axisy.max && y2 <= axisy.max) {
                    x1 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
                    y1 = axisy.max;
                } else if (y2 >= y1 && y2 > axisy.max && y1 <= axisy.max) {
                    x2 = (axisy.max - y1) / (y2 - y1) * (x2 - x1) + x1;
                    y2 = axisy.max;
                }

                // if the x value was changed we got a rectangle
                // to fill
                if (x1 !== x1old) {
                    ctx.lineTo(axisx.p2c(x1old), axisy.p2c(y1));
                    // it goes to (x1, y1), but we fill that below
                }

                // fill triangular section, this sometimes result
                // in redundant points if (x1, y1) hasn't changed
                // from previous line to, but we just ignore that
                ctx.lineTo(axisx.p2c(x1), axisy.p2c(y1));
                ctx.lineTo(axisx.p2c(x2), axisy.p2c(y2));

                // fill the other rectangle if it's there
                if (x2 !== x2old) {
                    ctx.lineTo(axisx.p2c(x2), axisy.p2c(y2));
                    ctx.lineTo(axisx.p2c(x2old), axisy.p2c(y2));
                }
            }
        }

        /**
        - drawSeriesLines(series, ctx, plotOffset, plotWidth, plotHeight, drawSymbol, getColorOrGradient)

         This function is used for drawing lines or area fill.  In case the series has line decimation function
         attached, before starting to draw, as an optimization the points will first be decimated.

         The series parameter contains the series to be drawn on ctx context. The plotOffset, plotWidth and
         plotHeight are the corresponding parameters of flot used to determine the drawing surface.
         The function getColorOrGradient is used to compute the fill style of lines and area.
        */
        function drawSeriesLines(series, ctx, plotOffset, plotWidth, plotHeight, drawSymbol, getColorOrGradient) {
            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);
            ctx.lineJoin = "round";

            if (series.lines.dashes && ctx.setLineDash) {
                ctx.setLineDash(series.lines.dashes);
            }

            var datapoints = {
                format: series.datapoints.format,
                points: series.datapoints.points,
                pointsize: series.datapoints.pointsize
            };

            if (series.decimate) {
                datapoints.points = series.decimate(series, series.xaxis.min, series.xaxis.max, plotWidth, series.yaxis.min, series.yaxis.max, plotHeight);
            }

            var lw = series.lines.lineWidth;

            ctx.lineWidth = lw;
            ctx.strokeStyle = series.color;
            var fillStyle = getFillStyle(series.lines, series.color, 0, plotHeight, getColorOrGradient);
            if (fillStyle) {
                ctx.fillStyle = fillStyle;
                plotLineArea(datapoints, series.xaxis, series.yaxis, series.lines.fillTowards || 0, ctx, series.lines.steps);
            }

            if (lw > 0) {
                plotLine(datapoints, 0, 0, series.xaxis, series.yaxis, ctx, series.lines.steps);
            }

            ctx.restore();
        }

        /**
        - drawSeriesPoints(series, ctx, plotOffset, plotWidth, plotHeight, drawSymbol, getColorOrGradient)

         This function is used for drawing points using a given symbol. In case the series has points decimation
         function attached, before starting to draw, as an optimization the points will first be decimated.

         The series parameter contains the series to be drawn on ctx context. The plotOffset, plotWidth and
         plotHeight are the corresponding parameters of flot used to determine the drawing surface.
         The function drawSymbol is used to compute and draw the symbol chosen for the points.
        */
        function drawSeriesPoints(series, ctx, plotOffset, plotWidth, plotHeight, drawSymbol, getColorOrGradient) {
            function drawCircle(ctx, x, y, radius, shadow, fill) {
                ctx.moveTo(x + radius, y);
                ctx.arc(x, y, radius, 0, shadow ? Math.PI : Math.PI * 2, false);
            }
            drawCircle.fill = true;
            function plotPoints(datapoints, radius, fill, offset, shadow, axisx, axisy, drawSymbolFn) {
                var points = datapoints.points,
                    ps = datapoints.pointsize;

                ctx.beginPath();
                for (var i = 0; i < points.length; i += ps) {
                    var x = points[i],
                        y = points[i + 1];
                    if (x == null || x < axisx.min || x > axisx.max || y < axisy.min || y > axisy.max) {
                        continue;
                    }

                    x = axisx.p2c(x);
                    y = axisy.p2c(y) + offset;

                    drawSymbolFn(ctx, x, y, radius, shadow, fill);
                }
                if (drawSymbolFn.fill && !shadow) {
                    ctx.fill();
                }
                ctx.stroke();
            }

            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);

            var datapoints = {
                format: series.datapoints.format,
                points: series.datapoints.points,
                pointsize: series.datapoints.pointsize
            };

            if (series.decimatePoints) {
                datapoints.points = series.decimatePoints(series, series.xaxis.min, series.xaxis.max, plotWidth, series.yaxis.min, series.yaxis.max, plotHeight);
            }

            var lw = series.points.lineWidth,
                radius = series.points.radius,
                symbol = series.points.symbol,
                drawSymbolFn;

            if (symbol === 'circle') {
                drawSymbolFn = drawCircle;
            } else if (typeof symbol === 'string' && drawSymbol && drawSymbol[symbol]) {
                drawSymbolFn = drawSymbol[symbol];
            } else if (typeof drawSymbol === 'function') {
                drawSymbolFn = drawSymbol;
            }

            // If the user sets the line width to 0, we change it to a very
            // small value. A line width of 0 seems to force the default of 1.

            if (lw === 0) {
                lw = 0.0001;
            }

            ctx.lineWidth = lw;
            ctx.fillStyle = getFillStyle(series.points, series.color, null, null, getColorOrGradient);
            ctx.strokeStyle = series.color;
            plotPoints(datapoints, radius,
                true, 0, false,
                series.xaxis, series.yaxis, drawSymbolFn);
            ctx.restore();
        }

        function drawBar(x, y, b, barLeft, barRight, fillStyleCallback, axisx, axisy, c, horizontal, lineWidth) {
            var left = x + barLeft,
                right = x + barRight,
                bottom = b, top = y,
                drawLeft, drawRight, drawTop, drawBottom = false,
                tmp;

            drawLeft = drawRight = drawTop = true;

            // in horizontal mode, we start the bar from the left
            // instead of from the bottom so it appears to be
            // horizontal rather than vertical
            if (horizontal) {
                drawBottom = drawRight = drawTop = true;
                drawLeft = false;
                left = b;
                right = x;
                top = y + barLeft;
                bottom = y + barRight;

                // account for negative bars
                if (right < left) {
                    tmp = right;
                    right = left;
                    left = tmp;
                    drawLeft = true;
                    drawRight = false;
                }
            }
            else {
                drawLeft = drawRight = drawTop = true;
                drawBottom = false;
                left = x + barLeft;
                right = x + barRight;
                bottom = b;
                top = y;

                // account for negative bars
                if (top < bottom) {
                    tmp = top;
                    top = bottom;
                    bottom = tmp;
                    drawBottom = true;
                    drawTop = false;
                }
            }

            // clip
            if (right < axisx.min || left > axisx.max ||
                top < axisy.min || bottom > axisy.max) {
                return;
            }

            if (left < axisx.min) {
                left = axisx.min;
                drawLeft = false;
            }

            if (right > axisx.max) {
                right = axisx.max;
                drawRight = false;
            }

            if (bottom < axisy.min) {
                bottom = axisy.min;
                drawBottom = false;
            }

            if (top > axisy.max) {
                top = axisy.max;
                drawTop = false;
            }

            left = axisx.p2c(left);
            bottom = axisy.p2c(bottom);
            right = axisx.p2c(right);
            top = axisy.p2c(top);

            // fill the bar
            if (fillStyleCallback) {
                c.fillStyle = fillStyleCallback(bottom, top);
                c.fillRect(left, top, right - left, bottom - top)
            }

            // draw outline
            if (lineWidth > 0 && (drawLeft || drawRight || drawTop || drawBottom)) {
                c.beginPath();

                // FIXME: inline moveTo is buggy with excanvas
                c.moveTo(left, bottom);
                if (drawLeft) {
                    c.lineTo(left, top);
                } else {
                    c.moveTo(left, top);
                }

                if (drawTop) {
                    c.lineTo(right, top);
                } else {
                    c.moveTo(right, top);
                }

                if (drawRight) {
                    c.lineTo(right, bottom);
                } else {
                    c.moveTo(right, bottom);
                }

                if (drawBottom) {
                    c.lineTo(left, bottom);
                } else {
                    c.moveTo(left, bottom);
                }

                c.stroke();
            }
        }

        /**
        - drawSeriesBars(series, ctx, plotOffset, plotWidth, plotHeight, drawSymbol, getColorOrGradient)

         This function is used for drawing series represented as bars. In case the series has decimation
         function attached, before starting to draw, as an optimization the points will first be decimated.

         The series parameter contains the series to be drawn on ctx context. The plotOffset, plotWidth and
         plotHeight are the corresponding parameters of flot used to determine the drawing surface.
         The function getColorOrGradient is used to compute the fill style of bars.
        */
        function drawSeriesBars(series, ctx, plotOffset, plotWidth, plotHeight, drawSymbol, getColorOrGradient) {
            function plotBars(datapoints, barLeft, barRight, fillStyleCallback, axisx, axisy) {
                var points = datapoints.points,
                    ps = datapoints.pointsize,
                    fillTowards = series.bars.fillTowards || 0,
                    defaultBottom = fillTowards > axisy.min ? Math.min(axisy.max, fillTowards) : axisy.min;

                for (var i = 0; i < points.length; i += ps) {
                    if (points[i] == null) {
                        continue;
                    }

                    // Use third point as bottom if pointsize is 3
                    var bottom = ps === 3 ? points[i + 2] : defaultBottom;
                    drawBar(points[i], points[i + 1], bottom, barLeft, barRight, fillStyleCallback, axisx, axisy, ctx, series.bars.horizontal, series.bars.lineWidth);
                }
            }

            ctx.save();
            ctx.translate(plotOffset.left, plotOffset.top);

            var datapoints = {
                format: series.datapoints.format,
                points: series.datapoints.points,
                pointsize: series.datapoints.pointsize
            };

            if (series.decimate) {
                datapoints.points = series.decimate(series, series.xaxis.min, series.xaxis.max, plotWidth);
            }

            ctx.lineWidth = series.bars.lineWidth;
            ctx.strokeStyle = series.color;

            var barLeft;
            var barWidth = series.bars.barWidth[0] || series.bars.barWidth;
            switch (series.bars.align) {
                case "left":
                    barLeft = 0;
                    break;
                case "right":
                    barLeft = -barWidth;
                    break;
                default:
                    barLeft = -barWidth / 2;
            }

            var fillStyleCallback = series.bars.fill ? function(bottom, top) {
                return getFillStyle(series.bars, series.color, bottom, top, getColorOrGradient);
            } : null;

            plotBars(datapoints, barLeft, barLeft + barWidth, fillStyleCallback, series.xaxis, series.yaxis);
            ctx.restore();
        }

        function getFillStyle(filloptions, seriesColor, bottom, top, getColorOrGradient) {
            var fill = filloptions.fill;
            if (!fill) {
                return null;
            }

            if (filloptions.fillColor) {
                return getColorOrGradient(filloptions.fillColor, bottom, top, seriesColor);
            }

            var c = $.color.parse(seriesColor);
            c.a = typeof fill === "number" ? fill : 0.4;
            c.normalize();
            return c.toString();
        }

        this.drawSeriesLines = drawSeriesLines;
        this.drawSeriesPoints = drawSeriesPoints;
        this.drawSeriesBars = drawSeriesBars;
        this.drawBar = drawBar;
    };

    $.plot.drawSeries = new DrawSeries();
})(jQuery);
/* global jQuery */

/**
## jquery.flot.hover.js

This plugin is used for mouse hover and tap on a point of plot series.
It supports the following options:
```js
grid: {
    hoverable: false, //to trigger plothover event on mouse hover or tap on a point
    clickable: false //to trigger plotclick event on mouse hover
}
```

It listens to native mouse move event or click, as well as artificial generated
tap and touchevent.

When the mouse is over a point or a tap on a point is performed, that point or
the correscponding bar will be highlighted and a "plothover" event will be generated.

Custom "touchevent" is triggered when any touch interaction is made. Hover plugin
handles this events by unhighlighting all of the previously highlighted points and generates
"plothovercleanup" event to notify any part that is handling plothover (for exemple to cleanup
the tooltip from webcharts).
*/


(function($) {
    'use strict';

    var options = {
        grid: {
            hoverable: false,
            clickable: false
        }
    };

    var browser = $.plot.browser;

    var eventType = {
        click: 'click',
        hover: 'hover'
    }

    function init(plot) {
        var lastMouseMoveEvent;
        var highlights = [];

        function bindEvents(plot, eventHolder) {
            var o = plot.getOptions();

            if (o.grid.hoverable || o.grid.clickable) {
                eventHolder[0].addEventListener('touchevent', triggerCleanupEvent, false);
                eventHolder[0].addEventListener('tap', generatePlothoverEvent, false);
            }

            if (o.grid.clickable) {
                eventHolder.bind("click", onClick);
            }

            if (o.grid.hoverable) {
                eventHolder.bind("mousemove", onMouseMove);

                // Use bind, rather than .mouseleave, because we officially
                // still support jQuery 1.2.6, which doesn't define a shortcut
                // for mouseenter or mouseleave.  This was a bug/oversight that
                // was fixed somewhere around 1.3.x.  We can return to using
                // .mouseleave when we drop support for 1.2.6.

                eventHolder.bind("mouseleave", onMouseLeave);
            }
        }

        function shutdown(plot, eventHolder) {
            eventHolder[0].removeEventListener('tap', generatePlothoverEvent);
            eventHolder[0].removeEventListener('touchevent', triggerCleanupEvent);
            eventHolder.unbind("mousemove", onMouseMove);
            eventHolder.unbind("mouseleave", onMouseLeave);
            eventHolder.unbind("click", onClick);
            highlights = [];
        }


        function generatePlothoverEvent(e) {
            var o = plot.getOptions(),
                newEvent = new CustomEvent('mouseevent');

            //transform from touch event to mouse event format
            newEvent.pageX = e.detail.changedTouches[0].pageX;
            newEvent.pageY = e.detail.changedTouches[0].pageY;
            newEvent.clientX = e.detail.changedTouches[0].clientX;
            newEvent.clientY = e.detail.changedTouches[0].clientY;

            if (o.grid.hoverable) {
                doTriggerClickHoverEvent(newEvent, eventType.hover, 30);
            }
            return false;
        }

        function doTriggerClickHoverEvent(event, eventType, searchDistance) {
            var series = plot.getData();
            if (event !== undefined
                && series.length > 0
                && series[0].xaxis.c2p !== undefined
                && series[0].yaxis.c2p !== undefined) {
                var eventToTrigger = "plot" + eventType;
                var seriesFlag = eventType + "able";
                triggerClickHoverEvent(eventToTrigger, event,
                    function(i) {
                        return series[i][seriesFlag] !== false;
                    }, searchDistance);
            }
        }

        function onMouseMove(e) {
            lastMouseMoveEvent = e;
            plot.getPlaceholder()[0].lastMouseMoveEvent = e;
            doTriggerClickHoverEvent(e, eventType.hover);
        }

        function onMouseLeave(e) {
            lastMouseMoveEvent = undefined;
            plot.getPlaceholder()[0].lastMouseMoveEvent = undefined;
            triggerClickHoverEvent("plothover", e,
                function(i) {
                    return false;
                });
        }

        function onClick(e) {
            doTriggerClickHoverEvent(e, eventType.click);
        }

        function triggerCleanupEvent() {
            plot.unhighlight();
            plot.getPlaceholder().trigger('plothovercleanup');
        }

        // trigger click or hover event (they send the same parameters
        // so we share their code)
        function triggerClickHoverEvent(eventname, event, seriesFilter, searchDistance) {
            var options = plot.getOptions(),
                offset = plot.offset(),
                page = browser.getPageXY(event),
                canvasX = page.X - offset.left,
                canvasY = page.Y - offset.top,
                pos = plot.c2p({
                    left: canvasX,
                    top: canvasY
                }),
                distance = searchDistance !== undefined ? searchDistance : options.grid.mouseActiveRadius;

            pos.pageX = page.X;
            pos.pageY = page.Y;

            var items = plot.findNearbyItems(canvasX, canvasY, seriesFilter, distance);
            var item = items[0];

            for (var i = 1; i < items.length; ++i) {
                if (item.distance === undefined || 
                    items[i].distance < item.distance) {
                    item = items[i];
                }
            }

            if (item) {
                // fill in mouse pos for any listeners out there
                item.pageX = parseInt(item.series.xaxis.p2c(item.datapoint[0]) + offset.left, 10);
                item.pageY = parseInt(item.series.yaxis.p2c(item.datapoint[1]) + offset.top, 10);
            } else {
                item = null;
            }

            if (options.grid.autoHighlight) {
                // clear auto-highlights
                for (var i = 0; i < highlights.length; ++i) {
                    var h = highlights[i];
                    if ((h.auto === eventname &&
                        !(item && h.series === item.series &&
                            h.point[0] === item.datapoint[0] &&
                            h.point[1] === item.datapoint[1])) || !item) {
                        unhighlight(h.series, h.point);
                    }
                }

                if (item) {
                    highlight(item.series, item.datapoint, eventname);
                }
            }

            plot.getPlaceholder().trigger(eventname, [pos, item, items]);
        }

        function highlight(s, point, auto) {
            if (typeof s === "number") {
                s = plot.getData()[s];
            }

            if (typeof point === "number") {
                var ps = s.datapoints.pointsize;
                point = s.datapoints.points.slice(ps * point, ps * (point + 1));
            }

            var i = indexOfHighlight(s, point);
            if (i === -1) {
                highlights.push({
                    series: s,
                    point: point,
                    auto: auto
                });

                plot.triggerRedrawOverlay();
            } else if (!auto) {
                highlights[i].auto = false;
            }
        }

        function unhighlight(s, point) {
            if (s == null && point == null) {
                highlights = [];
                plot.triggerRedrawOverlay();
                return;
            }

            if (typeof s === "number") {
                s = plot.getData()[s];
            }

            if (typeof point === "number") {
                var ps = s.datapoints.pointsize;
                point = s.datapoints.points.slice(ps * point, ps * (point + 1));
            }

            var i = indexOfHighlight(s, point);
            if (i !== -1) {
                highlights.splice(i, 1);

                plot.triggerRedrawOverlay();
            }
        }

        function indexOfHighlight(s, p) {
            for (var i = 0; i < highlights.length; ++i) {
                var h = highlights[i];
                if (h.series === s &&
                    h.point[0] === p[0] &&
                    h.point[1] === p[1]) {
                    return i;
                }
            }

            return -1;
        }

        function processDatapoints() {
            triggerCleanupEvent();
            doTriggerClickHoverEvent(lastMouseMoveEvent, eventType.hover);
        }

        function setupGrid() {
            doTriggerClickHoverEvent(lastMouseMoveEvent, eventType.hover);
        }

        function drawOverlay(plot, octx, overlay) {
            var plotOffset = plot.getPlotOffset(),
                i, hi;

            octx.save();
            octx.translate(plotOffset.left, plotOffset.top);
            for (i = 0; i < highlights.length; ++i) {
                hi = highlights[i];

                if (hi.series.bars.show) drawBarHighlight(hi.series, hi.point, octx);
                else drawPointHighlight(hi.series, hi.point, octx, plot);
            }
            octx.restore();
        }

        function drawPointHighlight(series, point, octx, plot) {
            var x = point[0],
                y = point[1],
                axisx = series.xaxis,
                axisy = series.yaxis,
                highlightColor = (typeof series.highlightColor === "string") ? series.highlightColor : $.color.parse(series.color).scale('a', 0.5).toString();

            if (x < axisx.min || x > axisx.max || y < axisy.min || y > axisy.max) {
                return;
            }

            var pointRadius = series.points.radius + series.points.lineWidth / 2;
            octx.lineWidth = pointRadius;
            octx.strokeStyle = highlightColor;
            var radius = 1.5 * pointRadius;
            x = axisx.p2c(x);
            y = axisy.p2c(y);

            octx.beginPath();
            var symbol = series.points.symbol;
            if (symbol === 'circle') {
                octx.arc(x, y, radius, 0, 2 * Math.PI, false);
            } else if (typeof symbol === 'string' && plot.drawSymbol && plot.drawSymbol[symbol]) {
                plot.drawSymbol[symbol](octx, x, y, radius, false);
            }

            octx.closePath();
            octx.stroke();
        }

        function drawBarHighlight(series, point, octx) {
            var highlightColor = (typeof series.highlightColor === "string") ? series.highlightColor : $.color.parse(series.color).scale('a', 0.5).toString(),
                fillStyle = highlightColor,
                barLeft;

            var barWidth = series.bars.barWidth[0] || series.bars.barWidth;
            switch (series.bars.align) {
                case "left":
                    barLeft = 0;
                    break;
                case "right":
                    barLeft = -barWidth;
                    break;
                default:
                    barLeft = -barWidth / 2;
            }

            octx.lineWidth = series.bars.lineWidth;
            octx.strokeStyle = highlightColor;

            var fillTowards = series.bars.fillTowards || 0,
                bottom = fillTowards > series.yaxis.min ? Math.min(series.yaxis.max, fillTowards) : series.yaxis.min;

            $.plot.drawSeries.drawBar(point[0], point[1], point[2] || bottom, barLeft, barLeft + barWidth,
                function() {
                    return fillStyle;
                }, series.xaxis, series.yaxis, octx, series.bars.horizontal, series.bars.lineWidth);
        }

        function initHover(plot, options) {
            plot.highlight = highlight;
            plot.unhighlight = unhighlight;
            if (options.grid.hoverable || options.grid.clickable) {
                plot.hooks.drawOverlay.push(drawOverlay);
                plot.hooks.processDatapoints.push(processDatapoints);
                plot.hooks.setupGrid.push(setupGrid);
            }

            lastMouseMoveEvent = plot.getPlaceholder()[0].lastMouseMoveEvent;
        }

        plot.hooks.bindEvents.push(bindEvents);
        plot.hooks.shutdown.push(shutdown);
        plot.hooks.processOptions.push(initHover);
    }

    $.plot.plugins.push({
        init: init,
        options: options,
        name: 'hover',
        version: '0.1'
    });
})(jQuery);
(function ($) {
    'use strict';
    $.plot.uiConstants = {
        SNAPPING_CONSTANT: 20,
        PANHINT_LENGTH_CONSTANT: 10,
        MINOR_TICKS_COUNT_CONSTANT: 4,
        TICK_LENGTH_CONSTANT: 10,
        ZOOM_DISTANCE_MARGIN: 25
    };
})(jQuery);
/* Flot plugin for selecting regions of a plot.

Copyright (c) 2007-2014 IOLA and Ole Laursen.
Licensed under the MIT license.

The plugin supports these options:

selection: {
    mode: null or "x" or "y" or "xy" or "smart",
    color: color,
    shape: "round" or "miter" or "bevel",
    visualization: "fill" or "focus",
    minSize: number of pixels
}

Selection support is enabled by setting the mode to one of "x", "y" or "xy".
In "x" mode, the user will only be able to specify the x range, similarly for
"y" mode. For "xy", the selection becomes a rectangle where both ranges can be
specified. "color" is color of the selection (if you need to change the color
later on, you can get to it with plot.getOptions().selection.color). "shape"
is the shape of the corners of the selection.

The way how the selection is visualized, can be changed by using the option
"visualization". Flot currently supports two modes: "focus" and "fill". The
option "focus" draws a colored bezel around the selected area while keeping
the selected area clear. The option "fill" highlights (i.e., fills) the
selected area with a colored highlight.

"minSize" is the minimum size a selection can be in pixels. This value can
be customized to determine the smallest size a selection can be and still
have the selection rectangle be displayed. When customizing this value, the
fact that it refers to pixels, not axis units must be taken into account.
Thus, for example, if there is a bar graph in time mode with BarWidth set to 1
minute, setting "minSize" to 1 will not make the minimum selection size 1
minute, but rather 1 pixel. Note also that setting "minSize" to 0 will prevent
"plotunselected" events from being fired when the user clicks the mouse without
dragging.

When selection support is enabled, a "plotselected" event will be emitted on
the DOM element you passed into the plot function. The event handler gets a
parameter with the ranges selected on the axes, like this:

    placeholder.bind( "plotselected", function( event, ranges ) {
        alert("You selected " + ranges.xaxis.from + " to " + ranges.xaxis.to)
        // similar for yaxis - with multiple axes, the extra ones are in
        // x2axis, x3axis, ...
    });

The "plotselected" event is only fired when the user has finished making the
selection. A "plotselecting" event is fired during the process with the same
parameters as the "plotselected" event, in case you want to know what's
happening while it's happening,

A "plotunselected" event with no arguments is emitted when the user clicks the
mouse to remove the selection. As stated above, setting "minSize" to 0 will
destroy this behavior.

The plugin allso adds the following methods to the plot object:

- setSelection( ranges, preventEvent )

  Set the selection rectangle. The passed in ranges is on the same form as
  returned in the "plotselected" event. If the selection mode is "x", you
  should put in either an xaxis range, if the mode is "y" you need to put in
  an yaxis range and both xaxis and yaxis if the selection mode is "xy", like
  this:

    setSelection({ xaxis: { from: 0, to: 10 }, yaxis: { from: 40, to: 60 } });

  setSelection will trigger the "plotselected" event when called. If you don't
  want that to happen, e.g. if you're inside a "plotselected" handler, pass
  true as the second parameter. If you are using multiple axes, you can
  specify the ranges on any of those, e.g. as x2axis/x3axis/... instead of
  xaxis, the plugin picks the first one it sees.

- clearSelection( preventEvent )

  Clear the selection rectangle. Pass in true to avoid getting a
  "plotunselected" event.

- getSelection()

  Returns the current selection in the same format as the "plotselected"
  event. If there's currently no selection, the function returns null.

*/


(function ($) {
    function init(plot) {
        var selection = {
            first: {x: -1, y: -1},
            second: {x: -1, y: -1},
            show: false,
            currentMode: 'xy',
            active: false
        };

        var SNAPPING_CONSTANT = $.plot.uiConstants.SNAPPING_CONSTANT;

        // FIXME: The drag handling implemented here should be
        // abstracted out, there's some similar code from a library in
        // the navigation plugin, this should be massaged a bit to fit
        // the Flot cases here better and reused. Doing this would
        // make this plugin much slimmer.
        var savedhandlers = {};

        var mouseUpHandler = null;

        function onMouseMove(e) {
            if (selection.active) {
                updateSelection(e);

                plot.getPlaceholder().trigger("plotselecting", [ getSelection() ]);
            }
        }

        function onMouseDown(e) {
            var o = plot.getOptions();
            // only accept left-click
            if (e.which !== 1 || o.selection.mode === null) return;

            // reinitialize currentMode
            selection.currentMode = 'xy';

            // cancel out any text selections
            document.body.focus();

            // prevent text selection and drag in old-school browsers
            if (document.onselectstart !== undefined && savedhandlers.onselectstart == null) {
                savedhandlers.onselectstart = document.onselectstart;
                document.onselectstart = function () { return false; };
            }
            if (document.ondrag !== undefined && savedhandlers.ondrag == null) {
                savedhandlers.ondrag = document.ondrag;
                document.ondrag = function () { return false; };
            }

            setSelectionPos(selection.first, e);

            selection.active = true;

            // this is a bit silly, but we have to use a closure to be
            // able to whack the same handler again
            mouseUpHandler = function (e) { onMouseUp(e); };

            $(document).one("mouseup", mouseUpHandler);
        }

        function onMouseUp(e) {
            mouseUpHandler = null;

            // revert drag stuff for old-school browsers
            if (document.onselectstart !== undefined) {
                document.onselectstart = savedhandlers.onselectstart;
            }

            if (document.ondrag !== undefined) {
                document.ondrag = savedhandlers.ondrag;
            }

            // no more dragging
            selection.active = false;
            updateSelection(e);

            if (selectionIsSane()) {
                triggerSelectedEvent();
            } else {
                // this counts as a clear
                plot.getPlaceholder().trigger("plotunselected", [ ]);
                plot.getPlaceholder().trigger("plotselecting", [ null ]);
            }

            return false;
        }

        function getSelection() {
            if (!selectionIsSane()) return null;

            if (!selection.show) return null;

            var r = {},
                c1 = {x: selection.first.x, y: selection.first.y},
                c2 = {x: selection.second.x, y: selection.second.y};

            if (selectionDirection(plot) === 'x') {
                c1.y = 0;
                c2.y = plot.height();
            }

            if (selectionDirection(plot) === 'y') {
                c1.x = 0;
                c2.x = plot.width();
            }

            $.each(plot.getAxes(), function (name, axis) {
                if (axis.used) {
                    var p1 = axis.c2p(c1[axis.direction]), p2 = axis.c2p(c2[axis.direction]);
                    r[name] = { from: Math.min(p1, p2), to: Math.max(p1, p2) };
                }
            });
            return r;
        }

        function triggerSelectedEvent() {
            var r = getSelection();

            plot.getPlaceholder().trigger("plotselected", [ r ]);

            // backwards-compat stuff, to be removed in future
            if (r.xaxis && r.yaxis) {
                plot.getPlaceholder().trigger("selected", [ { x1: r.xaxis.from, y1: r.yaxis.from, x2: r.xaxis.to, y2: r.yaxis.to } ]);
            }
        }

        function clamp(min, value, max) {
            return value < min ? min : (value > max ? max : value);
        }

        function selectionDirection(plot) {
            var o = plot.getOptions();

            if (o.selection.mode === 'smart') {
                return selection.currentMode;
            } else {
                return o.selection.mode;
            }
        }

        function updateMode(pos) {
            if (selection.first) {
                var delta = {
                    x: pos.x - selection.first.x,
                    y: pos.y - selection.first.y
                };

                if (Math.abs(delta.x) < SNAPPING_CONSTANT) {
                    selection.currentMode = 'y';
                } else if (Math.abs(delta.y) < SNAPPING_CONSTANT) {
                    selection.currentMode = 'x';
                } else {
                    selection.currentMode = 'xy';
                }
            }
        }

        function setSelectionPos(pos, e) {
            var offset = plot.getPlaceholder().offset();
            var plotOffset = plot.getPlotOffset();
            pos.x = clamp(0, e.pageX - offset.left - plotOffset.left, plot.width());
            pos.y = clamp(0, e.pageY - offset.top - plotOffset.top, plot.height());

            if (pos !== selection.first) updateMode(pos);

            if (selectionDirection(plot) === "y") {
                pos.x = pos === selection.first ? 0 : plot.width();
            }

            if (selectionDirection(plot) === "x") {
                pos.y = pos === selection.first ? 0 : plot.height();
            }
        }

        function updateSelection(pos) {
            if (pos.pageX == null) return;

            setSelectionPos(selection.second, pos);
            if (selectionIsSane()) {
                selection.show = true;
                plot.triggerRedrawOverlay();
            } else clearSelection(true);
        }

        function clearSelection(preventEvent) {
            if (selection.show) {
                selection.show = false;
                selection.currentMode = '';
                plot.triggerRedrawOverlay();
                if (!preventEvent) {
                    plot.getPlaceholder().trigger("plotunselected", [ ]);
                }
            }
        }

        // function taken from markings support in Flot
        function extractRange(ranges, coord) {
            var axis, from, to, key, axes = plot.getAxes();

            for (var k in axes) {
                axis = axes[k];
                if (axis.direction === coord) {
                    key = coord + axis.n + "axis";
                    if (!ranges[key] && axis.n === 1) {
                        // support x1axis as xaxis
                        key = coord + "axis";
                    }

                    if (ranges[key]) {
                        from = ranges[key].from;
                        to = ranges[key].to;
                        break;
                    }
                }
            }

            // backwards-compat stuff - to be removed in future
            if (!ranges[key]) {
                axis = coord === "x" ? plot.getXAxes()[0] : plot.getYAxes()[0];
                from = ranges[coord + "1"];
                to = ranges[coord + "2"];
            }

            // auto-reverse as an added bonus
            if (from != null && to != null && from > to) {
                var tmp = from;
                from = to;
                to = tmp;
            }

            return { from: from, to: to, axis: axis };
        }

        function setSelection(ranges, preventEvent) {
            var range;

            if (selectionDirection(plot) === "y") {
                selection.first.x = 0;
                selection.second.x = plot.width();
            } else {
                range = extractRange(ranges, "x");
                selection.first.x = range.axis.p2c(range.from);
                selection.second.x = range.axis.p2c(range.to);
            }

            if (selectionDirection(plot) === "x") {
                selection.first.y = 0;
                selection.second.y = plot.height();
            } else {
                range = extractRange(ranges, "y");
                selection.first.y = range.axis.p2c(range.from);
                selection.second.y = range.axis.p2c(range.to);
            }

            selection.show = true;
            plot.triggerRedrawOverlay();
            if (!preventEvent && selectionIsSane()) {
                triggerSelectedEvent();
            }
        }

        function selectionIsSane() {
            var minSize = plot.getOptions().selection.minSize;
            return Math.abs(selection.second.x - selection.first.x) >= minSize &&
                Math.abs(selection.second.y - selection.first.y) >= minSize;
        }

        plot.clearSelection = clearSelection;
        plot.setSelection = setSelection;
        plot.getSelection = getSelection;

        plot.hooks.bindEvents.push(function(plot, eventHolder) {
            var o = plot.getOptions();
            if (o.selection.mode != null) {
                eventHolder.mousemove(onMouseMove);
                eventHolder.mousedown(onMouseDown);
            }
        });

        function drawSelectionDecorations(ctx, x, y, w, h, oX, oY, mode) {
            var spacing = 3;
            var fullEarWidth = 15;
            var earWidth = Math.max(0, Math.min(fullEarWidth, w / 2 - 2, h / 2 - 2));
            ctx.fillStyle = '#ffffff';

            if (mode === 'xy') {
                ctx.beginPath();
                ctx.moveTo(x, y + earWidth);
                ctx.lineTo(x - 3, y + earWidth);
                ctx.lineTo(x - 3, y - 3);
                ctx.lineTo(x + earWidth, y - 3);
                ctx.lineTo(x + earWidth, y);
                ctx.lineTo(x, y);
                ctx.closePath();

                ctx.moveTo(x, y + h - earWidth);
                ctx.lineTo(x - 3, y + h - earWidth);
                ctx.lineTo(x - 3, y + h + 3);
                ctx.lineTo(x + earWidth, y + h + 3);
                ctx.lineTo(x + earWidth, y + h);
                ctx.lineTo(x, y + h);
                ctx.closePath();

                ctx.moveTo(x + w, y + earWidth);
                ctx.lineTo(x + w + 3, y + earWidth);
                ctx.lineTo(x + w + 3, y - 3);
                ctx.lineTo(x + w - earWidth, y - 3);
                ctx.lineTo(x + w - earWidth, y);
                ctx.lineTo(x + w, y);
                ctx.closePath();

                ctx.moveTo(x + w, y + h - earWidth);
                ctx.lineTo(x + w + 3, y + h - earWidth);
                ctx.lineTo(x + w + 3, y + h + 3);
                ctx.lineTo(x + w - earWidth, y + h + 3);
                ctx.lineTo(x + w - earWidth, y + h);
                ctx.lineTo(x + w, y + h);
                ctx.closePath();

                ctx.stroke();
                ctx.fill();
            }

            x = oX;
            y = oY;

            if (mode === 'x') {
                ctx.beginPath();
                ctx.moveTo(x, y + fullEarWidth);
                ctx.lineTo(x, y - fullEarWidth);
                ctx.lineTo(x - spacing, y - fullEarWidth);
                ctx.lineTo(x - spacing, y + fullEarWidth);
                ctx.closePath();

                ctx.moveTo(x + w, y + fullEarWidth);
                ctx.lineTo(x + w, y - fullEarWidth);
                ctx.lineTo(x + w + spacing, y - fullEarWidth);
                ctx.lineTo(x + w + spacing, y + fullEarWidth);
                ctx.closePath();
                ctx.stroke();
                ctx.fill();
            }

            if (mode === 'y') {
                ctx.beginPath();

                ctx.moveTo(x - fullEarWidth, y);
                ctx.lineTo(x + fullEarWidth, y);
                ctx.lineTo(x + fullEarWidth, y - spacing);
                ctx.lineTo(x - fullEarWidth, y - spacing);
                ctx.closePath();

                ctx.moveTo(x - fullEarWidth, y + h);
                ctx.lineTo(x + fullEarWidth, y + h);
                ctx.lineTo(x + fullEarWidth, y + h + spacing);
                ctx.lineTo(x - fullEarWidth, y + h + spacing);
                ctx.closePath();
                ctx.stroke();
                ctx.fill();
            }
        }

        plot.hooks.drawOverlay.push(function (plot, ctx) {
            // draw selection
            if (selection.show && selectionIsSane()) {
                var plotOffset = plot.getPlotOffset();
                var o = plot.getOptions();

                ctx.save();
                ctx.translate(plotOffset.left, plotOffset.top);

                var c = $.color.parse(o.selection.color);
                var visualization = o.selection.visualization;

                var scalingFactor = 1;

                // use a dimmer scaling factor if visualization is "fill"
                if (visualization === "fill") {
                    scalingFactor = 0.8;
                }

                ctx.strokeStyle = c.scale('a', scalingFactor).toString();
                ctx.lineWidth = 1;
                ctx.lineJoin = o.selection.shape;
                ctx.fillStyle = c.scale('a', 0.4).toString();

                var x = Math.min(selection.first.x, selection.second.x) + 0.5,
                    oX = x,
                    y = Math.min(selection.first.y, selection.second.y) + 0.5,
                    oY = y,
                    w = Math.abs(selection.second.x - selection.first.x) - 1,
                    h = Math.abs(selection.second.y - selection.first.y) - 1;

                if (selectionDirection(plot) === 'x') {
                    h += y;
                    y = 0;
                }

                if (selectionDirection(plot) === 'y') {
                    w += x;
                    x = 0;
                }

                if (visualization === "fill") {
                    ctx.fillRect(x, y, w, h);
                    ctx.strokeRect(x, y, w, h);
                } else {
                    ctx.fillRect(0, 0, plot.width(), plot.height());
                    ctx.clearRect(x, y, w, h);
                    drawSelectionDecorations(ctx, x, y, w, h, oX, oY, selectionDirection(plot));
                }

                ctx.restore();
            }
        });

        plot.hooks.shutdown.push(function (plot, eventHolder) {
            eventHolder.unbind("mousemove", onMouseMove);
            eventHolder.unbind("mousedown", onMouseDown);

            if (mouseUpHandler) {
                $(document).unbind("mouseup", mouseUpHandler);
            }
        });
    }

    $.plot.plugins.push({
        init: init,
        options: {
            selection: {
                mode: null, // one of null, "x", "y" or "xy"
                visualization: "focus", // "focus" or "fill"
                color: "#888888",
                shape: "round", // one of "round", "miter", or "bevel"
                minSize: 5 // minimum number of pixels
            }
        },
        name: 'selection',
        version: '1.1'
    });
})(jQuery);
/* =========================================================
 * bootstrap-slider.js v2.0.0
 * http://www.eyecon.ro/bootstrap-slider
 * =========================================================
 * Copyright 2012 Stefan Petre
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 * ========================================================= */

 
!function( $ ) {

  var Slider = function(element, options) {
    this.element = $(element);
    this.picker = $('<div class="slider">'+
              '<div class="slider-track">'+
                '<div class="slider-selection"></div>'+
                '<div class="slider-handle"></div>'+
                '<div class="slider-handle"></div>'+
              '</div>'+
              '<div class="tooltip"><div class="tooltip-arrow"></div><div class="tooltip-inner"></div></div>'+
            '</div>')
              .insertBefore(this.element)
              .append(this.element);
    this.id = this.element.data('slider-id')||options.id;
    if (this.id) {
      this.picker[0].id = this.id;
    }

    if (typeof Modernizr !== 'undefined' && Modernizr.touch) {
      this.touchCapable = true;
    }

    var tooltip = this.element.data('slider-tooltip')||options.tooltip;

    this.tooltip = this.picker.find('.tooltip');
    this.tooltipInner = this.tooltip.find('div.tooltip-inner');

    this.orientation = this.element.data('slider-orientation')||options.orientation;
    switch(this.orientation) {
      case 'vertical':
        this.picker.addClass('slider-vertical');
        this.stylePos = 'top';
        this.mousePos = 'pageY';
        this.sizePos = 'offsetHeight';
        this.tooltip.addClass('right')[0].style.left = '100%';
        break;
      default:
        this.picker
          .addClass('slider-horizontal')
          .css('width', this.element.outerWidth());
        this.orientation = 'horizontal';
        this.stylePos = 'left';
        this.mousePos = 'pageX';
        this.sizePos = 'offsetWidth';
        this.tooltip.addClass('top')[0].style.top = -this.tooltip.outerHeight() - 14 + 'px';
        break;
    }

    this.min = this.element.data('slider-min')||options.min;
    this.max = this.element.data('slider-max')||options.max;
    this.step = this.element.data('slider-step')||options.step;
    this.value = this.element.data('slider-value')||options.value;
    if (this.value[1]) {
      this.range = true;
    }

    this.selection = this.element.data('slider-selection')||options.selection;
    this.selectionEl = this.picker.find('.slider-selection');
    if (this.selection === 'none') {
      this.selectionEl.addClass('hide');
    }
    this.selectionElStyle = this.selectionEl[0].style;


    this.handle1 = this.picker.find('.slider-handle:first');
    this.handle1Stype = this.handle1[0].style;
    this.handle2 = this.picker.find('.slider-handle:last');
    this.handle2Stype = this.handle2[0].style;

    var handle = this.element.data('slider-handle')||options.handle;
    switch(handle) {
      case 'round':
        this.handle1.addClass('round');
        this.handle2.addClass('round');
        break
      case 'triangle':
        this.handle1.addClass('triangle');
        this.handle2.addClass('triangle');
        break
    }

    if (this.range) {
      this.value[0] = Math.max(this.min, Math.min(this.max, this.value[0]));
      this.value[1] = Math.max(this.min, Math.min(this.max, this.value[1]));
    } else {
      this.value = [ Math.max(this.min, Math.min(this.max, this.value))];
      this.handle2.addClass('hide');
      if (this.selection == 'after') {
        this.value[1] = this.max;
      } else {
        this.value[1] = this.min;
      }
    }
    this.diff = this.max - this.min;
    this.percentage = [
      (this.value[0]-this.min)*100/this.diff,
      (this.value[1]-this.min)*100/this.diff,
      this.step*100/this.diff
    ];

    this.offset = this.picker.offset();
    this.size = this.picker[0][this.sizePos];

    this.formater = options.formater;

    this.layout();

    if (this.touchCapable) {
      // Touch: Bind touch events:
      this.picker.on({
        touchstart: $.proxy(this.mousedown, this)
      });
    } else {
      this.picker.on({
        mousedown: $.proxy(this.mousedown, this)
      });
    }

    if (tooltip === 'show') {
      this.picker.on({
        mouseenter: $.proxy(this.showTooltip, this),
        mouseleave: $.proxy(this.hideTooltip, this)
      });
    } else {
      this.tooltip.addClass('hide');
    }
  };

  Slider.prototype = {
    constructor: Slider,

    over: false,
    inDrag: false,
    
    showTooltip: function(){
      this.tooltip.addClass('in');
      //var left = Math.round(this.percent*this.width);
      //this.tooltip.css('left', left - this.tooltip.outerWidth()/2);
      this.over = true;
    },
    
    hideTooltip: function(){
      if (this.inDrag === false) {
        this.tooltip.removeClass('in');
      }
      this.over = false;
    },

    layout: function(){
      this.handle1Stype[this.stylePos] = this.percentage[0]+'%';
      this.handle2Stype[this.stylePos] = this.percentage[1]+'%';
      if (this.orientation == 'vertical') {
        this.selectionElStyle.top = Math.min(this.percentage[0], this.percentage[1]) +'%';
        this.selectionElStyle.height = Math.abs(this.percentage[0] - this.percentage[1]) +'%';
      } else {
        this.selectionElStyle.left = Math.min(this.percentage[0], this.percentage[1]) +'%';
        this.selectionElStyle.width = Math.abs(this.percentage[0] - this.percentage[1]) +'%';
      }
      if (this.range) {
        this.tooltipInner.text(
          this.formater(this.value[0]) + 
          ' : ' + 
          this.formater(this.value[1])
        );
        this.tooltip[0].style[this.stylePos] = this.size * (this.percentage[0] + (this.percentage[1] - this.percentage[0])/2)/100 - (this.orientation === 'vertical' ? this.tooltip.outerHeight()/2 : this.tooltip.outerWidth()/2) +'px';
      } else {
        this.tooltipInner.text(
          this.formater(this.value[0])
        );
        this.tooltip[0].style[this.stylePos] = this.size * this.percentage[0]/100 - (this.orientation === 'vertical' ? this.tooltip.outerHeight()/2 : this.tooltip.outerWidth()/2) +'px';
      }
    },

    mousedown: function(ev) {

      // Touch: Get the original event:
      if (this.touchCapable && ev.type === 'touchstart') {
        ev = ev.originalEvent;
      }

      this.offset = this.picker.offset();
      this.size = this.picker[0][this.sizePos];

      var percentage = this.getPercentage(ev);

      if (this.range) {
        var diff1 = Math.abs(this.percentage[0] - percentage);
        var diff2 = Math.abs(this.percentage[1] - percentage);
        this.dragged = (diff1 < diff2) ? 0 : 1;
      } else {
        this.dragged = 0;
      }

      this.percentage[this.dragged] = percentage;
      this.layout();

      if (this.touchCapable) {
        // Touch: Bind touch events:
        $(document).on({
          touchmove: $.proxy(this.mousemove, this),
          touchend: $.proxy(this.mouseup, this)
        });
      } else {
        $(document).on({
          mousemove: $.proxy(this.mousemove, this),
          mouseup: $.proxy(this.mouseup, this)
        });
      }

      this.inDrag = true;
      var val = this.calculateValue();
      this.element.trigger({
          type: 'slideStart',
          value: val
        }).trigger({
          type: 'slide',
          value: val
        });
      return false;
    },

    mousemove: function(ev) {
      
      // Touch: Get the original event:
      if (this.touchCapable && ev.type === 'touchmove') {
        ev = ev.originalEvent;
      }

      var percentage = this.getPercentage(ev);
      if (this.range) {
        if (this.dragged === 0 && this.percentage[1] < percentage) {
          this.percentage[0] = this.percentage[1];
          this.dragged = 1;
        } else if (this.dragged === 1 && this.percentage[0] > percentage) {
          this.percentage[1] = this.percentage[0];
          this.dragged = 0;
        }
      }
      this.percentage[this.dragged] = percentage;
      this.layout();
      var val = this.calculateValue();
      this.element
        .trigger({
          type: 'slide',
          value: val
        })
        .data('value', val)
        .prop('value', val);
      return false;
    },

    mouseup: function(ev) {
      if (this.touchCapable) {
        // Touch: Bind touch events:
        $(document).off({
          touchmove: this.mousemove,
          touchend: this.mouseup
        });
      } else {
        $(document).off({
          mousemove: this.mousemove,
          mouseup: this.mouseup
        });
      }

      this.inDrag = false;
      if (this.over == false) {
        this.hideTooltip();
      }
      this.element;
      var val = this.calculateValue();
      this.element
        .trigger({
          type: 'slideStop',
          value: val
        })
        .data('value', val)
        .prop('value', val);
      return false;
    },

    calculateValue: function() {
      var val;
      if (this.range) {
        val = [
          (this.min + Math.round((this.diff * this.percentage[0]/100)/this.step)*this.step),
          (this.min + Math.round((this.diff * this.percentage[1]/100)/this.step)*this.step)
        ];
        this.value = val;
      } else {
        val = (this.min + Math.round((this.diff * this.percentage[0]/100)/this.step)*this.step);
        this.value = [val, this.value[1]];
      }
      return val;
    },

    getPercentage: function(ev) {
      if (this.touchCapable) {
        ev = ev.touches[0];
      }
      var percentage = (ev[this.mousePos] - this.offset[this.stylePos])*100/this.size;
      percentage = Math.round(percentage/this.percentage[2])*this.percentage[2];
      return Math.max(0, Math.min(100, percentage));
    },

    getValue: function() {
      if (this.range) {
        return this.value;
      }
      return this.value[0];
    },

    setValue: function(val) {
      this.value = val;

      if (this.range) {
        this.value[0] = Math.max(this.min, Math.min(this.max, this.value[0]));
        this.value[1] = Math.max(this.min, Math.min(this.max, this.value[1]));
      } else {
        this.value = [ Math.max(this.min, Math.min(this.max, this.value))];
        this.handle2.addClass('hide');
        if (this.selection == 'after') {
          this.value[1] = this.max;
        } else {
          this.value[1] = this.min;
        }
      }
      this.diff = this.max - this.min;
      this.percentage = [
        (this.value[0]-this.min)*100/this.diff,
        (this.value[1]-this.min)*100/this.diff,
        this.step*100/this.diff
      ];
      this.layout();
    }
  };

  $.fn.slider = function ( option, val ) {
    return this.each(function () {
      var $this = $(this),
        data = $this.data('slider'),
        options = typeof option === 'object' && option;
      if (!data)  {
        $this.data('slider', (data = new Slider(this, $.extend({}, $.fn.slider.defaults,options))));
      }
      if (typeof option == 'string') {
        data[option](val);
      }
    })
  };

  $.fn.slider.defaults = {
    min: 0,
    max: 10,
    step: 1,
    orientation: 'horizontal',
    value: 5,
    selection: 'before',
    tooltip: 'show',
    handle: 'round',
    formater: function(value) {
      return value;
    }
  };

  $.fn.slider.Constructor = Slider;

}( window.jQuery );
// for Blacklight.onLoad:

/* A custom event "plotDrawn.blacklight.rangeLimit" will be sent when flot plot
   is (re-)drawn on screen possibly with a new size. target of event will be the DOM element
   containing the plot.  Used to resize slider to match. */


Blacklight.onLoad(function() {
  // ratio of width to height for desired display, multiply width by this ratio
  // to get height. hard-coded in for now.
  var display_ratio = 1/(1.618 * 2); // half a golden rectangle, why not
  var redrawnEvent = "plotDrawn.blacklight.rangeLimit";



  // Facets already on the page? Turn em into a chart.
  $(".range_limit .profile .distribution.chart_js ul").each(function() {
      turnIntoPlot($(this).parent());
  });

  checkForNeededFacetsToFetch();

  // Listen for twitter bootstrap collapsible open events, to render flot
  // in previously hidden divs on open, if needed.
  $("body").on("show.bs.collapse", function(event) {
    // Was the target a .facet-content including a .chart-js?
    var container =  $(event.target).filter(".facet-content").find(".chart_js");

    // only if it doesn't already have a canvas, it isn't already drawn
    if (container && container.find("canvas").length == 0) {
      // be willing to wait up to 1100ms for container to
      // have width -- right away on show.bs is too soon, but
      // shown.bs is later than we want, we want to start rendering
      // while animation is still in progress.
      turnIntoPlot(container, 1100);
    }
  });

  // When loaded in a modal
  $(Blacklight.modal.modalSelector).on('shown.bs.modal', function() {
    $(this).find(".range_limit .profile .distribution.chart_js ul").each(function() {
      turnIntoPlot($(this).parent());
    });

    // Case when there is no currently selected range
    checkForNeededFacetsToFetch();
  });

  // Add AJAX fetched range facets if needed, and add a chart to em
  function checkForNeededFacetsToFetch() {
    $(".range_limit .profile .distribution a.load_distribution").each(function() {
      var container = $(this).parent('div.distribution');

      $(container).load($(this).attr('href'), function(response, status) {
        if ($(container).hasClass("chart_js") && status == "success" ) {
          turnIntoPlot(container);
          }
      });
    });
  }


  // after a collapsible facet contents is fully shown,
  // resize the flot chart to current conditions. This way, if you change
  // browser window size, you can get chart resized to fit by closing and opening
  // again, if needed.

  function redrawPlot(container) {
    if (container && container.width() > 0) {
      // resize the container's height, since width may have changed.
      container.height( container.width() * display_ratio  );

      // redraw the chart.
      var plot = container.data("plot");
      if (plot) {
        // how to redraw after possible resize?
        // Cribbed from https://github.com/flot/flot/blob/master/jquery.flot.resize.js
        plot.resize();
        plot.setupGrid();
        plot.draw();
        // plus trigger redraw of the selection, which otherwise ain't always right
        // we'll trigger a fake event on one of the boxes
        var form = $(container).closest(".limit_content").find("form.range_limit");
        form.find("input.range_begin").trigger("change");

        // send our custom event to trigger redraw of slider
        $(container).trigger(redrawnEvent);
      }
    }
  }

  $("body").on("shown.bs.collapse", function(event) {
    var container =  $(event.target).filter(".facet-content").find(".chart_js");
    redrawPlot(container);
  });

  // debouce borrowed from underscore
  // Returns a function, that, as long as it continues to be invoked, will not
  // be triggered. The function will be called after it stops being called for
  // N milliseconds. If `immediate` is passed, trigger the function on the
  // leading edge, instead of the trailing.
  debounce = function(func, wait, immediate) {
    var timeout;
    return function() {
      var context = this, args = arguments;
      var later = function() {
        timeout = null;
        if (!immediate) func.apply(context, args);
      };
      var callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) func.apply(context, args);
    };
  };

  $(window).on("resize", debounce(function() {
    $(".chart_js").each(function(i, container) {
      redrawPlot($(container));
    });
  }, 350));

  // second arg, if provided, is a number of ms we're willing to
  // wait for the container to have width before giving up -- we'll
  // set 50ms timers to check back until timeout is expired or the
  // container is finally visible. The timeout is used when we catch
  // bootstrap show event, but the animation hasn't barely begun yet -- but
  // we don't want to wait until it's finished, we want to start rendering
  // as soon as we can.
  //
  // We also will
  function turnIntoPlot(container, wait_for_visible) {
    // flot can only render in a a div with a defined width.
    // for instance, a hidden div can't generally be rendered in (although if you set
    // an explicit width on it, it might work)
    //
    // We'll count on later code that catch bootstrap collapse open to render
    // on show, for currently hidden divs.

    // for some reason width sometimes return negative, not sure
    // why but it's some kind of hidden.
    if (container.width() > 0) {
      var height = container.width() * display_ratio;

      // Need an explicit height to make flot happy.
      container.height( height )

      areaChart($(container));

      $(container).trigger(redrawnEvent);
    }
    else if (wait_for_visible > 0) {
      setTimeout(function() {
        turnIntoPlot(container, wait_for_visible - 50);
      }, 50);
    }
  }

     // Takes a div holding a ul of distribution segments produced by
    // blacklight_range_limit/_range_facets and makes it into
    // a flot area chart.
    function areaChart(container) {
      //flot loaded? And canvas element supported.
      if (  domDependenciesMet()  ) {

        // Grab the data from the ul div
        var series_data = new Array();
        var pointer_lookup = new Array();
        var x_ticks = new Array();
        var min = BlacklightRangeLimit.parseNum($(container).find("ul li:first-child span.from").text());
        var max = BlacklightRangeLimit.parseNum($(container).find("ul li:last-child span.to").text());

        $(container).find("ul li").each(function() {
            var from = BlacklightRangeLimit.parseNum($(this).find("span.from").text());
            var to = BlacklightRangeLimit.parseNum($(this).find("span.to").text());
            var count = BlacklightRangeLimit.parseNum($(this).find("span.count").text());
            var avg = (count / (to - from + 1));


            //We use the avg as the y-coord, to make the area of each
            //segment proportional to how many documents it holds.
            series_data.push( [from, avg ] );
            series_data.push( [to+1, avg] );

            x_ticks.push(from);

            pointer_lookup.push({'from': from, 'to': to, 'count': count, 'label': $(this).find(".facet_select").text() });
        });
        var max_plus_one = BlacklightRangeLimit.parseNum($(container).find("ul li:last-child span.to").text())+1;
        x_ticks.push( max_plus_one );



        var plot;
        var config = $(container).closest('.facet_limit').data('plot-config') || {};

        try {
          plot = $.plot($(container), [series_data],
              $.extend(true, config, {
              yaxis: {  ticks: [], min: 0, autoscaleMargin: 0.1},
            //xaxis: { ticks: x_ticks },
            xaxis: { tickDecimals: 0 }, // force integer ticks
            series: { lines: { fill: true, steps: true }},
            grid: {clickable: true, hoverable: true, autoHighlight: false, margin: { left: -14, right: -12 }},
            selection: {mode: "x"}
          }));
        }
        catch(err) {
          alert(err);
        }

        find_segment_for = function_for_find_segment(pointer_lookup);
        var last_segment = null;
        $(container).tooltip({'placement': 'bottom', 'trigger': 'manual', 'delay': { show: 0, hide: 100}});

        $(container).bind("plothover", function (event, pos, item) {
          segment = find_segment_for(pos.x);

          if(segment != last_segment) {
            var title = find_segment_for(pos.x).label  + ' (' + BlacklightRangeLimit.parseNum(segment.count) + ')';
            $(container).attr("title", title).tooltip("_fixTitle").tooltip("show");

            last_segment  = segment;
           }
        });

        $(container).bind("mouseout", function() {
          last_segment = null;
          $(container).tooltip('hide');
        });
        $(container).bind("plotclick", function (event, pos, item) {
            if ( plot.getSelection() == null) {
              segment = find_segment_for(pos.x);
              plot.setSelection( normalized_selection(segment.from, segment.to));
            }
        });
        $(container).bind("plotselected plotselecting", function(event, ranges) {
            if (ranges != null ) {
              var from = Math.floor(ranges.xaxis.from);
              var to = Math.floor(ranges.xaxis.to);

              var form = $(container).closest(".limit_content").find("form.range_limit");
              form.find("input.range_begin").val(from);
              form.find("input.range_end").val(to);

              var slider_placeholder = $(container).closest(".limit_content").find("[data-slider-placeholder]");
              if (slider_placeholder) {
                slider_placeholder.slider("setValue", [from, to+1]);
              }
            }
        });

        var form = $(container).closest(".limit_content").find("form.range_limit");
        form.find("input.range_begin, input.range_end").change(function () {
           plot.setSelection( form_selection(form, min, max) , true );
        });
        $(container).closest(".limit_content").find(".profile .range").on("slide", function(event, ui) {
          var values = $(event.target).data("slider").getValue();
          form.find("input.range_begin").val(values[0]);
          form.find("input.range_end").val(values[1]);
          plot.setSelection( normalized_selection(values[0], Math.max(values[0], values[1]-1)), true);
        });

        // initially entirely selected, to match slider
        plot.setSelection( {xaxis: { from:min, to:max+0.9999}}  );
      }
    }


    // Send endpoint to endpoint+0.99999 to have display
    // more closely approximate limiting behavior esp
    // at small resolutions. (Since we search on whole numbers,
    // inclusive, but flot chart is decimal.)
    function normalized_selection(min, max) {
      max += 0.99999;

      return {xaxis: { 'from':min, 'to':max}}
    }

    function form_selection(form, min, max) {
      var begin_val = BlacklightRangeLimit.parseNum($(form).find("input.range_begin").val());
      if (isNaN(begin_val) || begin_val < min) {
        begin_val = min;
      }
      var end_val = BlacklightRangeLimit.parseNum($(form).find("input.range_end").val());
      if (isNaN(end_val) || end_val > max) {
        end_val = max;
      }

      return normalized_selection(begin_val, end_val);
    }

    function function_for_find_segment(pointer_lookup_arr) {
      return function(x_coord) {
        for (var i = pointer_lookup_arr.length-1 ; i >= 0 ; i--) {
          var hash = pointer_lookup_arr[i];
          if (x_coord >= hash.from)
            return hash;
        }
        return pointer_lookup_arr[0];
      };
    }

    // Check if Flot is loaded, and if browser has support for
    // canvas object, either natively or via IE excanvas.
    function domDependenciesMet() {
      var flotLoaded = (typeof $.plot != "undefined");
      var canvasAvailable = ((typeof(document.createElement('canvas').getContext) != "undefined") || (typeof  window.CanvasRenderingContext2D != 'undefined' || typeof G_vmlCanvasManager != 'undefined'));

      return (flotLoaded && canvasAvailable);
    }
});

// takes a string and parses into an integer, but throws away commas first, to avoid truncation when there is a comma
// use in place of javascript's native parseInt
!function(global) {
  'use strict';

  var previousBlacklightRangeLimit = global.BlacklightRangeLimit;

  function BlacklightRangeLimit(options) {
    this.options = options || {};
  }

  BlacklightRangeLimit.parseNum = function parseNum(str) {
    str = String(str).replace(/[^0-9-]/g, '');
    return parseInt(str, 10);
  };

  BlacklightRangeLimit.noConflict = function noConflict() {
    global.BlacklightRangeLimit = previousBlacklightRangeLimit;
    return BlacklightRangeLimit;
  };

  global.BlacklightRangeLimit = BlacklightRangeLimit;
}(this);
// for Blacklight.onLoad:

Blacklight.onLoad(function() {

  $(".range_limit .profile .range.slider_js").each(function() {
    buildSlider(this);
  });

  $(Blacklight.modal.modalSelector).on('shown.bs.modal', function() {
    $(this).find(".range_limit .profile .range.slider_js").each(function() {
      buildSlider(this);
    });
  });

// catch event for redrawing chart, to redraw slider to match width
$("body").on("plotDrawn.blacklight.rangeLimit", function(event) {
  var area       = $(event.target).closest(".limit_content.range_limit");
  var plot       = area.find(".chart_js").data("plot");
  var slider_el  = area.find(".slider");

  if (plot && slider_el) {
      slider_el.width(plot.width());
      slider_el.css("display", "block")
      slider_el.css('margin-right', 'auto');
      slider_el.css('margin-left', 'auto'); 
  }
});

// returns two element array min/max as numbers. If there is a limit applied,
// it's boundaries are are limits. Otherwise, min/max in current result
// set as sniffed from HTML. Pass in a DOM element for a div.range
// Will return NaN as min or max in case of error or other weirdness. 
function min_max(range_element) {
   var current_limit =  $(range_element).closest(".limit_content.range_limit").find(".current")
   
   
   
   var min = max = BlacklightRangeLimit.parseNum(current_limit.find(".single").text())
   if ( isNaN(min)) {
     min = BlacklightRangeLimit.parseNum(current_limit.find(".from").first().text());
     max = BlacklightRangeLimit.parseNum(current_limit.find(".to").first().text());
   }
  
   if (isNaN(min) || isNaN(max)) {
      //no current limit, take from results min max included in spans
      min = BlacklightRangeLimit.parseNum($(range_element).find(".min").first().text());
      max = BlacklightRangeLimit.parseNum($(range_element).find(".max").first().text());
   }
   
   return [min, max]
}


// Check to see if a value is an Integer
// see: http://stackoverflow.com/questions/3885817/how-to-check-if-a-number-is-float-or-integer
function isInt(n) {
  return n % 1 === 0;
}

  function buildSlider(thisContext) {
    var range_element = $(thisContext);

    var boundaries = min_max(thisContext);
    var min = boundaries[0];
    var max = boundaries[1];

    if (isInt(min) && isInt(max)) {
      $(thisContext).contents().wrapAll('<div style="display:none" />');

      var range_element = $(thisContext);
      var form = $(range_element).closest(".range_limit").find("form.range_limit");
      var begin_el = form.find("input.range_begin");
      var end_el = form.find("input.range_end");

      var placeholder_input = $('<input type="hidden" data-slider-placeholder="true" />').appendTo(range_element);

      // make sure slider is loaded
      if (placeholder_input.slider !== undefined) {
        placeholder_input.slider({
          min: min,
          max: max + 1,
          value: [min, max + 1],
          tooltip: "hide"
        });

        // try to make slider width/orientation match chart's
        var container = range_element.closest(".range_limit");
        var plot = container.find(".chart_js").data("plot");
        var slider_el = container.find(".slider");

        if (plot && slider_el) {
          slider_el.width(plot.width());
          slider_el.css("display", "block")
          slider_el.css('margin-right', 'auto');
          slider_el.css('margin-left', 'auto');
        } else if (slider_el) {
          slider_el.css("width", "100%");
        }
      }

      // Slider change should update text input values.
      var parent = $(thisContext).parent();
      var form = $(parent).closest(".limit_content").find("form.range_limit");
      $(parent).closest(".limit_content").find(".profile .range").on("slide", function(event, ui) {
        var values = $(event.target).data("slider").getValue();
        form.find("input.range_begin").val(values[0]);
        form.find("input.range_end").val(values[1]);
      });
    }

    begin_el.val(min);
    end_el.val(max);

    begin_el.change(function() {
      var val = BlacklightRangeLimit.parseNum($(thisContext).val());
      if (isNaN(val) || val < min) {
        //for weird data, set slider at min           
        val = min;
      }
      var values = placeholder_input.data("slider").getValue();
      values[0] = val;
      placeholder_input.slider("setValue", values);
    });

    end_el.change(function() {
      var val = BlacklightRangeLimit.parseNum($(thisContext).val());
      if (isNaN(val) || val > max) {
        //weird entry, set slider to max
        val = max;
      }
      var values = placeholder_input.data("slider").getValue();
      values[1] = val;
      placeholder_input.slider("setValue", values);
    });
  }
});
// Master manifest file for engine, so local app can require
// this one file, but get all our files -- and local app
// require does not need to change if we change file list.
//
// Note JQuery is required to be loaded for flot and blacklight_range_limit
// JS to work, expect host app to load it.














;
