#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {Environment} from 'aws-cdk-lib';
import {Env, ProdExportNames, UatExportNames} from "../lib/Env";
import SaasWorkshop from "../lib/SaasWorkshop";
import EmailReceivingStack from "../lib/EmailReceivingStack";

const app = new cdk.App();

const env: Environment = {
  account: "014498632285",
  region: "ap-southeast-2"
}

new SaasWorkshop(app, Env.Uat, UatExportNames, {
  stackName: `LazyInvoiceHostedZoneStackUat`,
  description: `This stack includes resources needed to create the hosted zone for LazyInvoice Uat`,
  env,
});

new SaasWorkshop(app, Env.Prod, ProdExportNames, {
  stackName: `LazyInvoiceHostedZoneStackProd`,
  description: `This stack includes resources needed to create the hosted zone for LazyInvoice Prod`,
  env,
});

new EmailReceivingStack(app, ProdExportNames.hostedZoneIdExportName, {
  stackName: `LazyInvoiceEmailReceivingStack`,
  description: `This stack includes resources needed to receive emails for LazyInvoice`,
  env,
});
