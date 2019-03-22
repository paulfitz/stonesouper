#!/bin/bash

set -e

mkdir -p /tmp/sitemem
sudo umount /tmp/sitemem || echo ok
sudo mount -t tmpfs -o size=100m tmpfs /tmp/sitemem
rm -f /tmp/sitemem/stonesoup.sqlite3
sheetsite
cp -v /tmp/sitemem/stonesoup.sqlite3 .
mv ../backend/stonesoup.sqlite3 /tmp || echo ok
ln -s $PWD/stonesoup.sqlite3 ../backend/stonesoup.sqlite3
./index.sh
./solidarity.sh
