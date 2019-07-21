import template from '../template.json';
import chalk from 'chalk';
import inquirer = require('inquirer');
import * as logger from '../utils/logger';
import { Options } from '../types';
import { CloudFormationGateway } from '../gateways/CloudFormationGateway';
import { S3Gateway } from '../gateways/S3Gateway';
import { CloudFrontGateway } from '../gateways/CloudFrontGateway';
import { executeChangeSetQuestion, useExistingStackQuestion } from '../questions';
import { CloudFormation } from 'aws-sdk';

export const deploy = async (projectName: string, dist: string, { sync, yes }: Options, cloudFormationGateway: CloudFormationGateway = new CloudFormationGateway(), s3Gateway: S3Gateway = new S3Gateway(), cloudFrontGateway: CloudFrontGateway = new CloudFrontGateway()) => {    
    logger.info('Checking for existing stack...');

    let stack;
    let resources;
    const existing = await cloudFormationGateway.fetchStack(projectName);

    if (existing) {
        logger.info('Using existing stack...');
        resources = await cloudFormationGateway.describeStackResources(existing);
        const { useExistingStack } = (yes) ? { useExistingStack: true } : await inquirer.prompt([useExistingStackQuestion(formatResources(resources))]);
        if (useExistingStack) {
            stack = existing;
        }
    } else {
        logger.info('Existing stack not found...');
        logger.info('Creating new stack...');
        const changeSet = await cloudFormationGateway.createChangeSet(projectName, JSON.stringify(template));
        const { executeChangeSet } = (yes) ? { executeChangeSet: true } : await inquirer.prompt([executeChangeSetQuestion(formatChanges(changeSet.Changes))]);
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
        const distribution = resources.find((resource) => resource.ResourceType === 'AWS::CloudFront::Distribution');
        if (bucket && bucket.PhysicalResourceId) {
            logger.info('Uploading artifacts to S3...');
            await s3Gateway.uploadDistToS3Bucket(bucket.PhysicalResourceId, dist, false);
            logger.info('Deployment finished...');
            if (distribution && distribution.PhysicalResourceId) {
                const distributionDescription = await cloudFrontGateway.describeDistribution(distribution.PhysicalResourceId);
                console.log(chalk.underline(chalk.yellow('\nStack Information')));
                if (distributionDescription) {
                    console.log(`${chalk.yellow(`distribution:`)}\n  domain-name: ${distributionDescription.DomainName}`);
                    console.log(`${chalk.yellow(`bucket:`)}\n  name: ${bucket.PhysicalResourceId}`);
                }
            }
        }
    }
}

const formatChanges = (changes: CloudFormation.Change[] = []): string => changes
    .reduce((acc, { ResourceChange: { ResourceType } = {}}: CloudFormation.Change) => acc += chalk.green(`\n+ ${ResourceType}`), '')

const formatResources = (resources: CloudFormation.StackResource[]): string => resources
    .reduce((acc, resource) => acc + `${chalk.yellow(`\n~ ${resource.ResourceType}`)}\n  PhysicalResourceId: ${resource.PhysicalResourceId}\n  ResourceStatus: ${resource.ResourceStatus}`, '');

