import * as cdk from 'aws-cdk-lib/core';
import { Construct } from 'constructs';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import { CfnOutput } from 'aws-cdk-lib/core';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { ImportedRessources } from '../../infraLibrary/lib/importedRessources';
import { AWSConstants } from '../../infrabaseline/lib/constants';
import * as route53_targets from 'aws-cdk-lib/aws-route53-targets';
import * as cr from 'aws-cdk-lib/custom-resources';
import { Duration } from 'aws-cdk-lib';


/**
 * Describes a backend microservice API that should be reachable through CloudFront.
 *
 * CloudFront will create a dedicated behavior for the given pathPattern
 * and route matching requests to the API Gateway identified by apiName.
 */
export interface ApiServiceOriginProps {
    /**
     * The API name used when the ApiStack was deployed (matches the `apiName` prop).
     * This is used to look up the exported domain name and stage name via CloudFormation imports.
     *
     * Example: 'SubmissionServiceAPI'
     */
    apiName: string;

    /**
     * CloudFront path pattern for this service (must include a wildcard).
     * All requests matching this pattern are forwarded to the service's API Gateway.
     *
     * Example: '/api/submission/*'
     *
     * Convention: always use the prefix  /api/<service-short-name>/*
     * The backend service's OpenAPI spec must set  servers: [{url: '/api/<service-short-name>'}]
     * so that API Gateway routes include this prefix and match the forwarded path.
     */
    pathPattern: string;

    /**
     * Whether to enable caching for this API. Defaults to false.
     */
    enableCaching?: boolean;
}

export interface CloudFrontStackProps extends cdk.StackProps {
    /**
     * The API name of the Web UI service. Its API Gateway will be the CloudFront default origin,
     * meaning ALL requests that do not match a more-specific apiServices path pattern will be
     * forwarded here (including '/', '/index.html', '/assets/*' etc.).
     *
     * Example: 'WebUiServiceAPI'
     */
    webUiApiName: string;

    /**
     * List of backend microservice APIs to expose under /api/<service>/*.
     * Each entry creates a CloudFront cache behavior with the given pathPattern
     * forwarding to the respective API Gateway.
     *
     * When a new service is deployed, add an entry here and re-deploy this stack.
     */
    apiServices: ApiServiceOriginProps[];
}

/**
 * Creates a CloudFront distribution that acts as the single stable entry point for the
 * entire PeerReview system.
 *
 * URL structure:
 *   https://<dist>.cloudfront.net/              → Web UI (default behavior)
 *   https://<dist>.cloudfront.net/api/<svc>/*   → Backend microservice API (per-service behavior)
 *
 * How path forwarding works:
 *   CloudFront forwards the full request URI to the origin.
 *   Each API Gateway origin uses originPath = '/<stageName>' so that CloudFront
 *   prepends the stage path before forwarding. The result:
 *
 *     Request:  GET /api/submission/documents
 *     Forwarded: GET /prod/api/submission/documents  (origin = submission-apigw, originPath = /prod)
 *
 *   The backend service's OpenAPI spec sets servers[0].url = '/api/submission' which causes
 *   api.ts to register the route  /api/submission/documents  on the API Gateway — this matches.
 *
 * Caching:
 *   All behaviors use CachingDisabled to ensure every request reaches the origin.
 *   Enable caching for the Web UI's static assets if desired by updating the default behavior.
 *
 * CORS:
 *   Since the Web UI and all APIs share the same CloudFront domain, there are no cross-origin
 *   requests from the browser perspective. No CORS headers are required.
 */
export class CloudFrontStack extends cdk.Stack {

    constructor(scope: Construct, id: string, props: CloudFrontStackProps) {
        super(scope, id, props);


        const crossRegionSsmReaderCertificate = new cr.AwsCustomResource(this, 'GetCrossRegionCertArn', {
            onUpdate: {
                service: 'SSM',
                action: 'getParameter',
                parameters: {
                    Name: '/acm/cloudfront/certificate-arn',
                },
                region: 'us-east-1',
                physicalResourceId: cr.PhysicalResourceId.of(`CrossRegionCertReaderCertificateArn-${Date.now()}`),
            },
            policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
                resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
            }),
        });

        const crossRegionSsmReaderHostedZoneId = new cr.AwsCustomResource(this, 'GetCrossRegionHostedZoneId', {
            onUpdate: {
                service: 'SSM',
                action: 'getParameter',
                parameters: {
                    Name: '/route53/cloudfront/hosted-zone-id',
                },
                region: 'us-east-1',
                physicalResourceId: cr.PhysicalResourceId.of(`CrossRegionHostedZoneIdReader-${Date.now()}`),
            },
            policy: cr.AwsCustomResourcePolicy.fromSdkCalls({
                resources: cr.AwsCustomResourcePolicy.ANY_RESOURCE,
            }),
        });

        const domainName = AWSConstants.DNS_DOMAIN_NAME;
        const certArn = crossRegionSsmReaderCertificate.getResponseField('Parameter.Value');
        const certificate = acm.Certificate.fromCertificateArn(this, 'DomainCertificate', certArn);
        const hostedZone = route53.HostedZone.fromHostedZoneAttributes(this, 'DomainHostedZone', {
            hostedZoneId: crossRegionSsmReaderHostedZoneId.getResponseField('Parameter.Value'),
            zoneName: domainName,
        });


        // ── Web UI origin (default / fallback) ────────────────────────────────────
        const webUiDomainName = ImportedRessources.getApiDomainName(props.webUiApiName);
        const webUiStageName = ImportedRessources.getApiStageName(props.webUiApiName);

        const webUiOrigin = new origins.HttpOrigin(webUiDomainName, {
            // Prepend the stage name so CloudFront forwards /prod/<path> to API Gateway.
            originPath: cdk.Fn.join('', ['/', webUiStageName]),
            protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            // API Gateway requires HTTPS; keep the default read/connect timeouts.
        });

        // ── Cache and Origin Request Policies ─────────────────────────────────────
        // We use managed policies for API Gateway origins:
        // 1. CACHING_DISABLED: We don't want CloudFront to cache API responses.
        // 2. ALL_VIEWER_EXCEPT_HOST_HEADER: Forwards all headers (including Authorization),
        //    query strings, and cookies to API Gateway, except the Host header (which
        //    CloudFront replaces with the origin's domain).
        const cachePolicy = cloudfront.CachePolicy.CACHING_DISABLED;
        const originRequestPolicy = cloudfront.OriginRequestPolicy.ALL_VIEWER_EXCEPT_HOST_HEADER;

        const redirectFunction = new cloudfront.Function(this, 'RedirectFunction', {
            code: cloudfront.FunctionCode.fromInline(`
                function handler(event) {
                    var request = event.request;
                    var host = request.headers.host ? request.headers.host.value : '';
                    if (host === '${AWSConstants.REDIRECT_DOMAIN_NAME}' || host === '${AWSConstants.REDIRECT_WWW_DOMAIN_NAME}') {
                        return {
                            statusCode: 301,
                            statusDescription: 'Moved Permanently',
                            headers: {
                                'location': { value: '${AWSConstants.REDIRECT_TARGET_URL}' }
                            }
                        };
                    }
                    return request;
                }
            `),
        });

        // ── Default cache behavior (Web UI) ───────────────────────────────────────
        const defaultBehavior: cloudfront.BehaviorOptions = {
            origin: webUiOrigin,
            cachePolicy,
            originRequestPolicy,
            // The Web UI only needs GET/HEAD for static assets, but the API Gateway's
            // greedy proxy also handles POST/OPTIONS (e.g. Cognito redirects, preflight).
            allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
            cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
            viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
            compress: true,
            functionAssociations: [{
                function: redirectFunction,
                eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
            }],
        };

        // ── Per-service API behaviors ─────────────────────────────────────────────
        const shortCachePolicy = new cloudfront.CachePolicy(this, "ShortCachePolicy", { defaultTtl: Duration.minutes(1), minTtl: Duration.seconds(1), maxTtl: Duration.minutes(5) });
        const additionalBehaviors: Record<string, cloudfront.BehaviorOptions> = {};

        for (const service of props.apiServices) {
            const svcDomainName = ImportedRessources.getApiDomainName(service.apiName);
            const svcStageName = ImportedRessources.getApiStageName(service.apiName);

            const svcOrigin = new origins.HttpOrigin(svcDomainName, {
                originPath: cdk.Fn.join('', ['/', svcStageName]),
                protocolPolicy: cloudfront.OriginProtocolPolicy.HTTPS_ONLY,
            });

            
            const serviceCachePolicy = service.enableCaching ? shortCachePolicy : cachePolicy;

            additionalBehaviors[service.pathPattern] = {
                origin: svcOrigin,
                cachePolicy: serviceCachePolicy,
                originRequestPolicy,
                // APIs need all HTTP methods (GET, POST, PUT, DELETE, PATCH, OPTIONS, HEAD).
                allowedMethods: cloudfront.AllowedMethods.ALLOW_ALL,
                cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
                viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
                compress: false,
                functionAssociations: [{
                    function: redirectFunction,
                    eventType: cloudfront.FunctionEventType.VIEWER_REQUEST,
                }],
            };
        }

        // ── CloudFront Distribution ───────────────────────────────────────────────
        const distribution = new cloudfront.Distribution(this, 'PeerReviewDistribution', {
            comment: 'PeerReview system — single entry point for Web UI and all microservice APIs',
            defaultBehavior,
            additionalBehaviors,
            domainNames: [
                AWSConstants.APP_DOMAIN_NAME,
                AWSConstants.APP_WWW_DOMAIN_NAME,
                // Currently Disbaled because the Domain is still blocked by the old account. After 90 it would be released and can be used again.
                // AWSConstants.REDIRECT_DOMAIN_NAME,
                // AWSConstants.REDIRECT_WWW_DOMAIN_NAME
            ],
            certificate: certificate,
            // Use the default CloudFront certificate (*.cloudfront.net) — no custom domain needed.
            // HTTP requests are automatically redirected to HTTPS by viewerProtocolPolicy above.
            httpVersion: cloudfront.HttpVersion.HTTP2_AND_3,
            // eu-north-1 is in Price Class 100 (Europe + North America).
            // Use ALL if you need global coverage (higher cost).
            priceClass: cloudfront.PriceClass.PRICE_CLASS_100,
            minimumProtocolVersion: cloudfront.SecurityPolicyProtocol.TLS_V1_2_2021,
        });

        // ── Route 53 Alias Record ────────────────────────────────────────────────
        const records = [
            AWSConstants.APP_DOMAIN_NAME,
            AWSConstants.APP_WWW_DOMAIN_NAME,
            AWSConstants.REDIRECT_DOMAIN_NAME,
            AWSConstants.REDIRECT_WWW_DOMAIN_NAME
        ];

        records.forEach((recordName) => {
            // Replace dots to make a valid Construct ID (e.g. www.peer-review.fh-wedel.dev -> wwwpeer-reviewfh-wedeldev)
            const idSuffix = recordName.replace(/\./g, '-');
            new route53.ARecord(this, `CloudFrontAliasRecordIPv4-${idSuffix}`, {
                zone: hostedZone,
                recordName: recordName,
                target: route53.RecordTarget.fromAlias(new route53_targets.CloudFrontTarget(distribution)),
            });

            new route53.AaaaRecord(this, `CloudFrontAliasRecordIPv6-${idSuffix}`, {
                zone: hostedZone,
                recordName: recordName,
                target: route53.RecordTarget.fromAlias(new route53_targets.CloudFrontTarget(distribution)),
            });

            new route53.TxtRecord(this, `CloudFrontVerificationTxt-${idSuffix}`, {
                zone: hostedZone,
                recordName: `_${recordName}`,
                values: [distribution.distributionDomainName],
                ttl: Duration.minutes(5),
            });
        });


        // ── Outputs ───────────────────────────────────────────────────────────────
        new CfnOutput(this, 'CloudFrontDomainName', {
            value: AWSConstants.APP_DOMAIN_NAME,
            description: 'Stable HTTPS entry point for the PeerReview system (Web UI + all APIs)',
            exportName: 'Baseline:CloudFrontDomainName',
        });
    }
}
