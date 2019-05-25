import path from 'path';
import mime from 'mime-types';
import fs from 'fs';
import dir from 'node-dir';
import { S3 } from 'aws-sdk';

export class S3Gateway {
    constructor(private readonly client: S3 = new S3({ apiVersion: '2010-05-15' })) { }

    public async uploadDistToS3Bucket(bucketName: string, directory: string, dryRun: boolean) {
        await this.client.waitFor('bucketExists', { Bucket: bucketName }).promise();
        const root = `${path.resolve(`${process.cwd()}${path.sep}${directory}`)}${path.sep}`;
        const files = dir.files(root, { sync: true });
        await Promise.all(files.map(async (file) => {
            const body = await fs.readFileSync(file);
            const key = file.replace(root, '');
            if (!dryRun) {
                await this.client.putObject({
                    Bucket: bucketName,
                    Key: key,
                    Body: body,
                    CacheControl: (key === 'index.html') ? 'no-cache' : 'max-age=31536000',
                    ContentType: mime.lookup(key) || undefined
                }).promise();
            }
        }));
    }

    public async emptyS3Bucket(bucketName: string) {
        const { Contents = [] } = await this.client.listObjectsV2({ Bucket: bucketName }).promise();
        const Objects: any[] = Contents.map(({ Key }) => ({ Key }));
        if (Objects && Objects.length > 0) {
            await this.client.deleteObjects({
                Bucket: bucketName,
                Delete: {
                    Objects,
                }
            }).promise();
        }
    }
}
