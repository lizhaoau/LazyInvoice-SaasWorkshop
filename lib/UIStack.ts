import * as cdk from "aws-cdk-lib";
import {Duration, RemovalPolicy} from "aws-cdk-lib";
import type {Construct} from "constructs";
import {DomainName, Env} from "./Env";
import {Bucket} from "aws-cdk-lib/aws-s3";
import {
  AllowedMethods, CacheHeaderBehavior, CachePolicy,
  Distribution,
  HeadersFrameOption,
  HeadersReferrerPolicy, OriginRequestPolicy, PriceClass,
  ResponseHeadersPolicy, ViewerProtocolPolicy
} from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from 'aws-cdk-lib/aws-cloudfront-origins';
import {Certificate} from "aws-cdk-lib/aws-certificatemanager";
import SaasWorkshop from "./SaasWorkshop";
import {ARecord, RecordTarget} from "aws-cdk-lib/aws-route53";
import {CloudFrontTarget} from "aws-cdk-lib/aws-route53-targets";

class UIStack extends cdk.Stack {
  constructor(
    readonly scope: Construct,
    readonly env: Env,
    readonly outputs: {
      hostedZoneIdExportName: string
      s3BucketNameExportName: string
    },
    readonly props: cdk.StackProps
  ) {
    super(scope, props.stackName, props)

    const bucket = this.createS3Bucket()
    const responseHeadersPolicy = this.createResponseHeadersPolicy()
    const distribution = this.createCloudFrontDistribution(bucket, responseHeadersPolicy)
    this.createAliasRecord(distribution)
  }

    //create an s3 bucket
  private createS3Bucket():Bucket {
      const bucket = new Bucket(this, `Lazy-Invoice-UI-Bucket -${this.env}`, {
        bucketName: DomainName[this.env],
        publicReadAccess: true,
        blockPublicAccess: {
          blockPublicAcls: false,
          blockPublicPolicy: false,
          ignorePublicAcls: false,
          restrictPublicBuckets: false
        },
        versioned: false,
        websiteIndexDocument: 'index.html',
        websiteErrorDocument: 'error.html',
        removalPolicy: RemovalPolicy.DESTROY
      })
      new cdk.CfnOutput(this, `LazyInvoice-UI-Bucket-Output-${this.env}`, {
        exportName: this.outputs.s3BucketNameExportName,
        value: bucket.bucketName
      })

      return bucket;
    }

    private createResponseHeadersPolicy(): ResponseHeadersPolicy {
      return new ResponseHeadersPolicy(this, `LazyInvoice-ResponseHeadersPolicy-${this.env}`, {
        responseHeadersPolicyName: `LazyInvoice-ResponseHeadersPolicy-${this.env}`,
        securityHeadersBehavior: {
          strictTransportSecurity: {
            accessControlMaxAge: Duration.days(365),
            includeSubdomains: true,
            preload: false,
            override: true
          },
          frameOptions:{
            frameOption:HeadersFrameOption.DENY,
            override: true
          },
          xssProtection:{
            protection: true,
            override: true
          },
          referrerPolicy:{
            referrerPolicy: HeadersReferrerPolicy.STRICT_ORIGIN,
            override: true
          },
          contentSecurityPolicy:{
            contentSecurityPolicy: 'frame-ancestors \'self\'',
            override: true
          }
        }
      })
    }

    private createCloudFrontDistribution(
      bucket: Bucket,
      responseHeadersPolicy: ResponseHeadersPolicy): Distribution {
      const distribution = new Distribution(this, `Lazy-Invoice-UI-Distribution-${this.env}`, {
        domainNames: [DomainName[this.env]],
        defaultBehavior: {
          origin: new S3Origin(bucket, { originPath: '/1' }),
          allowedMethods: AllowedMethods.ALLOW_GET_HEAD,
          responseHeadersPolicy,
          compress: true,
          viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
          cachePolicy: CachePolicy.CACHING_OPTIMIZED,
          originRequestPolicy: new OriginRequestPolicy(this, `Lazy-Invoice-UI-OriginRequestPolicy-${this.env}`, {
            headerBehavior: CacheHeaderBehavior.allowList('Cache-Control')
          })
        },
        errorResponses: [{
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: '/index.html'
        }],
        certificate: Certificate.fromCertificateArn(this, `LazyInvoice-UI-Certificate-${this.env}`,
          "arn:aws:acm:us-east-1:014498632285:certificate/3544f2e1-f518-45ac-b6df-d2f46e06259a"),
        enableLogging: false,
        enableIpv6: false,
        priceClass: PriceClass.PRICE_CLASS_ALL
      })

      new cdk.CfnOutput(this, `LazyInvoice-UI-Distribution-Output-${this.env}`, {
        exportName: `LazyInvoice-UI-Distribution-Output-${this.env}`,
        value: distribution.distributionDomainName
      })

      return distribution
    }

    private createAliasRecord(distribution: Distribution): void {
      const zone = SaasWorkshop.getHostedZone(this, this.env, this.outputs)
      const target = RecordTarget.fromAlias(new CloudFrontTarget(distribution))
      new ARecord(this, `LazyInvoice-UI-CloudFront-Record-${this.env}`, {
        zone,
        target,
        recordName: DomainName[this.env]
      })
    }
  }

export default UIStack