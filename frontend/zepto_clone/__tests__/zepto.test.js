const lib = require('../src/zepto.js');
const $ = lib.$;

test('$ is a function', () => {
  expect(typeof $).toBe('function');
});

test('selects and manipulates DOM', () => {
  const root = document.createElement('div');
  root.id = 'jest-root';
  root.innerHTML = '<button id="jb">x</button><div id="jo"></div><div class="item"></div><div class="item"></div>';
  document.body.appendChild(root);

  const btn = $('#jb');
  expect(btn.get(0).id).toBe('jb');
  expect(btn.eq(0).nodes.length).toBe(1);

  let called = false;
  function h(){ called = true; }
  btn.on('click', h);
  document.getElementById('jb').click();
  expect(called).toBe(true);
  btn.off('click', h);
  called = false;
  document.getElementById('jb').click();
  expect(called).toBe(false);

  $('#jo').attr('data-test', '1');
  expect($('#jo').attr('data-test')).toBe('1');

  $('#jo').text('hello');
  expect($('#jo').text()).toBe('hello');

  $('#jo').css('color', 'rgb(255, 0, 0)');
  expect($('#jo').css('color')).toBe('rgb(255, 0, 0)');

  const items = $('.item');
  expect(items.length).toBe(2);
  items.addClass('selected');
  expect(items.hasClass('selected')).toBe(true);
  items.removeClass('selected');
  expect(items.hasClass('selected')).toBe(false);

  const prep = $('#jo').append('<span class="child">child</span>');
  expect(prep.find('.child').text()).toBe('child');
});

test('animation helpers exist and update styles', () => {
  const anim = document.createElement('div');
  anim.id = 'anim';
  anim.style.display = 'none';
  document.body.appendChild(anim);
  const $anim = $('#anim');

  expect(typeof $anim.fadeIn).toBe('function');
  expect(typeof $anim.fadeOut).toBe('function');
  expect(typeof $anim.slideDown).toBe('function');
  expect(typeof $anim.slideUp).toBe('function');
  expect(typeof $anim.animate).toBe('function');

  $anim.fadeIn(1);
  expect($anim.get(0).style.display).not.toBe('none');

  $anim.fadeOut(1);
  expect($anim.get(0).style.opacity).toBe('0');

  expect(() => $anim.slideDown(1)).not.toThrow();
  expect(() => $anim.slideUp(1)).not.toThrow();

  $anim.animate({ width: '120px' }, 1);
  expect($anim.get(0).style.width).toBe('120px');
});

test('event delegation works', () => {
  const root = document.createElement('div');
  root.id = 'delegate-root';
  root.innerHTML = '<ul><li class="item">one</li><li class="item">two</li></ul>';
  document.body.appendChild(root);

  const list = $('#delegate-root');
  let count = 0;
  list.on('click', '.item', function(){ count += 1; });
  document.querySelector('#delegate-root .item').click();
  expect(count).toBe(1);
});

test('ajax utilities create URLs and accept callbacks', () => {
  expect(typeof $.param).toBe('function');
  expect($.param({ a: 1, b: 2 })).toBe('a=1&b=2');
});
