import program from 'commander';
import { deploy, destroy } from './actions';

program
    .version('1.0.0')
    .command('deploy <projectName> <dist>')
    .usage('<projectName> <dist> [options]')
    .option('-d, --dryRun', 'Dry run. Resources will not be allocated')
    .action(deploy);

program
    .version('1.0.0')
    .command('destroy <projectName>')
    .usage('<projectName> [options]')
    .option('-d, --dryRun', 'Dry run. Resources will not be deleted')
    .action(destroy);

program.parse(process.argv)
