import program from 'commander';
import Listr from 'listr';
import { version } from '../package.json';
import loadPage from '.';
import getErrorMessage from './lib/errors';

const getTask = (item) => {
  const result = {
    title: item.url,
    task: async (ctx, task) => {
      const info = await item.load;
      if (!info.success) {
        const message = getErrorMessage(info.error);
        task.skip(message);
      }
    },
  };

  return result;
};

export default () => {
  program
    .version(version)
    .arguments('<url>')
    .action(async (url, options) => {
      try {
        const output = options.output;
        const { htmlName, resourses } = await loadPage(url, output);
        const tasks = resourses.map(getTask);
        const trackingLoadResourses = async ([task, ...rest]) => {
          if (task) {
            const tracking = new Listr([task]);
            await tracking.run();
            return trackingLoadResourses(rest);
          }

          return Promise.resolve();
        };
        trackingLoadResourses(tasks);
        console.log();
        console.log(`Page was downloaded as ${htmlName}`);
      } catch (err) {
        const message = getErrorMessage(err, options);
        console.error(message);
        process.exit(1);
      }
    });

  const pwd = process.env.PWD;

  program
    .description('Downloading the specified address from the web.')
    .option('--output [path]', 'The output directory for additional file', pwd);

  program.parse(process.argv);
};

