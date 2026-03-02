"""
fetch_saude.py — Script de coleta de equipamentos de saúde
Fonte: GeoSampa (geo.smdu.prefeitura.sp.gov.br) / dados.gov.br

API GeoSampa é pública e não requer autenticação.
"""

import requests
import pandas as pd
import json
import os
from datetime import datetime

SP_BOUNDS = {
    'lat_min': -24.0, 'lat_max': -23.4,
    'lon_min': -47.0, 'lon_max': -46.3,
}

def fetch_geosampa():
    """
    Coleta equipamentos de saúde via GeoSampa WFS.
    """
    url = 'https://geoserver.prefeitura.sp.gov.br/geoserver/ads/ows'
    params = {
        'service':      'WFS',
        'version':      '1.0.0',
        'request':      'GetFeature',
        'typeName':     'ads:SAD_EQS_SAUDE_P',  # Equipamentos de saúde
        'outputFormat': 'application/json',
        'maxFeatures':  500,
    }

    try:
        resp = requests.get(url, params=params, timeout=45)
        resp.raise_for_status()
        return resp.json().get('features', [])
    except Exception as e:
        print(f'[WARN] GeoSampa falhou: {e}')
        return []

def normalize_geosampa(features):
    rows = []
    for f in features:
        props = f.get('properties', {})
        geom  = f.get('geometry', {})
        coords = geom.get('coordinates', [])

        if len(coords) < 2:
            continue

        lon, lat = coords[0], coords[1]
        if not (SP_BOUNDS['lat_min'] <= lat <= SP_BOUNDS['lat_max']):
            continue

        tipo = props.get('ds_tipo', 'Equipamento Saúde') or 'Equipamento Saúde'
        nome = props.get('nm_equip', tipo) or tipo

        # Equipamentos de emergência têm intensidade maior (prioridade de monitoramento)
        prioritarios = ['hospital', 'pronto', 'upa', 'ama']
        intensidade  = 0.8 if any(p in tipo.lower() for p in prioritarios) else 0.5

        rows.append({
            'latitude':    round(lat, 6),
            'longitude':   round(lon, 6),
            'tipo':        tipo,
            'intensidade': intensidade,
            'data':        datetime.now().strftime('%Y-%m-%d'),
            'fonte':       'GeoSampa/SMS-SP',
            'nome':        nome,
        })

    return rows

def generate_synthetic_saude():
    """Equipamentos representativos de SP com coordenadas reais aproximadas."""
    equipamentos = [
        # Hospitais estaduais
        ('Hospital das Clínicas',        -23.5505, -46.6706, 'Hospital', 0.9),
        ('Hospital do Servidor Público',  -23.5589, -46.6429, 'Hospital', 0.85),
        ('Hospital Albert Einstein',      -23.5975, -46.7183, 'Hospital', 0.9),
        ('Hospital São Paulo (UNIFESP)',   -23.5983, -46.6390, 'Hospital', 0.85),
        ('Hospital Sírio-Libanês',         -23.5557, -46.6611, 'Hospital', 0.9),
        # UPAs
        ('UPA Lapa',                       -23.5187, -46.7050, 'UPA', 0.75),
        ('UPA Cidade Ademar',              -23.6679, -46.6512, 'UPA', 0.75),
        ('UPA Campo Limpo',                -23.6387, -46.7480, 'UPA', 0.75),
        ('UPA Ermelino Matarazzo',         -23.4986, -46.4540, 'UPA', 0.75),
        ('UPA Brasilândia',                -23.4323, -46.6887, 'UPA', 0.75),
        # AMAs
        ('AMA Vila Nova Cachoeirinha',     -23.4604, -46.6720, 'AMA', 0.6),
        ('AMA Parque São Lucas',           -23.5764, -46.5343, 'AMA', 0.6),
        ('AMA Ipiranga',                   -23.5894, -46.6050, 'AMA', 0.6),
        ('AMA Penha',                      -23.5271, -46.5312, 'AMA', 0.6),
        ('AMA Mooca',                      -23.5453, -46.6033, 'AMA', 0.6),
        # CAPS
        ('CAPS Bom Retiro',                -23.5222, -46.6442, 'CAPS', 0.55),
        ('CAPS Pinheiros',                 -23.5659, -46.6878, 'CAPS', 0.55),
        ('CAPS Itaquera',                  -23.5449, -46.4507, 'CAPS', 0.55),
        # UBS
        ('UBS Jardim Ângela',              -23.6875, -46.7638, 'UBS', 0.45),
        ('UBS Capão Redondo',              -23.6568, -46.7766, 'UBS', 0.45),
    ]

    return [
        {
            'latitude':    lat,
            'longitude':   lon,
            'tipo':        tipo,
            'intensidade': intens,
            'data':        datetime.now().strftime('%Y-%m-%d'),
            'fonte':       'SMS-SP (sintético)',
            'nome':        nome,
        }
        for nome, lat, lon, tipo, intens in equipamentos
    ]

def main():
    print('🏥 Coletando equipamentos de saúde...')
    features = fetch_geosampa()
    rows     = normalize_geosampa(features)

    if len(rows) < 5:
        print(f'[INFO] Usando fallback sintético ({len(rows)} reais encontrados)')
        rows = generate_synthetic_saude()

    df = pd.DataFrame(rows)
    os.makedirs('data', exist_ok=True)
    df.to_parquet('data/saude_sp.parquet', index=False)

    meta = {
        'updated_at': datetime.utcnow().isoformat() + 'Z',
        'count':      len(df),
        'source':     'GeoSampa/SMS-SP',
    }
    with open('data/saude_sp_meta.json', 'w') as f:
        json.dump(meta, f)

    print(f'✅ saude_sp.parquet: {len(df)} registros salvos')

if __name__ == '__main__':
    main()
