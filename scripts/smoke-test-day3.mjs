/**
 * Day 3 smoke test — exercises the same libs the browser code uses, on a
 * synthetic CSV + XLSX, to confirm the parsing pipeline produces the expected
 * shape end-to-end.
 *
 * Run: node scripts/smoke-test-day3.mjs
 */
import Papa from 'papaparse';
import * as XLSX from 'xlsx';
import { webcrypto } from 'node:crypto';
import { TextEncoder } from 'node:util';

let passed = 0;
let failed = 0;

function check(name, condition, detail = '') {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.error(`  ✗ ${name}${detail ? ` — ${detail}` : ''}`);
    failed++;
  }
}

function section(title) {
  console.log(`\n${title}`);
  console.log('─'.repeat(60));
}

// ----------- Test data -----------

const SAMPLE_CSV = `order_id,customer,product,quantity,unit_price,order_date
1001,Acme Corp,Widget,10,9.99,2024-01-15
1002,Beta LLC,Gadget,5,24.50,2024-01-16
1003,Gamma Inc,Widget,20,9.99,2024-01-17
1004,Acme Corp,Gizmo,3,49.00,2024-01-18
1005,Delta Co,Widget,15,9.99,2024-01-19`;

const SEMICOLON_CSV = `name;city;population
Mumbai;India;20400000
Tokyo;Japan;37400000
Delhi;India;28500000`;

// ----------- CSV parsing -----------

section('1. CSV parsing (PapaParse)');
{
  const r = Papa.parse(SAMPLE_CSV, { header: true, skipEmptyLines: true });
  check('parses without fatal errors', r.errors.filter((e) => e.type === 'Delimiter').length === 0);
  check(
    'detects all 6 columns',
    r.meta.fields?.length === 6,
    `got ${r.meta.fields?.length} — ${r.meta.fields?.join(', ')}`
  );
  check('returns 5 data rows', r.data.length === 5, `got ${r.data.length}`);
  check(
    'first row has expected shape',
    r.data[0]?.order_id === '1001' && r.data[0]?.customer === 'Acme Corp'
  );
  check('values stay as strings (type detection is Day 4)', typeof r.data[0]?.unit_price === 'string');
}

section('2. CSV with semicolon delimiter (European)');
{
  const r = Papa.parse(SEMICOLON_CSV, { header: true, skipEmptyLines: true });
  check('auto-detected delimiter', r.meta.delimiter === ';', `got '${r.meta.delimiter}'`);
  check('parses 3 rows', r.data.length === 3, `got ${r.data.length}`);
  check('keys correct', r.meta.fields?.[0] === 'name' && r.meta.fields?.[1] === 'city');
}

// ----------- XLSX parsing -----------

section('3. XLSX parsing (SheetJS)');
{
  const ws = XLSX.utils.aoa_to_sheet([
    ['region', 'sales', 'quarter'],
    ['North', 12500, 'Q1'],
    ['South', 9800, 'Q1'],
    ['East', 15200, 'Q1'],
    ['West', 11300, 'Q1'],
  ]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });

  const parsed = XLSX.read(buf, { type: 'array' });
  const firstSheetName = parsed.SheetNames[0];
  const sheet = parsed.Sheets[firstSheetName];
  const rows = XLSX.utils.sheet_to_json(sheet, { defval: null });

  check('reads first sheet name', firstSheetName === 'Sheet1');
  check('returns 4 data rows', rows.length === 4);
  check(
    'columns inferred from header',
    Object.keys(rows[0] ?? {}).join(',') === 'region,sales,quarter'
  );
  check('numeric cell types preserved', typeof rows[0]?.sales === 'number');
}

// ----------- SHA-256 hash -----------

section('4. SHA-256 hash (WebCrypto)');
{
  const buffer = new TextEncoder().encode(SAMPLE_CSV);
  const digest = await webcrypto.subtle.digest('SHA-256', buffer);
  const hex = Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  check('produces 64-character hex', hex.length === 64);
  check('deterministic — same input, same hash', /^[0-9a-f]{64}$/.test(hex));

  const buffer2 = new TextEncoder().encode(SAMPLE_CSV);
  const digest2 = await webcrypto.subtle.digest('SHA-256', buffer2);
  const hex2 = Array.from(new Uint8Array(digest2))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  check('two runs of same content produce same hash', hex === hex2);

  const differentDigest = await webcrypto.subtle.digest(
    'SHA-256',
    new TextEncoder().encode(SAMPLE_CSV + '\n')
  );
  const hexDiff = Array.from(new Uint8Array(differentDigest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  check('different content produces different hash', hex !== hexDiff);
}

// ----------- Auto-name from filename -----------

section('5. Auto-name from filename');
{
  function nameFromFilename(filename) {
    const base = filename.replace(/\.[^/.]+$/, '');
    const normalized = base.replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
    if (!normalized) return 'Untitled';
    return normalized
      .split(' ')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  const cases = [
    ['q3_sales_data.csv', 'Q3 Sales Data'],
    ['northwind-orders-2024.xlsx', 'Northwind Orders 2024'],
    ['REPORT__final.xlsx', 'Report Final'],
    ['single.csv', 'Single'],
    ['.csv', 'Untitled'],
    ['data with spaces.csv', 'Data With Spaces'],
  ];
  for (const [input, expected] of cases) {
    const actual = nameFromFilename(input);
    check(`"${input}" → "${expected}"`, actual === expected, `got "${actual}"`);
  }
}

// ----------- Summary -----------

console.log('\n' + '═'.repeat(60));
console.log(`Result: ${passed} passed, ${failed} failed`);
console.log('═'.repeat(60));
process.exit(failed > 0 ? 1 : 0);
