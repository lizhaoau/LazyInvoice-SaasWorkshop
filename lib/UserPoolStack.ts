import * as cdk from 'aws-cdk-lib'
import { Duration, RemovalPolicy } from 'aws-cdk-lib'
import {
  AccountRecovery,
  Mfa,
  UserPool,
  UserPoolEmail,
  VerificationEmailStyle
} from 'aws-cdk-lib/aws-cognito'
import type { Construct } from 'constructs'

import type { Env } from './Env'
import { DomainName } from './Env'

class UserPoolStack extends cdk.Stack {
  constructor(
    readonly scope: Construct,
    readonly env: Env,
    readonly outputs: {
      hostedZoneIdExportName: string
      userPoolArnExportName: string
    },
    readonly props: cdk.StackProps
  ) {
    super(scope, props.stackName, props)
    const userPool = this.createUserPool()
     userPool.addDomain('CognitoDomain', {
      cognitoDomain: {
        domainPrefix: 'lazyinvoice',
      },
    });

    userPool.addClient('LazyInvoiceWebClient', {
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
          implicitCodeGrant: true,
        },
        callbackUrls: ['https://lazyinvoice.xyz'],
        logoutUrls: ['https://lazyinvoice.xyz'],
      },
      preventUserExistenceErrors: true,
      refreshTokenValidity: Duration.days(30),
      userPoolClientName: 'LazyInvoiceWebClient',
    });
  }

  private createUserPool(): UserPool {
    const userPool = new UserPool(this, `XLearning-UserPool-${this.env}`, {
      userPoolName:`LazyInvoice-UserPool-${this.env}`,
      standardAttributes: {
        fullname: {
          required: true,
          mutable: true
        },
        phoneNumber:{
          required: false,
          mutable: true
        }
      },
      mfa: Mfa.OPTIONAL,
      mfaSecondFactor: {
        otp: true,
        sms: true
      },
      passwordPolicy: {
        tempPasswordValidity:Duration.days(7),
        minLength: 8,
        requireLowercase: true,
        requireDigits: true,
        requireSymbols: true,
        requireUppercase: true,
      },
      accountRecovery: AccountRecovery.EMAIL_ONLY,
      selfSignUpEnabled: true,
      signInCaseSensitive: false,
      signInAliases: {
        username: true,
        email: true,
        phone: false,
        preferredUsername:true,
      },
      autoVerify: {
        email: true,
        phone: false
      },
      keepOriginal:{
        email: true,
        phone: false,
      },
      email:UserPoolEmail.withCognito('admin@lazyinvoice.xyz'),
      removalPolicy:RemovalPolicy.DESTROY,
    })
    new cdk.CfnOutput(this, `XLearning-UserPool-Output-${this.env}`, {
      exportName: this.outputs.userPoolArnExportName,
      value: userPool.userPoolArn
    })
    return userPool
  }
}

export default UserPoolStack