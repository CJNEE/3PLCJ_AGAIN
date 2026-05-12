import requests, json

url = 'http://127.0.0.1:8000/api/edit-requests/'
payload = {
    'employee': '1',
    'requested_data': json.dumps({'firstname': 'Form Test'})
}
resp = requests.post(url, data=payload)
print('status', resp.status_code)
print(resp.text)
