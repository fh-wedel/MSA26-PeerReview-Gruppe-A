import * as cdk from 'aws-cdk-lib';
import { ImportedRessources } from '../lib/importedRessources';

test('ImportedRessources uses baseline export names', () => {
    const app = new cdk.App();
    const stack = new cdk.Stack(app, 'TestStack');

    expect(stack.resolve(ImportedRessources.getVpcId())).toEqual({
        'Fn::ImportValue': 'Baseline:VpcId',
    });
    expect(stack.resolve(ImportedRessources.getAvailabilityZone())).toEqual({
        'Fn::ImportValue': 'Baseline:AvailabilityZone',
    });
    expect(stack.resolve(ImportedRessources.getPublicIPV4SubnetId())).toEqual({
        'Fn::ImportValue': 'Baseline:PublicIPV4SubnetId',
    });
    expect(stack.resolve(ImportedRessources.getPrivateIPV6SubnetId())).toEqual({
        'Fn::ImportValue': 'Baseline:PrivateIPV6SubnetId',
    });
    expect(stack.resolve(ImportedRessources.getPrivateDualStackSubnetId())).toEqual({
        'Fn::ImportValue': 'Baseline:PrivateDualStackSubnetId',
    });
    expect(stack.resolve(ImportedRessources.getECSClusterName())).toEqual({
        'Fn::ImportValue': 'Baseline:ECSClusterName',
    });
    expect(stack.resolve(ImportedRessources.getCloudMapNamespaceId())).toEqual({
        'Fn::ImportValue': 'Baseline:CloudMapNamespaceId',
    });
});
