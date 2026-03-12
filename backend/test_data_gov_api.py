import requests
import xml.etree.ElementTree as ET
import os

api_key = os.getenv("DATA_GOV_API_KEY", "579b464db66ec23bdd000001dd04808e681c4d5c74fb3b7fccaff0f7")
resource_id = os.getenv("DATA_GOV_RESOURCE_ID", "35985678-0d79-46b4-9ed6-6f13308a1d24")
limit = int(os.getenv("DATA_GOV_LIMIT", "14"))

url = f"https://api.data.gov.in/resource/{resource_id}"
params = {
    "api-key": api_key,
    "limit": limit
}

print("Testing Data.gov.in API...")
try:
    response = requests.get(url, params=params, timeout=20)
    print("Status Code:", response.status_code)
    if response.status_code == 200:
        print("Response received.")
        root = ET.fromstring(response.text)
        items = root.findall(".//item")
        print(f"Found {len(items)} records.")
        for item in items[:3]:  # Show first 3 records
            print({
                "State": item.findtext("State"),
                "Market": item.findtext("Market"),
                "Commodity": item.findtext("Commodity"),
                "Modal_Price": item.findtext("Modal_Price"),
                "Arrival_Date": item.findtext("Arrival_Date")
            })
    else:
        print("Error response:", response.text[:500])
except Exception as e:
    print("API request failed:", e)

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
