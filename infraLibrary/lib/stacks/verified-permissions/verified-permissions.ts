import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as cognito from 'aws-cdk-lib/aws-cognito';
import {
  PolicyStore,
  ValidationSettingsMode,
  IdentitySource,
  Policy,
  DeletionProtectionMode,
} from '@cdklabs/cdk-verified-permissions';
import * as fs from 'fs';
import path from 'path';

export interface VerifiedPermissionsEntityTypeNames {
  user?: string;
  group?: string;
  application?: string;
  action?: string;
}

export interface VerifiedPermissionsStoreProps {
  namespace: string;
  userPoolId: string;
  appClientId: string;
  policies: VerifiedPermissionsPolicyDefinition[];
  description?: string;
  entityTypeNames?: VerifiedPermissionsEntityTypeNames;
  schemaJson?: string;
  validationMode?: 'STRICT' | 'OFF';
}

export interface VerifiedPermissionsPolicyDefinition {
  id?: string;
  groupName: string;
  actionId: string;
  description?: string;
  resourceId?: string;
}

export interface VerifiedPermissionsPolicyFile {
  namespace: string;
  resourceId?: string;
  entityTypeNames?: VerifiedPermissionsEntityTypeNames;
  policies: VerifiedPermissionsPolicyDefinition[];
}

export interface VerifiedPermissionsPolicySetProps {
  policyStore: PolicyStore;
  namespace: string;
  policies: VerifiedPermissionsPolicyDefinition[];
  userPoolId: string;
  resourceId?: string;
  entityTypeNames?: VerifiedPermissionsEntityTypeNames;
}


const DEFAULT_ENTITY_TYPES = {
  user: 'User',
  group: 'UserGroup',
  application: 'Application',
  action: 'Action',
};

function normalizeEntityTypeNames(entityTypeNames?: VerifiedPermissionsEntityTypeNames) {
  return {
    user: entityTypeNames?.user ?? DEFAULT_ENTITY_TYPES.user,
    group: entityTypeNames?.group ?? DEFAULT_ENTITY_TYPES.group,
    application: entityTypeNames?.application ?? DEFAULT_ENTITY_TYPES.application,
    action: entityTypeNames?.action ?? DEFAULT_ENTITY_TYPES.action,
  };
}

export function buildDefaultSchemaJson(
  namespace: string,
  policies: VerifiedPermissionsPolicyDefinition[],
  entityTypeNames?: VerifiedPermissionsEntityTypeNames,
): string {
  const names = normalizeEntityTypeNames(entityTypeNames);
  const actions: Record<string, object> = {};

  for (const policy of policies) {
    actions[policy.actionId] = {
      appliesTo: {
        principalTypes: [names.user],
        resourceTypes: [names.application],
      },
    };
  }
  const schema = {
    [namespace]: {
      entityTypes: {
        [names.user]: {
          memberOfTypes: [names.group],
          shape: { type: 'Record', attributes: {} },
        },
        [names.group]: { shape: { type: 'Record', attributes: {} } },
        [names.application]: { shape: { type: 'Record', attributes: {} } },
      },
      actions,
    },
  };
  return JSON.stringify(schema, null, 2);
}

export function loadVerifiedPermissionsPolicyFile(filePath: string): VerifiedPermissionsPolicyFile {
  const resolved = path.isAbsolute(filePath) ? filePath : path.resolve(process.cwd(), filePath);
  const raw = fs.readFileSync(resolved, 'utf-8');
  const parsed = JSON.parse(raw) as VerifiedPermissionsPolicyFile;
  if (!parsed?.namespace) {
    throw new Error(`Policy file at ${resolved} must include a namespace`);
  }
  if (!Array.isArray(parsed.policies) || parsed.policies.length === 0) {
    throw new Error(`Policy file at ${resolved} must include at least one policy`);
  }
  return parsed;
}

function buildGroupPolicyStatement(
  namespace: string,
  policy: VerifiedPermissionsPolicyDefinition,
  userPoolId: string,
  entityTypeNames?: VerifiedPermissionsEntityTypeNames,
  defaultResourceId?: string,
) {
  const names = normalizeEntityTypeNames(entityTypeNames);
  const groupEntityType = `${namespace}::${names.group}`;
  const actionEntityType = `${namespace}::${names.action}`;
  const resourceEntityType = `${namespace}::${names.application}`;
  const resourceId = policy.resourceId ?? defaultResourceId ?? namespace;
  return `permit(principal in ${groupEntityType}::"${userPoolId}|${policy.groupName}", action == ${actionEntityType}::"${policy.actionId}", resource == ${resourceEntityType}::"${resourceId}");`;
}

function toConstructId(value: string, fallback: string) {
  const cleaned = value.replace(/[^A-Za-z0-9]/g, '');
  return cleaned.length > 0 ? cleaned : fallback;
}



export class VerifiedPermissionsStore extends Construct {
  public readonly policyStore: PolicyStore;

  constructor(scope: Construct, id: string, props: VerifiedPermissionsStoreProps) {
    super(scope, id);

    const names = normalizeEntityTypeNames(props.entityTypeNames);
    const schemaJson =
      props.schemaJson ??
      buildDefaultSchemaJson(props.namespace, props.policies, names);

    const validationMode =
      props.validationMode === 'STRICT'
        ? ValidationSettingsMode.STRICT
        : ValidationSettingsMode.OFF;

    this.policyStore = new PolicyStore(this, 'PolicyStore', {
      description: props.description ?? `Verified Permissions policy store for ${props.namespace}`,
      validationSettings: { mode: validationMode },
      deletionProtection: DeletionProtectionMode.DISABLED,
      schema: { cedarJson: schemaJson },
    });


    const userPool = cognito.UserPool.fromUserPoolId(
      this,
      'ImportedUserPool',
      props.userPoolId,
    );

    new IdentitySource(this, 'CognitoIdentitySource', {
      policyStore: this.policyStore,
      principalEntityType: `${props.namespace}::${names.user}`,
      configuration: {
        cognitoUserPoolConfiguration: {
          userPool,
          clientIds: [props.appClientId],
          groupConfiguration: {
            groupEntityType: `${props.namespace}::${names.group}`,
          },
        },
      },
    });
  }
}

export class VerifiedPermissionsPolicySet extends Construct {
  constructor(scope: Construct, id: string, props: VerifiedPermissionsPolicySetProps) {
    super(scope, id);

    const defaultResourceId = props.resourceId ?? props.namespace;

    props.policies.forEach((policy, index) => {
      if (!policy.groupName || !policy.actionId) {
        throw new Error('Policy definitions must include groupName and actionId');
      }

      const baseId = policy.id ?? policy.actionId;
      const constructId = toConstructId(baseId, `Policy${index + 1}`);
      const statement = buildGroupPolicyStatement(
        props.namespace,
        policy,
        props.userPoolId,
        props.entityTypeNames,
        defaultResourceId,
      );

      new Policy(this, constructId, {
        policyStore: props.policyStore,
        definition: {
          static: {
            description:
              policy.description ??
              `Allow ${policy.groupName} to access ${policy.actionId}`,
            statement,
          },
        },
      });
    });
  }
}