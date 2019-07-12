import inquirer from 'inquirer';
import chalk from 'chalk';
import { Options } from '../types';
import { CloudFormationGateway } from '../gateways/CloudFormationGateway';
import { S3Gateway } from '../gateways/S3Gateway';
import { deleteStackQuestion } from '../questions';
import { CloudFormation } from 'aws-sdk';
import * as logger from '../logger';

const formatResources = (resources: CloudFormation.StackResource[]): string => resources.reduce((acc, resource) => acc + `${chalk.red(`\n- ${resource.ResourceType}`)}\n  PhysicalResourceId: ${resource.PhysicalResourceId}\n  ResourceStatus: ${resource.ResourceStatus}`, '');

export const destroy = async (projectName: string, { sync, yes }: Options, cloudFormationGateway: CloudFormationGateway = new CloudFormationGateway(), s3Gateway: S3Gateway = new S3Gateway()) => {    
    logger.info('Checking for existing stack...');
    const stack = await cloudFormationGateway.fetchStack(projectName);
    if (stack) {
        logger.info('Deleting stack...');
        const resources = await cloudFormationGateway.describeStackResources(stack);
        const formatedResources = formatResources(resources);
        const { deleteStack } = (yes) ? { deleteStack: true } : await inquirer.prompt([deleteStackQuestion(formatedResources)]);
        if (deleteStack) {
            const bucket = resources.find((resource) => resource.ResourceType === 'AWS::S3::Bucket');
            if (bucket && bucket.PhysicalResourceId) {
                await s3Gateway.emptyS3Bucket(bucket.PhysicalResourceId)
            }
            await cloudFormationGateway.deleteStack(stack.StackName, sync);
        }
    } else {
        logger.info('Existing stack not found...');
    }
    logger.info('Finished...');
}
