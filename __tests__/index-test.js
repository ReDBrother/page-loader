import loadPage from '../src/';
import nock from 'nock';
import os from 'os';
import path from 'path';
import fs from 'mz/fs';
import axios from 'axios';
import httpAdapter from 'axios/lib/adapters/http';

nock.disableNetConnect();
axios.defaults.adapter = httpAdapter;

const tmpDir = os.tmpdir();

describe('Loading page', () => {
  let output;

  beforeEach(() => {
    const { sep } = path;
    output = fs.mkdtempSync(`${tmpDir}${sep}`);
  });

  it('set 1', (done) => {
    const host = 'http://hexlet.io';
    const status = 200;
    nock(host)
      .get('/page')
      .replyWithFile(status, `${__dirname}/__fixtures__/page.html`);
    
    const pageUrl = `${host}/page`;
    loadPage(pageUrl, { output }).then((result) => {
      fs.exists(result).then((exists) => {
        if (exists) {
          done();
        }
        
        done.fail();
      });
    });
  });

  afterEach(() => {
    fs.rmdirSync(output);
  });
});
