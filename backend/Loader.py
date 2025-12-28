import pandas as pd

class SignalLoader:
    def __init__(self, filepath):
        self.filepath = filepath
        self.df = None

    def load_data(self):
        self.df = pd.read_csv(self.filepath)
        return self.df

    def get_time_column(self):
        if self.df is None:
            self.load_data()
        first_col = self.df.columns[0]
        values = self.df[first_col].values
        if pd.api.types.is_numeric_dtype(values) and (values >= 0).all():
            return first_col
        else:
            step = 1.0 / 100.0
            n = len(self.df)
            self.df.insert(0, "time", [i * step for i in range(n)])
            return "time" 


    def get_leads(self):
        if self.df is None:
            self.load_data()
        time_col = self.get_time_column()
        return [col for col in self.df.columns if col != time_col]


    def get_chunk(self, start_idx=0, chunk_size=500, leads=None):
    
        if self.df is None:
            self.load_data()

        end_idx = start_idx + chunk_size
        chunk_df = self.df.iloc[start_idx:end_idx]

        if leads is None:
            leads = self.get_leads()

        time_col = self.get_time_column()
        chunk = {"time": chunk_df[time_col].tolist()}
        for lead in leads:
            if lead in chunk_df.columns:
                chunk[lead] = chunk_df[lead].tolist()

        return chunk