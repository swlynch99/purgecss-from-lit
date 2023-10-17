import { createHash } from 'crypto';

// In a separate file so it can be imported by both index.ts and its tests.
export const placeholder = 'placeholder' + createHash('sha256')
    .update('placeholder')
    .digest('hex');
