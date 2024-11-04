import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import {DomainName, Env, Outputs} from "./Env";
import {HostedZone, IPublicHostedZone, PublicHostedZone} from "aws-cdk-lib/aws-route53";
import {CfnOutput} from "aws-cdk-lib";
// import * as sqs from 'aws-cdk-lib/aws-sqs';

class HostedZoneStack extends cdk.Stack {
  constructor(
    readonly scope: Construct,
    readonly env: Env,
    readonly outputs: Outputs,
    readonly props: cdk.StackProps)
  {
    super(scope, props.stackName, props);
    const zone = this.createHostedZone();
    this.exportHostedZoneId(zone);

    // The code that defines your stack goes here

    // example resource
    // const queue = new sqs.Queue(this, 'SaasWorkshopQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }

  static getHostedZone(stack: cdk.Stack, env: Env, outputs: { hostedZoneIdExportName: string }): IPublicHostedZone {
    const hostedZoneId = cdk.Fn.importValue(outputs.hostedZoneIdExportName)
    // const hostedZoneId = "Z05409461EMIIDH6ZJELZ"
    return PublicHostedZone.fromPublicHostedZoneAttributes(stack, `LazyInvoice-HostedZone-Output-${env}`, {
      hostedZoneId,
      zoneName: DomainName[env]
    })
  }

  private exportHostedZoneId(hostedZone: HostedZone){
    new CfnOutput(this, `LazyInvoice-HostedZoneId-Output-${this.env}`, {
      exportName: this.outputs.hostedZoneIdExportName,
      value: hostedZone.hostedZoneId
    })
  }

  private createHostedZone(): PublicHostedZone {
    return new PublicHostedZone(this, `LazyInvoice-HostedZone-${this.env}`, {
      zoneName: DomainName[this.env]
    })
  }
}

export default HostedZoneStack;

