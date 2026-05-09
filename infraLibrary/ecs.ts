import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as flyod from 'cdk-iam-floyd';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';
import pino from 'pino';
import { AWSConstants } from '../infraBaseline/lib/constants.js';
import { ImportedRessources } from './importedRessources';

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
});

export class EcsInfra {
    public static grantDefaultTaskRolePermissions(taskDefinition: ecs.FargateTaskDefinition) {
        const ecrBaseStatement = new flyod.Statement.Ecr()
            .allow()
            .toGetAuthorizationToken()
            .onAllResources();

        const usedEcrImage = taskDefinition.defaultContainer?.imageName;
        let repositoryName = '*';

        if (!usedEcrImage) {
            logger.warn('No image specified for the default container. Granting ECR permissions to all resources.');
        } else {
            const firstSlashIndex = usedEcrImage.indexOf('/');
            if (firstSlashIndex !== -1) {
                const pathParts = usedEcrImage.substring(firstSlashIndex + 1);
                const tagIndex = pathParts.lastIndexOf(':');
                repositoryName = tagIndex !== -1 ? pathParts.substring(0, tagIndex) : pathParts;
            } else {
                const tagIndex = usedEcrImage.lastIndexOf(':');
                repositoryName = tagIndex !== -1 ? usedEcrImage.substring(0, tagIndex) : usedEcrImage;
            }
        }

        const ecrRepoStatement = new flyod.Statement.Ecr()
            .allow()
            .toBatchCheckLayerAvailability()
            .toGetDownloadUrlForLayer()
            .toBatchGetImage()
            .onRepository(repositoryName);

        taskDefinition.addToExecutionRolePolicy(ecrBaseStatement);
        taskDefinition.addToExecutionRolePolicy(ecrRepoStatement);
    }

    public static getIpV4Subnet(scope: Construct): ec2.ISubnet {
        const subnetId = ImportedRessources.getPublicIPV4SubnetId();
        const routeTableId = ImportedRessources.getPublicIPV4SubnetRouteTableId();

        return ec2.Subnet.fromSubnetAttributes(scope, 'BaselinePublicSubnet', {
            subnetId: subnetId,
            availabilityZone: ImportedRessources.getAvailabilityZone(),
            routeTableId: routeTableId,
        });
    }

    public static getIpV6Subnet(scope: Construct): ec2.ISubnet {
        const subnetId = ImportedRessources.getPrivateIPV6SubnetId();
        const routeTableId = ImportedRessources.getPrivateIPV6SubnetRouteTableId();

        return ec2.Subnet.fromSubnetAttributes(scope, 'BaselinePrivateSubnet', {
            subnetId: subnetId,
            availabilityZone: ImportedRessources.getAvailabilityZone(),
            routeTableId: routeTableId,
        });
    }

    public static getDefaultImageNameIpv4(serviceName: string, imageVersion: string): string {
        return `${AWSConstants.ECR_REPOSITORY_PREFIX}fh-wedel/${serviceName}:${imageVersion}`;
    }

    public static getDefaultImageNameIpv6(serviceName: string, imageVersion: string): string {
        return `${AWSConstants.AWS_ACCOUNT_ID}.dkr-ecr.${AWSConstants.AWS_REGION}.on.aws/fh-wedel/${serviceName}:${imageVersion}`;
    }
}