#!/usr/bin/env node

import neode from '../app/lib/neode.js';
import neo4j from 'neo4j-driver';
import yargs from 'yargs';
import parse from 'csv-parse';
import fs from 'fs';
import cliProgress from 'cli-progress';

const argv = yargs
               .scriptName("lat_long_update.js")
               .usage('$0 <cmd> [options] <filename>')
               .command('update [filename]', 'parse the given csv file.', (yargs) => {
                 yargs.positional('filename', {
                   type: 'string',
                   describe: 'csv file to parse'
                 })
               }, async function (argv) {
                 await parseCsv(argv)
                         .then( ()=> { process.exit(0) } )
                         .catch( (err)=> { console.log(err); process.exit(1); } );
               })
               .option({
                 'latCol': {
                   describe: 'column of the latitude',
                   type: 'integer'
                 }
               })
               .option({
                 'longCol': {
                   describe: 'column of the longitude',
                   type: 'integer'
                 }
               })
               .option({
                 'from': {
                   describe: 'parse from line N (starts at 1)',
                   type: 'number'
                 }
               })
               .help()
               .argv

function parseLocation(record, argv) {
  return {
    latitude: argv.latCol ? parseFloat(record[parseInt(argv.latCol)]) : 0,
    longitude: argv.longCol ? parseFloat(record[parseInt(argv.longCol)]) : 0,
  };
}

async function parseRecord(record, argv) {
  let obj = {
    voter_id: record[0],
    location: parseLocation(record, argv)
  };

  return obj;
}

async function parseCsv(argv) {
  const csvFile = fs.readFileSync(argv.filename, 'utf8');

  console.log('file loaded. starting parse.\n');

  let startRow = argv.from ? argv.from : 2; // ignore header by default

  const parsed = parse(csvFile, { from_line: startRow });

  const bar1 = new cliProgress.SingleBar({
    format: 'progress [{bar}] Elapsed: {duration_formatted} | ETA: {eta_formatted} | {percentage}% | {value}/{total}'
  }, cliProgress.Presets.shades_classic);

  bar1.start(csvFile.split('\n').length, startRow);

  for await (const record of parsed) {
    let parsedRecord = '';
    parsedRecord = await parseRecord(record, argv);
    try {
      let existing_record = await neode.first('Tripler', 'voter_id', parsedRecord.voter_id);
      await existing_record.update({ location: new neo4j.types.Point(
        4326,
        parseFloat(parsedRecord.location.longitude, 10),
        parseFloat(parsedRecord.location.latitude, 10))});
    } catch (err) {
      console.log('error parsing: ', err);
    }

    bar1.increment();
  }

  console.log('\n.... done.\n');
  return true;
}
