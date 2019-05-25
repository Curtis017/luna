import chalk from 'chalk';

export const created = (text: any) => console.log(chalk.green(`+ ${text}`));
export const existed = (text: any) => console.log(chalk.yellow(`~ ${text}`));
export const deleted = (text: any) => console.log(chalk.red(`- ${text}`));
