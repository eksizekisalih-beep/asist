const fs = require('fs');

async function listModels() {
  let apiKey = '';
  try {
    const env = fs.readFileSync('.env.local', 'utf8');
    apiKey = env.match(/NEXT_PUBLIC_GEMINI_API_KEY=(.*)/)[1].trim();
  } catch (e) {
    console.error("Could not read .env.local", e);
    return;
  }

  try {
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
    const data = await response.json();
    if (data.models) {
      console.log(data.models.map(m => m.name).join('\n'));
    } else {
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (err) {
    console.error(err);
  }
}

listModels();
