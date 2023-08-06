import { IExecuteFunctions } from 'n8n-core';
import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { generateSignature } from '../../utils';

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

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const credentials = await this.getCredentials('icypeasBulkApi');
		if (!credentials || !credentials.apiKey || !credentials.apiSecret || !credentials.userId) {
			throw new NodeOperationError(this.getNode(), 'Credentials are missing.');
		}

		const apiKey = credentials.apiKey as string;
      	const apiSecret = credentials.apiSecret as string;
		const user = credentials.userId as string;

		const URL = "https://app.icypeas.com/api/bulk-search";
		const METHOD = "POST";

		try {
			const task = this.getNodeParameter('task', 0);
			let name = this.getNodeParameter('name', 0);
			if (!name) {
				name = 'Test';
			}
			const timestamp = new Date().toISOString();
			const signature = generateSignature(URL, METHOD, apiSecret, timestamp);

			const headers = {
				"Content-Type": "application/json",
				Authorization: `${apiKey}:${signature}`,
				"X-ROCK-TIMESTAMP": timestamp,
			};

			if ( task === 'email-search') {
				const inputData = this.getInputData(0); //O : index of the first input
				const data : any[][] = [];
				for (let i = 0; i < inputData.length; i++) {
					const item = inputData[i];
					const firstName = item.json.firstname || '';
					const lastName = item.json.lastname || '';
					const company = item.json.company || '';

					data.push([firstName, lastName, company]);
				}
				console.log(data);
				const bodyParameters = JSON.stringify({ user, name, task, data });
				console.log(bodyParameters);

				const response = await fetch(URL, {
					method: "POST",
					headers: headers,
					body: bodyParameters,
				});

				const responseData: any = await response.json();
				if (response.status === 200 && responseData.success) {
					// If the request was successful (success = true) return results in the output data array
					const status = responseData.status;
        			const fileId = responseData.file;
					const outputData: INodeExecutionData[] = [
						{
							json: {
								message: 'Bulk email search successful!',
								status: status,
								fileId: fileId,
							},
						},
					];
					return [outputData];

				} else if (response.status === 200 && responseData.validationErrors) {
					console.log(responseData.validationErrors);
					const errorMessage = responseData.validationErrors.map((error: any) => error.message).join(', ');
					//throw new NodeOperationError(this.getNode(), errorMessage);
					throw new Error(errorMessage);
				} else if (response.status === 401) {
					throw new NodeOperationError(this.getNode(), 'Unauthorized access.');
				} else {
					throw new NodeOperationError(this.getNode(), 'An unknown error occurred while processing the request.');
				}
			}else if ( task === 'email-verification') {
				const inputData = this.getInputData(0); //O : index of the first input
				const data : any[][] = [];
				for (let i = 0; i < inputData.length; i++) {
					const item = inputData[i];
					const email = item.json.email || '';
					data.push([email]);
				}
				console.log(data);
				const bodyParameters = JSON.stringify({ user, name, task, data });
				console.log(bodyParameters);

				const response = await fetch(URL, {
					method: "POST",
					headers: headers,
					body: bodyParameters,
				});

				const responseData: any = await response.json();
				if (response.status === 200 && responseData.success) {
					const status = responseData.status;
        			const fileId = responseData.file;
					const outputData: INodeExecutionData[] = [
						{
							json: {
								message: 'Bulk email verification successful!',
								status: status,
								fileId: fileId,
							},
						},
					];
					return [outputData];

				} else if (response.status === 200 && responseData.validationErrors) {
					console.log(responseData.validationErrors);
					const errorMessage = responseData.validationErrors.map((error: any) => error.message).join(', ');
					//throw new NodeOperationError(this.getNode(), errorMessage);
					throw new Error(errorMessage);
				} else if (response.status === 401) {
					throw new NodeOperationError(this.getNode(), 'Unauthorized access.');
				} else {
					throw new NodeOperationError(this.getNode(), 'An unknown error occurred while processing the request.');
				}
			}
			else{
				const inputData = this.getInputData(0); //O : index of the first input
				console.log('Input Data:', inputData);
				const data : any[][] = [];
				for (let i = 0; i < inputData.length; i++) {
					const item = inputData[i];
					const company = item.json.company || '';
					data.push([company]);
				}
				console.log('Data :' , data);
				const bodyParameters = JSON.stringify({ user, name, task, data });
				console.log(bodyParameters);

				const response = await fetch(URL, {
					method: "POST",
					headers: headers,
					body: bodyParameters,
				});

				const responseData: any = await response.json();
				console.log('API Response:', responseData);

				if (response.status === 200 && responseData.success) {
					const status = responseData.status;
        			const fileId = responseData.file;
					const outputData: INodeExecutionData[] = [
						{
							json: {
								message: 'Bulk domain search successful!',
								status: status,
								fileId: fileId,
							},
						},
					];
					return [outputData];

				} else if (response.status === 200 && responseData.validationErrors) {
					console.log(responseData.validationErrors);
					const errorMessage = responseData.validationErrors.map((error: any) => error.message).join(', ');
					//throw new NodeOperationError(this.getNode(), errorMessage);
					throw new Error(errorMessage);
				} else if (response.status === 401) {
					throw new NodeOperationError(this.getNode(), 'Unauthorized access.');
				} else {
					throw new NodeOperationError(this.getNode(), 'An unknown error occurred while processing the request.');
				}
			}
		} catch (error) {
			if (error instanceof NodeOperationError && error.message === 'Unauthorized access.') {
				throw new NodeOperationError(this.getNode(), 'Unauthorized access.');
			} else if (error instanceof NodeOperationError && error.message === 'The search type you selected is not implemented yet.') {
				throw new NodeOperationError(this.getNode(), 'The search type you selected is not implemented yet.');
			} else if (error instanceof NodeOperationError && error.message === 'Credentials are missing.') {
				throw new NodeOperationError(this.getNode(), 'Credentials are missing.');
			}throw new NodeOperationError(this.getNode(), 'An unknown error occurred while processing the request.');
		}

	}
}
