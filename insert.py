from pymongo import MongoClient
from dotenv import load_dotenv
import os

# Load environment variables from .env.local
load_dotenv(".env.local")

# Get the MONGO_URI from the environment
MONGO_URI = os.getenv("MONGO_URI")
USE_MONGOOSE = os.getenv("USE_MONGOOSE")  # Not directly used in this script but available

# Connect to MongoDB
try:
    client = MongoClient(MONGO_URI)
    db = client.get_database("Crypto")  # Specify your database name
    collection = db['coins']  # Collection name (matches Mongoose schema)

    # Example data to insert
    coin_data = {
        "symbol": "SYMBOL HERE",
        "name": "NAME HERE",
        "description": "DESCRIPTION HERE",
    }

    # Insert the document
    result = collection.insert_one(coin_data)
    print(f"Data inserted with ID: {result.inserted_id}")
except Exception as e:
    print(f"Error: {e}")
finally:
    client.close()
