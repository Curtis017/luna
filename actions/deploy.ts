import template from '../template.json';
import chalk from 'chalk';
import inquirer = require('inquirer');
import { Options } from '../types';
import { CloudFormationGateway } from '../gateways/CloudFormationGateway';
import { S3Gateway } from '../gateways/S3Gateway';
import { executeChangeSetQuestion, useExistingStackQuestion } from '../questions';
import * as logger from '../utils/logger';

export const deploy = async (projectName: string, dist: string, { sync, yes }: Options, cloudFormationGateway: CloudFormationGateway = new CloudFormationGateway(), s3Gateway: S3Gateway = new S3Gateway()) => {    
    logger.info('Checking for existing stack...');

    let stack;
    let resources;
    const existing = await cloudFormationGateway.fetchStack(projectName);

    if (existing) {
        logger.info('Using existing stack...');
        resources = await cloudFormationGateway.describeStackResources(existing);
        const { useExistingStack } = (yes) ? { useExistingStack: true } : await inquirer.prompt([useExistingStackQuestion(chalk.yellow(JSON.stringify(existing, null, 2)))]);
        if (useExistingStack) {
            stack = existing;
        }
    } else {
        logger.info('Existing stack not found...');
        logger.info('Creating new stack...');
        const changeSet = await cloudFormationGateway.createChangeSet(projectName, JSON.stringify(template));
        const { executeChangeSet } = (yes) ? { executeChangeSet: true } : await inquirer.prompt([executeChangeSetQuestion(chalk.green(JSON.stringify(changeSet, null, 2)))]);
        if (executeChangeSet) {
            await cloudFormationGateway.executeChangeSet(changeSet, sync);
            stack = await cloudFormationGateway.fetchStack(projectName);
            if (stack) {
                resources = await cloudFormationGateway.describeStackResources(stack);
            }
        } else {
            await cloudFormationGateway.deleteStack(projectName, sync);
        }
    }

    if (stack && resources) {
        const bucket = resources.find((resource) => resource.ResourceType === 'AWS::S3::Bucket');
        if (bucket && bucket.PhysicalResourceId) {
            logger.info('Uploading artifacts to S3...');
            await s3Gateway.uploadDistToS3Bucket(bucket.PhysicalResourceId, dist, false);
        }
        logger.info('Deployment finished...');
    }
}
