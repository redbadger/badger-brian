FROM rust:1.51 AS build

RUN rustup component add rustfmt clippy

COPY Cargo.toml Cargo.lock ./

RUN mkdir -p ./src/ && echo 'fn main() {}' >./src/main.rs
RUN cargo build --release && rm -rf ./target/release/.fingerprint/hr-*

COPY src ./src

RUN cargo clippy --release -- -D warnings && \
    cargo build --release

# ~~~~~~~~~~~~~~~~~~~~~~
FROM debian:buster-slim as release

RUN apt-get update && apt-get install -y \
    openssl \
    tini \
    && rm -rf /var/lib/apt/lists/*

RUN useradd svc
USER svc

COPY --chown=svc --from=build \
    /target/release/hr \
    /

ENTRYPOINT ["/usr/bin/tini", "--"]

EXPOSE 3000
CMD ["/hr"]