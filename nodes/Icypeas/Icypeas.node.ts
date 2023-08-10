import { IExecuteFunctions } from 'n8n-core';
import {
	INodeExecutionData,
	INodeType,
	INodeTypeDescription,
	NodeOperationError,
} from 'n8n-workflow';
import { IApiKeys } from '../../types';
import * as Utils from '../../utils';
import * as Constants from './constants';

export class Icypeas implements INodeType {
	description: INodeTypeDescription = {
		displayName: 'Icypeas',
		name: 'Icypeas',
		icon: 'file:logo.svg',
		group: ['transform'],
		version: 1,
		description:
			'Icypeas Node for n8n will take care of the single and bulk searches (verify emails, search for emails, discover all generic emails from a domain)',
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
		properties: [
			// Node properties
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
						description: 'When you need to discover or verify only one email address',
					},
					{
						name: 'Bulk Search',
						value: 'bulkSearch',
						description: 'When you need to discover or verify more than one email addresses',
					},
				],
				default: 'singleSearch',
				required: true,
			},
			{
				displayName: 'Task',
				noDataExpression: true,
				name: 'singleSearchTask',
				type: 'options',
				displayOptions: {
					show: {
						searchType: ['singleSearch'],
					},
				},
				options: [
					{
						name: 'Email Verification',
						value: 'email-verification',
						description: 'Verify that an email address exists',
					},
					{
						name: 'Email Search',
						value: 'email-search',
						description: 'Look for the email address of your prospect',
					},
					{
						name: 'Domain Search',
						value: 'domain-search',
						description: 'Discover all generics email addresses for a domain or a company',
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
						singleSearchTask: ['email-verification'],
					},
				},
			},
			{
				displayName: 'First Name',
				name: 'firstname',
				type: 'string',
				default: '',
				placeholder: 'John',
				displayOptions: {
					show: {
						singleSearchTask: ['email-search'],
					},
				},
			},
			{
				displayName: 'Last Name',
				name: 'lastname',
				type: 'string',
				default: '',
				placeholder: 'Doe',
				displayOptions: {
					show: {
						singleSearchTask: ['email-search'],
					},
				},
			},
			{
				displayName: 'Domain Name',
				name: 'domainOrCompany',
				type: 'string',
				default: '',
				placeholder: 'icypeas.com',
				displayOptions: {
					show: {
						singleSearchTask: ['email-search', 'domain-search'],
					},
				},
			},
			{
				displayName: 'Task',
				noDataExpression: true,
				name: 'bulkSearchTask',
				type: 'options',
				displayOptions: {
					show: {
						searchType: ['bulkSearch'],
					},
				},
				options: [
					{
						name: 'Email Verification',
						value: 'email-verification',
						description: 'Verify that an email address exists',
					},
					{
						name: 'Email Search',
						value: 'email-search',
						description: 'Look for the email address of your prospect',
					},
					{
						name: 'Domain Search',
						value: 'domain-search',
						description: 'Discover all generics email addresses for a domain or a company',
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
						bulkSearchTask: ['email-search', 'domain-search', 'email-verification'],
					},
				},
			},
			{
				displayName: 'Rename Columns',
				name: 'renameColumns',
				type: 'collection',
				placeholder: 'Add New Column',
				description:
					'You can set the columns names here if they are different from the default ones',
				default: {},
				displayOptions: {
					show: {
						bulkSearchTask: ['email-search', 'domain-search', 'email-verification'],
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
						name: 'domainOrCompany',
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
				],
			},
		],
	};

	async execute(this: IExecuteFunctions): Promise<INodeExecutionData[][]> {
		const credentials = await this.getCredentials('icypeasApi');
		const searchType = this.getNodeParameter('searchType', 0);

		if (!credentials.apiKey || !credentials.apiSecret) {
			throw new NodeOperationError(this.getNode(), 'Credentials are missing.');
		}

		try {
			const taskName = this.getNodeParameter(`${searchType}Task`, 0) as string;
			const myUrl =
				searchType === 'singleSearch'
					? `${Constants.ICYPEAS_HOSTNAME}/api/${taskName}`
					: `${Constants.ICYPEAS_HOSTNAME}/api/bulk-search`;
			let bodyParameters: any = {};
			const taskFields = Constants.tasks.get(taskName)!;
			if (searchType === 'singleSearch') {
				bodyParameters = JSON.stringify(
					taskFields.reduce((params: any, field: string) => {
						params[field] = this.getNodeParameter(field, 0) as string;
						return params;
					}, {}),
				);
			} else {
				if (!credentials.userId)
					throw new NodeOperationError(
						this.getNode(),
						'Credentials are missing: userId for bulk search.',
					);
				const user = credentials.userId as string;
				const name =
					(this.getNodeParameter('name', 0) as string) || Constants.DEFAULT_BULKSEARCH_NAME;
				const renameColumns = this.getNodeParameter('renameColumns', 0) as {
					[key: string]: string | undefined;
				};
				const inputData = this.getInputData(0); //O : index of the first input
				const data: any[][] = inputData.map((item) => {
					return taskFields.map((field) => {
						const f: string = renameColumns[field] || field;
						return item.json[f] || '';
					});
				});
				bodyParameters = JSON.stringify({ user, name, task: taskName, data });
			}
			const outputData = await Utils.processApiCall(
				myUrl,
				credentials as unknown as IApiKeys,
				bodyParameters,
				searchType === 'singleSearch',
			);
			return [outputData];
		} catch (error) {
			if (error instanceof Error && error.message === 'Unauthorized access.') {
				throw new NodeOperationError(this.getNode(), 'Unauthorized access.');
			} else if (
				error instanceof NodeOperationError &&
				error.message === 'Credentials are missing.'
			) {
				throw new NodeOperationError(this.getNode(), 'Credentials are missing.');
			} else if (
				error instanceof NodeOperationError &&
				error.message === 'Credentials are missing: userId for bulk search.'
			) {
				throw new NodeOperationError(
					this.getNode(),
					'Credentials are missing: userId for bulk search.',
				);
			}
			throw new NodeOperationError(
				this.getNode(),
				'An unknown error occurred while processing the request.',
			);
		}
	}
}
