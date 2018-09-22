#!/bin/bash

(
cat<<EOF
DROP TABLE IF EXISTS units;
DROP TABLE IF EXISTS units_taggables;
CREATE TABLE units_taggables(
   id INTEGER NOT NULL,
   taggable_id INTEGER NOT NULL,
   taggable_type TEXT NOT NULL,
   PRIMARY KEY (id)
);
CREATE INDEX idx_units_taggables_out ON units_taggables(taggable_id, taggable_type);
CREATE VIRTUAL TABLE units USING fts4(taggable_id, taggable_type,
       name,
       description,
       phone,
       email,
       website,
       notindexed=taggable_id, notindexed=taggable_type);
INSERT INTO units(taggable_id,taggable_type,name,description,phone,email,website) SELECT id as taggable_id, 'Organization' as taggable_type, name, description, phone, email, website FROM organizations;
INSERT INTO units(taggable_id,taggable_type,name,description) SELECT id as taggable_id, 'Person' as taggable_type, coalesce(firstname,'') || ' ' || coalesce(lastname,''), '' FROM people;
INSERT INTO units_taggables(id, taggable_id, taggable_type) SELECT docid as id, taggable_id, taggable_type FROM units;
EOF
) | sqlite3 stonesoup.sqlite3
