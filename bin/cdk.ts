#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {Environment} from 'aws-cdk-lib';
import {Env, ProdExportNames, UatExportNames} from "../lib/Env";
import SaasWorkshop from "../lib/SaasWorkshop";

const app = new cdk.App();

const env: Environment = {
  account: "484011448296",
  region: "us-east-1"
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
