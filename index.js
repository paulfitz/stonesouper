const {Search} = require('./lib/soup');
const express = require('express');
const bodyParser = require('body-parser');

const db = new Search("stonesoup.sqlite3");

const app = express();

app.use( bodyParser.json() );       // to support JSON-encoded bodies
app.use(bodyParser.urlencoded({     // to support URL-encoded bodies
  extended: true
}));

app.post('/search', (req, res) => {
  console.log(req.body);
  res.json(db.search(req.body));
});

app.use(express.static('static'));

// app.get('/', (req, res) => res.send('Hello Worldy!'));


app.listen(3000, () => console.log('Example app listening on port 3000!'));

