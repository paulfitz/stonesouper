#!/bin/bash

# make compatible with solidarityeconomy site
(
cat <<EOF
ALTER TABLE organizations ADD COLUMN icon_group_id;
EOF
) | sqlite3 stonesoup.sqlite3
