import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import { ApiStack } from '../api/api';
import { loadVerifiedPermissionsPolicyFile, VerifiedPermissionsPolicySet, VerifiedPermissionsStore } from './verified-permissions';
import { AWSConstants } from '../../../../infrabaseline/lib/constants';

export interface AuthStackProps extends cdk.StackProps {
    policyFilePath: string;
    serviceName: string;
}

export class AuthStack extends cdk.Stack {
    readonly policyStore: VerifiedPermissionsStore;
    readonly policyConfig: ReturnType<typeof loadVerifiedPermissionsPolicyFile>;

    constructor(scope: Construct, id: string, props: AuthStackProps) {
        super(scope, id, props);

        const userPoolId = cdk.Fn.importValue(`${AWSConstants.COGNITO_USER_POOL_NAME}-UserPoolId`);
        const appClientId = cdk.Fn.importValue(`${AWSConstants.COGNITO_APP_CLIENT_NAME}-AppClientId`);

        this.policyConfig = loadVerifiedPermissionsPolicyFile(props.policyFilePath);

        this.policyStore = new VerifiedPermissionsStore(this, 'TemplatePolicyStore', {
            namespace: this.policyConfig.namespace,
            userPoolId: userPoolId,
            description: `Policy store for ${props.serviceName} service API`,
            appClientId: appClientId,
            policies: this.policyConfig.policies,
            validationMode: 'STRICT',
        });

        new VerifiedPermissionsPolicySet(this, 'TemplateApiPolicies', {
            namespace: this.policyConfig.namespace,
            policyStore: this.policyStore.policyStore,
            userPoolId: userPoolId,
            policies: this.policyConfig.policies,
            resourceId: this.policyConfig.resourceId,
            entityTypeNames: this.policyConfig.entityTypeNames,
        });

    }
}


