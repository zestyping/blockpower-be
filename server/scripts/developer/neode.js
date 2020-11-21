/*
 *
 * This file is used for rapidly testing code in the context of a node.js repl
 *
 */
require('dotenv').config();
neode = require('neode').fromEnv().withDirectory(process.cwd() + '/app/models/va');
