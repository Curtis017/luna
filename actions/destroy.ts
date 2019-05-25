import inquirer from 'inquirer';
import chalk from 'chalk';
import { Options } from '../types';
import { CloudFormationGateway } from '../gateways/CloudFormationGateway';
import { S3Gateway } from '../gateways/S3Gateway';
import { deleteStackQuestion } from '../questions';

export const destroy = async (projectName: string, { sync, yes }: Options, cloudFormationGateway: CloudFormationGateway = new CloudFormationGateway(), s3Gateway: S3Gateway = new S3Gateway()) => {    
    const stack = await cloudFormationGateway.fetchStack(projectName);
    if (stack) {
        const resources = await cloudFormationGateway.describeStackResources(stack);
        const { deleteStack } = (yes) ? { deleteStack: true } : await inquirer.prompt([deleteStackQuestion(chalk.red(JSON.stringify(resources, null, 2)))]);
        if (deleteStack) {
            const bucket = resources.find((resource) => resource.ResourceType === 'AWS::S3::Bucket');
            if (bucket && bucket.PhysicalResourceId) {
                await s3Gateway.emptyS3Bucket(bucket.PhysicalResourceId)
            }
            await cloudFormationGateway.deleteStack(stack.StackName, sync);
        }
    }
}
