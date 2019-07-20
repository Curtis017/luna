import { CloudFront } from 'aws-sdk';

export class CloudFrontGateway {
    constructor(private readonly client: CloudFront = new CloudFront({ apiVersion: '2010-05-15' })) { }

    public async describeDistribution(id: string): Promise<CloudFront.Distribution> {
        const { Distribution } = await this.client.getDistribution({
            Id: id,
        }).promise();
        return Distribution;
    }
}
