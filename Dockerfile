# Docker best practices/commands:
# https://docs.docker.com/engine/userguide/eng-image/dockerfile_best-practices/

FROM jesseolsen/core-hubot:latest

ARG PROXY

COPY docker_entry.sh /usr/local/bin/
COPY docker_go.sh /go.sh
COPY . /home/docker/hubot-org/

WORKDIR /home/docker/hubot

RUN npm install hubot-hipchat
RUN npm install hubot-conversation

ENTRYPOINT ["sh", "/usr/local/bin/docker_entry.sh"]
