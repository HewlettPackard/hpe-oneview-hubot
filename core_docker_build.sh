#!/bin/bash
docker build -f Dockerfile-core --build-arg=PROXY=$PROXY -t docker.io/jesseolsen/core-hubot:latest .
