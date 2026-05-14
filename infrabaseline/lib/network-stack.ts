import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { AWSConstants } from './constants';

export class NetworkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const vpc = new ec2.Vpc(this, 'VPC', {
      natGateways: 0,
      availabilityZones: [AWSConstants.AVAILABILITY_ZONE],
      createInternetGateway: true,
      ipAddresses: ec2.IpAddresses.cidr(AWSConstants.VPC_CIDR),
      ipProtocol: ec2.IpProtocol.DUAL_STACK,
      enableDnsHostnames: true,
      enableDnsSupport: true,
      subnetConfiguration: [
        {
          name: 'PublicSubnetIPV4',
          subnetType: ec2.SubnetType.PUBLIC,
          ipv6AssignAddressOnCreation: false,
          mapPublicIpOnLaunch: true,
          cidrMask: 24,
        },
        {
          name: 'PrivateSubnetIPV6WithEgress',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
          ipv6AssignAddressOnCreation: true,
        },
        {
          name: 'PrivateSubnetDualStackIsolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
          ipv6AssignAddressOnCreation: true,
          cidrMask: 24,
        }
      ],
    });

    // Use L1 Override to set ipv6Native to true for the private subnet. Otherwise ECS Fargate will not be able to launch tasks
    const cfnPrivateSubnet = vpc.privateSubnets[0].node.defaultChild as ec2.CfnSubnet;
    cfnPrivateSubnet.ipv6Native = true;
    cfnPrivateSubnet.cidrBlock = undefined;


    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'Id of the VPC',
      exportName: 'Baseline:VpcId',
    });
    new cdk.CfnOutput(this, 'PublicIPV4SubnetId', {
      value: vpc.publicSubnets[0].subnetId,
      description: 'Id of the public IPV4 subnet',
      exportName: 'Baseline:PublicIPV4SubnetId',
    });
    new cdk.CfnOutput(this, 'PrivateIPV6SubnetId', {
      value: vpc.privateSubnets[0].subnetId,
      description: 'Id of the private IPV6 subnet',
      exportName: 'Baseline:PrivateIPV6SubnetId',
    });
    new cdk.CfnOutput(this, 'PrivateDualStackSubnetId', {
      value: vpc.isolatedSubnets[0].subnetId,
      description: 'Id of the private dual stack subnet',
      exportName: 'Baseline:PrivateDualStackSubnetId',
    });
    new cdk.CfnOutput(this, 'PublicSubnetRouteTableId', {
      value: vpc.publicSubnets[0].routeTable.routeTableId,
      description: 'Id of the public subnet route table',
      exportName: 'Baseline:PublicIPV4SubnetRouteTableId',
    });
    new cdk.CfnOutput(this, 'PrivateSubnetRouteTableId', {
      value: vpc.privateSubnets[0].routeTable.routeTableId,
      description: 'Id of the private subnet route table',
      exportName: 'Baseline:PrivateIPV6SubnetRouteTableId',
    });
    new cdk.CfnOutput(this, 'PrivateDualStackSubnetRouteTableId', {
      value: vpc.isolatedSubnets[0].routeTable.routeTableId,
      description: 'Id of the private dual stack subnet route table',
      exportName: 'Baseline:PrivateDualStackSubnetRouteTableId',
    });
  }
}