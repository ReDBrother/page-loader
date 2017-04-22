import program from 'commander';
import { version } from '../package.json';
import loadPage from '.';
import getErrorMessage from './lib/errors';

export default () => {
  program
    .version(version)
    .arguments('<url>')
    .action((url, options) => {
      loadPage(url, options)
        .then(([pageName, filesInfo]) => {
          filesInfo.forEach((item) => {
            const flag = item.success ? '\u2714' : '\u2715';
            console.log(`${flag} ${item.url}`);
          });
          console.log();
          console.log(`Page was downloaded as '${pageName}'`);
        }).catch((err) => {
          const message = getErrorMessage(err, options);
          console.error(message);
          process.exit(1);
        });
    });

  const pwd = process.env.PWD;

  program
    .description('Downloading the specified address from the web.')
    .option('--output [path]', 'The output directory for additional file', pwd);

  program.parse(process.argv);
};

