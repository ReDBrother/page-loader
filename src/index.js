import axios from 'axios';
import fs from 'mz/fs';
import url from 'url';
import path from 'path';

const getName = (currentUrl) => {
  const { hostname, pathname } = url.parse(currentUrl);
  const str = `${hostname}${pathname}`;
  return str.replace(/\W/g, '-');
};

export default (pageUrl, keys) => {
  const { output } = keys;
  return axios.get(pageUrl).then((response) => {
    const name = `${getName(pageUrl)}.html`;
    const filePath = path.resolve(output, name);
    fs.writeFileSync(filePath, response.data);
    return filePath;
  });
};
