FROM denoland/deno:1.18.1

ARG WORKDIR=/usr/src/app

RUN apt-get update && apt-get install -y \
  git \
  imagemagick \
  nodejs \
  npm \
  && rm -rf /var/lib/apt/lists/*

RUN npm install -g sass

ENV LANG=C.UTF-8 TZ=Asia/Tokyo

RUN mkdir -p $WORKDIR

WORKDIR $WORKDIR

VOLUME ["$WORKDIR"]

# CMD ["/bin/bash"]
