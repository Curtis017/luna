import pipeline from '../pipeline';
import inquirer from 'inquirer';
import dir from 'node-dir';
import path from 'path';
import mime from 'mime-types';
import fs from 'fs';
import * as logger from '../logger';
import { Options } from '../models';
import { s3BucketHandler, cloudFrontOriginAccessIdentityHandler, cloudFrontDistributionHandler } from '../handlers';
import { useExistingResourceQuestion } from '../questions';
import { Handler } from '../interfaces';
import { S3 } from 'aws-sdk';

const handlers: Handler<any>[] = [
    cloudFrontOriginAccessIdentityHandler,
    s3BucketHandler,
    cloudFrontDistributionHandler,
];

const uploadDistToS3Bucket = async (bucket: string, directory: string, dryRun: boolean, client = new S3()) => {
    const root = `${path.resolve(`${process.cwd()}${path.sep}${directory}`)}${path.sep}`;
    const files = dir.files(root, { sync:true });
    await Promise.all(files.map(async (file) => {
        const body = await fs.readFileSync(file);
        const key = file.replace(root, '');
        if (!dryRun) {
            await client.putObject({
                Bucket: bucket,
                Key: key,
                Body: body,
                CacheControl: (key === 'index.html') ? 'no-cache' : 'max-age=31536000',
                ContentType: mime.lookup(key) || undefined
            }).promise();
        }
    }));
}

export const deploy = async (projectName: string, dist: string, { dryRun }: Options) => {
    const resources = await pipeline({ projectName, dryRun }, ...handlers.map((handler: Handler<any>) => {
        return async (payload: any, next: (res?: any) => void) => {
            let resource = await handler.fetch(payload);
            if (resource.exists) {
                logger.existed(`${resource.type}${handler.format(resource)}`);
                const { useExistingResource = true } = await inquirer.prompt([ useExistingResourceQuestion(resource.type) ]);
                if (!useExistingResource) {
                    throw new Error('Please use the existing resource or provide another name.');
                }
            } else {
                if (!dryRun) {
                    resource = await handler.create(resource);
                }
                logger.created(`${resource.type}${handler.format(resource)}`);
            }
            return next(resource.payload);
        }
    }));
    await uploadDistToS3Bucket(resources.bucket.name, dist, dryRun);
}
