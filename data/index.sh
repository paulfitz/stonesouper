#!/bin/bash

(
cat<<EOF
 -- Regular search index
DROP TABLE IF EXISTS units;
CREATE VIRTUAL TABLE units USING fts4(taggable_id, taggable_type,
       name,
       description,
       phone,
       email,
       website,
       notindexed=taggable_id, notindexed=taggable_type);
INSERT INTO units(taggable_id,taggable_type,name,description,phone,email,website) SELECT id as taggable_id, 'Organization' as taggable_type, name, description, phone, email, website FROM organizations;
INSERT INTO units(taggable_id,taggable_type,name,description) SELECT id as taggable_id, 'Person' as taggable_type, coalesce(firstname,'') || ' ' || coalesce(lastname,''), '' FROM people;

 -- I have no memory of what units_taggables is about
DROP TABLE IF EXISTS units_taggables;
CREATE TABLE units_taggables(
   id INTEGER NOT NULL,
   taggable_id INTEGER NOT NULL,
   taggable_type TEXT NOT NULL,
   PRIMARY KEY (id)
);
CREATE INDEX idx_units_taggables_out ON units_taggables(taggable_id, taggable_type);
INSERT INTO units_taggables(id, taggable_id, taggable_type) SELECT docid as id, taggable_id, taggable_type FROM units;

 -- This could do with an explanation
UPDATE organizations SET grouping = (select o2.id from organizations as o2 where o2.source_grouping = organizations.source_grouping order by o2.id limit 1);
EOF
) | sqlite3 stonesoup.sqlite3
