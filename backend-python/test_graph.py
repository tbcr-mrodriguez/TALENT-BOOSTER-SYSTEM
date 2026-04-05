#!/usr/bin/env python3
"""Prueba directa de Microsoft Graph API para enviar correos"""

import requests



def get_access_token():
    """Obtiene token de acceso usando Client Credentials"""
    url = f"https://login.microsoftonline.com/{TENANT_ID}/oauth2/v2.0/token"
    
    data = {
        'client_id': CLIENT_ID,
        'client_secret': CLIENT_SECRET,
        'scope': 'https://graph.microsoft.com/.default',
        'grant_type': 'client_credentials'
    }
    
    response = requests.post(url, data=data)
    
    if response.status_code == 200:
        token = response.json().get('access_token')
        print("✅ Token obtenido correctamente")
        return token
    else:
        print(f"❌ Error obteniendo token: {response.status_code}")
        print(response.text)
        return None

def send_email(token, to_email, subject, body):
    """Envía correo usando Microsoft Graph API"""
    url = f"https://graph.microsoft.com/v1.0/users/{SENDER_EMAIL}/sendMail"
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    
    email_body = {
        "message": {
            "subject": subject,
            "body": {
                "contentType": "HTML",
                "content": body
            },
            "toRecipients": [
                {
                    "emailAddress": {
                        "address": to_email
                    }
                }
            ]
        },
        "saveToSentItems": "true"
    }
    
    response = requests.post(url, headers=headers, json=email_body)
    
    if response.status_code == 202:
        print(f"✅ Correo enviado exitosamente a {to_email}")
        return True
    else:
        print(f"❌ Error enviando correo: {response.status_code}")
        print(response.text)
        return False

if __name__ == "__main__":
    print("=" * 50)
    print("📧 Prueba de envío de correo con Microsoft Graph API")
    print("=" * 50)
    
    # Validar configuración
    if "TU_TENANT_ID" in [TENANT_ID, CLIENT_ID, CLIENT_SECRET]:
        print("❌ ERROR: Debes reemplazar los valores de configuración:")
        print("   - TENANT_ID")
        print("   - CLIENT_ID") 
        print("   - CLIENT_SECRET")
        print("   - SENDER_EMAIL")
        print("\n📝 Edita el archivo test_graph.py y pon tus credenciales reales")
        exit(1)
    
    print(f"📤 Remitente: {SENDER_EMAIL}")
    print(f"📥 Destinatario: {RECIPIENT_EMAIL}")
    print()
    
    # Obtener token
    token = get_access_token()
    if not token:
        exit(1)
    
    # Enviar correo
    subject = "Prueba desde Talent Pipeline"
    body = """
    <html>
    <body>
        <h1 style="color: #2563eb;">🎯 Talent Pipeline</h1>
        <p>Este es un correo de prueba enviado desde Microsoft Graph API.</p>
        <p>Si recibes este mensaje, la configuración está funcionando correctamente.</p>
        <hr>
        <p style="color: #64748b; font-size: 12px;">Enviado automáticamente por el sistema de reclutamiento.</p>
    </body>
    </html>
    """
    
    success = send_email(token, RECIPIENT_EMAIL, subject, body)
    
    if success:
        print("\n✅ Prueba exitosa. Revisa tu bandeja de entrada.")
    else:
        print("\n❌ Prueba fallida. Revisa los errores arriba.")
