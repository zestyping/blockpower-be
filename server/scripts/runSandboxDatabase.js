/*
 *
 * Note: this file is used when a neo4j database is running locally
 *
 */

import { runDatabase } from './lib/utils';

runDatabase(true, {
  pagecache_size: 0,
  heap_size_init: 0,
  heap_size_max: 0,
});
