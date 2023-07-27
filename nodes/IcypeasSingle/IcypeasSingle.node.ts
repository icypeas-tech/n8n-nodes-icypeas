import { IExecuteFunctions } from 'n8n-core';
import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';

export class IcypeasSingle implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Icypeas-Single',
		name: 'IcypeasSingle',
		group: ['transform'],
		version: 1,
		description: 'Icypeas-Single Node for n8n will take care of the single searches (email verification, email search & domain search) with the Icypeas\'s API',
		defaults: {
			name: 'Example Node',
		},
		inputs: ['main'],
		outputs: ['main'],
		properties: [
			// Node properties which the user gets displayed and
			// can change on the node.
			{
				displayName: 'API Key',
				name: 'apiKey',
				type: 'string',
				default: '',
			},
			{
				displayName: 'API Secret',
				name: 'apiSecret',
				type: 'string',
				default: '',
			},
			{
				displayName: 'User ID',
				name: 'userId',
				type: 'string',
				default: '',
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				placeholder: 'Email to search',
				description: 'Email to search',
			},
			
		],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const items = this.getInputData();

		let item: INodeExecutionData;

		const apiKey = this.getNodeParameter('apiKey', 0) as string;
		const apiSecret = this.getNodeParameter('apiSecret', 0) as string;
		const userId = this.getNodeParameter('userId', 0) as string;

		const URL = "https://app.icypeas.com/api/email-verification";
		const METHOD = "POST";

		// Function to generate the signature
		const genSignature = (
			url: string,
			method: string,
			secret: string,
			timestamp: string = new Date().toISOString()
		) : string => {
			const URL = require('url').URL;
			const Crypto = require('crypto');
			const endpoint = new URL(url).pathname;
			const payload = `${method}${endpoint}${timestamp}`.toLowerCase();
			const sign = Crypto.createHmac("sha1", secret).update(payload).digest("hex");
	
			return sign;
		};

		// Iterates over all input items and add the key "response" with the result of the API call
		for (const item of items) {
			try {
				const email = item.json.email as string; // Get the email value from the input item

				const timestamp = new Date().toISOString();
				const signature = genSignature(URL, METHOD, apiSecret, timestamp);

				const bodyParameters = { email, };

				const headersParameters = { "X-ROCK-TIMESTAMP": timestamp,};

				// Make the API call with the provided parameters (apiKey, apiSecret, userId, etc.)
				const response = await this.helpers.request({
					method: 'POST',
					url: URL,
					body: bodyParameters,
					headers: {
						Authorization: `Basic ${Buffer.from(`${apiKey}:${signature}`).toString('base64')}`,
						"X-ROCK-TIMESTAMP": timestamp,
					},
				});

				if (response.success) {
					// If the API call was successful
					item.json['response'] = {
						success: true,
						message: 'Email verification successful!',
						data: {
							email,
							status: response.item?.status,
							// Add other relevant data here based on the Icypeas API response
						},
					};
				} else {
					// If the API call was not successful, check for specific errors
					if (response.validationErrors) {
						// If there are validation errors
						const errorMessage = response.validationErrors.map((error: any) => error.message).join(', ');
						throw new NodeOperationError(this.getNode(), errorMessage);
					} else if (response.error === 'UnauthorizedAccessError') {
						// If there was an unauthorized access error
						throw new NodeOperationError(this.getNode(), 'Unauthorized access. Please check your API credentials.');
					} else {
						// If there was a generic error
						throw new NodeOperationError(this.getNode(), 'An unknown error occurred while processing the request.');
					}
				}
			} catch (error) {
				// If there's an error, set the response message to indicate an error occurred
				item.json['response'] = {
					success: false,
					message: 'An error occurred while processing the item.',
				};
			}
		}

		return this.prepareOutputData(items);
	}
}
