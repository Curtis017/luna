import { BasePayload, S3Bucket, CloudFrontOriginAccessIdentity } from "../../models";

export type Payload = BasePayload & S3Bucket & CloudFrontOriginAccessIdentity;
