import requests
import os
from dotenv import load_dotenv

load_dotenv('.env.development')

class OutlookMailer:
    def __init__(self):
        self.tenant_id = os.getenv('AZURE_TENANT_ID')
        self.client_id = os.getenv('AZURE_CLIENT_ID')
        self.client_secret = os.getenv('AZURE_CLIENT_SECRET')
        self.sender_email = os.getenv('SENDER_EMAIL')
        
    def get_access_token(self):
        url = f"https://login.microsoftonline.com/{self.tenant_id}/oauth2/v2.0/token"
        data = {
            'client_id': self.client_id,
            'client_secret': self.client_secret,
            'scope': 'https://graph.microsoft.com/.default',
            'grant_type': 'client_credentials'
        }
        response = requests.post(url, data=data)
        if response.status_code == 200:
            return response.json().get('access_token')
        return None
    
    def send_email(self, to_email, subject, body, is_html=True):
        token = self.get_access_token()
        if not token:
            return {"success": False, "error": "No se pudo obtener token"}
        
        url = f"https://graph.microsoft.com/v1.0/users/{self.sender_email}/sendMail"
        headers = {
            'Authorization': f'Bearer {token}',
            'Content-Type': 'application/json'
        }
        email_body = {
            "message": {
                "subject": subject,
                "body": {
                    "contentType": "HTML" if is_html else "Text",
                    "content": body
                },
                "toRecipients": [
                    {"emailAddress": {"address": to_email}}
                ]
            },
            "saveToSentItems": "true"
        }
        response = requests.post(url, headers=headers, json=email_body)
        if response.status_code == 202:
            return {"success": True, "message": f"Correo enviado a {to_email}"}
        return {"success": False, "error": f"Error {response.status_code}: {response.text}"}
    
    def send_email_sync(self, to_email, subject, body, is_html=True):
        return self.send_email(to_email, subject, body, is_html)

mailer = OutlookMailer()
