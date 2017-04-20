import fs from 'mz/fs';
import url from 'url';
import path from 'path';
import axios from './lib/axios';

const getName = (currentUrl) => {
  const { hostname, pathname } = url.parse(currentUrl);
  const str = `${hostname}${pathname}`;
  return str.replace(/\W/g, '-');
};

export default (pageUrl, keys) => {
  const { output } = keys;
  const name = `${getName(pageUrl)}.html`;
  return axios.get(pageUrl).then((response) => {
    const filePath = path.resolve(output, name);
    return fs.writeFile(filePath, response.data, 'utf8');
  }).then(() => new Promise((resolve) => {
    resolve(name);
  }));
};
