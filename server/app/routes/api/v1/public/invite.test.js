import { expect } from 'chai';

import { ov_config } from '../../../../lib/ov_config';
import neo4j from '../../../../lib/neo4j';
import { appInit, base_uri, getObjs } from '../../../../../test/lib/utils';

var api;
var db;
var mua = 'Mozilla/5.0 (iPhone; CPU iPhone OS 5_0 like Mac OS X) AppleWebKit/534.46 (KHTML, like Gecko) Version/5.1 Mobile/9A334 Safari/7534.48.3'

describe('Invite', function () {

  before(() => {
    db = new neo4j(ov_config);
    api = appInit(db);
  });

  after(async () => {
    db.close();
  });

  it('deprecated invite URL desktop redirects to web', async () => {
    let r = await api.get('/HelloVoterHQ/mobile/invite');
    expect(r.statusCode).to.equal(302);
  });

  it('deprecated invite URL desktop redirects to web with orgId', async () => {
    let r = await api.get('/HelloVoterHQ/DEMO/mobile/invite');
    expect(r.statusCode).to.equal(302);
  });

  it('invite URL desktop redirects to web', async () => {
    let r = await api.get(base_uri+'/public/invite');
    expect(r.statusCode).to.equal(302);
    expect(r.headers.location).to.equal('https://ourvoiceusa.org/hellovoter/');
  });

  it('invite URL mobile redirects to mobile', async () => {
    let r = await api.get(base_uri+'/public/invite')
      .set('User-Agent', mua);
    expect(r.statusCode).to.equal(302);
    expect(r.headers.location).to.equal('OurVoiceApp://invite?inviteCode=undefined&server=undefined');
  });

});
