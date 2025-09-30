// Test workflow API call
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVmeW5rcmFhbmhqd2ZqZXRuY2NwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc5OTc1NTEsImV4cCI6MjA3MzU3MzU1MX0.7qUX4HszRbSWk6EdiONiytzE4xdYCvlAtUuPgD0842k';
const testClerkToken = 'test_token';

fetch('https://efynkraanhjwfjetnccp.supabase.co/functions/v1/run-intelligence-workflow', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${supabaseAnonKey}`,
    'x-clerk-token': testClerkToken
  },
  body: JSON.stringify({
    fullName: 'Test User',
    websiteUrl: 'https://example.com',
    industry: 'Technology',
    location: 'United States'
  })
})
.then(response => {
  console.log('Status:', response.status);
  return response.text();
})
.then(text => {
  console.log('Response body:', text);
  try {
    const json = JSON.parse(text);
    console.log('Parsed JSON:', JSON.stringify(json, null, 2));
  } catch (e) {
    console.log('Could not parse as JSON');
  }
})
.catch(error => {
  console.error('Fetch error:', error);
});