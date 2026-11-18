# FLAC Pocket

A personal music addon for BitChord and Eclipse Music, built on [PencariMovie Server](https://github.com/aiskendi/pencarimovie-server). The homepage is a music player with search, source filtering, playback and an install link. Open **Server settings** when you need the original dashboard.

## Deploy on Render

1. In Render, choose **New → Blueprint** and connect this GitHub repository. It builds the Dockerfile here, including the FLAC Pocket homepage and music routes.
2. Set **SERVER_TOKEN** to a fresh 32-character hexadecimal secret. Generate it using `openssl rand -hex 16` on a trusted device, or use a password manager that can generate 32 random hexadecimal characters.
3. Set **SERVER_PASSWORD** to a different strong password of at least 12 characters. This opens the dashboard. Keep both values in Render's environment settings.
4. After the service is live, open its homepage and choose **Copy addon link**. The link is `https://YOUR-SERVICE.onrender.com/m/manifest.json`.

In **BitChord**, open **Settings → Sources → Add addon**. In **Eclipse Music**, open **Settings → Connections → Add Connection → Addon**. Paste the full link and save. Anyone with the new URL can use the music addon and consume its hosting bandwidth. The addon URL does not contain your server credentials.

## Add external music sources

Open **Sources** in the web player, sign in with **SERVER_PASSWORD**, then paste an addon manifest URL and choose **Test and add**. The source must be a public HTTPS music addon with BitChord-style JSON search and a direct, unencrypted audio stream. Search includes the sources you add in both the web player and the existing `/m/manifest.json` addon. A source's stream is delivered by that source. Add sources whose playback links may be shared with anyone who uses your FLAC Pocket link.

Source changes are stored on the server disk. Render Free can wipe that disk on restart. In **Sources → Keep sources after a Render restart**, copy the value into the Render environment variable **POCKET_MUSIC_SOURCES**. Update the value after changing your source list. Hosts with a persistent `/data` volume retain changes automatically.

## Server settings

Visit `/dashboard` to manage Telegram bot sessions using **SERVER_PASSWORD**. PencariMovie automatically leases a guest bot for streaming, so a connected bot can appear even when you have not created one. If you use your own bot, enter **BOT_TOKEN** in Render's environment settings. Playback requires a working bot session and an available PencariMovie catalog.

PencariMovie streams audio through your instance. This uses your hosting bandwidth, and Render Free can lose local sessions and dashboard changes when it restarts. A persistent `/data` volume keeps them on hosts that support persistent disks. The memory figure in the dashboard is current RAM usage and the container’s RAM limit. It is separate from bandwidth. There is no song or device quota in FLAC Pocket. The server keeps its concurrent-request safeguards.

## Keep-alive

Open **Keep-alive setup** on the homepage and copy the health URL. Set your cron service to send a GET request to it every 10 minutes. This can help prevent idle spin-down, but does not override Render workspace usage limits, restarts or outages.

## Source

The Dockerfile builds the upstream commit in [upstream-revision](upstream-revision), applies [the Rust patch](patches/flac-pocket.patch), and embeds the frontend from [public/pocket](public/pocket). The original `/m/<token>/manifest.json` and `/<token>/music/manifest.json` paths remain available for existing installations. The root `/manifest.json` still serves the original video addon.

The upstream source is MIT-licensed. See [LICENSE](LICENSE) and [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md).
