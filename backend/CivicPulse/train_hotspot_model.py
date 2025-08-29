import pandas as pd
from sklearn.ensemble import RandomForestClassifier
import pickle
from gsheet_utils import get_gsheet_rows

# --- Step 1: Load/Prepare Data from MongoDB ---
rows = get_gsheet_rows()
if not rows:
    raise ValueError('No data found in MongoDB gsheet_logs collection.')
df = pd.DataFrame(rows)

# --- Step 2: Encode Category ---
df = pd.get_dummies(df, columns=['category'])

# --- Step 3: Train Model ---
X = df.drop('is_hotspot', axis=1)
y = df['is_hotspot']
model = RandomForestClassifier()
model.fit(X, y)

# --- Step 4: Save Model ---
with open('hotspot_model.pkl', 'wb') as f:
    pickle.dump((model, list(X.columns)), f)

print('Model trained and saved as hotspot_model.pkl')
