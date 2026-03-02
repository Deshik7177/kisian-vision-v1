
import os
import requests
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

api_key = os.getenv("DATA_GOV_API_KEY", "")
resource_id = os.getenv("DATA_GOV_RESOURCE_ID", "35985678-0d79-46b4-9ed6-6f13308a1d24")
limit = int(os.getenv("DATA_GOV_LIMIT", "10"))

url = f"https://api.data.gov.in/resource/{resource_id}"
params = {
    "api-key": api_key,
    "format": "json",
    "limit": limit,
    "filters[Commodity]": "Rice",
}

print(f"Testing Data.gov.in API with key: {api_key}")
response = requests.get(url, params=params)
print("Status Code:", response.status_code)
if response.status_code == 200:
    print("Success! Response snippet:")
    print(response.text[:1000])
else:
    print("Error response:")
    print(response.text)
