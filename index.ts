#!/usr/bin/env node
import program from 'commander';
import { deploy, destroy } from './actions';
import { version } from './package.json';

program
    .version(version)
    .command('deploy <projectName> <dist>')
    .option('-s, --sync', 'Synchronously wait for resources to be deployed.')
    .option('-y, --yes', 'Automatically reply yes for all prompts.')
    .usage('<projectName> <dist> [options]')
    .action(deploy);

program
    .version(version)
    .command('destroy <projectName>')
    .option('-s, --sync', 'Synchronously wait for resources to be destroyed.')
    .option('-y, --yes', 'Automatically reply yes for all prompts.')
    .usage('<projectName> [options]')
    .action(destroy);

program.parse(process.argv)
