import requests
import json

url = 'http://127.0.0.1:8000/api/edit-requests/'
payload = {'employee': 1, 'requested_data': {'firstname': 'CLI Test'}}
resp = requests.post(url, json=payload)
print(resp.status_code)
print(resp.text)
