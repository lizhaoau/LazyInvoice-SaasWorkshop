import * as cdk from "aws-cdk-lib";
import type {Construct} from "constructs";
import {DomainName, Env, Outputs} from "./Env";

import {FederatedPrincipal, OpenIdConnectProvider, Role} from "aws-cdk-lib/aws-iam";
import UIStack from "./UIStack";
import {Distribution} from "aws-cdk-lib/aws-cloudfront";


class GithubActionsRoleStack extends cdk.Stack {
  constructor(
    readonly scope: Construct,
    readonly env: Env,
    readonly outputs: Outputs,
    readonly props: cdk.StackProps
  ) {
    super(scope, props.stackName, props)

    const role = this.createGithubActionsRole()
    this.grantAppPermissions(role)
  }

  private createGithubActionsRole(): Role {
    const githubOpenIdConnectProvider = new OpenIdConnectProvider(this, `LazyInvoice-OpenIdConnectProvider`, {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com']
    })

    const githubFederationPrincipal = new FederatedPrincipal(githubOpenIdConnectProvider.openIdConnectProviderArn, {
      "StringLike": {
        "token.actions.githubusercontent.com:sub": "repo:sqiubgl/lazyinvoice-*:*"
      },
      "StringEquals": {
        "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
      }
    }, "sts:AssumeRoleWithWebIdentity")

    return new Role(this, `LazyInvoice-GithubActions-Role`, {
      assumedBy: githubFederationPrincipal,
    })
  }

  private grantAppPermissions(githubActionsRole: Role): void {
    const uiS3Bucket = UIStack.getS3BucketName(this, this.env, this.outputs)
    uiS3Bucket.grantReadWrite(githubActionsRole)
    const distribution = UIStack.getDistribution(this, this.env, this.outputs)
    distribution.grant(githubActionsRole,
      'cloudfront:GetDistribution',
      'cloudfront:GetDistributionConfig',
      'cloudfront:UpdateDistribution',
      'cloudfront:CreateInvalidation',
      'cloudfront:GetInvalidation')
  }

}

export default GithubActionsRoleStack;