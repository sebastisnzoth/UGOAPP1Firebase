import streamlit as st
import pandas as pd
from google.cloud import firestore
import json
import datetime

# Setup page
st.set_page_config(page_title="Quantum OS Analytics", layout="wide", page_icon="🌐")
st.title("U.G.O. QUANTUM OS - Analytics Dashboard 📊")
st.markdown("Monitor de Actividad, Mapeo de Proveedores y Volumetría de Servicios")

# Conexión Segura a Firestore
@st.cache_resource
def get_db():
    try:
        # En Streamlit Cloud, las credenciales se cargan desde st.secrets
        # El secreto "firebase" debe contener el JSON del Service Account
        if "firebase" in st.secrets:
            secret_val = st.secrets["firebase"]
            
            # Soporta tanto String JSON como Diccionario TOML
            if isinstance(secret_val, str):
                key_dict = json.loads(secret_val)
            else:
                # Convertir AttrDict de Streamlit a dict normal
                key_dict = dict(secret_val)
                
            # Corregir los saltos de línea escapados en la clave privada
            if "private_key" in key_dict:
                key_dict["private_key"] = key_dict["private_key"].replace('\\n', '\n')

            db = firestore.Client.from_service_account_info(key_dict)
            return db
        else:
            st.warning("No se encontraron secretos de Firebase en la configuración.")
            return None
    except Exception as e:
        st.error(f"Error de conexión: {e}")
        return None

db = get_db()

if db:
    st.markdown("---")
    
    try:
        # Cargar Datos
        profiles_ref = db.collection('profiles')
        profiles = [doc.to_dict() for doc in profiles_ref.stream()]
        
        bookings_ref = db.collection('bookings')
        bookings = [doc.to_dict() for doc in bookings_ref.stream()]
        
        # Validar si hay datos
        if not profiles:
            st.info("Aún no hay perfiles registrados.")
        else:
            # 1. Métricas Principales (KPIs)
            st.header("Métricas Globales")
            col1, col2, col3, col4 = st.columns(4)
            
            df_profiles = pd.DataFrame(profiles)
            df_bookings = pd.DataFrame(bookings)
            
            total_users = len(df_profiles)
            clientes = len(df_profiles[df_profiles.get('role') == 'cliente']) if 'role' in df_profiles.columns else 0
            proveedores = len(df_profiles[df_profiles.get('role') == 'proveedor']) if 'role' in df_profiles.columns else 0
            total_reservas = len(bookings)
            
            col1.metric("Usuarios Totales", total_users)
            col2.metric("Clientes Activos", clientes)
            col3.metric("Proveedores", proveedores)
            col4.metric("Servicios Registrados", total_reservas)
            
            st.markdown("---")
            
            # 2. Análisis por Role y Karma
            row2_c1, row2_c2 = st.columns(2)
            
            with row2_c1:
                st.subheader("Distribución de Roles")
                if 'role' in df_profiles.columns:
                    role_counts = df_profiles['role'].value_counts()
                    st.bar_chart(role_counts)
                    
            with row2_c2:
                st.subheader("Salud de la Red (Karma de Proveedores)")
                if 'karma' in df_profiles.columns and 'role' in df_profiles.columns:
                    providers_karma = df_profiles[df_profiles['role'] == 'proveedor']['karma'].dropna()
                    if not providers_karma.empty:
                        # Gráfico de la distribución de Karma
                        st.line_chart(providers_karma.reset_index(drop=True))
                        st.caption(f"Karma Promedio: {providers_karma.mean():.1f} puntos")
            
            # 3. Mapa de Proveedores Activos (Mapeo geoespacial directo)
            st.markdown("---")
            st.subheader("Posicionamiento en Tiempo Real")
            
            if 'lat' in df_profiles.columns and 'lng' in df_profiles.columns:
                # Filtrar usuarios con coordenadas válidas
                mapped_users = df_profiles.dropna(subset=['lat', 'lng']).copy()
                # Asegurar que sean numéricos 
                mapped_users['lat'] = pd.to_numeric(mapped_users['lat'], errors='coerce')
                mapped_users['lon'] = pd.to_numeric(mapped_users['lng'], errors='coerce') # Streamlit usa 'lon'
                mapped_users = mapped_users.dropna(subset=['lat', 'lon'])
                
                if not mapped_users.empty:
                    st.map(mapped_users)
                else:
                    st.info("No hay proveedores con ubicación reportada en tiempo real.")

    except Exception as e:
        st.error(f"Error procesando la analítica: {e}")
else:
    st.info("Esperando configuración del entorno (Secrets de Firestore).")
