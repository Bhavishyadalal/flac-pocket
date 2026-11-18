# FLAC Pocket

A personal music addon for BitChord and Eclipse Music, built on [PencariMovie Server](https://github.com/aiskendi/pencarimovie-server). The homepage verifies and copies your private music link. Open **Server settings** when you need the original dashboard.

## Deploy on Render

1. In Render, choose **New → Blueprint** and connect this GitHub repository. It builds the Dockerfile here, including the FLAC Pocket homepage and music routes.
2. Set **SERVER_TOKEN** to a fresh 32-character hexadecimal secret. Generate it using `openssl rand -hex 16` on a trusted device, or use a password manager that can generate 32 random hexadecimal characters.
3. Set **SERVER_PASSWORD** to a different strong password of at least 12 characters. This opens the dashboard. Keep both values in Render's environment settings.
4. After the service is live, open its homepage, paste your **SERVER_TOKEN**, and choose **Get addon link → Copy link**. The link is `https://YOUR-SERVICE.onrender.com/m/YOUR-TOKEN/manifest.json`.

In **BitChord**, open **Settings → Sources → Add addon**. In **Eclipse Music**, open **Settings → Connections → Add Connection → Addon**. Paste the full link and save. Anyone who has the link has your server token, so keep it private.

## Server settings

Visit `/dashboard` to manage Telegram bot sessions using **SERVER_PASSWORD**. PencariMovie supports automatic guest-bot provisioning and your own bot token. If you use your own bot, enter **BOT_TOKEN** in Render's environment settings. Playback requires a working bot session and an available PencariMovie catalog.

PencariMovie streams audio through your instance. This uses your hosting bandwidth, and Render Free can lose local sessions and dashboard changes when it restarts. A persistent `/data` volume keeps them on hosts that support persistent disks. Keep **SERVER_TOKEN** fixed to preserve your addon link even if local storage is cleared.

## Source

The Dockerfile builds the upstream commit in [upstream-revision](upstream-revision), applies [the Rust patch](patches/flac-pocket.patch), and embeds the frontend from [public/pocket](public/pocket). The original `/<token>/music/manifest.json` path remains available. The root `/manifest.json` still serves the original video addon.

The upstream source is MIT-licensed. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
