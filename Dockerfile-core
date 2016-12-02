# Docker best practices/commands:
# https://docs.docker.com/engine/userguide/eng-image/dockerfile_best-practices/

FROM ubuntu:14.04

COPY docker_entry.sh /usr/local/bin/
COPY docker_go.sh /go.sh

RUN useradd -ms /bin/bash docker

###############################################################################
USER docker
COPY . /home/docker/hpe-oneview-hubot-org/
RUN mkdir -p /home/docker/hubot/node_modules
RUN chmod 777 /home/docker/hubot/
RUN chmod 777 /home/docker/hubot/node_modules
WORKDIR /home/docker/hubot

###############################################################################
USER root

#http://askubuntu.com/questions/506158/unable-to-initialize-frontend-dialog-when-using-ssh
ENV DEBIAN_FRONTEND=noninteractive

ARG PROXY
ENV http_proxy http://$PROXY
ENV https_proxy http://$PROXY
ENV HTTP_PROXY http://$PROXY
ENV HTTPS_PROXY http://$PROXY

# Steps from:
# https://github.com/HewlettPackard/hpe-oneview-hubot/wiki/Getting-Started

# 1. Clone repo

# 2. Install node.js + npm (etc.)
RUN apt-get update && apt-get install -y \
    curl                                 \
    libcurl3                             \
    libcurl3-dev                         \
    php5-curl
RUN curl -sL https://deb.nodesource.com/setup_6.x | sudo -E bash -
RUN apt-get install -y aptitude
RUN aptitude install -y \
    jq                  \
    nodejs              \
    npm

RUN npm config set proxy $http_proxy
RUN npm config set http-proxy $http_proxy
RUN npm config set https-proxy $http_proxy


# 3. Install Hubot

RUN npm install -g yo generator-hubot

###############################################################################
USER docker

ENV http_proxy http://$PROXY
ENV https_proxy http://$PROXY
ENV HTTP_PROXY http://$PROXY
ENV HTTPS_PROXY http://$PROXY

RUN npm config set proxy $http_proxy
RUN npm config set http-proxy $http_proxy
RUN npm config set https-proxy $http_proxy


RUN echo "n" | yo hubot --defaults --name="jesse-bot" --adapter=slack

###############################################################################
USER root

# Avoid warnings for deprecated dependencies:
RUN npm install -g minimatch@^3.0.2;      \
    npm install -g graceful-fs@^4.0.0;

RUN npm install gulp;                     \
    npm install gulp-babel@^6.1.2;        \
    npm install gulp-task-listing@^1.0.1;

# To install avoid cross-device link not permitted...
RUN cd /usr/lib/node_modules/npm; npm install fs-extra;        \
    sed -i -e s/graceful-fs/fs-extra/ -e s/fs.rename/fs.move/ ./lib/utils/rename.js

###############################################################################
USER docker


RUN npm install hubot@2.x;                \
    npm install hubot-test-helper@^1.3.0; \
    npm install amqp@^0.2.6;              \
    npm install d3@^4.2.7;                \
    npm install jsdom@^9.8.0;             \
    npm install svg2png@^4.0.0;           \
    npm install fuzzyset.js@0.0.1;        \
    npm install nlp_compromise@^6.5.0;    \
    npm install request@^2.75.0;          \
    npm install request-promise@^4.1.1;


RUN npm install babel-plugin-transform-function-bind; \
    npm install babel-preset-es2015@^6.16.0;          \
    npm install del@^2.2.2;

###############################################################################
USER root

# 4. Install gulp (etc.)

WORKDIR /home/docker/hpe-oneview-hubot-org

ENV http_proxy http://$PROXY
ENV https_proxy http://$PROXY
ENV HTTP_PROXY http://$PROXY
ENV HTTPS_PROXY http://$PROXY

# To install avoid cross-device link not permitted...
RUN cd /usr/lib/node_modules/npm; npm install fs-extra;        \
    sed -i -e s/graceful-fs/fs-extra/ -e s/fs.rename/fs.move/ ./lib/utils/rename.js

# Avoid warnings for deprecated dependencies:
RUN npm install minimatch@^3.0.2;   \
    npm install graceful-fs@^4.0.0;

RUN npm install -g gulp;                  \
    npm install;                          \
    npm install gulp;                     \
    npm install gulp-babel@^6.1.2;        \
    npm install gulp-task-listing@^1.0.1; \
    npm install gulp-util@^3.0.7

RUN npm install hubot@2.x;                \
    npm install hubot-test-helper@^1.3.0; \
    npm install amqp@^0.2.6;              \
    npm install d3@^4.2.7;                \
    npm install jsdom@^9.8.0;             \
    npm install svg2png@^4.0.0;           \
    npm install fuzzyset.js@0.0.1;        \
    npm install nlp_compromise@^6.5.0;    \
    npm install request@^2.75.0;          \
    npm install request-promise@^4.1.1;   \
    npm install babel-core;               \
    npm install babel-plugin-transform-function-bind;  \
    npm install babel-preset-es2015@^6.16.0;  \
    npm install babel-register;           \
    npm install del@^2.2.2;


# 5. Copy config file
# 6. Update IP (docker_run.sh handles this)
# 7. Run gulp watch (docker_go.sh handles this, called by docker_run.sh)
# 8. Run bin/hubot (docker_go.sh handles this, called by docker_run.sh)
# 9. Test your bot (instructions presented by docker_go.sh)

ENTRYPOINT ["sh", "/usr/local/bin/docker_entry.sh"]

