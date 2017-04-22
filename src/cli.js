import program from 'commander';
import Listr from 'listr';
import { version } from '../package.json';
import loadPage from '.';
import getErrorMessage from './lib/errors';

export default () => {
  program
    .version(version)
    .arguments('<url>')
    .action((url, options) => {
      loadPage(url, options)
        .then(([htmlName, resourses]) => {
          const tasks = resourses.map((item) => {
            const title = item.url;
            return {
              title,
              task: (ctx, task) => item.load.then((info) => {
                if (!info.success) {
                  const message = getErrorMessage(info.error);
                  task.skip(message);
                }

                return info
              }),
            };
          });
          const trackingLoad = new Listr(tasks);
          trackingLoad.run().then(() => {
            console.log();
            console.log(`Page was downloaded as ${htmlName}`);
          });
        })
        .catch((err) => {
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

