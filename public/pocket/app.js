'use strict';

const form = document.querySelector('#setup');
const token = document.querySelector('#token');
const verify = document.querySelector('#verify');
const status = document.querySelector('#status');
const result = document.querySelector('#result');
const link = document.querySelector('#link');
const show = document.querySelector('#show');
const copy = document.querySelector('#copy');

function announce(message, error = false) {
  status.dataset.error = String(error);
  status.textContent = message;
}

function hideLink() {
  link.type = 'password';
  show.textContent = 'Show link';
}

form.addEventListener('submit', async (event) => {
  event.preventDefault();
  const secret = token.value.trim().toLowerCase();
  result.hidden = true;
  link.value = '';
  hideLink();

  if (!/^[a-f0-9]{32}$/.test(secret)) {
    announce('Enter a 32-character token using the digits 0–9 and letters A–F.', true);
    token.focus();
    return;
  }

  const url = new URL('/m/' + secret + '/manifest.json', location.origin);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 12000);
  verify.disabled = true;
  token.readOnly = true;
  announce('Checking your addon link…');

  try {
    const response = await fetch(url, {
      cache: 'no-store',
      credentials: 'omit',
      referrerPolicy: 'no-referrer',
      signal: controller.signal,
    });
    if (response.status === 401) {
      announce('That token didn’t match. Check SERVER_TOKEN and try again.', true);
      return;
    }
    if (!response.ok || (await response.json()).id !== 'io.github.bhavishyadalal.flacpocket') {
      throw new Error('Unexpected manifest response');
    }
    link.value = url.href;
    token.value = '';
    result.hidden = false;
    announce('Your addon link is ready.');
  } catch {
    announce('Couldn’t verify the addon link. Try again when the server is ready.', true);
  } finally {
    clearTimeout(timer);
    verify.disabled = false;
    token.readOnly = false;
  }
});

show.addEventListener('click', () => {
  if (link.type === 'text') {
    hideLink();
  } else {
    link.type = 'text';
    show.textContent = 'Hide link';
  }
});

copy.addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(link.value);
    announce('Addon link copied.');
  } catch {
    link.type = 'text';
    show.textContent = 'Hide link';
    link.focus();
    link.select();
    announce('Copy the selected addon link.');
  }
});
