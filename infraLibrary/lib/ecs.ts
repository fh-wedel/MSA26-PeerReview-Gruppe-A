import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as cdk from 'aws-cdk-lib/core';
import * as flyod from 'cdk-iam-floyd';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as appscaling from 'aws-cdk-lib/aws-applicationautoscaling';
import { Construct } from 'constructs';
import pino from 'pino';
import { AWSConstants } from '../../infrabaseline/lib/constants';
import { ImportedRessources } from '../lib/importedRessources';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';

const logger = pino({
    level: process.env.LOG_LEVEL || 'info',
});

export class EcsInfra {
    public static getDefaultRuntimePlatform(): ecs.RuntimePlatform {
        return {
            cpuArchitecture: ecs.CpuArchitecture.ARM64,
            operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
        };
    }

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

    public static createServiceDiscoveryAAAARecord(scope: Construct, serviceName: string, namespace: servicediscovery.INamespace): servicediscovery.CfnService {
        const sdService = new servicediscovery.CfnService(scope, 'SdService', {
            name: serviceName,
            namespaceId: namespace.namespaceId,
            dnsConfig: {
                dnsRecords: [
                    {
                        type: 'AAAA',
                        ttl: 30,
                    },
                ],
                routingPolicy: 'MULTIVALUE',
            },
            healthCheckCustomConfig: {
                failureThreshold: 1,
            },
        });

        return sdService;
    }

    public static springBootHealthCheckCommand(containerPort: number, startPeriod: cdk.Duration = cdk.Duration.seconds(60)): ecs.HealthCheck {
        return {
            command: ['CMD-SHELL', `wget -qO- http://localhost:${containerPort}/actuator/health || exit 1`],
            interval: cdk.Duration.seconds(15),
            timeout: cdk.Duration.seconds(5),
            retries: 5,
            startPeriod: startPeriod,
        };
    }

    public static addAutoScalingToService(service: ecs.FargateService, minTaskCount: number, maxTaskCount: number, cpuTargetUtilizationPercent: number) {
        const scalableTarget = service.autoScaleTaskCount({
            minCapacity: minTaskCount,
            maxCapacity: maxTaskCount,
        });

        scalableTarget.scaleOnCpuUtilization('CpuScaling', {
            targetUtilizationPercent: cpuTargetUtilizationPercent,
        });

        const timeZone = cdk.TimeZone.EUROPE_BERLIN

        // Weekdays: 0:00 - 1:00 && 15:00 - 0:00
        scalableTarget.scaleOnSchedule('ScaleDownWeekdaysMorning', {
            schedule: appscaling.Schedule.cron({ minute: '0', hour: '1', weekDay: 'MON-FRI' }),
            minCapacity: 0,
            maxCapacity: 0,
            timeZone: timeZone,
        });

        scalableTarget.scaleOnSchedule('ScaleUpWeekdaysAfternoon', {
            schedule: appscaling.Schedule.cron({ minute: '0', hour: '15', weekDay: 'MON-FRI' }),
            minCapacity: minTaskCount,
            maxCapacity: maxTaskCount,
            timeZone: timeZone,
        });

        // Weekends: 0:00 - 2:00 && 10:00 - 0:00
        scalableTarget.scaleOnSchedule('ScaleDownWeekendMorning', {
            schedule: appscaling.Schedule.cron({ minute: '0', hour: '2', weekDay: 'SAT,SUN' }),
            minCapacity: 0,
            maxCapacity: 0,
            timeZone: timeZone,
        });

        scalableTarget.scaleOnSchedule('ScaleUpWeekendMorning', {
            schedule: appscaling.Schedule.cron({ minute: '0', hour: '10', weekDay: 'SAT,SUN' }),
            minCapacity: minTaskCount,
            maxCapacity: maxTaskCount,
            timeZone: timeZone,
        });
    }
}