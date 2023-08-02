import {
	//IAuthenticateGeneric,
	//ICredentialTestRequest,
	ICredentialType,
	INodeProperties,
	JsonObject,
} from 'n8n-workflow';
import { generateSignature } from '../utils'; // Import the generateSignature function

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
	/*authenticate: IAuthenticateGeneric = {
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
	};*/

	async authenticateRequest(this: any, request: any): Promise<void> {
		// Add authentication to the request
		const credentials = this.getCredentials();
    	const apiKey = credentials.apiKey as string;
    	const apiSecret = credentials.apiSecret as string;
    	const timestamp = new Date().toISOString();
    	const signature = generateSignature(
      		'https://app.icypeas.com/api/email-verification',
      		'POST',
      		apiSecret,
      		timestamp
    	);

    	// Explicitly cast request.headers to JsonObject
    	(request.headers as JsonObject) = {
      		...(request.headers as JsonObject),
      		'Content-Type': 'application/json',
      		Authorization: `${apiKey}:${signature}`,
      		'X-ROCK-TIMESTAMP': timestamp,
    	};
	}

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
