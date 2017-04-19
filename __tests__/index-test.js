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
const filePath1 = `${__dirname}/__fixtures__/page.html`;
const fileData1 = fs.readFileSync(filePath1, 'utf8');
const host = 'http://hexlet.io';

describe('Loading page', () => {
  let output;

  beforeAll(() => {
    nock(host)
      .get('/page')
      .replyWithFile(200, filePath1);
  });

  beforeEach(() => {
    output = fs.mkdtempSync(`${tmpDir}${path.sep}`);
  });

  it('test loading page', (done) => {
    const pageUrl = `${host}/page`;
    loadPage(pageUrl, { output }).then((result) => {
      expect(result).toBe(`${output}${path.sep}hexlet-io-page.html`);
      const data = fs.readFileSync(result, 'utf8');
      expect(data).toBe(fileData1);
    }).catch(done.fail).then(done);
  });
});
