import { URL } from 'url';
import Crypto from 'crypto';

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