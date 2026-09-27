const fs=require('fs');
let c=fs.readFileSync('src/components/SettingsView.tsx','utf8'); 
c=c.replace(/const \[\s*currencySymbol,\s*setCurrencySymbol\s*\] = useState<string>\(settings\.currencySymbol\);/, ''); 
c=c.replace(/currencySymbol,/, ''); 
c=c.replace(/currency: settings\.currency,/, ''); 
c=c.replace(/<label className="text-\[10px\] font-bold text-slate-400 uppercase tracking-wider font-mono">Currency Symbol<\/label>[\s\S]*?<\/div>/, `<label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Currency</label>
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
const i = c.indexOf('loungeName,\n');
if (i !== -1) {
  c = c.substring(0, i) + 'loungeName,\n        currency: settings.currency,\n' + c.substring(i + 'loungeName,\n'.length);
}
fs.writeFileSync('src/components/SettingsView.tsx',c);
