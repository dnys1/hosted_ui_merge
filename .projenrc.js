const { awscdk } = require('projen');
const project = new awscdk.AwsCdkTypeScriptApp({
  cdkVersion: '2.73.0',
  defaultReleaseBranch: 'main',
  name: 'hosted_ui_merge',
  deps: [
    "@aws-cdk/aws-cognito-identitypool-alpha",
    "@aws-sdk/client-cognito-identity-provider",
  ],
  devDeps: [
    "@types/aws-lambda",
  ],
  gitignore: [
    "creds/"
  ],
});
project.synth();