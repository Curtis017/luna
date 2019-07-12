import chalk from 'chalk';

export const info = (text: string) => console.log(`Luna: ${chalk.yellow(text)}`);
export const created = (text: string) => console.log(chalk.green(`+ ${text}`));
export const deleted = (text: string) => console.log(chalk.red(`- ${text}`));
export const existed = (text: string) => console.log(chalk.yellow(`~ ${text}`));