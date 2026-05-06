import * as cdk from 'aws-cdk-lib/core';
import { Template, Match } from 'aws-cdk-lib/assertions';
import * as Baseline from '../lib/network-stack';
import { AWSConstants } from '../lib/constants';

test('VPC Created', () => {
  const app = new cdk.App();
  // WHEN
  const stack = new Baseline.NetworkStack(app, 'TestNetworkStack');
  // THEN
  const template = Template.fromStack(stack);

  const vpcId = template.getResourceId('AWS::EC2::VPC');
  const publicIPV4SubnetId = template.getResourceId('AWS::EC2::Subnet', {
    Properties: {
      VpcId: { Ref: vpcId },
      AvailabilityZone: AWSConstants.AVAILABILITY_ZONE,
      CidrBlock: '10.96.0.0/28',
      MapPublicIpOnLaunch: false
    }
  });
  const privateIPV6SubnetId = template.getResourceId('AWS::EC2::Subnet', {
    Properties: {
      VpcId: { Ref: vpcId },
      AvailabilityZone: AWSConstants.AVAILABILITY_ZONE,
      AssignIpv6AddressOnCreation: true,
      Ipv6Native: true,
      MapPublicIpOnLaunch: false
    }
  });

  template.resourceCountIs('AWS::EC2::VPC', 1);
  template.resourceCountIs('AWS::EC2::RouteTable', 2);
  template.resourceCountIs('AWS::EC2::InternetGateway', 1);
  template.resourceCountIs('AWS::EC2::EgressOnlyInternetGateway', 1);
  template.resourceCountIs('AWS::EC2::Subnet', 2);
  template.resourceCountIs('AWS::EC2::NatGateway', 0);
  template.resourceCountIs('AWS::EC2::EgressOnlyInternetGateway', 1);


  template.hasResourceProperties('AWS::EC2::VPC', {
    EnableDnsHostnames: true,
    EnableDnsSupport: true,
    CidrBlock: AWSConstants.VPC_CIDR,
  });

  template.hasResourceProperties('AWS::EC2::VPCCidrBlock', {
    AmazonProvidedIpv6CidrBlock: true,
    VpcId: { Ref: vpcId },
  });

  template.hasResourceProperties('AWS::EC2::Subnet', Match.objectLike({
    AvailabilityZone: AWSConstants.AVAILABILITY_ZONE,
    AssignIpv6AddressOnCreation: false,
    CidrBlock: '10.96.0.0/28',
    Ipv6CidrBlock: Match.anyValue(),
    VpcId: { Ref: vpcId },
  }));

  template.hasResourceProperties('AWS::EC2::Subnet', Match.objectLike({
    AssignIpv6AddressOnCreation: true,
    Ipv6Native: true,
    Ipv6CidrBlock: Match.anyValue(),
    VpcId: { Ref: vpcId },
  }));

  template.hasResourceProperties('AWS::EC2::Route', Match.objectLike({
    DestinationIpv6CidrBlock: '::/0',
    GatewayId: { Ref: Match.anyValue() },
  }));

  template.hasResourceProperties('AWS::EC2::Route', Match.objectLike({
    DestinationIpv6CidrBlock: '::/0',
    EgressOnlyInternetGatewayId: { Ref: Match.anyValue() },
  }));

  template.hasOutput('VPCId', {
    Value: { Ref: vpcId },
    Export: {
      Name: 'Baseline:VpcId',
    },
  });

  template.hasOutput('PublicIPV4SubnetId', {
    Value: { Ref: publicIPV4SubnetId },
    Export: {
      Name: 'Baseline:PublicIPV4SubnetId',
    },
  });

  template.hasOutput('PrivateIPV6SubnetId', {
    Value: { Ref: privateIPV6SubnetId },
    Export: {
      Name: 'Baseline:PrivateIPV6SubnetId',
    },
  });

  template.hasOutput('PublicSubnetRouteTableId', {
    Value: { Ref: Match.anyValue() },
    Export: {
      Name: 'Baseline:PublicIPV4SubnetRouteTableId',
    },
  });

  template.hasOutput('PrivateSubnetRouteTableId', {
    Value: { Ref: Match.anyValue() },
    Export: {
      Name: 'Baseline:PrivateIPV6SubnetRouteTableId',
    },
  });
});
