import { IExecuteFunctions } from 'n8n-core';
import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import fetch from 'node-fetch'; // Import the fetch function

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

		try {
			const email = this.getNodeParameter('email', 0) as string; // Get the email value from the node properties

			// Generate the timestamp and signature
			const timestamp = new Date().toISOString();
			const signature = genSignature(URL, METHOD, apiSecret, timestamp);

			const bodyParameters = JSON.stringify({ email });

			const headers = {
					"Content-Type": "application/json",
					Authorization: `${apiKey}:${signature}`,
					"X-ROCK-TIMESTAMP": timestamp,
			};

			// Make the API call with the provided parameters (apiKey, apiSecret, userId, etc.)
			const response = await this.helpers.request({
				method: 'POST',
				url: URL,
				body: bodyParameters,
				headers: headers,
			});

			if (response.status === 200 && response.data.success) {
				// If request (code 200) was successful (success = true)
				// return results in the output data array
				const status = response.data.item?.status;
				const searchId = response.data.item?._id;
	
				const outputData: INodeExecutionData[] = [
					{
						json: {
							searchId: searchId,
							status: status,
							message: 'Email verification successful!',
						}
					}
				];
				return [outputData];

				} else if (response.status === 200 && response.data.validationErrors) {
					// If request (code 200) was successful but validationErrors = true
					const errorMessage = response.data.validationErrors.map((error: any) => error.message).join(', ');
					throw new NodeOperationError(this.getNode(), errorMessage);

				} else if (response.status === 401) {
					// If the request send an error 401 (Unauthorized)
					throw new NodeOperationError(this.getNode(), 'Unauthorized access.');
				
				} else {
					// generic error
					throw new NodeOperationError(this.getNode(), 'An unknown error occurred while processing the request.');
				}
			} catch (error) {
				// Si une erreur se produit, capturez-la ici et renvoyez-la en tant qu'exception pour n8n
				throw new NodeOperationError(this.getNode(), 'An error occurred while processing the request.');
			}
	}
}
