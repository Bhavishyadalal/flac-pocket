'use strict';

const $ = id => document.getElementById(id);
const audio = $('audio');
const searchStatus = $('search-status');
const playbackStatus = $('playback-status');
let searchRequest;
let streamRequest;
let results = [];
let queue = [];
let active = -1;

function mediaURL(value) {
  try {
    const url = new URL(value, location.origin);
    if (typeof value !== 'string' || !value ||
        (url.protocol !== 'https:' && url.origin !== location.origin)) return null;
    return url.href;
  } catch {
    return null;
  }
}

function art(container, value) {
  container.replaceChildren();
  const src = mediaURL(value);
  if (!src) return;
  const image = document.createElement('img');
  image.alt = '';
  image.loading = 'lazy';
  image.src = src;
  image.addEventListener('error', () => image.remove());
  container.append(image);
}

function text(tag, value, className) {
  const element = document.createElement(tag);
  element.textContent = value;
  if (className) element.className = className;
  return element;
}

function activeTrack() {
  return queue[active];
}

function highlight() {
  for (const row of $('tracks').children) {
    if (row.dataset.id === activeTrack()?.id) row.setAttribute('aria-current', 'true');
    else row.removeAttribute('aria-current');
  }
}

function renderResults() {
  const rows = results.map((track, index) => {
    const row = text('li', '', 'track');
    row.dataset.id = track.id;
    const cover = text('div', '', 'art');
    art(cover, track.artworkURL);
    const info = text('div', '', 'track-info');
    info.append(text('strong', track.title), text('p', [track.artist, track.sourceName || 'PencariMusic'].filter(Boolean).join(' · ')));
    const play = text('button', 'Play', 'secondary play');
    play.type = 'button';
    play.setAttribute('aria-label', 'Play ' + track.title);
    play.addEventListener('click', () => {
      queue = results.slice();
      void loadTrack(index);
    });
    row.append(cover, info, text('span', track.audioQuality || track.format || '', 'quality'), play);
    return row;
  });
  $('tracks').replaceChildren(...rows);
  highlight();
}

async function search() {
  const query = $('query').value.trim();
  if (!query) return;
  searchRequest?.abort();
  const request = new AbortController();
  searchRequest = request;
  searchStatus.textContent = 'Searching…';
  $('tracks').setAttribute('aria-busy', 'true');
  const params = new URLSearchParams({q:query, source:$('source').value});
  try {
    const response = await fetch('/m/search?' + params, {signal:request.signal});
    if (!response.ok) throw new Error('Search failed');
    const body = await response.json();
    if (!Array.isArray(body.tracks)) throw new Error('Invalid search response');
    if (request.signal.aborted) return;
    results = body.tracks.filter(track => typeof track?.id === 'string' && typeof track.title === 'string');
    searchStatus.textContent = results.length ? `${results.length} ${results.length === 1 ? 'track' : 'tracks'}` : 'No tracks found.';
    if (body.partial) searchStatus.textContent += ' Some external sources did not respond.';
    renderResults();
  } catch {
    if (!request.signal.aborted) searchStatus.textContent = 'Search failed. Try again.';
  } finally {
    if (searchRequest === request) $('tracks').removeAttribute('aria-busy');
  }
}

async function startAudio(signal = streamRequest?.signal) {
  try {
    await audio.play();
  } catch (error) {
    if (signal?.aborted) return;
    if (error.name === 'NotAllowedError') playbackStatus.textContent = 'Press Play to start playback.';
    else if (error.name !== 'AbortError') playbackStatus.textContent = 'Could not play this stream.';
  }
}

async function loadTrack(index) {
  const track = queue[index];
  if (!track) return;
  streamRequest?.abort();
  const request = new AbortController();
  streamRequest = request;
  active = index;
  audio.pause();
  audio.removeAttribute('src');
  audio.load();
  $('player').hidden = false;
  $('playing-title').textContent = track.title;
  $('playing-artist').textContent = track.artist || track.sourceName || 'PencariMusic';
  art($('playing-art'), track.artworkURL);
  $('previous').disabled = index === 0;
  $('next').disabled = index === queue.length - 1;
  $('toggle').disabled = true;
  playbackStatus.textContent = 'Opening stream…';
  highlight();
  updateProgress();
  try {
    const response = await fetch('/m/stream/' + encodeURIComponent(track.id), {signal:request.signal, cache:'no-store'});
    if (!response.ok) throw new Error('Stream failed');
    const data = await response.json();
    const url = mediaURL(data.url);
    if (!url || data.encrypted) throw new Error('No playable stream');
    if (request.signal.aborted) return;
    audio.src = url;
    playbackStatus.textContent = '';
    await startAudio(request.signal);
  } catch {
    if (!request.signal.aborted) playbackStatus.textContent = 'Could not open this stream. Try again or select another track.';
  } finally {
    if (streamRequest === request) $('toggle').disabled = false;
  }
}

function time(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const whole = Math.floor(seconds);
  return Math.floor(whole / 60) + ':' + String(whole % 60).padStart(2, '0');
}

function updateProgress() {
  const seek = $('seek');
  const duration = audio.duration;
  const available = Number.isFinite(duration) && duration > 0;
  seek.disabled = !available;
  seek.max = available ? duration : 1;
  seek.value = audio.currentTime || 0;
  $('elapsed').textContent = time(audio.currentTime);
  $('duration').textContent = time(duration);
}

$('search-form').addEventListener('submit', event => { event.preventDefault(); void search(); });
$('source').addEventListener('change', search);
$('previous').addEventListener('click', () => loadTrack(active - 1));
$('next').addEventListener('click', () => loadTrack(active + 1));
$('toggle').addEventListener('click', () => {
  if (!audio.getAttribute('src') || audio.error) void loadTrack(active);
  else if (audio.paused) void startAudio();
  else audio.pause();
});
$('volume').addEventListener('input', event => { audio.volume = Number(event.target.value); });
$('seek').addEventListener('input', event => { audio.currentTime = Number(event.target.value); });
for (const event of ['loadedmetadata', 'durationchange', 'timeupdate']) audio.addEventListener(event, updateProgress);
for (const event of ['play', 'pause', 'ended']) audio.addEventListener(event, () => {
  const playing = !audio.paused && !audio.ended;
  $('toggle').classList.toggle('is-playing', playing);
  $('toggle').setAttribute('aria-label', playing ? 'Pause' : 'Play');
});
audio.addEventListener('playing', () => { playbackStatus.textContent = ''; });
audio.addEventListener('error', () => {
  if (audio.getAttribute('src')) playbackStatus.textContent = 'Audio playback failed. Try another track or source.';
});
audio.addEventListener('ended', () => loadTrack(active + 1));

function configureCopy(inputId, buttonId, statusId, path, confirmation) {
  const input = $(inputId);
  input.value = new URL(path, location.origin).href;
  $(buttonId).addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(input.value);
      $(statusId).textContent = confirmation;
    } catch {
      input.focus();
      input.select();
      $(statusId).textContent = 'Copy the selected URL.';
    }
  });
}
configureCopy('link', 'copy', 'copy-status', '/m/manifest.json', 'Addon link copied.');
configureCopy('health-link', 'copy-health', 'health-status', '/health', 'Health URL copied.');

fetch('/api/pocket/sources').then(response => response.json()).then(body => {
  for (const source of body.sources || []) $('source').append(new Option(source.name, source.id));
}).catch(() => {});
