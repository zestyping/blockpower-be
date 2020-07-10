#!/usr/bin/env node

import neode from '../app/lib/neode.js';
import yargs from 'yargs';
import parse from 'csv-parse';
import fs from 'fs';

const argv = yargs
               .scriptName("import.js")
               .usage('$0 <cmd> [options] <filename>')
               .command('import [filename]', 'parse the given csv file.', (yargs) => {
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
                 'edges': {
                   describe: 'parse the csv as edges file',
                   type: 'boolean'
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

function parseRecord(record) {
  let obj = {
    id: record[0],
    first_name: record[3],
    last_name: record[4],
    address: JSON.stringify({
      address1: record[7],
      city: record[10],
      state: record[11],
      zip: record[12]
    }),
    location: {
      latitude: record[98] ? parseFloat(record[98], 10) : 0.0,
      longitude: record[99] ? parseFloat(record[99], 10) : 0.0
    },
    status: 'unconfirmed'
  }


  if (record[2] !== '') {
    obj.phone = record[2]; // prefer cell phones
  } else if (record[1] !== '') {
    obj.phone = record[1];
  }

  return obj
}

function parseEdge(record) {
  return {
    tripler1_id: record[1],
    tripler2_id: record[2],
    distance: record[4]
  }
}

async function parseCsv(argv) {
  const csvFile = fs.readFileSync(argv.filename, 'utf8');

  console.log('file loaded. starting parse.\n');

  const parsed = parse(csvFile, { from_line: argv.from ? argv.from : 0 });

  for await (const record of parsed) {
    let parsedRecord = '';
    if (argv.edges) {
      parsedRecord = parseEdge(record);
      let tripler1 = null;
      let tripler2 = null;
      try {
        tripler1 = await neode.first('Tripler', 'id', parsedRecord.tripler1_id);
      } catch (err) {
        console.log('error finding tripler for relationship: ', err);
      }
      try {
        tripler2 = await neode.first('Tripler', 'id', parsedRecord.tripler2_id);
      } catch (err) {
        console.log('error finding tripler for relationship: ', err);
      }
      try {
        await tripler1.relateTo(tripler2, 'knows', {distance: parsedRecord.distance});
      } catch (err) {
        console.log('error creating relationship: ', err);
      }
    } else {
      parsedRecord = parseRecord(record);
      try {
        await neode.create('Tripler', parsedRecord);
      } catch (err) {
        console.log('error parsing: ', err);
      }
    }

    process.stdout.write(`parsing ${record[0]}\n`);
  }

  console.log('\n.... done.\n');
  return true;
}
