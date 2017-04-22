import http from 'http';
import createDebug from 'debug';

const debug = createDebug('page-loader:errors');

const getErrorMessageByCode = (err, options) => {
  switch (err.code) {
    case 'EACCES':
      return `Permission denied for ${err.path} file or directory`;
    case 'ECONNREFUSED':
      return `No connection for ${err.config.url} url`;
    case 'EEXIST':
      return `${err.path} already exists`;
    case 'ENOTDIR':
      return `${err.path} is not a directory`;
    case 'ENOTFOUND': {
      return `Wrong url address: ${err.config.url}`;
    }
    case 'ENOENT': {
      if (err.syscall === 'mkdir') {
        return `Output directory ${options.output} is not exists`;
      }

      return `${err.path} is not exists`;
    }
    case 'EPERM':
      return `Operation ${err.syscall} is not permitted`;
    default: {
      debug('message for %s code is not defined', err.code);
      return err.message;
    }
  }
};

const getErrorMessageByStatus = (err) => {
  const url = err.config.url;
  const status = err.response.status;
  switch (status) {
    case 404:
      return `Request failed for ${url} url`;
    default:
      debug('message for %d status is not defined', status);
      return `${http.STATUS.CODES[status]} ${url}`;
  }
};

export default (err, options) => {
  if (err.response && err.response.status) {
    return getErrorMessageByStatus(err);
  } else if (err.code) {
    return getErrorMessageByCode(err, options);
  }

  return err.message;
};

