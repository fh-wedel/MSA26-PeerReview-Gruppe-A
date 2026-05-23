import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';

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

    public static getPrivateDualStackSubnetId(): string {
        return cdk.Fn.importValue('Baseline:PrivateDualStackSubnetId');
    }

    public static getPrivateDualStackSubnetRouteTableId(): string {
        return cdk.Fn.importValue('Baseline:PrivateDualStackSubnetRouteTableId');
    }

    public static getECSClusterName(): string {
        return cdk.Fn.importValue('Baseline:ECSClusterName');
    }

    public static getCloudMapNamespaceId(): string {
        return cdk.Fn.importValue('Baseline:CloudMapNamespaceId');
    }

    public static getCloudMapNamespaceName(): string {
        return cdk.Fn.importValue('Baseline:CloudMapNamespaceName');
    }

    public static getCloudMapNamespaceArn(): string {
        return cdk.Fn.importValue('Baseline:CloudMapNamespaceArn');
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
    public static getECSClusterByAttributes(stack: cdk.Stack, vpc: ec2.IVpc): ecs.ICluster {
        return ecs.Cluster.fromClusterAttributes(stack, 'EcsCluster', {
            clusterName: this.getECSClusterName(),
            vpc: vpc,
        });
    }

    public static getIPv6SubnetByAttributes(stack: cdk.Stack, vpc: ec2.IVpc): ec2.ISubnet {
        return ec2.Subnet.fromSubnetAttributes(stack, 'IPv6Subnet', {
            subnetId: this.getPrivateIPV6SubnetId(),
            availabilityZone: this.getAvailabilityZone(),
        });
    }

    public static getDualStackSubnetByAttributes(stack: cdk.Stack, vpc: ec2.IVpc): ec2.ISubnet {
        return ec2.Subnet.fromSubnetAttributes(stack, 'DualStackSubnet', {
            subnetId: this.getPrivateDualStackSubnetId(),
            availabilityZone: this.getAvailabilityZone(),
        });
    }

    public static getPublicIPv4SubnetByAttributes(stack: cdk.Stack, vpc: ec2.IVpc): ec2.ISubnet {
        return ec2.Subnet.fromSubnetAttributes(stack, 'PublicIPv4Subnet', {
            subnetId: this.getPublicIPV4SubnetId(),
            availabilityZone: this.getAvailabilityZone(),
        });
    }

    public static getCloudMapNamespace(stack: cdk.Stack): servicediscovery.INamespace {
        return servicediscovery.PrivateDnsNamespace.fromPrivateDnsNamespaceAttributes(stack, 'CloudMapNamespace', {
            namespaceId: this.getCloudMapNamespaceId(),
            namespaceName: this.getCloudMapNamespaceName(),
            namespaceArn: this.getCloudMapNamespaceArn(),
        });
    }

    /**
     * Returns the regional domain name (hostname only) of the API Gateway for the given API name.
     * This is the value exported by ApiStack as `<apiName>:ApiDomainName`.
     * Used by CloudFront as the origin domain.
     */
    public static getApiDomainName(apiName: string): string {
        return cdk.Fn.importValue(`${apiName}:ApiDomainName`);
    }

    /**
     * Returns the deployment stage name of the API Gateway for the given API name.
     * This is the value exported by ApiStack as `<apiName>:ApiStageName`.
     * Used by CloudFront as the origin path prefix (e.g. '/prod').
     */
    public static getApiStageName(apiName: string): string {
        return cdk.Fn.importValue(`${apiName}:ApiStageName`);
    }
}