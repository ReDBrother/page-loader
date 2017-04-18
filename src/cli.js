import program from 'commander';
import { version } from '../package.json';
import loadPage from '.';

export default () => {
  program
    .version(version)
    .arguments('<url>')
    .action(loadPage);

  const pwd = process.env.PWD;

  program
    .description('Downloading the specified address from the web.')
    .option('--output [path]', 'The output directory for additional file', pwd);

  program.parse(process.argv);
};

