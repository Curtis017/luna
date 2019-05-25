import { CloudFront } from "aws-sdk";

export type Options = {
    dryRun: boolean;
}

export type Arguments = {
    projectName: string;
    dist: string;
}

export type BasePayload = Options & Arguments;

export type S3Bucket = {
    bucket: {
        name: string;
        policy?: string;
    }
}

export type CloudFrontOriginAccessIdentity = {
    identity: {
        id?: string;
        comment: string;
    }
}

export type S3OriginConfig = {
    originAccessIdentity: string;
}

export type Origin = {
    id: string;
    domainName: string;
    s3OriginConfig: S3OriginConfig;
};

export type CloudFrontDistribution = {
    distribution: {
        id?: string;
        comment: string;
        domainName?: string;
        origin?: Origin;
        configuration?: CloudFront.Types.DistributionConfig;
    }
}
