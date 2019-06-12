import { Handler, Resource } from '../../interfaces';
import { S3Bucket } from '../../models';
import { Payload } from './types';
import { S3 } from "aws-sdk";
import crypto from 'crypto';

const resource = ({ bucket }: S3Bucket, exists: boolean = false): Resource<S3Bucket> => ({
    type: 'S3 Bucket',
    exists,
    payload: {
        bucket
    },
});

const generatePolicy = (bucketName: string, identityId?: string): string | undefined => {
    if (!identityId) {
        return undefined;
    }
    return JSON.stringify({
        "Version": "2012-10-17",
        "Statement": [
            {
                "Effect": "Allow",
                "Principal": {
                    "AWS": `arn:aws:iam::cloudfront:user/CloudFront Origin Access Identity ${identityId}`
                },
                "Action": "s3:GetObject",
                "Resource": `arn:aws:s3:::${bucketName}/*`
            }
        ]
    });
}

const hash = (value: string, key: string): string => {
    const hash = crypto.createHmac('md5', key).update(value).digest('hex');
    return `${value}-${hash.slice(-5)}`;
};

const updateBucketPolicy = async ({ bucket }: S3Bucket, client: S3, count: number = 10): Promise<void> => {
    if (count > 0) {
        try {
            await client.putBucketPolicy({
                Bucket: bucket.name,
                Policy: bucket.policy as string,
            }).promise();
        } catch (err) {
            if (err.statusCode === 400 && err.code === 'MalformedPolicy') {
                await new Promise((resolve) => setTimeout(async () => {
                    await updateBucketPolicy({ bucket }, client, --count);
                    resolve();
                }, 2000));
            } else {
                throw err;
            }
        }
    } else {
        throw new Error('Creating bucket policy: Max attempts reached. Bucket policy is malformed and can not be updated.');
    }
}

const deleteBucketObjects = async ({ bucket }: S3Bucket, client: S3) => {
    const { Contents = [] } = await client.listObjectsV2({ Bucket: bucket.name }).promise();
    const Objects: any[] = Contents.map(({ Key }) => ({ Key }));
    if (Objects && Objects.length > 0) {
        await client.deleteObjects({
            Bucket: bucket.name,
            Delete: {
                Objects,
            }
        }).promise();
    }
}

const fetchResource = async ({ bucket }: S3Bucket, count: number = 0, client: S3 = new S3()): Promise<Resource<S3Bucket>> => {
    try {
        await client.headBucket({ Bucket: bucket.name }).promise();
        const { Policy: policy } = await client.getBucketPolicy({ Bucket: bucket.name }).promise();
        return resource({ bucket: { ...bucket, policy } }, true);
    } catch(err) {
        switch (err.code) {
            case 'NotFound':
                return resource({ bucket }, false);
            case 'Forbidden':
                return fetchResource({ bucket: { ...bucket, name: hash(bucket.name, count.toString()) } }, ++count);
            default:
                throw err;
        }
    }
}

const createResource = async ({ payload: { bucket } }: Resource<S3Bucket>, client: S3 = new S3()): Promise<Resource<S3Bucket>> => {
    if (!bucket.policy) {
        throw Error('Origin Access Identity must be created before S3Bucket');
    }
    await client.createBucket({ Bucket: bucket.name }).promise();
    await client.waitFor('bucketExists', { Bucket: bucket.name }).promise();
    await updateBucketPolicy({ bucket }, client);
    return resource({ bucket }, true);
}

const deleteResource = async ({ payload: { bucket } }: Resource<S3Bucket>, client: S3 = new S3()) => {
    await deleteBucketObjects({ bucket }, client);
    await client.deleteBucket({ Bucket: bucket.name }).promise();
}

export const s3BucketHandler: Handler<S3Bucket> = {
    fetch: async (payload: Payload) => {
        const resource = await fetchResource({ bucket: { name: payload.projectName } });
        const policy = resource.payload.bucket.policy || generatePolicy(resource.payload.bucket.name, (payload.identity) ? payload.identity.id : undefined);
        return {
            ...resource,
            payload: {
                bucket: {
                    ...resource.payload.bucket,
                    policy,
                }
            }
        };
    },
    create: async (resource: Resource<S3Bucket>) => {
        return await createResource(resource);
    },
    delete: async (resource: Resource<S3Bucket>) => {
        await deleteResource(resource);
        return resource;
    },
    format: ({ payload: { bucket }}: Resource<S3Bucket>) => {
        return `\n\tName: ${bucket.name}\n\tPolicy: ${bucket.policy}`;
    }
};
