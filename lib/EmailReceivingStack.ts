import * as cdk from 'aws-cdk-lib'
import { Duration } from 'aws-cdk-lib'
import { Role, ServicePrincipal } from 'aws-cdk-lib/aws-iam'
import { Architecture, Code, Function as LambdaFunction, Runtime } from 'aws-cdk-lib/aws-lambda'
import type { MxRecord } from 'aws-cdk-lib/aws-route53'
import type { Bucket } from 'aws-cdk-lib/aws-s3'
import { ReceiptRuleSet } from 'aws-cdk-lib/aws-ses'
import type { Construct } from 'constructs'

import { EmailForwardingLambdaCode } from './EmailForwardingLambdaCode'

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
    // TODO: Add a bucket
  }

  private createLambda(bucket: Bucket): LambdaFunction {
    const role = new Role(this, 'EmailForwarding-Lambda-Role', {
      roleName: 'email-forwarding-lambda-role',
      assumedBy: new ServicePrincipal('lambda.amazonaws.com')
    })
    // TODO: Add policies tp the role
    return new LambdaFunction(this, 'EmailForwarding-Lambda', {
      functionName: '=mailForwardingFunction',
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
    // TODO: Add a rule to the rule set
    return ruleSet
  }

  private addMxRecord(): MxRecord {
    // TODO: Add an MX record
  }
}

export default EmailReceivingStack