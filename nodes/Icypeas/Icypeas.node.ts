import { IExecuteFunctions } from 'n8n-core';
import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { generateSignature, processApiCallSingle, processApiCallBulk } from '../../utils'; // Import the generateSignature & processApiCall functions

export class Icypeas implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Icypeas',
		name: 'Icypeas',
		icon: 'file:logo.svg',
		group: ['transform'],
		version: 1,
		description: 'Icypeas Node for n8n will take care of the single and bulk searches (email verification, email search, domain search) with the Icypeas\'s API',
		defaults: {
			name: 'Icypeas',
		},
		inputs: ['main'],
		outputs: ['main'],
		credentials: [
			{
				name: 'icypeasApi',
				required: true,
			},
		],
		properties: [ // Node properties
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
						description: 'Requires a file with the informations to search',
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
				default: 'email-verification',
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
		const credentials = await this.getCredentials('icypeasApi');
		const searchType = this.getNodeParameter('searchType', 0);

		if ( !credentials.apiKey || !credentials.apiSecret) {
			throw new NodeOperationError(this.getNode(), 'Credentials are missing.');
		}
		const apiKey = credentials.apiKey as string;
      	const apiSecret = credentials.apiSecret as string;

		try {
			if ( searchType === 'singleSearch') {
				const taskSingle = this.getNodeParameter('taskSingle', 0);
				const URL_single = `https://app.icypeas.com/api/${taskSingle}`;
				//const URL_email_verif = "https://app.icypeas.com/api/email-verification";
				//const URL_email_search = "https://app.icypeas.com/api/email-search";
				//const URL_domain_search = "https://app.icypeas.com/api/domain-search";
				const timestamp = new Date().toISOString();
				const signature = generateSignature(URL_single, "POST", apiSecret, timestamp);
				const headers = {
					"Content-Type": "application/json",
					Authorization: `${apiKey}:${signature}`,
					"X-ROCK-TIMESTAMP": timestamp,
				};

				let bodyParameters = JSON.stringify({});

				if ( taskSingle === 'email-verification') {
					const email = this.getNodeParameter('email', 0) as string; // Get the email value from the node properties
					bodyParameters = JSON.stringify({ email });
				}
				else if ( taskSingle === 'email-search') {
					const firstname = this.getNodeParameter('firstname', 0) as string; 
					const lastname = this.getNodeParameter('lastname', 0) as string; 
					const domainOrCompany = this.getNodeParameter('domain', 0) as string; 
					bodyParameters = JSON.stringify({ firstname, lastname, domainOrCompany });
				}
				else{
					const domainOrCompany = this.getNodeParameter('domain', 0) as string;
					bodyParameters = JSON.stringify({ domainOrCompany });
				}
				const outputData = await processApiCallSingle(URL_single, headers, bodyParameters);
				return [outputData];
			}else{
				const task = this.getNodeParameter('taskBulk', 0);

				if (!credentials.userId) {
					throw new NodeOperationError(this.getNode(), 'Credentials are missing: userId for bulk search.');
				}
				const user = credentials.userId as string;
				
				let name = this.getNodeParameter('name', 0);
				if (!name) {
					name = 'Test';
				}
				
				const renameColumns = this.getNodeParameter('renameColumns', 0) as {
					firstname?: string;
					lastname?: string;
					domain?: string;
					email?: string;
				};

				const URL_bulk = "https://app.icypeas.com/api/bulk-search";
			
				const timestamp = new Date().toISOString();
				const signature = generateSignature(URL_bulk, "POST", apiSecret, timestamp);

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
						const firstName = renameColumns.firstname ? item.json[renameColumns.firstname] : item.json.firstname || '';
						const lastName = renameColumns.lastname ? item.json[renameColumns.lastname] : item.json.lastname || '';
						const company = renameColumns.domain ? item.json[renameColumns.domain] : item.json.company || '';
						data.push([firstName, lastName, company]);
					}

					const bodyParameters = JSON.stringify({ user, name, task, data });
	
					const outputData = await processApiCallBulk(URL_bulk, headers, bodyParameters);
					return [outputData];

				}else if ( task === 'email-verification' ) {
					const inputData = this.getInputData(0); //O : index of the first input
					const data : any[][] = [];
					for (let i = 0; i < inputData.length; i++) {
						const item = inputData[i];
						const email = renameColumns.email ? item.json[renameColumns.email] : item.json.email || '';
						data.push([email]);
					}
					
					const bodyParameters = JSON.stringify({ user, name, task, data });

					const outputData = await processApiCallBulk(URL_bulk, headers, bodyParameters);
					return [outputData];
				}
				else{
					const inputData = this.getInputData(0); //O : index of the first input
					const data : any[][] = [];
					for (let i = 0; i < inputData.length; i++) {
						const item = inputData[i];
						const company = renameColumns.domain ? item.json[renameColumns.domain] : item.json.company || '';
						data.push([company]);
					}
					
					const bodyParameters = JSON.stringify({ user, name, task, data });
					
					const outputData = await processApiCallBulk(URL_bulk, headers, bodyParameters);
					return [outputData];
				}
			}

		} catch (error) {
			if (error instanceof Error && error.message === 'Unauthorized access.') {
				throw new NodeOperationError(this.getNode(), 'Unauthorized access.');
			} else if (error instanceof NodeOperationError && error.message === 'Credentials are missing.') {
				throw new NodeOperationError(this.getNode(), 'Credentials are missing.');
			} else if (error instanceof NodeOperationError && error.message === 'Credentials are missing: userId for bulk search.') {
				throw new NodeOperationError(this.getNode(), 'Credentials are missing: userId for bulk search.');
			}throw new NodeOperationError(this.getNode(), 'An unknown error occurred while processing the request.');
		}
	}
}

