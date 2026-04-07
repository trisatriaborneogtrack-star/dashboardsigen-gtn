import streamlit as st
import psycopg2
import pandas as pd

# ======================
# CONFIG (pakai secrets)
# ======================
DB_URL = st.secrets["DB_URL"]

# ======================
# CONNECT DB
# ======================
@st.cache_resource
def get_connection():
    return psycopg2.connect(DB_URL)

# ======================
# LOAD DATA
# ======================
@st.cache_data(ttl=60)
def load_data():
    conn = get_connection()
    query = """
        SELECT *
        FROM realtime_data
        ORDER BY created_at DESC
        LIMIT 500
    """
    df = pd.read_sql(query, conn)
    return df

df = load_data()

# ======================
# UI
# ======================
st.title("⚡ Energy Monitoring Dashboard")

if df.empty:
    st.warning("No data available")
    st.stop()

latest = df.iloc[0]

col1, col2, col3, col4 = st.columns(4)

col1.metric("🔋 SOC", f"{latest['soc']} %")
col2.metric("⚡ Power", f"{latest['active_power']} kW")
col3.metric("🔌 Voltage", f"{latest['voltage_avg']:.1f} V")
col4.metric("🌡️ Temp", f"{latest['temperature']} °C")

# ======================
# FILTER SYSTEM
# ======================
system_list = df['system_id'].unique()
selected = st.selectbox("Pilih System", system_list)

df = df[df['system_id'] == selected]
df = df.sort_values("created_at")

# ======================
# CHART
# ======================
st.subheader("SOC Trend")
st.line_chart(df.set_index("created_at")["soc"])

st.subheader("Power Trend")
st.line_chart(df.set_index("created_at")["active_power"])

# ======================
# DATA TABLE
# ======================
st.subheader("Raw Data")
st.dataframe(df)
