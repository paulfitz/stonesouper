const {Search} = require('./lib/soup');
const express = require('express');
const bodyParser = require('body-parser');
const expressLayouts = require('express-ejs-layouts');

const db = new Search("stonesoup.sqlite3");

const app = express();

app.set('view engine', 'ejs');
app.use(expressLayouts);

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
  extended: true
}));

app.use((req, res, next) => {
  console.log("GOT SOMETHING", req.url);
  next();
});

app.post('/api/search', (req, res) => {
  res.json(db.search(req.body));
});

app.get('/api/search', (req, res) => {
  res.json(db.search({key: [req.query.key]}));
});

app.get('/api/org/:id([0-9]+)', (req, res) => {
  const org = db.org(req.params.id);
  const locs = db.locs(req.params.id);
  res.json({ org, locs: [locs]});
});


app.get('/', (req, res) => res.render('index'));

app.get('/search', (req, res) => {
  const orgs = db.search(req.query);
  res.render('search', { orgs });
});

app.get('/org/:id([0-9]+)', (req, res) => {
  const org = db.org(req.params.id);
  const locs = db.locs(req.params.id);
  res.render('org/show', { org, locs });
});

app.use(express.static('static'));


const port = process.env.PORT || 5555;
app.listen(port, () => console.log(`listening on port ${port}`));

