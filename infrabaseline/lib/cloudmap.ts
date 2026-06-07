import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import { ImportedRessources } from '../../infraLibrary/lib/importedRessources';
import * as servicediscovery from 'aws-cdk-lib/aws-servicediscovery';

export interface CloudMapProps extends cdk.StackProps {
    namespaceName: string;
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
    }
}