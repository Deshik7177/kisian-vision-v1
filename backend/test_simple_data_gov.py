import requests

url = "https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24?api-key=579b464db66ec23bdd000001dd04808e681c4d5c74fb3b7fccaff0f7&limit=14"
google_url = "https://www.google.com"

print("\n--- Testing Data.gov.in API with browser User-Agent ---")
headers = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
}
try:
    response = requests.get(url, timeout=5, headers=headers)
    print("Status Code:", response.status_code)
    print("Response snippet:", response.text[:500])
except Exception as e:
    print("API request failed:", e)

print("\n--- Testing Google API ---")
try:
    google_resp = requests.get(google_url, timeout=5)
    print("Google Status Code:", google_resp.status_code)
    print("Google Response snippet:", google_resp.text[:200])
except Exception as e:
    print("Google API request failed:", e)

print("\n--- Testing Data.gov.in API with SSL verification disabled ---")
try:
    response = requests.get(url, timeout=5, verify=False)
    print("Status Code (SSL off):", response.status_code)
    print("Response snippet (SSL off):", response.text[:500])
except Exception as e:
    print("API request failed (SSL off):", e)
