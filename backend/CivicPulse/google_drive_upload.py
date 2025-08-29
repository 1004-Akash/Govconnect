import os
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload
from google.oauth2 import service_account

# Set up Google Drive API credentials
SERVICE_ACCOUNT_FILE = 'govconnect-ai-abf3d192b22e.json'  # Place your service account JSON here
SCOPES = ['https://www.googleapis.com/auth/drive.file']

credentials = service_account.Credentials.from_service_account_file(
    SERVICE_ACCOUNT_FILE, scopes=SCOPES)
drive_service = build('drive', 'v3', credentials=credentials)

def upload_to_drive(file_path, file_name, folder_id=None):
    file_metadata = {'name': file_name}
    if folder_id:
        file_metadata['parents'] = [folder_id]
    media = MediaFileUpload(file_path, resumable=True)
    file = drive_service.files().create(
        body=file_metadata,
        media_body=media,
        fields='id'
    ).execute()
    file_id = file.get('id')
    # Make file shareable
    drive_service.permissions().create(
        fileId=file_id,
        body={'type': 'anyone', 'role': 'reader'}
    ).execute()
    shareable_link = f'https://drive.google.com/uc?id={file_id}'
    return shareable_link

# Example usage:
# link = upload_to_drive('uploads/image.jpg', 'image.jpg')
# print(link)
