import * as cdk from 'aws-cdk-lib/core';
import { Match, Template } from 'aws-cdk-lib/assertions';
import * as Baseline from '../lib/network-stack';
import { AWSConstants } from '../lib/constants';

test('VPC and subnets are created', () => {
  const app = new cdk.App();
  const stack = new Baseline.NetworkStack(app, 'TestNetworkStack');
  const template = Template.fromStack(stack);

  const vpcId = template.getResourceId('AWS::EC2::VPC');
  const subnetResources = template.findResources('AWS::EC2::Subnet') as Record<string, any>;
  const subnetProps = Object.values(subnetResources).map(
    (resource) => resource.Properties ?? {}
  );

  const publicSubnet = subnetProps.find(
    (props) => props.MapPublicIpOnLaunch === true && props.AssignIpv6AddressOnCreation === false
  );
  const ipv6NativeSubnet = subnetProps.find(
    (props) => props.Ipv6Native === true
  );
  const dualStackSubnet = subnetProps.find(
    (props) => props.AssignIpv6AddressOnCreation === true
      && props.Ipv6Native !== true
      && props.CidrBlock
  );

  template.resourceCountIs('AWS::EC2::VPC', 1);
  template.resourceCountIs('AWS::EC2::RouteTable', 3);
  template.resourceCountIs('AWS::EC2::InternetGateway', 1);
  template.resourceCountIs('AWS::EC2::EgressOnlyInternetGateway', 1);
  template.resourceCountIs('AWS::EC2::Subnet', 3);
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

  expect(publicSubnet).toEqual(
    expect.objectContaining({
      AvailabilityZone: AWSConstants.AVAILABILITY_ZONE,
      AssignIpv6AddressOnCreation: false,
      MapPublicIpOnLaunch: true,
      Ipv6CidrBlock: expect.anything(),
      VpcId: { Ref: vpcId },
    })
  );

  expect(ipv6NativeSubnet).toEqual(
    expect.objectContaining({
      AvailabilityZone: AWSConstants.AVAILABILITY_ZONE,
      AssignIpv6AddressOnCreation: true,
      Ipv6Native: true,
      MapPublicIpOnLaunch: false,
      Ipv6CidrBlock: expect.anything(),
      VpcId: { Ref: vpcId },
    })
  );

  expect(dualStackSubnet).toEqual(
    expect.objectContaining({
      AvailabilityZone: AWSConstants.AVAILABILITY_ZONE,
      AssignIpv6AddressOnCreation: true,
      MapPublicIpOnLaunch: false,
      Ipv6CidrBlock: expect.anything(),
      VpcId: { Ref: vpcId },
    })
  );

  template.hasResourceProperties(
    'AWS::EC2::Route',
    Match.objectLike({
      DestinationIpv6CidrBlock: '::/0',
      GatewayId: { Ref: Match.anyValue() },
    })
  );

  template.hasResourceProperties(
    'AWS::EC2::Route',
    Match.objectLike({
      DestinationIpv6CidrBlock: '::/0',
      EgressOnlyInternetGatewayId: { Ref: Match.anyValue() },
    })
  );

  template.hasOutput('VPCId', {
    Value: { Ref: vpcId },
    Export: {
      Name: 'Baseline:VpcId',
    },
  });

  template.hasOutput('PublicIPV4SubnetId', {
    Value: Match.anyValue(),
    Export: {
      Name: 'Baseline:PublicIPV4SubnetId',
    },
  });

  template.hasOutput('PrivateIPV6SubnetId', {
    Value: Match.anyValue(),
    Export: {
      Name: 'Baseline:PrivateIPV6SubnetId',
    },
  });

  template.hasOutput('PrivateDualStackSubnetId', {
    Value: Match.anyValue(),
    Export: {
      Name: 'Baseline:PrivateDualStackSubnetId',
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

  template.hasOutput('PrivateDualStackSubnetRouteTableId', {
    Value: { Ref: Match.anyValue() },
    Export: {
      Name: 'Baseline:PrivateDualStackSubnetRouteTableId',
    },
  });
});
