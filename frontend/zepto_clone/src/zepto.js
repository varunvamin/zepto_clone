/* Minimal Zepto-like helper - attaches `$` to window */
(function(window, document){
  function Zepto(nodes){ this.nodes = nodes || []; }

  Zepto.prototype.each = function(fn){
    this.nodes.forEach(function(n, i){ fn.call(n, i, n); });
    return this;
  };

  Zepto.prototype.on = function(event, handler){
    this.each(function(){ this.addEventListener(event, handler); });
    return this;
  };

  Zepto.prototype.off = function(event, handler){
    this.each(function(){ this.removeEventListener(event, handler); });
    return this;
  };

  Zepto.prototype.addClass = function(name){
    this.each(function(){ this.classList.add.apply(this.classList, name.split(/\s+/)); });
    return this;
  };

  Zepto.prototype.removeClass = function(name){
    this.each(function(){ this.classList.remove.apply(this.classList, name.split(/\s+/)); });
    return this;
  };

  Zepto.prototype.css = function(prop, value){
    if (value === undefined) {
      var el = this.nodes[0];
      return el ? getComputedStyle(el)[prop] : undefined;
    }
    this.each(function(){ this.style[prop] = value; });
    return this;
  };

  Zepto.prototype.attr = function(name, value){
    if (value === undefined) return this.nodes[0] && this.nodes[0].getAttribute(name);
    this.each(function(){ this.setAttribute(name, value); });
    return this;
  };

  Zepto.prototype.html = function(val){
    if (val === undefined) return this.nodes[0] && this.nodes[0].innerHTML;
    this.each(function(){ this.innerHTML = val; });
    return this;
  };

  Zepto.prototype.text = function(val){
    if (val === undefined) return this.nodes[0] && this.nodes[0].textContent;
    this.each(function(){ this.textContent = val; });
    return this;
  };

  Zepto.prototype.append = function(content){
    if (typeof content === 'string') {
      this.each(function(){ this.insertAdjacentHTML('beforeend', content); });
    } else {
      this.each(function(){ this.appendChild(content.cloneNode(true)); });
    }
    return this;
  };

  function $(selector, context){
    if (typeof selector === 'function') return domReady(selector);
    var ctx = context || document;
    var nodes = [];
    if (!selector) nodes = [];
    else if (typeof selector === 'string') nodes = Array.from(ctx.querySelectorAll(selector));
    else if (selector.nodeType) nodes = [selector];
    else nodes = Array.from(selector || []);
    return new Zepto(nodes);
  }

  function domReady(fn){
    if (document.readyState !== 'loading') fn();
    else document.addEventListener('DOMContentLoaded', fn);
  }

  // Minimal ajax wrapper using fetch
  function ajax(opts){
    opts = opts || {};
    var method = (opts.type || 'GET').toUpperCase();
    var headers = opts.headers || {};
    var body = opts.data ? (typeof opts.data === 'string' ? opts.data : JSON.stringify(opts.data)) : undefined;
    return fetch(opts.url, { method: method, headers: headers, body: body }).then(function(res){
      if (!res.ok) return Promise.reject(res);
      if (opts.dataType === 'text') return res.text();
      return res.json();
    });
  }

  window.$ = $;
  window.Zepto = Zepto;
  window.zepto = { ajax: ajax };

})(window, document);

// UMD/CommonJS exports for testing and bundling
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
