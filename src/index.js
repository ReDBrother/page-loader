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

const rewriteTags = (data, dirName) => {
  debug('start rewrite html page');
  const newData = tags.reduce((acc, tag) => {
    const $ = cheerio.load(acc);
    $(tag.name).each((i, el) => {
      const oldSrc = $(el).attr(tag.attr);
      if (oldSrc) {
        const fileName = getFileName(oldSrc);
        const newSrc = path.join(dirName, fileName);
        $(el).attr(tag.attr, newSrc);
      }
    });
    debug('rewrite src for %s tags', tag.name);
    return $.html();
  }, data);

  return newData;
};

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

const loadAssets = (currentUrl, dirPath, links) => {
  const result = links.reduce((acc, link) => {
    const fileName = getFileName(link);
    const srcUrl = url.resolve(currentUrl, link);
    const filePath = path.resolve(dirPath, fileName);
    const loadingAsset = axios({
      method: 'get',
      url: srcUrl,
      responseType: 'stream',
    })
      .then((response) => {
        debugLoading('load file %s', path.basename(srcUrl));
        response.data.pipe(fs.createWriteStream(filePath));
      })
      .then(() => {
        debugSaving('save file %s', path.basename(fileName));
        return {
          url: srcUrl,
          fileName,
        };
      });

    return [...acc, loadingAsset];
  }, []);

  return Promise.all(result);
};

export default (pageUrl, keys) => {
  const { output } = keys;
  const pageName = getPageName(pageUrl);
  const htmlName = `${pageName}.html`;
  const dirName = `${pageName}_files`;
  const dirPath = path.join(output, dirName);
  return fs.mkdir(dirPath)
    .then(() => {
      debug('create folder %s', dirName);
      return axios.get(pageUrl);
    })
    .then((response) => {
      debug('load page %s', pageUrl);
      const newData = rewriteTags(response.data, dirName);
      const pagePath = path.resolve(output, htmlName);
      return fs.writeFile(pagePath, newData, 'utf8').then(() => {
        debugSaving('save page %s', pageUrl);
        return response;
      });
    })
    .then((response) => {
      const links = getTagsSrc(response.data);
      return loadAssets(pageUrl, dirPath, links);
    })
    .then((result) => {
      debug('end loading and output of result');
      return [htmlName, result];
    });
};
