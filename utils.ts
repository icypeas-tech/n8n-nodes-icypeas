import { URL } from 'url';
import Crypto from 'crypto';
import { INodeExecutionData } from 'n8n-workflow';
import { IApiKeys } from './types';

export function generateSignature(
	url: string,
	method: string,
	secret: string,
	timestamp: string = new Date().toISOString(),
): string {
	const endpoint = new URL(url).pathname;
	const payload = `${method}${endpoint}${timestamp}`.toLowerCase();
	const sign = Crypto.createHmac('sha1', secret).update(payload).digest('hex');

	return sign;
}

export async function processApiCall(
	url: string,
	keys: IApiKeys,
	body: string,
	single: boolean,
): Promise<INodeExecutionData[]> {
	const timestamp = new Date().toISOString();
	const signature = generateSignature(url, 'POST', keys.apiSecret, timestamp);
	const headers = {
		'Content-Type': 'application/json',
		Authorization: `${keys.apiKey}:${signature}`,
		'X-ROCK-TIMESTAMP': timestamp,
	};

	// Make the API call
	const response = await fetch(url, {
		method: 'POST',
		headers,
		body,
	});

	const responseData: any = await response.json();
	if (response.status === 200 && responseData.success) {
		if (single) {
			const status = responseData.item?.status;
			const searchId = responseData.item?._id;
			return [
				{
					json: {
						searchId: searchId,
						status: status,
						message: 'Single search successful!',
					},
				},
			];
		} else {
			const status = responseData.status;
			const fileId = responseData.file;
			return [
				{
					json: {
						status: status,
						fileId: fileId,
						message: 'Bulk search successful!',
					},
				},
			];
		}
	} else if (response.status === 200 && responseData.validationErrors) {
		const errorMessage = responseData.validationErrors
			.map((error: any) => error.message)
			.join(', ');
		throw new Error('Request validation error: ' + errorMessage);
	} else if (response.status === 401) {
		throw new Error('Unauthorized access.');
	} else {
		throw new Error('An unknown error occurred while processing the request.');
	}
}

