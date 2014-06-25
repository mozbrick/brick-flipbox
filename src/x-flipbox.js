(function () {

  var prefix = (function () {
    var styles = window.getComputedStyle(document.documentElement, '');
    var pre = (Array.prototype.slice
                .call(styles)
                .join('')
                .match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o'])
              )[1];
    return {
      dom: pre === 'ms' ? 'MS' : pre,
      lowercase: pre,
      css: '-' + pre + '-',
      js: pre === 'ms' ? pre : pre[0].toUpperCase() + pre.substr(1)
    };
  })();

  var requestFrame = (function(){
    var raf = window.requestAnimationFrame ||
              window[prefix.lowercase + 'RequestAnimationFrame'] ||
              function(fn){ return window.setTimeout(fn, 20); };
    return function(fn){ return raf(fn); };
  })();

  var skipTransition = function(element, fn, bind){
    var prop = prefix.js + 'TransitionProperty';
    element.style[prop] = element.style.transitionProperty = 'none';
    var callback = fn ? fn.call(bind) : null;
    return requestFrame(function(){
      requestFrame(function(){
        element.style[prop] = element.style.transitionProperty = '';
        if (callback) {
          requestFrame(callback);
        }
      });
    });
  };


  var FlipboxPrototype = Object.create(HTMLElement.prototype);

  FlipboxPrototype.attachedCallback = function () {
    // default to right.
    var direction = this.getAttribute('direction') || 'right';
    this.direction = direction;
    // instantiate sides without initial flip animation
    if (this.firstElementChild) {
      skipTransition(this.firstElementChild, function () {});
    }
    if (this.lastElementChild) {
      skipTransition(this.lastElementChild, function () {});
    }
    // fire an flipend Event when the transition ended.
    this.firstElementChild.addEventListener('transitionend', function(e) {
      var flipBox = e.target.parentNode;
      var event = new CustomEvent('flipend', {'bubbles': true});
      flipBox.dispatchEvent(event);
      e.stopPropagation();
    });
  };

  FlipboxPrototype.attributeChangedCallback = function (attr, oldVal, newVal) {
    if (attr in attrs) {
      attrs[attr].call(this, oldVal, newVal);
    }
  };

  // Attribute handlers
  var attrs = {
    'direction': function (oldVal, newVal) {
      // Use the setter to update the _anim-direction as well.
      this.direction = newVal;
    }
  };

  // Custom methods
  FlipboxPrototype.toggle = function() {
    var newFlippedState = !this.hasAttribute('flipped');
    if (newFlippedState) {
      this.setAttribute('flipped','');
    } else {
      this.removeAttribute('flipped');
    }
  };

  FlipboxPrototype.showFront = function() {
    this.removeAttribute('flipped');
  };

  FlipboxPrototype.showBack = function() {
    this.setAttribute ('flipped','');
  };


  // Property handlers
  Object.defineProperties(FlipboxPrototype, {

    'flipped': {
      // The flipped state is only represented in the flipped attribute.
      get: function() {
        return this.hasAttribute('flipped');
      },
      set: function(newVal) {
        if (newVal) {
          this.setAttribute('flipped', newVal);
        } else {
          this.removeAttribute('flipped');
        }
      }
    },

    'direction': {
      get: function() {
        return this.getAttribute('direction');
      },
      set: function(newVal) {
        var self = this;
        // update the attribute if needed.
        if (self.setAttribute !== newVal) {
          self.setAttribute('direction', newVal);
        }
        // do skipTransition with bot sides.
        skipTransition(this.firstElementChild, function () {
          self.setAttribute('_anim-direction', newVal);
        });
        skipTransition(this.lastElementChild, function () {});
      }
    }

  });

  // Register the element
  window.XFlipbox = document.registerElement('x-flipbox', {
    prototype: FlipboxPrototype
  });

})();
