
import express from 'express';
import 'express-async-errors';
import expressLogging from 'express-logging';
import cors from 'cors';
import logger from 'logops';
import helmet from 'helmet';
import jwt from 'jsonwebtoken';
import bodyParser from 'body-parser';
import mobile from 'is-mobile';
import fs from 'fs';
import fetch from 'node-fetch';

import { ov_config } from './lib/ov_config';

import {
  cqdo, _400, _401, _403, _500, _503
} from './lib/utils';

import swaggerUi from 'swagger-ui-express';
import swaggerDocumentv1 from './swagger.v1.json';

const router = require('./routes/createRouter.js')();

var public_key;
var jwt_iss = ov_config.jwt_iss;

export function doExpressInit(log, db, qq) {

  // Initialize http server
  const app = express();

  if (log) app.use(expressLogging(logger));

  app.disable('x-powered-by');
  app.disable('etag');
  app.use(bodyParser.json({limit: '5mb'}));
  app.use(cors({exposedHeaders: ['x-sm-oauth-url']}));
  app.use(helmet());

  if (ov_config.no_auth) {
    console.warn("Starting up without authentication!");
  } else if (ov_config.jwt_pub_key) {
    public_key = fs.readFileSync(ov_config.jwt_pub_key, "utf8");
  } else {
    console.log("JWT_PUB_KEY not defined, attempting to fetch from "+ov_config.sm_oauth_url+'/pubkey');
    fetch(ov_config.sm_oauth_url+'/pubkey')
    .then(res => {
      jwt_iss = res.headers.get('x-jwt-iss');
      if (res.status !== 200) throw "http code "+res.status;
      return res.text()
    })
    .then(body => {
      public_key = body;
    })
    .catch((e) => {
      console.log("Unable to read SM_OAUTH_URL "+ov_config.sm_oauth_url);
      console.log(e);
      process.exit(1);
    });
  }

  // require ip_header if config for it is set
  if (!ov_config.DEBUG && ov_config.ip_header) {
    app.use(function (req, res, next) {
      if (!req.header(ov_config.ip_header)) {
        console.log('Connection without '+ov_config.ip_header+' header');
       return _400(res, "Missing required header.");
      }
      else next();
    });
  }

  // add req.user if there's a valid JWT
  app.use(async function (req, res, next) {

    if (req.method == 'OPTIONS') return next(); // skip OPTIONS requests

    req.user = {};
    req.db = db;
    req.qq = qq;

    res.set('x-sm-oauth-url', ov_config.sm_oauth_url);

    if (!public_key && !ov_config.no_auth) {
      return _503(res, "Server is starting up.");
    }

    // uri whitelist
    switch (req.url) {
      case '/':
      case '/poke':
        return next();
      default:
        break;
    }
    if (req.url.match(/^\/HelloVoterHQ[a-zA-Z0-9/]*\/mobile\//)) return next();
    if (req.url.match(/^\/HelloVoterHQ[a-zA-Z0-9/]*\/public\//)) return next();
    if (req.url.match(/\/\.\.\//)) return _400(res, "Not OK..");

    try {
      let u, a; // My Hero Academia
      if (!req.header('authorization')) return _400(res, "Missing required header.");
      let token = req.header('authorization').split(' ')[1];

      if (token.match(/^apikey:/)) {
        try {
          let apikey = token.split(':')[1];
          a = await req.db.query('match (v:Volunteer {apikey:{apikey}}) set v.last_seen = timestamp() return v', {apikey});
        } catch (e) {
          return _500(res, e);
        }
      } else {
        u = (ov_config.no_auth?jwt.decode(token):jwt.verify(token, public_key));

        // verify props
        if (!u.id) return _401(res, "Your token is missing a required parameter.");
        if (u.iss !== jwt_iss) return _401(res, "Your token was issued for a different domain.");
        if (u.aud && (
          (ov_config.jwt_aud && u.aud !== ov_config.jwt_aud) ||
          (!ov_config.jwt_aud && u.aud !== req.header('host'))
        )) return _401(res, "Your token has an incorrect audience.");

        if (!u.email) u.email = "";
        if (!u.avatar) u.avatar = "";

        try {
          a = await req.db.query('merge (a:Volunteer {id:{id}}) on match set a += {last_seen: timestamp(), name:{name}, email:{email}, avatar:{avatar}} on create set a += {created: timestamp(), last_seen: timestamp(), name:{name}, email:{email}, avatar:{avatar}} return a', u);
        } catch (e) {
          return _500(res, e);
        }
      }

      if (a.data.length === 1) {
        req.user = a.data[0];
      } else return _401(res, "Invalid token.");

      if (req.user.locked) return _403(res, "Your account is locked.");

    } catch (e) {
      console.warn(e);
      return _401(res, "Invalid token.");
    }

    next();
  });

  // healtcheck
  app.get('/poke', (req, res) => {
    return cqdo(req, res, 'return timestamp()', false)
  });

  app.get('/HelloVoterHQ/mobile/invite', invite);
  app.get('/HelloVoterHQ/[0-9A-Z]+/mobile/invite', invite);

  app.use('/HelloVoterHQ/api/v1', router);
  app.use('/HelloVoterHQ/[0-9A-Z]+/api/v1', router);

  app.use('/HelloVoterHQ/api/v1/public/swagger', swaggerUi.serve, swaggerUi.setup(swaggerDocumentv1));

  // default error handler
  app.use((err, req, res, next) => {
    return _500(res, err);
  });

  return app;
}

function invite(req, res) {
 let url = 'https://ourvoiceusa.org/hellovoter/';
 if (mobile({ua:req.get('User-Agent')})) url = 'OurVoiceApp://invite?inviteCode='+req.query.inviteCode+'&'+(req.query.orgId?'orgId='+req.query.orgId:'server='+req.query.server);
 res.redirect(url);
}
