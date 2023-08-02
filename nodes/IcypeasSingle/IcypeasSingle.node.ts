import { IExecuteFunctions } from 'n8n-core';
import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { generateSignature } from '../../utils'; // Import the generateSignature function

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
						searchType: [
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
						searchType: [
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
						searchType: [
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
						searchType: [
							'email-search',
							'domain-search',
						]
					},
				}
			},
		],
	};

	// The function below is responsible for actually doing whatever this node
	// is supposed to do. In this case, we're just appending the `myString` property
	// with whatever the user has entered.
	// You can make async calls and use `await`.
	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const credentials = await this.getCredentials('icypeasApi');
		if (!credentials || !credentials.apiKey || !credentials.apiSecret) {
			throw new NodeOperationError(this.getNode(), 'Credentials are missing.');
		}

		const apiKey = credentials.apiKey as string;
      	const apiSecret = credentials.apiSecret as string;

		//const userId = this.getNodeParameter('userId', 0) as string;

		const URL_email_verif = "https://app.icypeas.com/api/email-verification";
		const URL_email_search = "https://app.icypeas.com/api/email-search";
		const URL_domain_search = "https://app.icypeas.com/api/domain-search";
		const METHOD = "POST";

		try {
			const searchType = this.getNodeParameter('searchType', 0);
			const timestamp = new Date().toISOString();

			if ( searchType === 'email-verification') {
			// Generate the timestamp and signature
				const signature = generateSignature(URL_email_verif, METHOD, apiSecret, timestamp);

				const headers = {
					"Content-Type": "application/json",
					Authorization: `${apiKey}:${signature}`,
					"X-ROCK-TIMESTAMP": timestamp,
				};

				const email = this.getNodeParameter('email', 0) as string; // Get the email value from the node properties
				const bodyParameters = JSON.stringify({ email });


				// Make the API call with the provided parameters (apiKey, apiSecret, userId, etc.)
				const response = await fetch(URL_email_verif, {
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
					const status = responseData.item?.status;
					const searchId = responseData.item?._id;

					const outputData: INodeExecutionData[] = [
						{
							json: {
								searchId: searchId,
								status: status,
								message: 'Email verification successful!',
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

			}else if ( searchType === 'email-search') {
				// Generate the timestamp and signature
				const signature = generateSignature(URL_email_search, METHOD, apiSecret, timestamp);
				const headers = {
					"Content-Type": "application/json",
					Authorization: `${apiKey}:${signature}`,
					"X-ROCK-TIMESTAMP": timestamp,
				};

				const firstname = this.getNodeParameter('firstname', 0) as string; // Get the email value from the node properties
				const lastname = this.getNodeParameter('lastname', 0) as string; // Get the email value from the node properties
				const domain = this.getNodeParameter('domain', 0) as string; // Get the email value from the node properties
				const bodyParameters = JSON.stringify({ firstname, lastname, domain });


				// Make the API call with the provided parameters (apiKey, apiSecret, userId, etc.)
				const response = await fetch(URL_email_search, {
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
					const status = responseData.item?.status;
					const searchId = responseData.item?._id;

					const outputData: INodeExecutionData[] = [
						{
							json: {
								searchId: searchId,
								status: status,
								message: 'Email search successful!',
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
			}
			
			else{
				// Generate the timestamp and signature
				const signature = generateSignature(URL_domain_search, METHOD, apiSecret, timestamp);
				const headers = {
					"Content-Type": "application/json",
					Authorization: `${apiKey}:${signature}`,
					"X-ROCK-TIMESTAMP": timestamp,
				};

				const domain = this.getNodeParameter('domain', 0) as string; // Get the email value from the node properties
				const bodyParameters = JSON.stringify({ domain });

				// Make the API call with the provided parameters (apiKey, apiSecret, userId, etc.)
				const response = await fetch(URL_email_search, {
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
					const status = responseData.item?.status;
					const searchId = responseData.item?._id;

					const outputData: INodeExecutionData[] = [
						{
							json: {
								searchId: searchId,
								status: status,
								message: 'Domain search successful!',
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

