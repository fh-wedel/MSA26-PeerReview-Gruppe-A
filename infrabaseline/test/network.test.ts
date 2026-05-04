import * as cdk from 'aws-cdk-lib/core';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as Baseline from '../lib/network-stack';
import { AWSConstants } from '../lib/constants';
import { ref } from 'process';

test('VPC Created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Baseline.NetworkStack(app, 'TestNetworkStack');
  // THEN
  const template = Template.fromStack(stack);

  const vpcId = template.getResourceId('AWS::EC2::VPC');
  const publicSubnetId = template.getResourceId('AWS::EC2::Subnet', {
    Properties: {
      VpcId: { Ref: vpcId },
    }
  });
  const publicSubnetRouteTableId = template.getResourceId('AWS::EC2::RouteTable', {
    Properties: {
      VpcId: { Ref: vpcId },
    }
  });



  template.resourceCountIs('AWS::EC2::VPC', 1);
  template.resourceCountIs('AWS::EC2::NatGateway', 0);
  template.resourceCountIs('AWS::EC2::InternetGateway', 1);
  template.resourceCountIs('AWS::EC2::Subnet', 1);


  template.hasResourceProperties('AWS::EC2::VPC', {
    EnableDnsHostnames: true,
    EnableDnsSupport: true,
    CidrBlock: AWSConstants.VPC_CIDR,
  });

  template.hasResourceProperties('AWS::EC2::Subnet', {
    AvailabilityZone: AWSConstants.AVAILABILITY_ZONE,
    CidrBlock: AWSConstants.VPC_CIDR,
    MapPublicIpOnLaunch: true,
    VpcId: { Ref: vpcId },
  });

  template.hasResourceProperties('AWS::EC2::InternetGateway', {
  });

  template.hasOutput('VPCId', {
    Value: { Ref: vpcId },
    Export: {
      Name: 'Baseline:VpcId',
    },
  });

  template.hasOutput('PublicSubnetId', {
    Value: { Ref: publicSubnetId },
    Export: {
      Name: 'Baseline:PublicSubnetId',
    },
  });

  template.hasOutput('PublicSubnetRouteTableId', {
    Value: { Ref: publicSubnetRouteTableId },
    Export: {
      Name: 'Baseline:PublicSubnetRouteTableId',
    },
  });
});
