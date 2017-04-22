import nock from 'nock';
import os from 'os';
import path from 'path';
import fs from 'mz/fs';
import loadPage from '../src/';

const tmpDir = os.tmpdir();
const filePath1 = `${__dirname}/__fixtures__/page.html`;
const filePath2 = `${__dirname}/__fixtures__/wrongPage.html`;
const assetPath1 = `${__dirname}/__fixtures__/assets/application.js`;
const assetPath2 = `${__dirname}/__fixtures__/assets/link.ico`;
const assetPath3 = `${__dirname}/__fixtures__/assets/image.jpg`;
const fileData1 = `<!DOCTYPE html>
<html>
  <head>
    <script src="hexlet-io-page_files/assets-application.js"></script>
    <title>page</title>
    <link type="image/x-icon" href="hexlet-io-page_files/assets-link.ico">
  </head>
  <body>
    <img src="hexlet-io-page_files/assets-image.jpg">
    <img>
  </body>
</html>
`;
const host = 'http://hexlet.io';
const pageUrl = `${host}/page`;
const wrongPageUrl = `${host}/wrongPage`;
const wrongUrl = `${pageUrl}s`;

describe('Loading page', () => {
  let output;

  beforeAll(() => {
    nock.disableNetConnect();
    nock(host)
      .get('/page')
      .replyWithFile(200, filePath1)
      .get('/wrongPage')
      .replyWithFile(200, filePath2)
      .get('/assets/application.js')
      .reply(200, () => fs.createReadStream(assetPath1))
      .get('/assets/link.ico')
      .reply(200, () => fs.createReadStream(assetPath2))
      .get('/assets/image.jpg')
      .reply(200, () => fs.createReadStream(assetPath3));
  });

  beforeEach(() => {
    output = fs.mkdtempSync(`${tmpDir}${path.sep}`);
  });

  it('test loading page', (done) => {
    loadPage(pageUrl, { output }).then(([htmlName, assets]) => {
      expect(htmlName).toBe('hexlet-io-page.html');
      const filePath = `${output}${path.sep}${htmlName}`;
      const data = fs.readFileSync(filePath, 'utf8');
      expect(data).toBe(fileData1);
      assets.forEach((item) => {
        const assetPath = path.join(output, 'hexlet-io-page_files', item.fileName);
        const exists = fs.existsSync(assetPath);
        expect(exists).toBe(true);
      });
    }).catch(done.fail).then(done);
  });

  it('test wrong output directory', (done) => {
    loadPage(pageUrl, { output: 'blabla' }).then(done.fail)
      .catch((err) => {
        expect(err.code).toBe('ENOENT');
        expect(err.syscall).toBe('mkdir');
        done();
      });
  });

  it('test loading page with wrong link', (done) => {
    loadPage(wrongPageUrl, { output }).then(done.fail)
      .catch((err) => {
        expect(err.status).toBe(404);
        done();
      });
  });

  it('test wrong url', (done) => {
    loadPage(wrongUrl, { output }).then(done.fail)
      .catch((err) => {
        expect(err.status).toBe(404);
        done();
      });
  });
});
