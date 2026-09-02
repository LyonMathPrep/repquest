// code for the worker that is used to store user data (their USERNAME and Rank) //


const APPS_SCRIPT_URL = '{Apps-script URL}'; // <-- PASTE THE URL OF THE DATABASE - IN THIS EXAMPLE WE HAVE USED A GOOGLE SHEET + opensheet (for read access) + google apps script (for write access) //

export default {
  async fetch(request, env, ctx) {
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Content-Type': 'application/json'
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const url = new URL(request.url);

    // 1. HANDLE GET (Checking if user exists for login sync)
    if (request.method === 'GET') {
      const usernameParam = url.searchParams.get('username');

      if (!usernameParam) {
        return new Response(JSON.stringify({ error: 'Username parameter is required' }), {
          status: 400, headers: corsHeaders
        });
      }

      try {
        const openSheetUrl = '{URL of the opensheet/read only database}';
        const response = await fetch(openSheetUrl);
        const rawData = await response.json();

        const userRow = rawData.find(row => 
          (row["Username:"] || "").toLowerCase() === usernameParam.toLowerCase()
        );

        if (userRow) {
          return new Response(JSON.stringify({
            found: true,
            username: userRow["Username:"],
            xp: parseInt(userRow["User-XP"] || "0", 10)
          }), { status: 200, headers: corsHeaders });
        } else {
          return new Response(JSON.stringify({ found: false }), { status: 200, headers: corsHeaders });
        }
      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to fetch data' }), {
          status: 500, headers: corsHeaders
        });
      }
    }

    // 2. HANDLE POST (Updating XP when workout ends)
    if (request.method === 'POST') {
      try {
        const body = await request.json();
        
        // Forward the POST request to Google Apps Script
        const response = await fetch(APPS_SCRIPT_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body)
        });

        const textResponse = await response.text();
        
        return new Response(textResponse, {
          status: 200, headers: corsHeaders
        });

      } catch (error) {
        return new Response(JSON.stringify({ error: 'Failed to sync XP' }), {
          status: 500, headers: corsHeaders
        });
      }
    }

    return new Response(JSON.stringify({ error: 'Method Not Allowed' }), {
      status: 405, headers: corsHeaders
    });
  }
};
