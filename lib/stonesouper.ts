import {startServer} from './server';

export function main() {
  const port = parseInt(process.env.PORT || '5555', 10);
  startServer(process.argv[2] || "stonesoup.sqlite3", port, true);
}

if (require.main === module) {
  main();
}
