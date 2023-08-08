import { IExecuteFunctions } from 'n8n-core';
import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { generateSignature } from '../../utils'; // Import the generateSignature function
import { processApiCall } from '../../utils';

export class IcypeasSingle implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Icypeas Single Search',
		name: 'IcypeasSingle',
		icon: 'file:logo.svg',
		group: ['transform'],
		version: 1,
		description: 'Icypeas-Single Node for n8n will take care of the single searches (email verification, email search & domain search) with the Icypeas\'s API',
		defaults: {
			name: 'Icypeas : Single Search',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'icypeasApi',
				required: true,
			},
		],
		properties: [
			// Node properties which the user gets displayed and
			// can change on the node.
			{
				displayName: 'Search Type',
				noDataExpression: true,
				name: 'searchType',
				type: 'options',
				options: [
					{
						name: 'Single Search',
						value: 'singleSearch',
						action: 'Single Search',
					},
					{
						name: 'Bulk Search',
						value: 'bulkSearch',
						action: 'Bulk Search',
					},
				],
				default: 'singleSearch',
				required: true,
			},
			{
				displayName: 'Task',
				noDataExpression: true,
				name: 'taskSingle',
				type: 'options',
				displayOptions: {
					show: {
						searchType: [
							'singleSearch',
						]
					},
				},
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
				default: 'email-verification',
				required: true,
			},
			{
				displayName: 'Email',
				name: 'email',
				type: 'string',
				default: '',
				placeholder: 'name@email.com',
				description: 'Email to search',
				displayOptions: {
					show: {
						taskSingle: [
							'email-verification',
						]
					},
				}
			},
			{
				displayName: 'First Name',
				name: 'firstname',
				type: 'string',
				default: '',
				placeholder: 'John',
				displayOptions: {
					show: {
						taskSingle: [
							'email-search',
						]
					},
				}
			},
			{
				displayName: 'Last Name',
				name: 'lastname',
				type: 'string',
				default: '',
				placeholder: 'Doe',
				displayOptions: {
					show: {
						taskSingle: [
							'email-search',
						]
					},
				}
			},
			{
				displayName: 'Domain Name',
				name: 'domain',
				type: 'string',
				default: '',
				placeholder: 'icypeas.com',
				displayOptions: {
					show: {
						taskSingle: [
							'email-search',
							'domain-search',
						]
					},
				}
			},
			{
				displayName: 'Task',
				noDataExpression: true,
				name: 'taskBulk',
				type: 'options',
				displayOptions: {
					show: {
						searchType: [
							'bulkSearch',
						]
					},
				},
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
						taskBulk: [
							'email-search',
							'domain-search',
							'email-verification',
						],
					},
				},
			},
			{
				displayName: 'Rename columns',
				name: 'renameColumns',
				type: 'collection',
				placeholder: 'Add New Column',
				description: 'You can set the columns names here if they are different from the default ones',
				default: {},
				displayOptions: {
					show: {
						taskBulk: [
							'email-search',
							'domain-search',
							'email-verification',
						],
					},
				},
				options: [
					{
						displayName: 'First Name',
						name: 'firstname',
						type: 'string',
						default: '',
						description: 'Default: firstname',
						placeholder: 'firstname',
					},
					{
						displayName: 'Last Name',
						name: 'lastname',
						type: 'string',
						default: '',
						description: 'Default: lastname',
						placeholder: 'lastname',
					},
					{
						displayName: 'Domain',
						name: 'domain',
						type: 'string',
						default: '',
						description: 'Default: company',
						placeholder: 'company',
					},
					{
						displayName: 'Email',
						name: 'email',
						type: 'string',
						default: '',
						description: 'Default: email',
						placeholder: 'email',
					},
				]
			}
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		//Get the credentials the user provided for this node :  apiKey and apiSecret
		const credentials = await this.getCredentials('icypeasApi');
		//const searchType = this.getNodeParameter('searchType', 0);
		//if ( searchType === 'singleSearch') {}

		if ( !credentials.apiKey || !credentials.apiSecret) {
			throw new NodeOperationError(this.getNode(), 'Credentials are missing.');
		}
		const apiKey = credentials.apiKey as string;
      	const apiSecret = credentials.apiSecret as string;

		const URL_email_verif = "https://app.icypeas.com/api/email-verification";
		const URL_email_search = "https://app.icypeas.com/api/email-search";
		const URL_domain_search = "https://app.icypeas.com/api/domain-search";
		
		const METHOD = "POST";

		try {
			const taskSingle = this.getNodeParameter('taskSingle', 0);

			if ( taskSingle === 'email-verification') {
				const timestamp = new Date().toISOString();
				// Generate the timestamp and signature
				const signature = generateSignature(URL_email_verif, METHOD, apiSecret, timestamp);

				const headers = {
					"Content-Type": "application/json",
					Authorization: `${apiKey}:${signature}`,
					"X-ROCK-TIMESTAMP": timestamp,
				};

				const email = this.getNodeParameter('email', 0) as string; // Get the email value from the node properties
				const bodyParameters = JSON.stringify({ email });

				const outputData = await processApiCall(URL_email_verif, headers, bodyParameters);
        		return [outputData];

			}else if ( taskSingle === 'email-search') {
				const timestamp = new Date().toISOString();
				const signature = generateSignature(URL_email_search, METHOD, apiSecret, timestamp);
				const headers = {
					"Content-Type": "application/json",
					Authorization: `${apiKey}:${signature}`,
					"X-ROCK-TIMESTAMP": timestamp,
				};

				const firstname = this.getNodeParameter('firstname', 0) as string; 
				const lastname = this.getNodeParameter('lastname', 0) as string; 
				const domainOrCompany = this.getNodeParameter('domain', 0) as string; 
				const bodyParameters = JSON.stringify({ firstname, lastname, domainOrCompany });

				const response = await fetch(URL_email_search, {
					method: "POST",
					headers: headers,
					body: bodyParameters,
				});

				const responseData: any = await response.json();
				if (response.status === 200 && responseData.success) {
					const status = responseData.item?.status;
					const searchId = responseData.item?._id;

					const outputData: INodeExecutionData[] = [
						{
							json: {
								searchId: searchId,
								status: status,
							},
						},
					];return [outputData];

				} else if (response.status === 200 && responseData.validationErrors) {
					const errorMessage = responseData.validationErrors.map((error: any) => error.message).join(', ');
					throw new NodeOperationError(this.getNode(), errorMessage);
				} else if (response.status === 401) {
					throw new NodeOperationError(this.getNode(), 'Unauthorized access.');
				} else {
					throw new NodeOperationError(this.getNode(), 'An unknown error occurred while processing the request.');
				}
			}
			
			else{
				const timestamp = new Date().toISOString();
				const signature = generateSignature(URL_domain_search, METHOD, apiSecret, timestamp);
				const headers = {
					"Content-Type": "application/json",
					Authorization: `${apiKey}:${signature}`,
					"X-ROCK-TIMESTAMP": timestamp,
				};
				const domainOrCompany = this.getNodeParameter('domain', 0) as string;
				const bodyParameters = JSON.stringify({ domainOrCompany });

				const response = await fetch(URL_domain_search, {
					method: "POST",
					headers: headers,
					body: bodyParameters,
				});

				const responseData: any = await response.json();

				if (response.status === 200 && responseData.success) {
					const status = responseData.item?.status;
					const searchId = responseData.item?._id;
					const outputData: INodeExecutionData[] = [
						{
							json: {
								searchId: searchId,
								status: status,
							},
						},
					];
					return [outputData];
				} else if (response.status === 200 && responseData.validationErrors) {
					const errorMessage = responseData.validationErrors.map((error: any) => error.message).join(', ');
					throw new NodeOperationError(this.getNode(), errorMessage);
				} else if (response.status === 401) {
					throw new NodeOperationError(this.getNode(), 'Unauthorized access.');
				} else {
					throw new NodeOperationError(this.getNode(), 'An unknown error occurred while processing the request.');
				}
			}

			
		} catch (error) {
			// If an error occurs, capture it here and throw it as an exception for n8n
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

