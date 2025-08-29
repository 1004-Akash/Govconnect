from pymongo import MongoClient

# MongoDB setup
client = MongoClient("mongodb://localhost:27017/")
db = client["civicpulse"]
gsheet_logs_col = db["gsheet_logs"]

def get_gsheet_rows():
    return list(gsheet_logs_col.find({}, {"_id": 0}))

def log_to_gsheet_dict(data):
    gsheet_logs_col.insert_one(data)
