import pandas as pd

# Load original EEG CSV
df = pd.read_csv("backend/uploads/features_raw.csv")

# Keep only first 19 columns
df_19 = df.iloc[:, :19]

# Insert time column if not present
if "time" not in df_19.columns:
    df_19.insert(0, "time", range(len(df_19)))

# Save to new CSV
df_19.to_csv("EEG_19_time.csv", index=False)

print("✅ Saved new CSV with time + 19 columns as EEG_19_time.csv")

