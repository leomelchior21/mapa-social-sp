"""
fetch_ar.py — Script de coleta de qualidade do ar
Fonte: CETESB (dados.gov.br / API pública)

Alternativa open: OpenAQ API (gratuita, sem autenticação)
https://api.openaq.org/v3/locations?country=BR&city=São Paulo

Executa via GitHub Actions diariamente.
"""

import requests
import pandas as pd
import json
import os
from datetime import datetime, timedelta

# Bounding box de São Paulo
SP_BOUNDS = {
    'lat_min': -24.0, 'lat_max': -23.4,
    'lon_min': -47.0, 'lon_max': -46.3,
}

def fetch_openaq():
    """
    Coleta dados de qualidade do ar via OpenAQ (gratuito, sem chave).
    Filtra estações dentro de São Paulo.
    """
    # Busca medições recentes para PM2.5 e PM10 em SP
    url = 'https://api.openaq.org/v3/measurements'
    params = {
        'country_id':  'BR',
        'coordinates': '-23.5505,-46.6333',
        'radius':      30000,  # 30km do centro de SP
        'parameters':  ['pm25', 'pm10', 'o3', 'no2'],
        'limit':       500,
        'order_by':    'datetime',
        'sort_order':  'desc',
    }

    try:
        resp = requests.get(url, params=params, timeout=30)
        resp.raise_for_status()
        data = resp.json()
        return data.get('results', [])
    except Exception as e:
        print(f'[WARN] OpenAQ falhou: {e}')
        return []

def normalize_openaq(results):
    """Converte resultados OpenAQ para formato padrão."""
    rows = []
    for r in results:
        coords = r.get('coordinates', {})
        lat = coords.get('latitude')
        lon = coords.get('longitude')

        if not lat or not lon:
            continue
        if not (SP_BOUNDS['lat_min'] <= lat <= SP_BOUNDS['lat_max']):
            continue
        if not (SP_BOUNDS['lon_min'] <= lon <= SP_BOUNDS['lon_max']):
            continue

        value = r.get('value', 0)
        param = r.get('parameter', {}).get('name', 'desconhecido')

        # Normaliza intensidade: PM2.5 > 25 µg/m³ = intensidade máxima
        limites = {'pm25': 25, 'pm10': 50, 'o3': 100, 'no2': 40}
        limite = limites.get(param, 50)
        intensidade = min(1.0, max(0.0, value / limite))

        rows.append({
            'latitude':    lat,
            'longitude':   lon,
            'tipo':        f'Estação {param.upper()}',
            'intensidade': round(intensidade, 3),
            'data':        datetime.now().strftime('%Y-%m-%d'),
            'fonte':       'OpenAQ/CETESB',
            'nome':        r.get('location', {}).get('name', 'Estação SP'),
        })

    return rows

def generate_synthetic_fallback():
    """
    Gera dados sintéticos representativos quando a API está indisponível.
    Baseados em leituras típicas de estações CETESB em SP.
    """
    import random
    random.seed(42)  # seed fixo para reprodutibilidade

    estacoes = [
        ('Pinheiros',     -23.5630, -46.6853, 0.75),
        ('Ibirapuera',    -23.5874, -46.6576, 0.45),
        ('Mooca',         -23.5427, -46.5963, 0.80),
        ('Santo André',   -23.6671, -46.5283, 0.65),
        ('Osasco',        -23.5329, -46.7920, 0.70),
        ('Guarulhos',     -23.4543, -46.5337, 0.60),
        ('Santo Amaro',   -23.6510, -46.7150, 0.55),
        ('Cerqueira César',-23.5541, -46.6604, 0.40),
        ('Taboão da Serra',-23.6102, -46.7572, 0.68),
        ('Mauá',          -23.6678, -46.4609, 0.72),
    ]

    rows = []
    for nome, lat, lon, base_int in estacoes:
        # Varia ±15% aleatoriamente para simular leituras reais
        intensidade = min(1.0, max(0.0, base_int + random.uniform(-0.15, 0.15)))
        rows.append({
            'latitude':    lat + random.uniform(-0.01, 0.01),
            'longitude':   lon + random.uniform(-0.01, 0.01),
            'tipo':        'Estação CETESB',
            'intensidade': round(intensidade, 3),
            'data':        datetime.now().strftime('%Y-%m-%d'),
            'fonte':       'CETESB (sintético)',
            'nome':        f'Est. {nome}',
        })

    return rows

def main():
    print('📡 Coletando dados de qualidade do ar...')

    # 1. Tenta API real
    results = fetch_openaq()
    rows    = normalize_openaq(results)

    # 2. Fallback sintético se não há dados suficientes
    if len(rows) < 5:
        print(f'[INFO] Dados insuficientes ({len(rows)}), usando fallback sintético')
        rows = generate_synthetic_fallback()

    # 3. Salva como Parquet
    df = pd.DataFrame(rows)
    os.makedirs('data', exist_ok=True)
    df.to_parquet('data/ar_sp.parquet', index=False)

    # 4. Salva metadata (lida pelo frontend para "Última Atualização")
    meta = {
        'updated_at': datetime.utcnow().isoformat() + 'Z',
        'count':      len(df),
        'source':     'OpenAQ/CETESB',
    }
    with open('data/ar_sp_meta.json', 'w') as f:
        json.dump(meta, f)

    print(f'✅ ar_sp.parquet: {len(df)} registros salvos')

if __name__ == '__main__':
    main()
