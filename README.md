This is a start at rewriting https://github.com/datacommons/stonesoup, the directory software
that runs the http://find.coop website.

It is split into a backend api server, and a frontend spa.  To run the backend, get a data commons
database and place it at backend/stonesoup.sqlite3.  If you don't have one, you can copy a small
demo db:

```
cp data/stonesoup.sqlite3 backend/stonesoup.sqlite3
```

Then:

```
cd backend
npm install
node ./index.js
```

To run the frontend, do:

```
cd frontend
npm install
npm run serve
```

The backend will be serving on localhost:5555, the frontend is trivially served at localhost:2020

