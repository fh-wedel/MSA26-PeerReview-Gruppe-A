#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { CloudFrontStack } from '../lib/cloudfront-stack';
import { AWSConstants } from '../../infrabaseline/lib/constants';



const app = new cdk.App();

/**
 * CloudFront distributions are a global AWS service but the CDK stack itself
 * is deployed to eu-north-1 (same as all other stacks).
 * Cross-region stacks are NOT needed because we are not attaching a custom
 * ACM certificate — we use the default *.cloudfront.net certificate.
 *
 * cdk.Fn.importValue() works within the same region, so all API Gateway
 * domain-name exports (exported from eu-north-1) are importable here.
 */
const env = {
    account: AWSConstants.AWS_ACCOUNT_ID,
    region: AWSConstants.AWS_REGION,
};

new CloudFrontStack(app, 'PeerReviewCloudFrontStack', {
    env,

    // The Web UI is the default origin — all requests that do NOT match
    // an /api/<service>/* pattern below fall through to the Web UI API Gateway.
    webUiApiName: 'WebUiServiceAPI',

    // ── Backend microservice APIs ──────────────────────────────────────────────
    // Add a new entry here each time you deploy a new microservice API Gateway.
    //
    // Convention:
    //   apiName    → matches the `apiName` prop passed to ApiStack in the service's infra.ts
    //   pathPattern → /api/<service-short-name>/*
    //
    // The backend service's OpenAPI spec MUST set:
    //   servers:
    //     - url: /api/<service-short-name>
    //
    // This causes api.ts to prefix all routes with /api/<service-short-name>,
    // which matches the full path that CloudFront forwards to the API Gateway.
    //
    // Example (add when submission-service is deployed):
    //   { apiName: 'SubmissionServiceAPI', pathPattern: '/api/submission/*' },
    apiServices: [
        { apiName: 'TemplateServiceAPI', pathPattern: '/api/template/*' },
        // Placeholder — uncomment and extend as services are deployed:
        // { apiName: 'SubmissionServiceAPI',      pathPattern: '/api/submission/*' },
        // { apiName: 'UserManagementServiceAPI',  pathPattern: '/api/user-management/*' },
        // { apiName: 'WorkflowServiceAPI',        pathPattern: '/api/workflow/*' },
        // { apiName: 'ReviewServiceAPI',          pathPattern: '/api/review/*' },
        // { apiName: 'NotificationServiceAPI',    pathPattern: '/api/notification/*' },
        // { apiName: 'CommunicationServiceAPI',   pathPattern: '/api/communication/*' },
        // { apiName: 'AnalyticsServiceAPI',       pathPattern: '/api/analytics/*' },
    ],
});
