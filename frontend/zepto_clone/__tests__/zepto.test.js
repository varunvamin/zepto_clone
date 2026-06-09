const lib = require('../src/zepto.js');
const $ = lib.$;

test('$ is a function', () => {
  expect(typeof $).toBe('function');
});

test('selects and manipulates DOM', () => {
  const root = document.createElement('div');
  root.id = 'jest-root';
  root.innerHTML = '<button id="jb">x</button><div id="jo"></div>';
  document.body.appendChild(root);

  const btn = $('#jb');
  expect(btn.nodes.length).toBe(1);

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
});
