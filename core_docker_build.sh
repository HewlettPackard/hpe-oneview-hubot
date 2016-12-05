#!/bin/bash
docker build --build-arg=PROXY=$PROXY -t docker.io/jesseolsen/core-hubot:latest .
