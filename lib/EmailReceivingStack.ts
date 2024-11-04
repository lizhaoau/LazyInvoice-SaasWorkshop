import * as cdk from 'aws-cdk-lib'
import {Duration, Fn, RemovalPolicy} from 'aws-cdk-lib'
import {Effect, PolicyStatement, Role, ServicePrincipal} from 'aws-cdk-lib/aws-iam'
import {Architecture, Code, Function as LambdaFunction, Runtime} from 'aws-cdk-lib/aws-lambda'
import {Bucket, BucketEncryption} from 'aws-cdk-lib/aws-s3'
import {ReceiptRuleSet} from 'aws-cdk-lib/aws-ses'
import type {Construct} from 'constructs'

import {EmailForwardingLambdaCode} from './EmailForwardingLambdaCode'
import {DomainName, Env} from "./Env";
import {Lambda, LambdaInvocationType, S3} from "aws-cdk-lib/aws-ses-actions";
import {HostedZone, MxRecord} from "aws-cdk-lib/aws-route53";
import HostedZoneStack from "./HostedZoneStack";

class EmailReceivingStack extends cdk.Stack {
  constructor(
    readonly scope: Construct,
    readonly hostedZoneIdExportName: string,
    readonly props: cdk.StackProps
  ) {
    super(scope, props.stackName, props)

    const bucket = this.createS3Bucket()
    const lambda = this.createLambda(bucket)
    this.createEmailReceivingRuleSet(bucket, lambda)
    this.addMxRecord()
  }

  private createS3Bucket(): Bucket {
    return new Bucket(this, 'EmailBucket', {
      bucketName: 'lazy-invoice-email-receiving-bucket',
      publicReadAccess: false,
      versioned: false,
      removalPolicy: RemovalPolicy.DESTROY
    })
  }

  private createLambda(bucket: Bucket): LambdaFunction {
    const role = new Role(this, 'EmailForwarding-Lambda-Role', {
      roleName: 'email-forwarding-lambda-role',
      assumedBy: new ServicePrincipal('lambda.amazonaws.com')
    })

    // Add S3 policies to the role
    role.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions: [
        's3:GetObject',
        's3:PutObject',
      ],
      resources: [
        `${bucket.bucketArn}/*`
      ]
    }))

    //Add CloudWatch Logs policies to the role
    role.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions:[
        'logs:CreateLogGroup',
        'logs:CreateLogStream',
        'logs:PutLogEvents'
      ],
      resources: ['arn:aws:logs:*:*:*']
    }))

    //add SES policies to the role
    role.addToPolicy(new PolicyStatement({
      effect: Effect.ALLOW,
      actions:[
        'ses:SendRawEmail',
        'ses:SendEmail',
      ],
      resources:['arn:aws:ses:ap-southeast-2:014498632285:identity/*']
    }))


    return new LambdaFunction(this, 'EmailForwarding-Lambda', {
      functionName: 'mailForwardingFunction',
      runtime: Runtime.NODEJS_16_X,
      code: Code.fromInline(EmailForwardingLambdaCode),
      handler: 'index.handler',
      architecture: Architecture.X86_64,
      timeout: Duration.seconds(3),
      memorySize: 128,
      role
    })
  }

  private createEmailReceivingRuleSet(bucket: Bucket, lambda: LambdaFunction): ReceiptRuleSet {
    const ruleSet = new ReceiptRuleSet(this, 'EmailReceiving-RuleSet', {
      receiptRuleSetName: 'rule-set'
    })

    ruleSet.addRule('Lazy-invoice-EmailReceiving-ruleSet1', {
      receiptRuleName: 'lazy-invoice-email-receiving-rule-set1',
      enabled: true,
      scanEnabled: true,
      recipients: [`.${DomainName.Prod}`, DomainName.Prod],
      actions:[
        new S3({bucket}),
        new Lambda({
          function: lambda, invocationType: LambdaInvocationType.EVENT
        })
      ]
    })

    return ruleSet
  }

  private addMxRecord(): MxRecord {
    const zone = HostedZoneStack.getHostedZone(this, Env.Prod,
      { hostedZoneIdExportName: this.hostedZoneIdExportName })
    return new MxRecord(this, 'LazyInvoice-EmailReceiving-MxRecord', {
      zone,
      recordName: DomainName.Prod,
      values: [{
        priority: 10,
        hostName: 'inbound-smtp.ap-southeast-2.amazonaws.com'
      }],
      ttl: Duration.days(1)
    })
    }
}

export default EmailReceivingStack