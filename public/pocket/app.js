'use strict';

function configureCopy(inputId, buttonId, statusId, path, confirmation) {
  const input = document.getElementById(inputId);
  const button = document.getElementById(buttonId);
  const status = document.getElementById(statusId);
  input.value = new URL(path, location.origin).href;
  button.addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(input.value);
      status.textContent = confirmation;
    } catch {
      input.focus();
      input.select();
      status.textContent = 'Copy the selected URL.';
    }
  });
}

configureCopy('link', 'copy', 'status', '/m/manifest.json', 'Addon link copied.');
configureCopy('health-link', 'copy-health', 'health-status', '/health', 'Health URL copied.');
