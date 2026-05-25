import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';
import { AWSConstants } from './constants';

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

        new cdk.CfnOutput(this, 'CertificateArn', {
            exportName: 'DomainCertificateArn',
            value: this.certificate.certificateArn,
            description: 'ARN of the ACM certificate for the domain',
        });

        new cdk.CfnOutput(this, 'HostedZoneId', {
            exportName: 'DomainHostedZoneId',
            value: this.hostedZone.hostedZoneId,
            description: 'ID of the Route 53 hosted zone',
        });

        new cdk.CfnOutput(this, 'NameServers', {
            exportName: 'DomainNameServers',
            value: cdk.Fn.join(', ', this.hostedZone.hostedZoneNameServers as string[]),
            description: 'Copy these to Name.com',
        });
    }
}