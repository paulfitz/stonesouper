def add_demo_sectors(data, params):
    col = 'Wifi Password'
    for table in data.tables_with_columns(col):
        table.add_column('tags')
        for row in table.rows:
            if 'open' in row[col].lower():
                row.add_to_set('tags', 'dcc|Sector|open-password-place')
            if row['State'] == 'CA':
                row.add_to_set('tags', 'dcc|LegalStructure|wacky')
