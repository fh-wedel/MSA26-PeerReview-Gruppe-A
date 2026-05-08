import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as flyod from 'cdk-iam-floyd';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import pino from 'pino';
import { AWSConstants } from '../infraBaseline/lib/constants';
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
        if (!usedEcrImage) {
            logger.warn('No image specified for the default container. Granting ECR permissions to all resources.');
        }
        const ecrRepoStatement = new flyod.Statement.Ecr()
            .allow()
            .toBatchCheckLayerAvailability()
            .toGetDownloadUrlForLayer()
            .toBatchGetImage()
            .onRepository(usedEcrImage ?? '*');

        taskDefinition.addToTaskRolePolicy(ecrBaseStatement);
        taskDefinition.addToTaskRolePolicy(ecrRepoStatement);
    }

    public static getIpV4Subnet(): ec2.ISubnet {
        const subnetId = ImportedRessources.getPublicIPV4SubnetId();
        const routeTableId = ImportedRessources.getPublicIPV4SubnetRouteTableId();

        return ec2.Subnet.fromSubnetAttributes(new cdk.Stack(), 'BaselinePublicSubnet', {
            subnetId: subnetId,
            availabilityZone: ImportedRessources.getAvailabilityZone(),
            routeTableId: routeTableId,
        });
    }

    public static getIpV6Subnet(): ec2.ISubnet {
        const subnetId = ImportedRessources.getPrivateIPV6SubnetId();
        const routeTableId = ImportedRessources.getPrivateIPV6SubnetRouteTableId();

        return ec2.Subnet.fromSubnetAttributes(new cdk.Stack(), 'BaselinePrivateSubnet', {
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