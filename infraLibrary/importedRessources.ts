import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';

export class ImportedRessources {
    public static getVpcId(): string {
        return cdk.Fn.importValue('Baseline:VpcId');
    }

    public static getAvailabilityZone(): string {
        return cdk.Fn.importValue('Baseline:AvailabilityZone');
    }

    public static getPublicIPV4SubnetId(): string {
        return cdk.Fn.importValue('Baseline:PublicIPV4SubnetId');
    }

    public static getPublicIPV4SubnetRouteTableId(): string {
        return cdk.Fn.importValue('Baseline:PublicIPV4SubnetRouteTableId');
    }

    public static getPrivateIPV6SubnetId(): string {
        return cdk.Fn.importValue('Baseline:PrivateIPV6SubnetId');
    }
    
    public static getPrivateIPV6SubnetRouteTableId(): string {
        return cdk.Fn.importValue('Baseline:PrivateIPV6SubnetRouteTableId');
    }

    public static getECSClusterName(): string {
        return cdk.Fn.importValue('Baseline:ECSClusterName');
    }

    public static getVpcByAttributes(stack: cdk.Stack): ec2.IVpc {
        return cdk.aws_ec2.Vpc.fromVpcAttributes(stack, 'BaselineVPC', {
            vpcId: this.getVpcId(),
            availabilityZones: [this.getAvailabilityZone()],
            publicSubnetIds: [this.getPublicIPV4SubnetId()],
            publicSubnetRouteTableIds: [this.getPublicIPV4SubnetRouteTableId()],
            privateSubnetIds: [this.getPrivateIPV6SubnetId()],
            privateSubnetRouteTableIds: [this.getPrivateIPV6SubnetRouteTableId()],
        });
    }
    public static getECSClusterByAttributes(stack: cdk.Stack): ecs.ICluster {
        return ecs.Cluster.fromClusterAttributes(stack, 'EcsCluster', {
            clusterName: this.getECSClusterName(),
            vpc: this.getVpcByAttributes(stack),
        });
    }

}