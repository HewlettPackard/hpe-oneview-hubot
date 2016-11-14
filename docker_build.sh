#!/bin/bash
docker build --build-arg=PROXY=$PROXY -t docker.io/jesseolsen/hpe-oneview-hubot:latest .
