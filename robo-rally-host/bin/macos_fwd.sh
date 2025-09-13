#!/bin/bash

SCRIPT=`realpath $0`
# echo $SCRIPT
LEN=`echo $SCRIPT | tr '/' '\n' | wc -l`
# echo $LEN
LEN=$(($LEN - 1))
HERE=`echo $SCRIPT | cut -d'/' -f-$LEN`
# echo $HERE
echo "Invoking sudo..."
sudo pfctl -evf $HERE/port-forwarding.conf
