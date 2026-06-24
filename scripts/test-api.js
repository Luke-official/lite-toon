// A simple script to test the /api/agent endpoint using TOON payloads.
// Ensure the Next.js dev server is running before executing this script.

async function testApi() {
  const url = 'http://localhost:3000/api/agent';
  
  // A sample TOON request to call the getUsers capability
  const payload = `request[1]{action, params}:
  "getUsers", "{}"`;

  console.log(`Sending TOON payload to ${url}:`);
  console.log('--------------------------------------------------');
  console.log(payload);
  console.log('--------------------------------------------------');

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain'
      },
      body: payload
    });

    const text = await response.text();

    console.log(`\nResponse Status: ${response.status} ${response.statusText}`);
    console.log('Response Body (TOON Format):');
    console.log('--------------------------------------------------');
    console.log(text);
    console.log('--------------------------------------------------');
  } catch (error) {
    console.error('\nError connecting to the API. Make sure the dev server is running (npm run dev).');
    console.error(error.message);
  }
}

testApi();
