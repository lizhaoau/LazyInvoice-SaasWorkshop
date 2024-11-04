import * as cdk from 'aws-cdk-lib'
import type { ICertificate } from 'aws-cdk-lib/aws-certificatemanager'
import { Certificate, CertificateValidation } from 'aws-cdk-lib/aws-certificatemanager'
import type { Construct } from 'constructs'
import { lowerCase } from 'lodash'

import type { Env } from './Env'
import { DomainName } from './Env'
import HostedZoneStack from "./HostedZoneStack";

class ACMStack extends cdk.Stack {
  constructor(
    readonly scope: Construct,
    readonly env: Env,
    readonly outputs: {
      hostedZoneIdExportName: string
      acmRootCertificateArnExportName: string
      acmUsersCertificateArnExportName: string
    },
    readonly props: cdk.StackProps
  ) {
    super(scope, props.stackName, props)

    const validation = this.createValidation()
    const rootCertificate = this.createRootCertificate(validation)
    const usersCertificate = this.createUsersCertificate(validation)
    this.exportCertificates(rootCertificate, usersCertificate)
  }

  static getUsersCertificates(stack: cdk.Stack, env: Env, outputs: { acmUsersCertificateArnExportName: string }): ICertificate {
    const arn = cdk.Fn.importValue(outputs.acmUsersCertificateArnExportName)
    return Certificate.fromCertificateArn(stack, `LazyInvoice-Users-Certificate-Output-${env}`, arn)
  }

  private exportCertificates(rootCertificate: Certificate, usersCertificate: Certificate): void {
    new cdk.CfnOutput(this, `LazyInvoice-Root-Certificate-Output-${this.env}`, {
      exportName: this.outputs.acmRootCertificateArnExportName,
      value: rootCertificate.certificateArn
    })
    new cdk.CfnOutput(this, `LazyInvoice-Users-Certificate-Output-${this.env}`, {
      exportName: this.outputs.acmUsersCertificateArnExportName,
      value: usersCertificate.certificateArn
    })
  }

  private createValidation(): CertificateValidation {
    const hostedZone = HostedZoneStack.getHostedZone(this, this.env, this.outputs)
    return CertificateValidation.fromDns(hostedZone)
  }

  private createRootCertificate(validation: CertificateValidation): Certificate {
    return new Certificate(this, `LazyInvoice-Root-Certificate-${this.env}`, {
      certificateName: `LazyInvoice-root-certificate-${lowerCase(this.env)}`,
      domainName: DomainName[this.env],
      // subjectAlternativeNames: DomainName[this.env],
      validation
    })
  }

  private createUsersCertificate(validation: CertificateValidation): Certificate {
    return new Certificate(this, `LazyInvoice-Users-Certificate-${this.env}`, {
      certificateName: `LazyInvoice-users-certificate-${lowerCase(this.env)}`,
      domainName: DomainName[this.env],
      validation
    })
  }

  static getRootCertificate(stack: cdk.Stack, env: Env, outputs: { acmRootCertificateArnExportName: string }): ICertificate {
    const arn = cdk.Fn.importValue(outputs.acmRootCertificateArnExportName)
    return Certificate.fromCertificateArn(stack, `LazyInvoice-Root-Certificate-Output-${env}`, arn)
  }
}

export default ACMStack