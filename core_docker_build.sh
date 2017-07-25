#!/bin/bash
docker build -f Dockerfile-core --build-arg=http_proxy=$http_proxy --build-arg=https_proxy=$https_proxy -t docker.io/jesseolsen/core-hubot:latest .
