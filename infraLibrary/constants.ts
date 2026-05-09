const awsAccountId = process.env.AWS_ACCOUNT_ID ?? '720830544039';
const awsRegion = process.env.AWS_REGION ?? 'eu-north-1';
const ecrRepositoryPrefix =
    process.env.ECR_REPOSITORY_PREFIX ??
    `${awsAccountId}.dkr.ecr.${awsRegion}.amazonaws.com/`;

export class AWSConstants {
    static readonly AWS_ACCOUNT_ID = awsAccountId;
    static readonly AWS_REGION = awsRegion;
    static readonly ECR_REPOSITORY_PREFIX = ecrRepositoryPrefix;
}
