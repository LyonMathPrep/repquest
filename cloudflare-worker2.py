import json
from urllib.parse import urlparse, parse_qs
from workers import WorkerEntrypoint, Response, fetch

class Default(WorkerEntrypoint):
    async def fetch(self, request):
        # 1. Define CORS headers as a standard Python dictionary
        cors_headers = {
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
            "Access-Control-Allow-Headers": "Content-Type",
            "Content-Type": "application/json"
        }

        # Handle CORS preflight request
        if request.method == "OPTIONS":
            return Response("", headers=cors_headers)

        apps_script_url = 'https://script.google.com/macros/s/AKfycbxwmerPBmDLKLb198m5TyU4E65s979aKInpZSSZJUCeVncrezetwmTpydMlW-A25rSx/exec'
        open_sheet_url = 'https://opensheet.elk.sh/1XuAZ2VK-PJq-m473M8jk5Z91i5DRazL6u1JI-aYGrPM/responses1ver1'

        # Parse URL using standard Python libraries
        url_parsed = urlparse(request.url)
        query_params = parse_qs(url_parsed.query)
        
        # parse_qs returns a dict where each value is a list of strings
        username_list = query_params.get("username", [None])
        username_param = username_list[0] if username_list else None
        
        # --- 1. HANDLE GET ---
        if request.method == "GET":
            if not username_param:
                error_payload = json.dumps({"error": "Username parameter is required"})
                return Response(error_payload, status=400, headers=cors_headers)

            try:
                # Fetch from OpenSheet
                res = await fetch(open_sheet_url)
                raw_data = await res.json()
                
                # Safely convert JS proxy objects to native Python lists/dicts
                if hasattr(raw_data, "to_py"):
                    raw_data = raw_data.to_py()
                
                user_row = None
                for row in raw_data:
                    row_username = row.get("Username:", "")
                    if row_username.lower() == username_param.lower():
                        user_row = row
                        break
                
                if user_row:
                    username = user_row.get("Username:")
                    xp_str = user_row.get("User-XP") or "0"
                    xp = int(xp_str) if str(xp_str).lstrip('-').isdigit() else 0
                    
                    success_payload = json.dumps({
                        "found": True,
                        "username": username,
                        "xp": xp
                    })
                    return Response(success_payload, status=200, headers=cors_headers)
                else:
                    not_found_payload = json.dumps({"found": False})
                    return Response(not_found_payload, status=200, headers=cors_headers)
                    
            except Exception:
                error_payload = json.dumps({"error": "Failed to fetch data"})
                return Response(error_payload, status=500, headers=cors_headers)

        # --- 2. HANDLE POST ---
        if request.method == "POST":
            try:
                body_dict = await request.json()
                if hasattr(body_dict, "to_py"):
                    body_dict = body_dict.to_py()
                    
                body_string = json.dumps(body_dict)
                
                forward_res = await fetch(
                    apps_script_url,
                    method="POST",
                    body=body_string,
                    headers={"Content-Type": "application/json"}
                )
                text_response = await forward_res.text()
                
                return Response(text_response, status=200, headers=cors_headers)
                
            except Exception:
                error_payload = json.dumps({"error": "Failed to sync XP"})
                return Response(error_payload, status=500, headers=cors_headers)

        fallback_payload = json.dumps({"error": "Method Not Allowed"})
        return Response(fallback_payload, status=405, headers=cors_headers)
