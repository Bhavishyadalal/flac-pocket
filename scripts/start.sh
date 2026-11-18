#!/bin/sh
set -eu

token=${SERVER_TOKEN:-}
case "$token" in
  ''|*[!0-9a-fA-F]*)
    printf '%s\n' 'Set SERVER_TOKEN to a random 32-character hexadecimal value.' >&2
    exit 1
    ;;
esac
if [ "${#token}" -ne 32 ]; then
  printf '%s\n' 'Set SERVER_TOKEN to a random 32-character hexadecimal value.' >&2
  exit 1
fi

password=${SERVER_PASSWORD:-}
case "$password" in
  [[:space:]]*|*[[:space:]])
    printf '%s\n' 'SERVER_PASSWORD must not begin or end with whitespace.' >&2
    exit 1
    ;;
esac
if [ "${#password}" -lt 12 ] || [ "$password" = "$token" ]; then
  printf '%s\n' 'Set SERVER_PASSWORD to a separate password of at least 12 characters.' >&2
  exit 1
fi

exec /usr/local/bin/pencarimovie-server "$@"
