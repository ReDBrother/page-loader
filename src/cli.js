import program from 'commander';
import Listr from 'listr';
import { version } from '../package.json';
import loadPage from '.';
import getErrorMessage from './lib/errors';

const getTask = (item) => {
  const result = {
    title: item.url,
    task: (ctx, task) => item.load.then((info) => {
      if (!info.success) {
        const message = getErrorMessage(info.error);
        task.skip(message);
      }
    }),
  };

  return result;
};

export default () => {
  program
    .version(version)
    .arguments('<url>')
    .action((url, options) => {
      loadPage(url, options)
        .then(([htmlName, resourses]) => {
          const tasks = resourses.map(getTask);
          const trackingLoadResourses = (task, ...rest) => {
            if (!task) {
              return Promise.resolve(htmlName);
            }

            const tracking = new Listr([task]);
            return tracking.run().then(() => trackingLoadResourses(...rest));
          };

          return trackingLoadResourses(...tasks);
        })
        .then((htmlName) => {
          console.log();
          console.log(`Page was downloaded as ${htmlName}`);
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

