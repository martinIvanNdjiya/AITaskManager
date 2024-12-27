import OpenAI from 'openai';

if (!import.meta.env.VITE_OPENAI_API_KEY) {
    console.error('Missing OpenAI API Key in environment variables.');
}

if (!import.meta.env.VITE_OPENAI_ORG_ID) {
    console.warn('OpenAI Organization ID not provided.');
}

const openai = new OpenAI({
    dangerouslyAllowBrowser: true,
    apiKey: import.meta.env.VITE_OPENAI_API_KEY,
    organization: import.meta.env.VITE_OPENAI_ORG_ID, 
});

console.log('OpenAI API Key:', import.meta.env.VITE_OPENAI_API_KEY);
console.log('OpenAI Organization ID:', import.meta.env.VITE_OPENAI_ORG_ID);

export { openai };
