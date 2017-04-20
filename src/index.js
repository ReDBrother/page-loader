import fs from 'mz/fs';
import url from 'url';
import path from 'path';
import cheerio from 'cheerio';
import axios from './lib/axios';

const tags = [
  { name: 'script', attr: 'src' },
  { name: 'link', attr: 'href' },
  { name: 'img', attr: 'src' },
];

const getTagsSrc = (data) => {
  const result = tags.reduce((acc, tag) => {
    const $ = cheerio.load(data);
    const links = $(tag.name)
      .filter((i, el) => $(el).attr(tag.attr))
      .map((i, el) => $(el).attr(tag.attr));

    return [...acc, ...links];
  }, []);

  return result;
};

const getFileName = (str) => {
  const { dir, name, ext } = path.parse(str);
  if (ext !== '') {
    const newStr = path.join(dir, name);
    const result = newStr.replace(/\W/g, '-');
    return `${result}${ext}`;
  }
  return str.replace(/\W/g, '-');
};

const getPageName = (currentUrl) => {
  const { hostname, pathname } = url.parse(currentUrl);
  const str = `${hostname}${pathname}`;
  return getFileName(str);
};

const writeFile = (fileUrl, output) => {
  const result = axios({
    method: 'get',
    url: fileUrl,
    responseType: 'stream',
  }).then((response) => {
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
    const mkdir = fs.mkdir(dirPath)
      .then(() => Promise.resolve(response.data));
    return mkdir;
  }).then((data) => {
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

      return $.html();
    }, data);

    const pagePath = path.resolve(output, htmlName);
    const loadingPage = fs.writeFile(pagePath, newData, 'utf8')
      .then(() => Promise.resolve(htmlName));

    const links = getTagsSrc(data);
    const loadingAssets = links.map((link) => {
      const fileName = getFileName(link);
      const srcUrl = url.resolve(pageUrl, link);
      const filePath = path.resolve(dirPath, fileName);
      return writeFile(srcUrl, filePath).then(() => Promise.resolve({
        success: true,
        url: srcUrl,
        fileName,
      }));
    });

    return Promise.all([loadingPage, ...loadingAssets]);
  });
};
