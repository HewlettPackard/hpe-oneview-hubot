#!/bin/bash
docker build --build-arg=PROXY=$PROXY -t hub.docker.hpecorp.net/jesse/oneview-hubot:latest .

