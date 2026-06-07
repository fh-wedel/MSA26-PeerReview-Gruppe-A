import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { ImportedRessources } from '../../infraLibrary/lib/importedRessources';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';

export interface CloudMapProps extends cdk.StackProps {
    namespaceName: string;
    serviceConnectNamespaceName: string;
}

export class CloudMapStack extends cdk.Stack {
    constructor(scope: Construct, id: string, props: CloudMapProps) {
        super(scope, id, props);

        const vpc = ImportedRessources.getVpcByAttributes(this);

        // External-facing namespace — used by Lambda proxies for AAAA-record resolution
        const namespace = new servicediscovery.PrivateDnsNamespace(this, 'CloudMapNamespace', {
            name: props.namespaceName,
            vpc: vpc,
        });

        new cdk.CfnOutput(this, 'CloudMapNamespaceId', {
            value: namespace.namespaceId,
            description: 'Id of the Cloud Map namespace',
            exportName: 'Baseline:CloudMapNamespaceId',
        });

        new cdk.CfnOutput(this, 'CloudMapNamespaceName', {
            value: namespace.namespaceName,
            description: 'Name of the Cloud Map namespace',
            exportName: 'Baseline:CloudMapNamespaceName',
        });

        new cdk.CfnOutput(this, 'CloudMapNamespaceArn', {
            value: namespace.namespaceArn,
            description: 'ARN of the Cloud Map namespace',
            exportName: 'Baseline:CloudMapNamespaceArn',
        });

        // Internal Service Connect namespace — used exclusively by ECS Service Connect
        // to avoid name collisions with the AAAA-record entries above.
        const scNamespace = new servicediscovery.PrivateDnsNamespace(this, 'ServiceConnectNamespace', {
            name: props.serviceConnectNamespaceName,
            vpc: vpc,
        });

        new cdk.CfnOutput(this, 'ServiceConnectNamespaceId', {
            value: scNamespace.namespaceId,
            description: 'Id of the ECS Service Connect Cloud Map namespace',
            exportName: 'Baseline:ServiceConnectNamespaceId',
        });

        new cdk.CfnOutput(this, 'ServiceConnectNamespaceName', {
            value: scNamespace.namespaceName,
            description: 'Name of the ECS Service Connect Cloud Map namespace',
            exportName: 'Baseline:ServiceConnectNamespaceName',
        });

        new cdk.CfnOutput(this, 'ServiceConnectNamespaceArn', {
            value: scNamespace.namespaceArn,
            description: 'ARN of the ECS Service Connect Cloud Map namespace',
            exportName: 'Baseline:ServiceConnectNamespaceArn',
        });
    }
}