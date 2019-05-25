import { Handler, Resource } from '../../interfaces';
import { CloudFrontOriginAccessIdentity } from '../../models';
import { Payload } from './types';
import { CloudFront } from "aws-sdk";

const resource = ({ identity }: CloudFrontOriginAccessIdentity, exists: boolean = false): Resource<CloudFrontOriginAccessIdentity> => ({
    type: 'CloudFront Origin Access Identity',
    exists,
    payload: {
        identity
    },
});

const generateComment = (projectName: string) => {
    return `luna - CloudFront Origin Access Identity for (${projectName})`
}

const fetchResource = async ({ identity }: CloudFrontOriginAccessIdentity, client: CloudFront = new CloudFront()): Promise<Resource<CloudFrontOriginAccessIdentity>> => {
    const { CloudFrontOriginAccessIdentityList: { Items = [] } = {} } = await client.listCloudFrontOriginAccessIdentities().promise();            
    const { Id = null } = Items.find((summary: CloudFront.CloudFrontOriginAccessIdentitySummary) => summary.Comment === identity.comment) || {};
    return (Id) ? resource({ identity: { ...identity, id: Id } }, true) : resource({ identity }, false);
}

const createResource = async ({ payload: { identity }}: Resource<CloudFrontOriginAccessIdentity>, client: CloudFront = new CloudFront()): Promise<Resource<CloudFrontOriginAccessIdentity>> => {
    const { CloudFrontOriginAccessIdentity: { Id = undefined } = {}} = await client.createCloudFrontOriginAccessIdentity({
        CloudFrontOriginAccessIdentityConfig: {
            CallerReference: Date.now().toString(),
            Comment: identity.comment
        }
    }).promise();
    return resource({ identity: { ...identity, id: Id } }, true);
}

const deleteResource = async ({ payload: { identity }}: Resource<CloudFrontOriginAccessIdentity>, client: CloudFront = new CloudFront()) => {
    if (identity.id) {
        const { ETag = null } = await client.getCloudFrontOriginAccessIdentity({ Id: identity.id }).promise();
        await client.deleteCloudFrontOriginAccessIdentity({ Id: identity.id, IfMatch: ETag } as any).promise();
    }
    return resource({ identity }, false);
}

export const cloudFrontOriginAccessIdentityHandler: Handler<CloudFrontOriginAccessIdentity> = {
    fetch: async (payload: Payload) => {
        const comment = generateComment(payload.projectName);
        const identity = { comment };
        return await fetchResource({ identity });
    },
    create: async (resource: Resource<CloudFrontOriginAccessIdentity>) => {
        return await createResource(resource);
    },
    delete: async (resource: Resource<CloudFrontOriginAccessIdentity>) => {
        return await deleteResource(resource);
    },
    format: ({ payload: { identity }}: Resource<CloudFrontOriginAccessIdentity>) => {
        return `\n\tId: ${identity.id}\n\tComment: ${identity.comment}`;
    }
};
