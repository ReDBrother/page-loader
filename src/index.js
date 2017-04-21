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

const loadFile = (fileUrl) => {
  const result = axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
  });

  return result;
};

const loadAssets = (currentUrl, dirPath, links) => {
  const result = fs.mkdir(dirPath)
      .then(() => {
        debug('create folder');
        return links.map((link) => {
          const fileName = getFileName(link);
          const srcUrl = url.resolve(currentUrl, link);
          const filePath = path.resolve(dirPath, fileName);
          return loadFile(srcUrl)
            .then((response) => {
              debugLoading('load file %s', path.basename(srcUrl));
              response.data.pipe(fs.createWriteStream(filePath));
            })
            .then(() => {
              debugSaving('save file %s', path.basename(fileName));
              return Promise.resolve({
                url: srcUrl,
                fileName,
              });
            });
        });
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
    debug('start rewrite html page');
    const newData = rewriteTags(response.data, `${pageName}_files`);
    const pagePath = path.resolve(output, htmlName);
    const loadingPage = fs.writeFile(pagePath, newData, 'utf8')
      .then(() => {
        debugSaving('save page %s', pageUrl);
        return Promise.resolve(htmlName);
      });

    const links = getTagsSrc(response.data);
    const loadingAssets = loadAssets(pageUrl, dirPath, links);

    return Promise.all([loadingPage, ...loadingAssets]);
  });
};
