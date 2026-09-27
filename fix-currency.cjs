const fs = require('fs');
const path = require('path');

// 1. SettingsView.tsx
let settingsPath = path.join(__dirname, 'src/components/SettingsView.tsx');
let sv = fs.readFileSync(settingsPath, 'utf8');

sv = sv.replace(/const \[currencySymbol, setCurrencySymbol\] = useState<string>\(settings\.currencySymbol\);/, '');
sv = sv.replace(/currencySymbol,/, '');
sv = sv.replace(/currency: settings\.currency,/, '');
sv = sv.replace(/<label className="text-\[10px\] font-bold text-slate-400 uppercase tracking-wider font-mono">Currency Symbol<\/label>\s*<input[^>]+value=\{currencySymbol\}[^>]+onChange=\{[^}]+\}[^>]+\/>/, 
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
                </select>`);
sv = sv.replace(/loungeName,/, "loungeName,\n        currency: settings.currency,");
fs.writeFileSync(settingsPath, sv, 'utf8');


// 2. Loop through all components
const componentsDir = path.join(__dirname, 'src/components');
const files = fs.readdirSync(componentsDir);

files.forEach(f => {
    if (!f.endsWith('.tsx')) return;
    const fp = path.join(componentsDir, f);
    let c = fs.readFileSync(fp, 'utf8');
    
    // We only process if it has a hardcoded currency symbol ($, ₹, or &#8377;)
    if (c.includes('$') || c.includes('₹') || c.includes('&#8377;') || c.includes('Price (')) {
        // Add import
        if (!c.includes("import { formatCurrency, currencySymbol }")) {
            c = "import { formatCurrency, currencySymbol } from '../lib/currency';\n" + c;
        }

        // Add currency to props
        c = c.replace(/interface (\w+)Props \{/, "interface $1Props {\n  currency: string;");
        // Also inject into function arguments
        c = c.replace(/export default function (\w+)\(\{\s*/, "export default function $1({ currency, ");

        // Replaces
        // Literal texts like Price ($) or Price (₹)
        c = c.replace(/Price \(\$\)/g, 'Price (${currencySymbol(currency)})');
        c = c.replace(/Price \(₹\)/g, 'Price (${currencySymbol(currency)})');
        c = c.replace(/Amount \(\$\)/g, 'Amount (${currencySymbol(currency)})');
        c = c.replace(/Amount \(₹\)/g, 'Amount (${currencySymbol(currency)})');
        
        // JSX texts like >$10.00< or >₹10.00<
        c = c.replace(/>\$([0-9.]+)</g, '>{formatCurrency($1, currency)}<');
        c = c.replace(/>₹([0-9.]+)</g, '>{formatCurrency($1, currency)}<');
        c = c.replace(/>\$\{(pkg\.price)\}</g, '>{formatCurrency($1, currency)}<');
        c = c.replace(/>₹\{(pkg\.price)\}</g, '>{formatCurrency($1, currency)}<');
        
        // Inside string templates `${val}` -> `${formatCurrency(val, currency)}`
        // But only when preceded by $ or ₹
        c = c.replace(/\$\$\{([^}]+)\}/g, '${formatCurrency($1, currency)}');
        c = c.replace(/₹\{([^}]+)\}/g, '${formatCurrency($1, currency)}');
        
        // Other combinations like >${parseFloat(r.netRevenue).toFixed(0)}< -> >{formatCurrency(parseFloat(r.netRevenue).toFixed(0), currency)}<
        c = c.replace(/>\$([^{<]+)</g, '>{formatCurrency("$1", currency)}<');
        c = c.replace(/>₹([^{<]+)</g, '>{formatCurrency("$1", currency)}<');

        // Fix AnalyticsView specifically if it was `${something}`
        c = c.replace(/>\$\{(parseFloat[^}]+)\}</g, '>{formatCurrency($1, currency)}<');
        
        // Fix SessionsView `${session.totalCost}` -> `${formatCurrency(session.totalCost, currency)}`
        c = c.replace(/>\$\{(session\.totalCost)\}</g, '>{formatCurrency($1, currency)}<');
        c = c.replace(/>\$\{(session\.totalAmount)\}</g, '>{formatCurrency($1, currency)}<');
        c = c.replace(/>\$\{(pkg\.price)\}</g, '>{formatCurrency($1, currency)}<');

        fs.writeFileSync(fp, c, 'utf8');
        console.log(`Updated ${f}`);
    }
});
