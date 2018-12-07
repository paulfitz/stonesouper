// const fs = require('fs');
// const path = require('path');
// const appRoot = path.dirname(path.dirname(__dirname));
// require('app-module-path').addPath(appRoot);

require('ts-node').register({files: true});

const {startServer} = require('./lib/server');

if (require.main === module) {
  const port = process.env.PORT || 5555;
  startServer(process.argv[2] || "stonesoup.sqlite3", port, true);
}
