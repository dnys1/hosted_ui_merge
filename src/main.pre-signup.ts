import { PreSignUpTriggerHandler } from "aws-lambda";
import { CognitoIdentityProvider } from "@aws-sdk/client-cognito-identity-provider";

const CLIENT = new CognitoIdentityProvider({});

export const handler: PreSignUpTriggerHandler = async (event) => {
    console.log(`Got event: ${JSON.stringify(event, null, 2)}`);

    const {
        triggerSource,
        userPoolId,
        userName,
        request: {
            userAttributes: { email },
        },
    } = event;


    const listResp = await listUsersByEmail({
        userPoolId,
        email,
    });
    const usersForEmail = listResp.Users || [];
    console.log(`Users for ${email}: ${JSON.stringify(usersForEmail, null, 2)}`);

    if (triggerSource !== 'PreSignUp_ExternalProvider' || usersForEmail.length === 0) {
        event.response = {
            autoConfirmUser: true,
            autoVerifyEmail: true,
            autoVerifyPhone: false,
        }
        return event;
    }

    const existingUser = usersForEmail[0];
    const existingUsername = usersForEmail[0].Username!;
    const [providerName, providerUserId] = userName.split("_");
    console.log(`Found existing native account: ${JSON.stringify(existingUser, null, 2)}`);
    console.log(`Linking external account "${userName}" into native account "${existingUsername}"`);

    const linkedAccounts = await adminLinkUserAccounts({
        username: existingUsername,
        userPoolId,
        providerName,
        providerUserId,
    });
    console.log(`Linked accounts: ${JSON.stringify(linkedAccounts, null, 2)}`);

    event.response = {
        autoConfirmUser: true,
        autoVerifyEmail: true,
        autoVerifyPhone: false,
    }
    return event;
};

export const listUsersByEmail = async ({
    userPoolId,
    email,
}: {
    userPoolId: string;
    email: string;
}) => {
    return CLIENT.listUsers({
        UserPoolId: userPoolId,
        Filter: `email = "${email}"`,
    });
};

export const adminLinkUserAccounts = async ({
    username,
    userPoolId,
    providerName,
    providerUserId,
}: {
    username: string;
    userPoolId: string;
    providerName: string;
    providerUserId: string;
}) => {
    return CLIENT.adminLinkProviderForUser({
        DestinationUser: {
            ProviderAttributeValue: username,
            ProviderName: "Cognito",
        },
        SourceUser: {
            ProviderAttributeName: "Cognito_Subject",
            ProviderAttributeValue: providerUserId,
            ProviderName: providerName,
        },
        UserPoolId: userPoolId,
    });
};
