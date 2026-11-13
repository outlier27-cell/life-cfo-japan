"""Extract one explicitly identified World Bank Pink Sheet column; no interpolation."""
from pathlib import Path
import csv, hashlib, json
from openpyxl import load_workbook

root = Path(__file__).resolve().parents[1]
file = root / 'data/v4/raw/CMO-Historical-Data-Monthly.xlsx'
book = load_workbook(file, read_only=True, data_only=True)
sheet = book['Monthly Prices']
rows = list(sheet.iter_rows(values_only=True))
column = rows[4].index('Gold')
assert rows[5][column] == '($/troy oz)'
values = []
samples = []
for number, row in enumerate(rows[6:], 7):
    date = row[0]
    if not isinstance(date, str) or len(date) != 7 or date[4] != 'M':
        continue
    value = row[column]
    if not isinstance(value, (float, int)) or value <= 0:
        raise ValueError(f'Invalid gold price at row {number}: {value}')
    date = date[:4] + '-' + date[5:] + '-01'
    values.append([date, value])
    if date in [f'{year}-{month:02d}-01' for year in [1978,1988,1990,2008,2020] for month in [1,6,12]]:
        samples.append({'date':date, 'value':value, 'row':number, 'column':column+1})
with (root / 'data/v4/raw/WB_GOLD.csv').open('w', newline='', encoding='utf-8') as out:
    writer = csv.writer(out, lineterminator='\n')
    writer.writerow(['observation_date', 'WB_GOLD'])
    writer.writerows(values)
(root / 'data/v4/gold-extraction.json').write_text(json.dumps({
    'source':'World Bank Commodity Price Data (The Pink Sheet)',
    'workbook':'data/v4/raw/CMO-Historical-Data-Monthly.xlsx',
    'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),
    'sheet':'Monthly Prices', 'headingRow':5, 'column':column+1,
    'heading':rows[4][column], 'unit':rows[5][column], 'updated':rows[3][0],
    'count':len(values), 'samples':samples
}, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
print(f'Extracted {len(values)} gold observations; original worksheet and cells recorded.')
