import {
	IAuthenticateGeneric,
	ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
} from 'n8n-workflow';

export class IcypeasApi implements ICredentialType {
	name = 'icypeasApi';
	displayName = 'Icypeas API';
	properties: INodeProperties[] = [
		// The credentials to get from user and save encrypted.
		// Properties can be defined exactly in the same way
		// as node properties.
		{
			displayName: 'API Secret',
			name: 'apiSecret',
			type: 'string',
			typeOptions: {
			  	password: true,
			},
			default: '',
		},
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
		/*{
			displayName: 'User ID',
			name: 'userId',
			type: 'string',
			default: '',
		},*/
	];


	// This credential is currently not used by any node directly
	// but the HTTP Request node can use it to make requests.
	// The credential is also testable due to the `test` property below
	authenticate: IAuthenticateGeneric = {
		type: 'generic',
		properties: {
			auth: {
				username: '={{ $credentials.apiKey }}',
				password: '={{ $credentials.apiSecret }}',
			},
			qs: {
				// Send this as part of the query string
				n8n: 'rocks',
			},
		},
	};

	// The block below tells how this credential can be tested
	test: ICredentialTestRequest = {
		request: {
			baseURL: 'https://app.icypeas.com/api',
			url: '/email-verification',
			method: 'POST',
			body: {
				data: [{ email: '' }],
			},
		},
	};

	getCredentials(this: any): {
		apiKey: string;
		apiSecret: string;
	} {
		return {
			apiKey: this.getCredential('apiKey') as string,
			apiSecret: this.getCredential('apiSecret') as string,
		};
	}
}
