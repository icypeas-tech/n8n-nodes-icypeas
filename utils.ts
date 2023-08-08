import { URL } from 'url';
import Crypto from 'crypto';

//import fetch from 'node-fetch';
import {
	INodeExecutionData,    
} from 'n8n-workflow';

export function generateSignature(
    url: string,
    method: string,
    secret: string,
    timestamp: string = new Date().toISOString()
): string {
    const endpoint = new URL(url).pathname;
    const payload = `${method}${endpoint}${timestamp}`.toLowerCase();
    const sign = Crypto.createHmac("sha1", secret).update(payload).digest("hex");

    return sign;
}

export async function processApiCall(url: string, headers: any, body: string): Promise<INodeExecutionData[]> {
// Make the API call     
    const response = await fetch(url, {
        method: "POST",
        headers: headers,
        body: body,
    });

// Parse the API response
    const responseData: any = await response.json();
    
    if (response.status === 200 && responseData.success) {// If the request was successful (success = true) return results in the output data array
        const status = responseData.item?.status;
        const searchId = responseData.item?._id;
        return [
            {
                json: {
                    searchId: searchId,
                    status: status,
                },
            },
        ];
    } else if (response.status === 200 && responseData.validationErrors) {
        const errorMessage = responseData.validationErrors.map((error: any) => error.message).join(', ');
        throw new Error('Request validation error: ' + errorMessage);
    } else if (response.status === 401) {
        throw new Error('Unauthorized access.');
    } else {
        throw new Error('An unknown error occurred while processing the request.');
    }
}