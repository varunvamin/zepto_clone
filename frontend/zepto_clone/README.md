Zepto Clone

A more complete Zepto-like helper library for DOM manipulation, events, and ajax helpers.

Features:
- Selector engine with `$()` and DOM ready shorthand via `$.ready()`.
- DOM traversal: `.find()`, `.closest()`, `.parent()`, `.children()`, `.siblings()`.
- Manipulation: `.html()`, `.text()`, `.attr()`, `.prop()`, `.val()`, `.data()`, `.append()`, `.prepend()`, `.before()`, `.after()`, `.insertBefore()`, `.insertAfter()`, `.appendTo()`, `.prependTo()`, `.replaceWith()`, `.remove()`, `.empty()`, `.serialize()`.
- Layout: `.offset()`, `.position()`, `.width()`, `.height()`, `.scrollTop()`, `.scrollLeft()`.
- Class utils: `.addClass()`, `.removeClass()`, `.toggleClass()`, `.hasClass()`.
- Event helpers: `.on()`, `.off()`, `.trigger()` with delegation support.
- CSS helpers: `.css()`, `.show()`, `.hide()`, `.toggle()`.
- Effects: `.fadeIn()`, `.fadeOut()`, `.fadeToggle()`, `.slideDown()`, `.slideUp()`, `.slideToggle()`, `.animate()`.
- Ajax helpers: `$.ajax()`, `$.get()`, `$.post()`, `$.getJSON()`, `$.param()`.

Files:
- `src/zepto.js` — full library implementation.
- `demo/index.html` — interactive demo page.
- `demo/test.html` — browser-based quick test harness.
- `__tests__/zepto.test.js` — Jest unit tests.

Quick start:
1. Install dependencies:
   ```powershell
   cd frontend/zepto_clone
   npm install
   ```
2. Run demo server:
   ```powershell
   npm run start
   ```
3. Open `http://127.0.0.1:8080`.
4. Run tests:
   ```powershell
   npm test
   ```

The cloned API is intentionally small and easy to extend. Feel free to add more helpers like `.fadeIn()`, `.serialize()`, or more event utilities.
