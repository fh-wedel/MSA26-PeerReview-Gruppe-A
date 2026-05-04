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
      subnetConfiguration: [
        {
          name: 'PublicSubnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
      ],
    });

    new cdk.CfnOutput(this, 'VPCId', {
      value: vpc.vpcId,
      description: 'Id of the VPC',
      exportName: 'Baseline:VpcId',
    });
    new cdk.CfnOutput(this, 'PublicSubnetId', {
      value: vpc.publicSubnets[0].subnetId,
      description: 'Id of the public subnet',
      exportName: 'Baseline:PublicSubnetId',
    });
    new cdk.CfnOutput(this, 'PublicSubnetRouteTableId', {
      value: vpc.publicSubnets[0].routeTable.routeTableId,
      description: 'Id of the public subnet route table',
      exportName: 'Baseline:PublicSubnetRouteTableId',
    });
  }
}