import * as cdk from 'aws-cdk-lib/core';
import { Match, Template } from 'aws-cdk-lib/assertions';
import { CloudMapStack } from '../lib/cloudmap';

test('Cloud Map namespace is created with exports', () => {
    const app = new cdk.App();
    const stack = new CloudMapStack(app, 'TestCloudMapStack', {
        namespaceName: 'internal.services',
        serviceConnectNamespaceName: 'sc.internal',
    });

    const template = Template.fromStack(stack);

    // Both namespaces should be created
    template.resourceCountIs('AWS::ServiceDiscovery::PrivateDnsNamespace', 2);

    template.hasResourceProperties('AWS::ServiceDiscovery::PrivateDnsNamespace', {
        Name: 'internal.services',
        Vpc: {
            'Fn::ImportValue': 'Baseline:VpcId',
        },
    });

    template.hasResourceProperties('AWS::ServiceDiscovery::PrivateDnsNamespace', {
        Name: 'sc.internal',
        Vpc: {
            'Fn::ImportValue': 'Baseline:VpcId',
        },
    });

    // External namespace outputs
    template.hasOutput('CloudMapNamespaceId', {
        Value: Match.anyValue(),
        Export: {
            Name: 'Baseline:CloudMapNamespaceId',
        },
    });

    template.hasOutput('CloudMapNamespaceName', {
        Value: Match.anyValue(),
        Export: {
            Name: 'Baseline:CloudMapNamespaceName',
        },
    });

    template.hasOutput('CloudMapNamespaceArn', {
        Value: Match.anyValue(),
        Export: {
            Name: 'Baseline:CloudMapNamespaceArn',
        },
    });

    // Service Connect namespace outputs
    template.hasOutput('ServiceConnectNamespaceId', {
        Value: Match.anyValue(),
        Export: {
            Name: 'Baseline:ServiceConnectNamespaceId',
        },
    });

    template.hasOutput('ServiceConnectNamespaceName', {
        Value: Match.anyValue(),
        Export: {
            Name: 'Baseline:ServiceConnectNamespaceName',
        },
    });

    template.hasOutput('ServiceConnectNamespaceArn', {
        Value: Match.anyValue(),
        Export: {
            Name: 'Baseline:ServiceConnectNamespaceArn',
        },
    });
});
