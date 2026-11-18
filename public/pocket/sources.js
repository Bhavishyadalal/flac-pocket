'use strict';

const signIn = document.getElementById('sign-in');
const manage = document.getElementById('manage');
const add = document.getElementById('add-source');
const list = document.getElementById('sources');
const status = document.getElementById('status');
const managed = '/api/pocket/manage-sources';

async function request(path, method = 'GET', data) {
  const response = await fetch(path, {
    method, cache:'no-store',
    ...(data && {headers:{'Content-Type':'application/json'}, body:JSON.stringify(data)}),
  });
  const body = await response.json();
  if (!response.ok) {
    const error = new Error(body.error || body.message || 'Request failed.');
    error.status = response.status;
    throw error;
  }
  return body;
}

function showSignIn() {
  signIn.hidden = false;
  manage.hidden = true;
}

function render({sources, renderValue}) {
  const value = document.getElementById("render-value");
  value.value = renderValue;
  value.hidden = true;
  signIn.hidden = true;
  manage.hidden = false;
  list.replaceChildren(...sources.map(source => {
    const item = document.createElement('li');
    item.className = 'source-item';
    const name = document.createElement('strong');
    name.textContent = source.name;
    const button = document.createElement('button');
    button.className = 'secondary';
    button.textContent = 'Remove';
    button.setAttribute('aria-label', 'Remove ' + source.name);
    button.addEventListener('click', async () => {
      button.disabled = true;
      try {
        render(await request(managed, 'DELETE', {id:source.id}));
        status.textContent = 'Source removed.';
      } catch (error) {
        report(error);
        button.disabled = false;
      }
    });
    item.append(name, button);
    return item;
  }));
}

function report(error) {
  if (error.status === 401 || error.status === 403) showSignIn();
  status.textContent = error.message;
}

async function initialize() {
  try {
    render(await request(managed));
    status.textContent = '';
  } catch (error) {
    if (error.status === 401 || error.status === 403) {
      showSignIn();
      status.textContent = '';
    } else report(error);
  }
}

signIn.addEventListener('submit', async event => {
  event.preventDefault();
  const password = document.getElementById('password');
  const button = signIn.querySelector('button');
  button.disabled = true;
  try {
    await request('/api/auth/login', 'POST', {password:password.value});
    password.value = '';
    await initialize();
  } catch (error) {
    report(error);
  } finally {
    button.disabled = false;
  }
});

add.addEventListener('submit', async event => {
  event.preventDefault();
  const field = document.getElementById('addon-url');
  const button = add.querySelector('button');
  button.disabled = true;
  status.textContent = 'Testing the addon…';
  try {
    render(await request(managed, 'POST', {url:field.value}));
    field.value = '';
    status.textContent = 'Source added. It’s available in music search.';
  } catch (error) {
    report(error);
  } finally {
    button.disabled = false;
  }
});

document.getElementById('copy-render').addEventListener('click', async () => {
  const value = document.getElementById('render-value');
  try {
    await navigator.clipboard.writeText(value.value);
    status.textContent = 'Render value copied.';
  } catch {
    value.hidden = false;
    value.focus();
    value.select();
    status.textContent = 'Copy the selected Render value.';
  }
});

void initialize();
