#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import {Environment} from 'aws-cdk-lib';
import {Env, ProdExportNames, UatExportNames} from "../lib/Env";
import SaasWorkshop from "../lib/SaasWorkshop";
import EmailReceivingStack from "../lib/EmailReceivingStack";
import UserPoolStack from "../lib/UserPoolStack";
import ACMStack from "../lib/ACMStack";
import UIStack from "../lib/UIStack";

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

new UserPoolStack(app, Env.Uat, UatExportNames, {
  stackName: 'LazyInvoiceUserPoolStackUat',
  description: 'This stack includes resources needed to deploy the User Pool into this environment',
  env
})

new UserPoolStack(app, Env.Prod, ProdExportNames, {
  stackName: 'LazyInvoiceUserPoolStackProd',
  description: 'This stack includes resources needed to deploy the User Pool into this environment',
  env
})

new ACMStack(app, Env.Uat, UatExportNames, {
  stackName: 'LazyInvoiceACMStackUat',
  description: 'This stack includes resources needed to create the certificates into this environment',
  crossRegionReferences:true,
  env
})

new ACMStack(app, Env.Prod, ProdExportNames, {
  stackName: 'LazyInvoiceACMStackProd',
  description: 'This stack includes resources needed to create the certificates into this environment',
  env
})

new UIStack(app, Env.Uat,UatExportNames, {
  stackName: 'LazyInvoiceUIStackUat',
  description: 'This stack includes resources needed to deploy the UI into this environment',
  env
})

new UIStack(app, Env.Prod, ProdExportNames, {
  stackName: 'LazyInvoiceUIStackProd',
  description: 'This stack includes resources needed to deploy the UI into this environment',
  env
})
