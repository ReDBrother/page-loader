import fs from 'mz/fs';
import url from 'url';
import path from 'path';
import cheerio from 'cheerio';
import createDebug from 'debug';
import axios from './lib/axios';

const debug = createDebug('page-loader:other');
const debugSaving = createDebug('page-loader:save');
const debugLoading = createDebug('page-loader:load');

const tags = [
  { name: 'script', attr: 'src' },
  { name: 'link', attr: 'href' },
  { name: 'img', attr: 'src' },
];

const getTagsSrc = (data) => {
  debug('start getting tags');
  const result = tags.reduce((acc, tag) => {
    const $ = cheerio.load(data);
    const links = $(tag.name)
      .filter((i, el) => $(el).attr(tag.attr))
      .map((i, el) => $(el).attr(tag.attr));

    return [...acc, ...links];
  }, []);

  debug('end getting tags');
  return result;
};

const getFileName = (str) => {
  const { dir, name, ext } = path.parse(str);
  const newStr = path.join(dir, name);
  const result = newStr.replace(/\W/g, '-');
  return `${result}${ext}`;
};

const getPageName = (currentUrl) => {
  const { hostname, pathname } = url.parse(currentUrl);
  const str = `${hostname}${pathname}`;
  return str.replace(/\W/g, '-');
};

const writeFile = (fileUrl, output) => {
  const result = axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
  }).then((response) => {
    debugLoading('load file %s', path.basename(fileUrl));
    response.data.pipe(fs.createWriteStream(output));
  });

  return result;
};

export default (pageUrl, keys) => {
  const { output } = keys;
  const pageName = getPageName(pageUrl);
  const dirPath = path.join(output, `${pageName}_files`);
  const htmlName = `${pageName}.html`;
  return axios.get(pageUrl).then((response) => {
    debug('load page %s', pageUrl);
    const mkdir = fs.mkdir(dirPath)
      .then(() => {
        debug('create folder');
        return Promise.resolve(response.data);
    });
    return mkdir;
  }).then((data) => {
    debug('start rewrite html page');
    const newData = tags.reduce((acc, tag) => {
      const $ = cheerio.load(acc);
      $(tag.name).each((i, el) => {
        const oldSrc = $(el).attr(tag.attr);
        if (oldSrc) {
          const fileName = getFileName(oldSrc);
          const newSrc = path.join(`${pageName}_files`, fileName);
          $(el).attr(tag.attr, newSrc);
        }
      });
      debug('rewrite src for %s tags', tag.name);
      return $.html();
    }, data);

    const pagePath = path.resolve(output, htmlName);
    const loadingPage = fs.writeFile(pagePath, newData, 'utf8')
      .then(() => {
        debugSaving('save page %s', pageUrl);
        return Promise.resolve(htmlName)
      });

    const links = getTagsSrc(data);
    const loadingAssets = links.map((link) => {
      const fileName = getFileName(link);
      const srcUrl = url.resolve(pageUrl, link);
      const filePath = path.resolve(dirPath, fileName);
      return writeFile(srcUrl, filePath).then(() => {
        debugSaving('save file %s', path.basename(fileName));
        return Promise.resolve({
          url: srcUrl,
          fileName,
        });
      });
    });

    return Promise.all([loadingPage, ...loadingAssets]);
  });
};
