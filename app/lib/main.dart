import 'dart:convert';

import 'package:amplify_auth_cognito/amplify_auth_cognito.dart';
import 'package:amplify_authenticator/amplify_authenticator.dart';
import 'package:amplify_flutter/amplify_flutter.dart';
import 'package:flutter/material.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  final config = AmplifyConfig(
    auth: AuthConfig.cognito(
      userPoolConfig: const CognitoUserPoolConfig(
        region: 'us-west-2',
        poolId: 'us-west-2_RZeyG7E05',
        appClientId: '3e60o18c6bvu3ubg3kntghn040',
      ),
      hostedUiConfig: const CognitoOAuthConfig(
        webDomain: 'hosted-ui-merge.auth.us-west-2.amazoncognito.com',
        scopes: [
          'profile',
          'email',
          'openid',
          'aws.cognito.signin.user.admin',
        ],
        appClientId: '3e60o18c6bvu3ubg3kntghn040',
        signInRedirectUri: 'http://localhost:3000/,myapp://',
        signOutRedirectUri: 'http://localhost:3000/,myapp://',
      ),
      identityPoolConfig: const CognitoIdentityCredentialsProvider(
        region: 'us-west-2',
        poolId: 'us-west-2:69f6e095-b934-46a1-8d15-5a22281c0df0',
      ),
      signupAttributes: const [
        CognitoUserAttributeKey.email,
      ],
      socialProviders: const [
        SocialProvider.amazon,
        SocialProvider.google,
      ],
    ),
  );
  await Amplify.addPlugin(AmplifyAuthCognito());
  await Amplify.configure(jsonEncode(config));

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return Authenticator(
      child: MaterialApp(
        title: 'Hosted UI Merge',
        theme: ThemeData(
          primarySwatch: Colors.blue,
        ),
        builder: Authenticator.builder(),
        home: const MyHomePage(),
      ),
    );
  }
}

class MyHomePage extends StatelessWidget {
  const MyHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Hosted UI Merge'),
      ),
      body: const Center(
        child: SignOutButton(),
      ),
    );
  }
}
