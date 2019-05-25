import { Handler, Resource } from '../../interfaces';
import { CloudFrontDistribution, Origin } from '../../models';
import { Payload } from './types';
import { CloudFront } from "aws-sdk";

const resource = ({ distribution }: CloudFrontDistribution, exists: boolean = false): Resource<CloudFrontDistribution> => ({
    type: 'CloudFront Distribution',
    exists,
    payload: {
        distribution
    },
});

const generateComment = (projectName: string) => {
    return `luna - CloudFront Distribution for (${projectName})`
}

const generateOrigin = (s3BucketName: string, identityId?: string): Origin | undefined => {
    if (!identityId) {
        return undefined;
    }
    return {
        id: `S3-${s3BucketName}`,
        domainName: `${s3BucketName}.s3.amazonaws.com`,
        s3OriginConfig: {
            originAccessIdentity: `origin-access-identity/cloudfront/${identityId}`
        }
    }
}

const generateConfiguration = (comment: string, origin?: Origin): CloudFront.Types.DistributionConfig | undefined => {
    if (!origin) {
        return undefined;
    }
    return {
        CallerReference: Date.now().toString(),
        IsIPV6Enabled: true,
        Comment: comment,
        Enabled: true,
        Origins: {
            Quantity: 1,
            Items: [{
                Id: origin.id,
                DomainName: origin.domainName,
                S3OriginConfig: {
                    OriginAccessIdentity: origin.s3OriginConfig.originAccessIdentity
                }
            }]
        },
        DefaultRootObject: 'index.html',
        PriceClass: 'PriceClass_100',
        DefaultCacheBehavior: {
            TargetOriginId: origin.id,
            ViewerProtocolPolicy: 'redirect-to-https',
            TrustedSigners: {
                Enabled: false,
                Quantity: 0,
            },
            ForwardedValues: {
                Headers: {
                    Quantity: 0
                },
                Cookies: {
                    Forward: 'none'
                }, 
                QueryStringCacheKeys: {
                    Quantity: 0
                }, 
                QueryString: false
            },
            MaxTTL: 31536000,
            SmoothStreaming: false,
            DefaultTTL: 86400,
            AllowedMethods: {
                Items: [
                    'HEAD',
                    'GET'
                ],
                CachedMethods: {
                    Items: [
                        'HEAD',
                        'GET'
                    ],
                    Quantity: 2
                },
                Quantity: 2
            },
            MinTTL: 0,
            Compress: true
        },
        ViewerCertificate: {
            CloudFrontDefaultCertificate: true, 
            MinimumProtocolVersion: 'TLSv1', 
            CertificateSource: 'cloudfront'
        },
        CustomErrorResponses: {
            Items: [
                {
                    ErrorCode: 403, 
                    ResponsePagePath: '/index.html', 
                    ResponseCode: '200', 
                    ErrorCachingMinTTL: 300
                }, 
                {
                    ErrorCode: 404, 
                    ResponsePagePath: '/index.html', 
                    ResponseCode: '200', 
                    ErrorCachingMinTTL: 300
                }
            ],
            Quantity: 2
        },
        HttpVersion: 'http2',
    };
}

const disableDistribution = async ({ distribution }: CloudFrontDistribution, client: CloudFront): Promise<CloudFront.Types.UpdateDistributionResult> => {
    const { ETag = undefined, Distribution = undefined } = await client.getDistribution({ Id: distribution.id } as CloudFront.Types.GetDistributionRequest).promise();
    if (Distribution && Distribution.DistributionConfig && Distribution.DistributionConfig.Enabled) {
        const { ETag: updatedETag } = await client.updateDistribution({ Id: distribution.id, DistributionConfig: { ...Distribution.DistributionConfig, Enabled: false }, IfMatch: ETag } as CloudFront.Types.UpdateDistributionRequest).promise();
        return { Distribution, ETag: updatedETag };
    }
    return { Distribution, ETag }
}

const fetchResource = async ({ distribution }: CloudFrontDistribution, client: CloudFront = new CloudFront()): Promise<Resource<CloudFrontDistribution>> => {
    const { DistributionList: { Items = [] } = {} } = await client.listDistributions().promise();
    const { Id = undefined, DomainName = undefined, Origins = undefined } = Items.find((summary: CloudFront.DistributionSummary) => summary.Comment === distribution.comment) || {};    
    let origin = distribution.origin;
    if (Origins && Origins.Quantity > 0) {
        const { Items: [ { Id: id, DomainName: domainName, S3OriginConfig: { OriginAccessIdentity: originAccessIdentity = '' } = {} } ] } = Origins;
        origin = { id, domainName, s3OriginConfig: { originAccessIdentity } };
    }
    return resource({ distribution: { ...distribution, id: Id, domainName: DomainName, origin } }, (Id) ? true : false);
}

const createResource = async ({ payload: { distribution }}: Resource<CloudFrontDistribution>, client: CloudFront = new CloudFront()): Promise<Resource<CloudFrontDistribution>> => {
    if (!distribution.configuration) {
        throw Error('Origin Access Identity and S3Bucket must be created before CloudFront Distribution');
    }
    const { Distribution: { Id = undefined, DomainName = undefined } = {}} = await client.createDistribution({
        DistributionConfig: distribution.configuration
    }).promise();
    return resource({ distribution: { ...distribution, id: Id, domainName: DomainName } }, true);
}

const deleteResource = async ({ payload: { distribution }}: Resource<CloudFrontDistribution>, client: CloudFront = new CloudFront()) => {
    if (distribution.id) {
        const { ETag = null } = await disableDistribution({ distribution }, client);
        await client.waitFor('distributionDeployed', { Id: distribution.id } as CloudFront.GetDistributionRequest).promise();
        await client.deleteDistribution({ Id: distribution.id, IfMatch: ETag } as any).promise();
    }
    return resource({ distribution }, false);
}

export const cloudFrontDistributionHandler: Handler<CloudFrontDistribution> = {
    fetch: async (payload: Payload) => {
        const comment = generateComment(payload.projectName);
        const origin = generateOrigin(payload.bucket.name, (payload.identity) ? payload.identity.id : undefined);
        const configuration = generateConfiguration(comment, origin);
        const distribution = { comment, origin, configuration };
        return await fetchResource({ distribution });
    },
    create: async (resource: Resource<CloudFrontDistribution>) => {
        return await createResource(resource);
    },
    delete: async (resource: Resource<CloudFrontDistribution>) => {
        return await deleteResource(resource);
    },
    format: ({ payload: { distribution }}: Resource<CloudFrontDistribution>) => {
        return `\n\tId: ${distribution.id}\n\tComment: ${distribution.comment}\n\tOrigin: ${(distribution.origin) ? distribution.origin.domainName : undefined}\n\tDomain Name: ${distribution.domainName}`;
    }
};
