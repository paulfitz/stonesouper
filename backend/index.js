const {startServer} = require('./lib/server');

if (require.main === module) {
  const port = process.env.PORT || 5555;
  startServer("stonesoup.sqlite3", port, true);
}
