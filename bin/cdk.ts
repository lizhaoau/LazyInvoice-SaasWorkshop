#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {Environment} from 'aws-cdk-lib';
import {Env, ProdExportNames, UatExportNames} from "../lib/Env";
import HostedZoneStack from "../lib/HostedZoneStack";
import EmailReceivingStack from "../lib/EmailReceivingStack";
import UserPoolStack from "../lib/UserPoolStack";
import ACMStack from "../lib/ACMStack";
import UIStack from "../lib/UIStack";
import {GitHubSourceAction} from "aws-cdk-lib/aws-codepipeline-actions";
import GithubActionsRoleStack from "../lib/GithubActionsRoleStack";

const app = new cdk.App();

const envUsEast1: Environment = {
  account: "014498632285",
  region: "us-east-1"
}

const envSydney: Environment = {
  account: "014498632285",
  region: "ap-southeast-2"
}

new HostedZoneStack(app, Env.Uat, UatExportNames, {
  stackName: `LazyInvoiceHostedZoneStackUat`,
  description: `This stack includes resources needed to create the hosted zone for LazyInvoice Uat`,
  // crossRegionReferences: true,
  env: envSydney,
});

new HostedZoneStack(app, Env.Prod, ProdExportNames, {
  stackName: `LazyInvoiceHostedZoneStackProd`,
  description: `This stack includes resources needed to create the hosted zone for LazyInvoice Prod`,
  crossRegionReferences: true,
  env: envSydney,
});

new EmailReceivingStack(app, ProdExportNames.hostedZoneIdExportName, {
  stackName: `LazyInvoiceEmailReceivingStack`,
  description: `This stack includes resources needed to receive emails for LazyInvoice`,
  env: envSydney,
});

new UserPoolStack(app, Env.Uat, UatExportNames, {
  stackName: 'LazyInvoiceUserPoolStackUat',
  description: 'This stack includes resources needed to deploy the User Pool into this environment',
  env: envSydney,
})

new UserPoolStack(app, Env.Prod, ProdExportNames, {
  stackName: 'LazyInvoiceUserPoolStackProd',
  description: 'This stack includes resources needed to deploy the User Pool into this environment',
  env: envSydney,
})

new ACMStack(app, Env.Uat, UatExportNames, {
  stackName: 'LazyInvoiceACMStackUat',
  description: 'This stack includes resources needed to create the certificates into this environment',
  crossRegionReferences:true,
  env:envUsEast1
})

new ACMStack(app, Env.Prod, ProdExportNames, {
  stackName: 'LazyInvoiceACMStackProd',
  description: 'This stack includes resources needed to create the certificates into this environment',
  env:envUsEast1
})

new UIStack(app, Env.Uat,UatExportNames, {
  stackName: 'LazyInvoiceUIStackUat',
  description: 'This stack includes resources needed to deploy the UI into this environment',
  env: envSydney
})

new UIStack(app, Env.Prod, ProdExportNames, {
  stackName: 'LazyInvoiceUIStackProd',
  description: 'This stack includes resources needed to deploy the UI into this environment',
  env: envSydney
})

new GithubActionsRoleStack(app, Env.Uat, UatExportNames, {
  stackName: 'LazyInvoiceGithubActionsRoleStackUat',
  description: 'This stack includes resources needed to deploy the Github Actions Role into this environment',
  env: envSydney
});

new GithubActionsRoleStack(app, Env.Prod, ProdExportNames, {
  stackName: 'LazyInvoiceGithubActionsRoleStackProd',
  description: 'This stack includes resources needed to deploy the Github Actions Role into this environment',
  env: envSydney
});