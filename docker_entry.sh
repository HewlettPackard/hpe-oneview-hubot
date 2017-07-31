#!/bin/bash
su docker -c "/go.sh"
if [ $? -ne 10 ]; then
	sh
fi
