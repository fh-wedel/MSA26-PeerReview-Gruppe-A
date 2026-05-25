import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { AWSConstants } from './constants';
import * as ssm from 'aws-cdk-lib/aws-ssm';

export class CertificateStack extends cdk.Stack {
    public readonly certificate: acm.ICertificate;
    public readonly hostedZone: route53.IHostedZone;

    constructor(scope: Construct, id: string, props?: cdk.StackProps) {
        super(scope, id, props);

        const domainName = AWSConstants.DNS_DOMAIN_NAME;

        this.hostedZone = new route53.PublicHostedZone(this, 'HostedZone', {
            zoneName: domainName,
        });

        this.certificate = new acm.Certificate(this, 'SiteCertificate', {
            domainName: domainName,
            validation: acm.CertificateValidation.fromDns(this.hostedZone),
        });

        new ssm.StringParameter(this, 'CertArnParameter', {
            parameterName: '/acm/cloudfront/certificate-arn',
            stringValue: this.certificate.certificateArn,
        });

        new ssm.StringParameter(this, 'HostedZoneIdParameter', {
            parameterName: '/route53/cloudfront/hosted-zone-id',
            stringValue: this.hostedZone.hostedZoneId,
        });
    }
}