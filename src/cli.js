import program from 'commander';
import { version } from '../package.json';
import loadPage from '.';

export default () => {
  program
    .version(version)
    .arguments('<url>')
    .action((url, options) => {
      loadPage(url, options)
        .then(([pageName, filesInfo]) => {
          filesInfo.forEach((item) => {
            const flag = '\u2714';
            console.log(`${flag} ${item.url}`);
          });
          console.log();
          console.log(`Page was downloaded as '${pageName}'`);
        }).catch(console.error);
    });

  const pwd = process.env.PWD;

  program
    .description('Downloading the specified address from the web.')
    .option('--output [path]', 'The output directory for additional file', pwd);

  program.parse(process.argv);
};

