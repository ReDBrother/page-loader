import nock from 'nock';
import os from 'os';
import path from 'path';
import fs from 'mz/fs';
import loadPage from '../src/';

const tmpDir = os.tmpdir();
const filePath1 = `${__dirname}/__fixtures__/page.html`;
const filePath2 = `${__dirname}/__fixtures__/link.html`;
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
const pageWithWrongLinkUrl = `${host}/link`;
const wrongUrl = `${pageUrl}s`;

describe('Loading page', () => {
  let output;

  beforeAll(() => {
    nock.disableNetConnect();
    nock(host)
      .get('/page')
      .replyWithFile(200, filePath1)
      .get('/link')
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

  it('test loading page', async (done) => {
    try {
      const { htmlName, resourses } = await loadPage(pageUrl, output);
      expect(htmlName).toBe('hexlet-io-page.html');
      const filePath = `${output}${path.sep}${htmlName}`;
      const data = fs.readFileSync(filePath, 'utf8');
      expect(data).toBe(fileData1);
      const loadingAssets = resourses.map(item => item.load);
      const result = await Promise.all(loadingAssets);
      result.forEach((asset) => {
        expect(asset.success).toBe(true);
        const assetPath = path.join(output, 'hexlet-io-page_files', asset.fileName);
        const exists = fs.existsSync(assetPath);
        expect(exists).toBe(true);
      });
      done();
    } catch (err) {
      done.fail(err);
    }
  });

  it('test wrong output directory', async (done) => {
    try {
      await loadPage(pageUrl, 'blabla');
      done.fail();
    } catch (err) {
      expect(err.code).toBe('ENOENT');
      expect(err.syscall).toBe('mkdir');
      done();
    }
  });

  it('test loading page with wrong link', async (done) => {
    try {
      const { htmlName, resourses } = await loadPage(pageWithWrongLinkUrl, output);
      expect(htmlName).toBe('hexlet-io-link.html');
      const asset = await resourses[0].load;
      expect(asset.success).toBe(false);
      done();
    } catch (err) {
      done.fail(err);
    }
  });

  it('test wrong url', async (done) => {
    try {
      await loadPage(wrongUrl, output);
      done.fail();
    } catch (err) {
      expect(err.status).toBe(404);
      done();
    }
  });
});
