FROM rust:1-alpine AS build
RUN apk add --no-cache ca-certificates curl git musl-dev
WORKDIR /src
COPY upstream-revision /tmp/upstream-revision
RUN curl --fail --silent --show-error --location --retry 3 \
      "https://codeload.github.com/aiskendi/pencarimovie-server/tar.gz/$(cat /tmp/upstream-revision)" \
      --output /tmp/pencari.tar.gz \
 && tar -xzf /tmp/pencari.tar.gz --strip-components=1 \
 && rm /tmp/pencari.tar.gz
COPY patches/flac-pocket.patch /tmp/flac-pocket.patch
RUN git apply --check /tmp/flac-pocket.patch && git apply /tmp/flac-pocket.patch
COPY public/pocket/ ./public/pocket/
ENV PM_BUILD_VERSION=3.1.3
RUN cargo build --release --locked

FROM alpine:3.20
RUN apk add --no-cache ca-certificates tzdata \
 && adduser -D -u 10001 -h /data pocket \
 && mkdir -p /data \
 && chown 10001:10001 /data
COPY --from=build /src/target/release/pencarimovie-server /usr/local/bin/pencarimovie-server
COPY --from=build /src/LICENSE /src/THIRD_PARTY_NOTICES.md /usr/local/share/flac-pocket/
COPY scripts/start.sh /usr/local/bin/start-flac-pocket
ENV PM_APP_ROOT=/data PM_LISTEN_HOST=0.0.0.0 PORT=8088
EXPOSE 8088
VOLUME ["/data"]
USER 10001
ENTRYPOINT ["/bin/sh", "/usr/local/bin/start-flac-pocket"]
