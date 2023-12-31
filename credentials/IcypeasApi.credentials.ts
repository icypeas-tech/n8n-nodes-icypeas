import { ICredentialType, INodeProperties, JsonObject } from 'n8n-workflow';
import * as Utils from '../utils';

export class IcypeasApi implements ICredentialType {
	name = 'icypeasApi';
	displayName = 'Icypeas API';
	properties: INodeProperties[] = [
		{
			displayName: 'API Key',
			name: 'apiKey',
			type: 'string',
			typeOptions: {
				password: true,
			},
			default: '',
		},
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
			displayName: 'User ID',
			name: 'userId',
			type: 'string',
			default: '',
		},
	];

	async authenticateRequest(this: any, request: any): Promise<void> {
		const credentials = this.getCredentials();
		const apiKey = credentials.apiKey as string;
		const apiSecret = credentials.apiSecret as string;
		const timestamp = new Date().toISOString();
		const signature = Utils.generateSignature(
			'https://app.icypeas.com/api/email-verification',
			'POST',
			apiSecret,
			timestamp,
		);

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
		userId?: string;
	} {
		return {
			apiKey: this.getCredential('apiKey') as string,
			apiSecret: this.getCredential('apiSecret') as string,
			userId: this.getCredential('userId') as string,
		};
	}
}
