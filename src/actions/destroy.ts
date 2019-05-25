import pipeline from '../pipeline';
import inquirer from 'inquirer';
import * as logger from '../logger';
import { Options } from '../models';
import { s3BucketHandler, cloudFrontOriginAccessIdentityHandler, cloudFrontDistributionHandler } from '../handlers';
import { deleteExistingResourceQuestion } from '../questions';
import { Handler } from '../interfaces';

const handlers: Handler<any>[] = [
    s3BucketHandler,
    cloudFrontDistributionHandler,
    cloudFrontOriginAccessIdentityHandler,
];

export const destroy = async (projectName: string, { dryRun }: Options) => {
    pipeline({ projectName, dryRun }, ...handlers.map((handler: Handler<any>) => {
        return async (payload: any, next: (res?: any) => void) => {
            let resource = await handler.fetch(payload);

            if (resource.exists) {
                logger.deleted(`${resource.type}${handler.format(resource)}`);
                const { deleteExistingResource = true } = await inquirer.prompt([ deleteExistingResourceQuestion(resource.type) ]);
                if (deleteExistingResource) {
                    if (!dryRun) {
                        resource = await handler.delete(resource);
                    }
                }
            }
            return next(resource.payload);
        };
    }));
}
