/* Zepto-like helper library */
(function(window, document){
  var doc = document;
  var docElem = doc.documentElement;

  function isFunction(obj){ return typeof obj === 'function'; }
  function isString(obj){ return typeof obj === 'string'; }
  function isObject(obj){ return obj !== null && typeof obj === 'object'; }
  function isArrayLike(obj){ return obj && typeof obj.length === 'number' && !isString(obj); }
  function toArray(obj){ return Array.prototype.slice.call(obj); }
  function eachObject(obj, fn){ for(var key in obj){ if (Object.prototype.hasOwnProperty.call(obj, key)) fn(key, obj[key]); }}

  function Z(nodes){ this.nodes = nodes || []; }

  function buildFragment(html){
    var template = doc.createElement('template');
    template.innerHTML = html.trim();
    return toArray(template.content.childNodes);
  }

  function splitEvents(events){ return events.split(/\s+/).filter(Boolean); }

  function normalizeContent(content){
    if (isString(content)) return buildFragment(content);
    if (content instanceof Z) return content.nodes;
    if (content && content.nodeType) return [content];
    if (isArrayLike(content)) return toArray(content);
    return [];
  }

  function setStyles(el, props){
    eachObject(props, function(key, value){ el.style[key] = value; });
  }

  function defaultDisplay(tagName){
    var temp = doc.createElement(tagName);
    doc.body.appendChild(temp);
    var display = getComputedStyle(temp).display;
    doc.body.removeChild(temp);
    return display === 'none' ? 'block' : display;
  }

  function animateCss(el, props, duration, easing, callback){
    var transition = el.style.transition;
    el.style.transition = 'all ' + (duration || 400) + 'ms ' + (easing || 'ease');
    setStyles(el, props);
    var handler = function(event){
      if (event && event.target !== el) return;
      el.removeEventListener('transitionend', handler);
      el.style.transition = transition;
      if (callback) callback.call(el, event);
    };
    el.addEventListener('transitionend', handler);
    return el;
  }

  function showElement(el){
    if (getComputedStyle(el).display === 'none') {
      el.style.display = defaultDisplay(el.tagName);
    }
  }

  function fadeInElement(el, duration, callback){
    showElement(el);
    el.style.opacity = 0;
    requestAnimationFrame(function(){
      animateCss(el, { opacity: '1' }, duration, 'ease', callback);
    });
    return el;
  }

  function fadeOutElement(el, duration, callback){
    el.style.opacity = el.style.opacity || getComputedStyle(el).opacity || 1;
    animateCss(el, { opacity: '0' }, duration, 'ease', function(event){
      el.style.display = 'none';
      if (callback) callback.call(el, event);
    });
    return el;
  }

  function slideDownElement(el, duration, callback){
    if (getComputedStyle(el).display !== 'none') return el;
    var oldDisplay = defaultDisplay(el.tagName);
    el.style.display = oldDisplay;
    el.style.overflow = 'hidden';
    el.style.height = '0';
    var targetHeight = el.scrollHeight + 'px';
    requestAnimationFrame(function(){
      animateCss(el, { height: targetHeight }, duration, 'ease', function(){
        el.style.height = '';
        el.style.overflow = '';
        if (callback) callback.call(el);
      });
    });
    return el;
  }

  function slideUpElement(el, duration, callback){
    if (getComputedStyle(el).display === 'none') return el;
    el.style.overflow = 'hidden';
    el.style.height = el.scrollHeight + 'px';
    requestAnimationFrame(function(){
      animateCss(el, { height: '0' }, duration, 'ease', function(){
        el.style.display = 'none';
        el.style.height = '';
        el.style.overflow = '';
        if (callback) callback.call(el);
      });
    });
    return el;
  }

  function findHandlerIndex(list, event, selector, handler){
    return list.findIndex(function(item){
      return item.event === event && item.selector === selector && item.handler === handler;
    });
  }

  function storeEvent(el, event, selector, handler, listener){
    el.__zeptoEvents = el.__zeptoEvents || [];
    el.__zeptoEvents.push({ event: event, selector: selector, handler: handler, listener: listener });
  }

  function removeStoredHandlers(el, event, selector, handler){
    if (!el.__zeptoEvents) return;
    el.__zeptoEvents = el.__zeptoEvents.filter(function(item){
      var matches = (!event || item.event === event) &&
                    (!selector || item.selector === selector) &&
                    (!handler || item.handler === handler);
      if (matches) el.removeEventListener(item.event, item.listener);
      return !matches;
    });
  }

  function buildParams(obj, prefix){
    var pairs = [];
    eachObject(obj, function(key, val){
      var k = prefix ? prefix + '[' + key + ']' : key;
      if (isObject(val) && !Array.isArray(val)) {
        pairs = pairs.concat(buildParams(val, k));
      } else if (Array.isArray(val)) {
        val.forEach(function(v){ pairs.push(encodeURIComponent(k) + '=' + encodeURIComponent(v)); });
      } else {
        pairs.push(encodeURIComponent(k) + '=' + encodeURIComponent(val));
      }
    });
    return pairs;
  }

  function param(obj){
    if (isString(obj)) return obj;
    return buildParams(obj).join('&');
  }

  function ajax(opts){
    opts = opts || {};
    var method = (opts.type || opts.method || 'GET').toUpperCase();
    var headers = opts.headers || {};
    var body = null;
    var url = opts.url || '';

    if (opts.data) {
      if (method === 'GET' || method === 'HEAD') {
        url += (url.indexOf('?') === -1 ? '?' : '&') + param(opts.data);
      } else if (opts.processData === false) {
        body = opts.data;
      } else {
        body = isString(opts.data) ? opts.data : param(opts.data);
        headers['Content-Type'] = headers['Content-Type'] || 'application/x-www-form-urlencoded; charset=UTF-8';
      }
    }

    if (opts.dataType === 'jsonp') {
      return new Promise(function(resolve, reject){
        var callbackName = 'jsonp_callback_' + Math.round(100000 * Math.random());
        window[callbackName] = function(data){
          resolve(data);
          delete window[callbackName];
          script.parentNode.removeChild(script);
        };
        var script = doc.createElement('script');
        script.src = url + (url.indexOf('?') === -1 ? '?' : '&') + 'callback=' + callbackName;
        script.onerror = function(){ reject(new Error('JSONP request failed')); };
        doc.body.appendChild(script);
      });
    }

    return fetch(url, { method: method, headers: headers, body: body, credentials: opts.xhrFields && opts.xhrFields.withCredentials ? 'include' : 'same-origin' }).then(function(res){
      if (!res.ok) return Promise.reject(res);
      if (opts.dataType === 'text') return res.text();
      if (opts.dataType === 'json' || opts.dataType === undefined) return res.json();
      return res.text();
    });
  }

  function get(url, data, success, dataType){
    if (isFunction(data)) { dataType = success; success = data; data = undefined; }
    return ajax({ url: url, type: 'GET', data: data, dataType: dataType }).then(function(response){ if (success) success(response); return response; });
  }

  function post(url, data, success, dataType){
    if (isFunction(data)) { dataType = success; success = data; data = undefined; }
    return ajax({ url: url, type: 'POST', data: data, dataType: dataType }).then(function(response){ if (success) success(response); return response; });
  }

  function getJSON(url, data, success){
    if (isFunction(data)) { success = data; data = undefined; }
    return get(url, data, success, 'json');
  }

  function extend(target){
    var args = toArray(arguments).slice(1);
    args.forEach(function(source){
      if (!source) return;
      eachObject(source, function(key, value){ target[key] = value; });
    });
    return target;
  }

  function $(selector, context){
    if (!selector) return new Z([]);
    if (isFunction(selector)) return domReady(selector);
    if (selector instanceof Z) return selector;

    var ctx = context || doc;
    var nodes = [];

    if (isString(selector)) {
      selector = selector.trim();
      if (selector[0] === '<' && selector[selector.length - 1] === '>') {
        nodes = buildFragment(selector);
      } else {
        nodes = toArray(ctx.querySelectorAll(selector));
      }
    } else if (selector.nodeType) {
      nodes = [selector];
    } else if (isArrayLike(selector)) {
      nodes = toArray(selector);
    }

    return new Z(nodes);
  }

  function domReady(fn){
    if (doc.readyState !== 'loading') return fn();
    doc.addEventListener('DOMContentLoaded', fn);
  }

  Z.prototype = {
    constructor: Z,
    each: function(callback){
      this.nodes.forEach(function(node, index){ callback.call(node, index, node); });
      return this;
    },
    map: function(callback){
      return this.nodes.map(function(node, index){ return callback.call(node, index, node); });
    },
    get: function(index){
      if (index === undefined) return toArray(this.nodes);
      if (index < 0) index = this.nodes.length + index;
      return this.nodes[index];
    },
    eq: function(index){
      return $(this.get(index));
    },
    first: function(){ return this.eq(0); },
    last: function(){ return this.eq(-1); },
    find: function(selector){
      var result = [];
      this.each(function(){ result = result.concat(toArray(this.querySelectorAll(selector))); });
      return $(result);
    },
    closest: function(selector){
      var result = [];
      this.each(function(){
        var match = this.closest(selector);
        if (match && result.indexOf(match) === -1) result.push(match);
      });
      return $(result);
    },
    parent: function(){
      var result = [];
      this.each(function(){
        if (this.parentNode && result.indexOf(this.parentNode) === -1) result.push(this.parentNode);
      });
      return $(result);
    },
    children: function(){
      var result = [];
      this.each(function(){ result = result.concat(toArray(this.children)); });
      return $(result);
    },
    siblings: function(){
      var result = [];
      this.each(function(){
        var children = toArray(this.parentNode ? this.parentNode.children : []);
        children.forEach(function(node){ if (node !== this && result.indexOf(node) === -1) result.push(node); }, this);
      });
      return $(result);
    },
    filter: function(selector){
      var result = [];
      if (isFunction(selector)) {
        this.each(function(index){ if (selector.call(this, index, this)) result.push(this); });
      } else {
        this.each(function(){ if (this.matches(selector)) result.push(this); });
      }
      return $(result);
    },
    not: function(selector){
      var result = [];
      if (isFunction(selector)) {
        this.each(function(index){ if (!selector.call(this, index, this)) result.push(this); });
      } else {
        this.each(function(){ if (!this.matches(selector)) result.push(this); });
      }
      return $(result);
    },
    addClass: function(name){
      if (!name) return this;
      var classes = name.split(/\s+/);
      this.each(function(){ this.classList.add.apply(this.classList, classes); });
      return this;
    },
    removeClass: function(name){
      if (!name) return this;
      var classes = name.split(/\s+/);
      this.each(function(){ this.classList.remove.apply(this.classList, classes); });
      return this;
    },
    toggleClass: function(name, state){
      if (!name) return this;
      var classes = name.split(/\s+/);
      this.each(function(){
        classes.forEach(function(cls){
          var shouldAdd = state === undefined ? !this.classList.contains(cls) : state;
          if (shouldAdd) this.classList.add(cls);
          else this.classList.remove(cls);
        }, this);
      });
      return this;
    },
    hasClass: function(name){
      if (!name || !this.nodes.length) return false;
      return this.nodes.some(function(node){ return node.classList.contains(name); });
    },
    attr: function(name, value){
      if (value === undefined) {
        if (isObject(name)) return this;
        if (!this.nodes[0]) return undefined;
        return this.nodes[0].getAttribute(name);
      }
      if (isObject(name)) {
        eachObject(name, function(key, val){ this.each(function(){ this.setAttribute(key, val); }); }.bind(this));
        return this;
      }
      this.each(function(){ this.setAttribute(name, value); });
      return this;
    },
    removeAttr: function(name){
      if (!name) return this;
      this.each(function(){ this.removeAttribute(name); });
      return this;
    },
    prop: function(name, value){
      if (value === undefined) return this.nodes[0] && this.nodes[0][name];
      this.each(function(){ this[name] = value; });
      return this;
    },
    data: function(name, value){
      if (value === undefined) {
        if (!this.nodes[0]) return undefined;
        return this.nodes[0].dataset ? this.nodes[0].dataset[name] : null;
      }
      this.each(function(){ if (this.dataset) this.dataset[name] = value; });
      return this;
    },
    val: function(value){
      if (value === undefined) return this.nodes[0] && this.nodes[0].value;
      this.each(function(){ this.value = value; });
      return this;
    },
    html: function(value){
      if (value === undefined) return this.nodes[0] && this.nodes[0].innerHTML;
      this.each(function(){ this.innerHTML = value; });
      return this;
    },
    text: function(value){
      if (value === undefined) return this.nodes.map(function(node){ return node.textContent; }).join('');
      this.each(function(){ this.textContent = value; });
      return this;
    },
    css: function(prop, value){
      if (value === undefined && isObject(prop)) {
        this.each(function(){ eachObject(prop, function(key, val){ this.style[key] = val; }.bind(this)); });
        return this;
      }
      if (value === undefined) {
        return this.nodes[0] ? getComputedStyle(this.nodes[0])[prop] : undefined;
      }
      this.each(function(){ this.style[prop] = value; });
      return this;
    },
    show: function(){
      this.each(function(){ this.style.display = ''; });
      return this;
    },
    hide: function(){
      this.each(function(){ this.style.display = 'none'; });
      return this;
    },
    toggle: function(state){
      this.each(function(){
        var isHidden = getComputedStyle(this).display === 'none';
        var show = state === undefined ? isHidden : state;
        this.style.display = show ? '' : 'none';
      });
      return this;
    },
    append: function(content){
      var nodes = normalizeContent(content);
      this.each(function(){
        var parent = this;
        nodes.forEach(function(node){ parent.appendChild(node.cloneNode(true)); });
      });
      return this;
    },
    prepend: function(content){
      var nodes = normalizeContent(content);
      this.each(function(){
        var parent = this;
        for (var i = nodes.length - 1; i >= 0; i--) {
          parent.insertBefore(nodes[i].cloneNode(true), parent.firstChild);
        }
      });
      return this;
    },
    before: function(content){
      var nodes = normalizeContent(content);
      this.each(function(){
        var ref = this;
        nodes.forEach(function(node){ ref.parentNode.insertBefore(node.cloneNode(true), ref); });
      });
      return this;
    },
    after: function(content){
      var nodes = normalizeContent(content);
      this.each(function(){
        var ref = this;
        var parent = ref.parentNode;
        nodes.slice().reverse().forEach(function(node){ parent.insertBefore(node.cloneNode(true), ref.nextSibling); });
      });
      return this;
    },
    empty: function(){
      this.each(function(){ this.innerHTML = ''; });
      return this;
    },
    remove: function(){
      this.each(function(){ if (this.parentNode) this.parentNode.removeChild(this); });
      return this;
    },
    clone: function(){
      return $(this.nodes.map(function(node){ return node.cloneNode(true); }));
    },
    appendTo: function(target){
      var parents = $(target);
      this.each(function(){
        var node = this;
        parents.each(function(){ this.appendChild(node.cloneNode(true)); });
      });
      return this;
    },
    prependTo: function(target){
      var parents = $(target);
      this.each(function(){
        var node = this;
        parents.each(function(){ this.insertBefore(node.cloneNode(true), this.firstChild); });
      });
      return this;
    },
    insertBefore: function(target){
      var ref = $(target).get(0);
      if (!ref) return this;
      this.each(function(){ ref.parentNode.insertBefore(this.cloneNode(true), ref); });
      return this;
    },
    insertAfter: function(target){
      var ref = $(target).get(0);
      if (!ref || !ref.parentNode) return this;
      this.each(function(){ ref.parentNode.insertBefore(this.cloneNode(true), ref.nextSibling); });
      return this;
    },
    replaceWith: function(content){
      var nodes = normalizeContent(content);
      this.each(function(){
        var current = this;
        nodes.forEach(function(node){ current.parentNode.insertBefore(node.cloneNode(true), current); });
        if (current.parentNode) current.parentNode.removeChild(current);
      });
      return this;
    },
    serialize: function(){
      var elements = [];
      this.each(function(){
        if (this.elements) elements = elements.concat(toArray(this.elements));
      });
      var params = [];
      elements.forEach(function(el){
        if (!el.name || el.disabled) return;
        var type = el.type;
        if ((type === 'checkbox' || type === 'radio') && !el.checked) return;
        if (type === 'select-multiple') {
          toArray(el.options).forEach(function(option){
            if (option.selected) params.push(encodeURIComponent(el.name) + '=' + encodeURIComponent(option.value));
          });
          return;
        }
        params.push(encodeURIComponent(el.name) + '=' + encodeURIComponent(el.value));
      });
      return params.join('&');
    },
    offset: function(){
      var el = this.nodes[0];
      if (!el) return undefined;
      var rect = el.getBoundingClientRect();
      return { top: rect.top + window.pageYOffset, left: rect.left + window.pageXOffset };
    },
    position: function(){
      var el = this.nodes[0];
      if (!el) return undefined;
      return { top: el.offsetTop, left: el.offsetLeft };
    },
    width: function(value){
      if (value === undefined) return this.nodes[0] ? this.nodes[0].getBoundingClientRect().width : undefined;
      this.each(function(){ this.style.width = typeof value === 'number' ? value + 'px' : value; });
      return this;
    },
    height: function(value){
      if (value === undefined) return this.nodes[0] ? this.nodes[0].getBoundingClientRect().height : undefined;
      this.each(function(){ this.style.height = typeof value === 'number' ? value + 'px' : value; });
      return this;
    },
    fadeIn: function(duration, callback){
      this.each(function(){ fadeInElement(this, duration, callback); });
      return this;
    },
    fadeOut: function(duration, callback){
      this.each(function(){ fadeOutElement(this, duration, callback); });
      return this;
    },
    fadeToggle: function(duration, callback){
      this.each(function(){
        if (getComputedStyle(this).display === 'none') fadeInElement(this, duration, callback);
        else fadeOutElement(this, duration, callback);
      });
      return this;
    },
    slideDown: function(duration, callback){
      this.each(function(){ slideDownElement(this, duration, callback); });
      return this;
    },
    slideUp: function(duration, callback){
      this.each(function(){ slideUpElement(this, duration, callback); });
      return this;
    },
    slideToggle: function(duration, callback){
      this.each(function(){
        if (getComputedStyle(this).display === 'none') slideDownElement(this, duration, callback);
        else slideUpElement(this, duration, callback);
      });
      return this;
    },
    animate: function(properties, duration, easing, callback){
      this.each(function(){ animateCss(this, properties, duration, easing, callback); });
      return this;
    },
    scrollTop: function(value){
      if (value === undefined) {
        var el = this.nodes[0];
        if (!el) return undefined;
        return el === window || el === document ? window.pageYOffset : el.scrollTop;
      }
      this.each(function(){
        if (this === window || this === document) { window.scrollTo(window.pageXOffset, value); }
        else this.scrollTop = value;
      });
      return this;
    },
    scrollLeft: function(value){
      if (value === undefined) {
        var el = this.nodes[0];
        if (!el) return undefined;
        return el === window || el === document ? window.pageXOffset : el.scrollLeft;
      }
      this.each(function(){
        if (this === window || this === document) { window.scrollTo(value, window.pageYOffset); }
        else this.scrollLeft = value;
      });
      return this;
    },
    on: function(event, selector, handler){
      if (isFunction(selector)) { handler = selector; selector = null; }
      var events = splitEvents(event);
      this.each(function(){
        var element = this;
        events.forEach(function(name){
          var callback = selector ? function(e){
            var target = e.target.closest(selector);
            if (target && element.contains(target)) handler.call(target, e);
          } : handler;
          element.addEventListener(name, callback);
          storeEvent(element, name, selector, handler, callback);
        });
      });
      return this;
    },
    off: function(event, selector, handler){
      if (isFunction(selector)) { handler = selector; selector = null; }
      this.each(function(){
        var element = this;
        if (!event) {
          removeStoredHandlers(element);
          return;
        }
        splitEvents(event).forEach(function(name){ removeStoredHandlers(element, name, selector, handler); });
      });
      return this;
    },
    trigger: function(eventName, data){
      var event = doc.createEvent('Event');
      event.initEvent(eventName, true, true);
      event.data = data;
      this.each(function(){ this.dispatchEvent(event); });
      return this;
    },
    is: function(selector){
      if (!this.nodes[0] || !selector) return false;
      return this.nodes[0].matches(selector);
    }
  };

  Object.defineProperty(Z.prototype, 'length', {
    get: function(){ return this.nodes.length; }
  });

  $.ajax = ajax;
  $.get = get;
  $.post = post;
  $.getJSON = getJSON;
  $.param = param;
  $.extend = extend;
  $.ready = domReady;
  $.fn = Z.prototype;

  window.$ = $;
  window.Zepto = Z;
  window.zepto = { ajax: ajax, get: get, post: post, getJSON: getJSON, param: param, extend: extend, ready: domReady };

})(window, document);

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    $: window.$,
    Zepto: window.Zepto,
    zepto: window.zepto
  };
}
if (typeof define === 'function' && define.amd) {
  define(function(){ return window.$; });
}
