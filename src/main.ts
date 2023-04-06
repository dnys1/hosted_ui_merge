import { IdentityPool, UserPoolAuthenticationProvider } from '@aws-cdk/aws-cognito-identitypool-alpha';
import { App, CfnOutput, RemovalPolicy, Stack, StackProps } from 'aws-cdk-lib';
import { ProviderAttribute, UserPool, UserPoolIdentityProviderAmazon, UserPoolIdentityProviderGoogle } from 'aws-cdk-lib/aws-cognito';
import { Policy, PolicyStatement } from 'aws-cdk-lib/aws-iam';
import { Runtime } from 'aws-cdk-lib/aws-lambda';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { Secret } from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export class MyStack extends Stack {
  constructor(scope: Construct, id: string, props: StackProps = {}) {
    super(scope, id, props);

    const preSignUp = new NodejsFunction(this, 'pre-signup', {
      runtime: Runtime.NODEJS_18_X,
    });

    const userPool = new UserPool(this, 'UserPool', {
      removalPolicy: RemovalPolicy.DESTROY,
      selfSignUpEnabled: true,
      lambdaTriggers: {
        preSignUp,
      }
    });

    const policy = new Policy(this, "PreSignUpPolicy", {
      statements: [
        new PolicyStatement({
          resources: [userPool.userPoolArn],
          actions: [
            "cognito-idp:ListUsers",
            "cognito-idp:AdminLinkProviderForUser",
            "cognito-idp:AdminCreateUser",
            "cognito-idp:AdminSetUserPassword",
          ]
        })
      ]
    });
    preSignUp.role!.attachInlinePolicy(policy);

    const amazonCredentials = Secret.fromSecretNameV2(
      this,
      'AmazonCredentials',
      'hosted-ui-merge/amazon',
    );

    const amazonProvider = new UserPoolIdentityProviderAmazon(
      this,
      'AmazonProvider',
      {
        userPool,
        attributeMapping: {
          email: ProviderAttribute.AMAZON_EMAIL,
          givenName: ProviderAttribute.AMAZON_NAME,
        },
        clientId: amazonCredentials.secretValueFromJson('clientId').toString(),
        clientSecret: amazonCredentials.secretValueFromJson('clientSecret').toString(),
        scopes: ['profile', 'email', 'openid'],
      },
    );

    const googleCredentials = Secret.fromSecretNameV2(
      this,
      'GoogleCredentials',
      'hosted-ui-merge/google',
    );

    const googleProvider = new UserPoolIdentityProviderGoogle(
      this,
      'GoogleProvider',
      {
        userPool,
        attributeMapping: {
          email: ProviderAttribute.GOOGLE_EMAIL,
          givenName: ProviderAttribute.GOOGLE_GIVEN_NAME,
          familyName: ProviderAttribute.GOOGLE_FAMILY_NAME,
          phoneNumber: ProviderAttribute.GOOGLE_PHONE_NUMBERS,
        },
        clientId: googleCredentials.secretValueFromJson('clientId').toString(),
        clientSecretValue: googleCredentials
          .secretValueFromJson('clientSecret'),
        scopes: ['profile', 'email', 'openid'],
      },
    );

    userPool.registerIdentityProvider(amazonProvider);
    userPool.registerIdentityProvider(googleProvider);

    const userPoolClient = userPool.addClient('UserPoolClient', {
      authFlows: {
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        callbackUrls: [
          "http://localhost:3000/",
          "myapp://"
        ],
        logoutUrls: [
          "http://localhost:3000/",
          "myapp://"
        ],
      },
    });

    const domain = userPool.addDomain('Domain', {
      cognitoDomain: {
        domainPrefix: 'hosted-ui-merge',
      },
    });

    const identityPool = new IdentityPool(this, 'IdentityPool', {
      allowUnauthenticatedIdentities: true,
      authenticationProviders: {
        userPools: [
          new UserPoolAuthenticationProvider({
            userPool,
            userPoolClient,
          })
        ]
      }
    });

    new CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
    });
    new CfnOutput(this, "UserPoolClientId", {
      value: userPoolClient.userPoolClientId,
    });
    new CfnOutput(this, "UserPool.HostedUI.Domain", {
      value: domain.baseUrl(),
    });
    new CfnOutput(this, "IdentityPoolId", {
      value: identityPool.identityPoolId,
    });
  }
}

const app = new App();

new MyStack(app, 'hosted-ui-merge', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  }
});

app.synth();