const fs = require('fs');
const path = require('path');

// 1. types.ts
let typesPath = 'src/types.ts';
let t = fs.readFileSync(typesPath, 'utf8');
t = t.replace(/\s*currencySymbol: string;/, '');
fs.writeFileSync(typesPath, t, 'utf8');

// 2. data/mockData.ts
let mdPath = 'src/data/mockData.ts';
let md = fs.readFileSync(mdPath, 'utf8');
md = md.replace(/\s*currencySymbol: ".*",/, '');
fs.writeFileSync(mdPath, md, 'utf8');

// 3. SettingsView.tsx
let svPath = 'src/components/SettingsView.tsx';
let sv = fs.readFileSync(svPath, 'utf8');
sv = sv.replace(/const \[currencySymbol, setCurrencySymbol\] = useState<string>\(settings\.currencySymbol\);/, '');
sv = sv.replace(/currencySymbol,/, '');
sv = sv.replace(/currency: settings\.currency,/, ''); // wait, it might not exist
sv = sv.replace(/<label className="text-\[10px\] font-bold text-slate-400 uppercase tracking-wider font-mono">Currency Symbol<\/label>[\s\S]*?<\/div>/, 
`<label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Currency</label>
                <select
                  value={settings.currency}
                  onChange={(e) => onSaveSettings({ ...settings, currency: e.target.value }, [])}
                  className="w-full px-3 py-2 border border-slate-200 text-xs rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 bg-slate-50 font-sans transition-all"
                >
                  <option value="INR">₹ Indian Rupee (INR)</option>
                  <option value="USD">$ US Dollar (USD)</option>
                  <option value="EUR">€ Euro (EUR)</option>
                  <option value="GBP">£ British Pound (GBP)</option>
                </select>
                <p className="text-[10px] text-slate-400">Real — saves to the store record.</p>
              </div>`);
const svI = sv.indexOf('loungeName,\n');
if (svI !== -1 && !sv.includes('currency: settings.currency')) {
   sv = sv.substring(0, svI) + "loungeName,\n        currency: settings.currency,\n" + sv.substring(svI + 'loungeName,\n'.length);
}
fs.writeFileSync(svPath, sv, 'utf8');

// 4. App.tsx
let appPath = 'src/App.tsx';
let app = fs.readFileSync(appPath, 'utf8');
app = app.replace(/if \(nextSettings\.loungeName !== settings\.loungeName\) \{\s*await updateStore\(storeId, \{ name: nextSettings\.loungeName \}\);\s*\}/, 
"const storeUpdate: any = {};\n        if (nextSettings.loungeName !== settings.loungeName) storeUpdate.name = nextSettings.loungeName;\n        if (nextSettings.currency !== settings.currency) storeUpdate.currency = nextSettings.currency;\n        if (Object.keys(storeUpdate).length > 0) await updateStore(storeId, storeUpdate);");

// App.tsx prop injection
const views = [
  'DashboardView', 'LivePCsView', 'BillingView', 'PaymentsView', 'AnalyticsView',
  'DisputesView', 'SessionsView', 'CustomersView', 'GameLibraryView', 'GamepassView', 'LeaderboardsView'
];
views.forEach(v => {
  const reg = new RegExp(`<${v}\\b`);
  if (!app.includes(`<${v} currency`)) {
    app = app.replace(reg, `<${v} currency={settings.currency}`);
  }
});
fs.writeFileSync(appPath, app, 'utf8');

// 5. Views
const componentsDir = 'src/components';
const files = fs.readdirSync(componentsDir);

files.forEach(f => {
    if (!f.endsWith('.tsx')) return;
    const fp = path.join(componentsDir, f);
    let c = fs.readFileSync(fp, 'utf8');
    
    // We only process if it has a hardcoded currency symbol ($, ₹, or &#8377;)
    if (c.includes('$') || c.includes('₹') || c.includes('&#8377;') || c.includes('Price (')) {
        if (!c.includes("import { formatCurrency, currencySymbol }")) {
            c = "import { formatCurrency, currencySymbol } from '../lib/currency';\n" + c;
        }

        // Only inject currency props once
        if (!c.includes('currency: string;')) {
            c = c.replace(/interface (\w+)Props \{/, "interface $1Props {\n  currency: string;");
        }
        if (!c.includes('{ currency,') && !c.includes('{ currency }')) {
            c = c.replace(/export default function (\w+)\(\{\s*/, "export default function $1({ currency, ");
        }

        // Replaces
        c = c.replace(/Price \(\$\)/g, 'Price (${currencySymbol(currency)})');
        c = c.replace(/Price \(₹\)/g, 'Price (${currencySymbol(currency)})');
        c = c.replace(/Amount \(\$\)/g, 'Amount (${currencySymbol(currency)})');
        c = c.replace(/Amount \(₹\)/g, 'Amount (${currencySymbol(currency)})');
        
        c = c.replace(/>\$([0-9.]+)</g, '>{formatCurrency($1, currency)}<');
        c = c.replace(/>₹([0-9.]+)</g, '>{formatCurrency($1, currency)}<');
        c = c.replace(/>\$\{(pkg\.price)\}</g, '>{formatCurrency($1, currency)}<');
        c = c.replace(/>₹\{(pkg\.price)\}</g, '>{formatCurrency($1, currency)}<');
        
        c = c.replace(/\$\$\{([^}]+)\}/g, '${formatCurrency($1, currency)}');
        c = c.replace(/₹\{([^}]+)\}/g, '${formatCurrency($1, currency)}');
        
        c = c.replace(/>\$([^{<]+)</g, '>{formatCurrency("$1", currency)}<');
        c = c.replace(/>₹([^{<]+)</g, '>{formatCurrency("$1", currency)}<');

        c = c.replace(/>\$\{(parseFloat[^}]+)\}</g, '>{formatCurrency($1, currency)}<');
        
        c = c.replace(/>\$\{(session\.totalCost)\}</g, '>{formatCurrency($1, currency)}<');
        c = c.replace(/>\$\{(session\.totalAmount)\}</g, '>{formatCurrency($1, currency)}<');
        c = c.replace(/>\$\{(pkg\.price)\}</g, '>{formatCurrency($1, currency)}<');

        fs.writeFileSync(fp, c, 'utf8');
    }
});
