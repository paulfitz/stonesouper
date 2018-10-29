const express = require('express');
const bodyParser = require('body-parser');

const {Search} = require('./soup');

function startServer(filename, port, verbose) {
  const log = verbose ? console.log : ((...args) => 1);

  const db = new Search(filename);

  const app = express();
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({
    extended: true
  }));

  app.use((req, res, next) => {
    log("--", req.url);
    next();
  });

  app.get('/api/search', (req, res) => {
    const args = req.body;
    if (req.query.key) {
      args.key = [req.query.key];
    }
    res.json(db.search(args));
  });

  app.post('/api/search', (req, res) => {
    res.json(db.search(req.body));
  });

  app.get('/api/org/:id([0-9]+)', (req, res) => {
    const org = db.org(req.params.id);
    const locs = db.locs(req.params.id);
    res.json({ org, locs: [locs]});
  });

  app.use(express.static('dist'));

  return app.listen(port, () => log(`== port ${port}`));
}

function stopServer(server) {
  server.close();
}

module.exports = {
  startServer,
  stopServer,
};
