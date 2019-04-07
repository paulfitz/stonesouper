This is a start at rewriting https://github.com/datacommons/stonesoup, the directory software
that runs the http://find.coop website.

This is a backend only.  A demo frontend is available at https://github.com/paulfitz/stonesouper_demo_frontend

To run the backend, get a data commons
database and place it at backend/stonesoup.sqlite3.  If you don't have one, you can copy a small
demo db:

```
cp data/stonesoup.sqlite3 backend/stonesoup.sqlite3
```

Then:

```
npm i
npm start
```

The backend will be serving on localhost:5555

