#!/bin/bash
if [ ! -d /home/docker/hpe-oneview-hubot/node_modules ]; then
  cp -rf /home/docker/hubot-core-org/node_modules/ /home/docker/hpe-oneview-hubot/
fi

cd /home/docker/hpe-oneview-hubot
gulp build

cd /home/docker/hubot

jq -s add /home/docker/hpe-oneview-hubot/oneview-configuration.json /home/docker/hpe-oneview-hubot/local-configuration.json > /home/docker/hubot/oneview-configuration.json

echo "## LOCAL (~/hubot/hpe-oneview-configuration.json) ##---------------------"
cat /home/docker/hpe-oneview-hubot/local-configuration.json
echo "-------------------------------------------------------------------------"
echo ""
echo "## GIT_REPO (/home/docker/hpe-oneview-hubot/oneview-configuration.json) #"
cat /home/docker/hpe-oneview-hubot/oneview-configuration.json
echo "-------------------------------------------------------------------------"
echo ""
echo "## MERGED (js -s add LOCAL GIT_REPO) ##----------------------------------"
cat /home/docker/hubot/oneview-configuration.json
echo "-------------------------------------------------------------------------"
echo ""


if [[ -z ${HUBOT_NAME} ]]; then
  echo "##################################################################"
  echo "!!! HUBOT_NAME variable MUST BE SET!!";
  echo "##################################################################"
  exit 1;
fi

if [[ -z ${PARMS} ]]; then
  echo "##################################################################"
  echo " HUBOT_NAME: ${HUBOT_NAME}"
  echo " "
  echo " Once you see: Connected to SCMB, waiting for messages..."
  echo " Test hubot with:"
  echo " [ENTER] (to see prompt...)"
  echo " ${HUBOT_NAME}> @${HUBOT_NAME} help"
  echo " TO EXIT: ^C (or exit), [ENTER], exit"
  echo " - OR -"
  echo " TO RESTART after code changes: ^C, [ENTER], /go.sh"
  echo "##################################################################"
else
  if [[ ${PARMS} = "-a hipchat" ]]; then
	if [[ -z ${HUBOT_HIPCHAT_JID} ]]; then
      echo "##################################################################"
      echo "!!! HUBOT_HIPCHAT_JID variable MUST BE SET!!";
      echo "##################################################################"
      exit 10;
	fi
	if [[ -z ${HUBOT_HIPCHAT_PASSWORD} ]]; then
      echo "##################################################################"
      echo "!!! HUBOT_HIPCHAT_PASSWORD variable MUST BE SET!!";
      echo "##################################################################"
      exit 10;
	fi
  fi

  if [[ ${PARMS} = "-a slack" ]]; then
	if [[ -z ${HUBOT_SLACK_TOKEN} ]]; then
      echo "##################################################################"
      echo "!!! HUBOT_SLACK_TOKEN variable MUST BE SET!!";
      echo "##################################################################"
      exit 10;
    fi
  fi

  echo "##################################################################"
  echo " HUBOT_NAME: ${HUBOT_NAME}"
  echo " "
  echo " Once you see: How can I assist you?"
  echo " "
  echo " Then respond as instructed in the client window."
  echo " "
  echo " TROUBLESHOOTING:"
  echo " "
  echo " If you get no response,"
  echo "  try 'help' with and without @BOT-NAME ..."
  echo " "
  echo " If you see:  tunneling socket could not be established"
  echo "  Double check you have a valid IP (not 0.0.0.0)"
  echo " "
  echo " If it just hangs, and you don't see How can I assist you?"
  echo " ... did you forget to set the proxy variables?"
  echo "        http_proxy"
  echo "        https_proxy"
  echo "        no_proxy"
  echo " "
  echo "##################################################################"
fi


bin/hubot --name $HUBOT_NAME $PARMS
