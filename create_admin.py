import requests

url = "http://127.0.0.1:5000/api/admin/setup"
data = {"username": "admin", "password": "123456"}  # you can change these

res = requests.post(url, json=data)
print(res.json())