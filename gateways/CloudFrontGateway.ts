import { CloudFront } from 'aws-sdk';

export class CloudFrontGateway {
    constructor(private readonly client: CloudFront = new CloudFront({ apiVersion: '2019-03-26' })) { }

    public async describeDistribution(id: string): Promise<CloudFront.Distribution | undefined> {
        const { Distribution } = await this.client.getDistribution({
            Id: id,
        }).promise();
        return Distribution;
    }
}
