import { CloudFormation } from "aws-sdk";
import chalk from "chalk";

export const styleChanges = (changes: CloudFormation.Change[] = []): string => changes
    .filter(({ ResourceChange }) => (ResourceChange && ResourceChange.Action === 'Add'))
    .map(({ ResourceChange: { ResourceType } = {}}: CloudFormation.Change) => ResourceType || '')
    .reduce((acc, type) => acc += chalk.green(`\n+ ${type}`), '');

export const styleResources = (resources: CloudFormation.StackResource[]): string => resources
    .reduce((acc, resource) => acc + `${chalk.yellow(`\n~ ${resource.ResourceType}`)}\n  PhysicalResourceId: ${resource.PhysicalResourceId}\n  ResourceStatus: ${resource.ResourceStatus}`, '');
