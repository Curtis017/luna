import { CloudFormation } from "aws-sdk";
import { Template } from "../types";

export class CloudFormationGateway {
    constructor(private readonly client: CloudFormation = new CloudFormation({ apiVersion: '2010-05-15' })) {
        if (!client.config.credentials) {
            throw new Error('Please configure AWS credentials and default region.');
        }
    }

    public async fetchStack(stackName: string): Promise<CloudFormation.Types.Stack | undefined> {
        try {
            const { Stacks: [ stack = undefined ] = [] } = await this.client.describeStacks({
                StackName: stackName,
            }).promise();
            return stack;
        } catch (err) {
            if (err.statusCode === 400 && err.code === 'ValidationError' && err.message === `Stack with id ${stackName} does not exist`) {
                return undefined;
            }
            throw err;
        }
    }

    public async describeStackResources(stack: CloudFormation.Types.Stack) {
        const template = await this.fetchTemplate(stack);
        await this.waitForStackResourceInitializations(stack.StackName, template);
        const { StackResources = [] } = await this.client.describeStackResources({ StackName: stack.StackName }).promise();
        return StackResources;
    }

    public async deleteStack(stackName: string, sync?: boolean): Promise<void> {
        await this.client.deleteStack({ StackName: stackName }).promise();
        if (sync) {
            await this.client.waitFor('stackDeleteComplete', { StackName: stackName }).promise();
        }
    }

    public async createChangeSet(stackName: string, template: string): Promise<CloudFormation.DescribeChangeSetOutput> {
        const params = {
            StackName: stackName,
            ChangeSetName: `${stackName}-${Date.now().toString()}`,
        };
        await this.client.createChangeSet({
            ...params,
            TemplateBody: template,
            ChangeSetType: 'CREATE',
        }).promise();
        await this.client.waitFor('changeSetCreateComplete', params).promise();
        return await this.client.describeChangeSet(params).promise();
    }

    public async executeChangeSet({ StackName, ChangeSetName }: CloudFormation.DescribeChangeSetOutput, sync?: boolean): Promise<void> {
        await this.client.executeChangeSet({
            StackName: StackName,
            ChangeSetName: ChangeSetName || '',
        }).promise();
        if (sync) {
            await this.client.waitFor('stackCreateComplete', {
                StackName: StackName,
            }).promise();
        }
    }

    private async fetchTemplate({ StackName }: CloudFormation.Types.Stack): Promise<Template> {
        const { TemplateBody } = await this.client.getTemplate({ StackName }).promise();
        return (TemplateBody) ? JSON.parse(TemplateBody) : undefined;
    }

    private async waitForStackResourceInitializations(stackName: string, template: Template, count: number = 20) {
        if (count <= 0) {
            throw new Error('Max attempts reached waiting for stack resources to be initialized.');
        }
        const { StackResources = [] } = await this.client.describeStackResources({ StackName: stackName }).promise();
        if ((StackResources.length < Object.keys(template.Resources).length)) {
            await new Promise((resolve, reject) => setTimeout(async () => {
                try {
                    await this.waitForStackResourceInitializations(stackName, template, --count);
                    resolve();
                } catch (err) {
                    reject();
                }
            }, 5000));
        }
    }
}
