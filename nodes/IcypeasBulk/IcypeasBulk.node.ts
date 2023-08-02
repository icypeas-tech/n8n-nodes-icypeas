import { IExecuteFunctions } from 'n8n-core';
import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { generateSignature } from '../../utils'; // Import the generateSignature function

export class IcypeasBulk implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Icypeas Bulk Search',
		name: 'IcypeasBulk',
		icon: 'file:logo.svg',
		group: ['transform'],
		version: 1,
		description: 'Icypeas-Bulk Node for n8n will take charge of the bulk searches (email verification, email search & domain search) with the Icypeas\'s API',
		defaults: {
			name: 'Icypeas : Bulk Search',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'icypeasBulkApi',
				required: true,
			},
		],
		properties: [
			// Node properties which the user gets displayed and
			// can change on the node.
			{
				displayName: 'Task',
				noDataExpression: true,
				name: 'task',
				type: 'options',
				options: [
					{
						name: 'Email Verification',
						value: 'email-verification',
					},
					{
						name: 'Email Search',
						value: 'email-search',
						description: 'Requires the person\'s first name and last name, and a domain',
					},
					{
						name: 'Domain Search',
						value: 'domain-search',
					},
				],
				default: 'email-search',
				required: true,
			},
			{
				displayName: 'Name',
				name: 'name',
				type: 'string',
				default: '',
				placeholder: 'Test',
				description: 'The name of the test you want to make',
				displayOptions: {
					show: {
						task: [
							'email-search',
							'domain-search',
							'email-verification',
						],
					},
				},
			},
		],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const credentials = await this.getCredentials('icypeasBulkApi');
		if (!credentials) {
			throw new NodeOperationError(this.getNode(), 'Credentials are missing.');
		}

		const apiKey = credentials.apiKey as string;
      	const apiSecret = credentials.apiSecret as string;
		const userId = credentials.userId as string;

		const URL = "https://app.icypeas.com/api/bulk-search";
		const METHOD = "POST";

		try {
			const task = this.getNodeParameter('task', 0);
			const name = this.getNodeParameter('name', 0);

			if ( task === 'email-search') {
				// Read data from the input items
							// Generate the timestamp and signature
				const timestamp = new Date().toISOString();
				const signature = generateSignature(URL, METHOD, apiSecret, timestamp);

				const headers = {
					"Content-Type": "application/json",
					Authorization: `${apiKey}:${signature}`,
					"X-ROCK-TIMESTAMP": timestamp,
				};
				const items = this.getInputData();

				// Prepare the data for the API request
				const data = items.map((item) => {
			  		const firstName = item.json.firstName || '';
			  		const lastName = item.json.lastName || '';
			  		const company = item.json.company || '';
			  		return [firstName, lastName, company];
				});

				const bodyParameters = JSON.stringify({ task, userId, name, data });

				// Make the API call with the provided parameters (apiKey, apiSecret, userId, etc.)
				const response = await fetch(URL, {
					method: "POST",
					headers: headers,
					body: bodyParameters,
				});

				// Parse the API response
				//const responseData = await response.json() as IApiResponse;
				const responseData: any = await response.json();

				// Check the API response and handle it accordingly
				if (response.status === 200 && responseData.success) {
					// If the request was successful (success = true)
					// Return results in the output data array
					const status = responseData.status;
        			const fileId = responseData.file;

					const outputData: INodeExecutionData[] = [
						{
							json: {
								message: 'Bulk search successful!',
								status: status,
								fileId: fileId,
							},
						},
					];
					return [outputData];

				} else if (response.status === 200 && responseData.validationErrors) {
					// If the request was successful but validationErrors = true
					const errorMessage = responseData.validationErrors.map((error: any) => error.message).join(', ');
					throw new NodeOperationError(this.getNode(), errorMessage);
				} else if (response.status === 401) {
					// If the request returns an error 401 (Unauthorized)
					throw new NodeOperationError(this.getNode(), 'Unauthorized access.');
				} else {
					// Generic error
					throw new NodeOperationError(this.getNode(), 'An unknown error occurred while processing the request.');
				}

			}else{
				throw new NodeOperationError(this.getNode(), 'The search type you selected is not implemented yet.');
			}

		} catch (error) {
			// If an error occurs, capture it here and throw it as an exception for n8n
			throw new NodeOperationError(this.getNode(), 'An error occurred while processing the request.');
		}

	}
}
