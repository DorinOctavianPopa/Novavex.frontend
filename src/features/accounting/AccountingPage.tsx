import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAppContext } from '@/context'
import './accounting.css'

type Account = { code: string; name: string; type: string; currency: string; parent: string; archived: boolean }
type Line = { account: string; side: 'Debit' | 'Credit'; amount: string; costCenter: string }
type Entry = { number: string; type: string; date: string; description: string; lines: Line[] }
type Audit = { who: string; when: string; action: string }
type Settings = { registration: string; taxId: string; address: string; bank: string; year: string; month: string; retained: string; profit: string; vat: string; rates: string }

const emptyLine = (): Line => ({ account: '', side: 'Debit', amount: '', costCenter: '' })
const today = () => new Date().toLocaleDateString('en-CA')
const cents = (value: string) => {
  if (!/^\d{1,12}(\.\d{1,2})?$/.test(value)) return NaN
  const [whole, fraction = ''] = value.split('.')
  return Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
}
const money = (value: number) => (value / 100).toFixed(2)
const reportNames = ['Trial Balance', 'General Journal', 'Inventory Ledger', 'Account Ledger', 'General Ledger', 'Balance Sheet', 'Profit and Loss Statement', 'Purchase Journal', 'Sales Journal', 'Aging Accounts Receivable', 'Aging Accounts Payable', 'Cost Center Report']

export function AccountingPage() {
  const { session } = useAppContext()
  const roles = session?.user.roles ?? []
  const admin = roles.some((role) => role === 'super_admin' || role === 'cto')
  const senior = admin || roles.some((role) => role === 'finance_manager' || role === 'senior_accountant')
  const [tab, setTab] = useState('Accounts')
  const [accounts, setAccounts] = useState<Account[]>([])
  const [account, setAccount] = useState<Account>({ code: '', name: '', type: 'A', currency: 'RON', parent: '', archived: false })
  const [entries, setEntries] = useState<Entry[]>([])
  const [entry, setEntry] = useState<Entry>({ number: '', type: 'Invoice', date: today(), description: '', lines: [emptyLine(), { ...emptyLine(), side: 'Credit' }] })
  const [settings, setSettings] = useState<Settings>({ registration: '', taxId: '', address: '', bank: '', year: today().slice(0, 4), month: today().slice(5, 7), retained: '', profit: '', vat: '', rates: '' })
  const [locked, setLocked] = useState<string[]>([])
  const [lockPeriod, setLockPeriod] = useState(today().slice(0, 7))
  const [audit, setAudit] = useState<Audit[]>([])
  const [message, setMessage] = useState('')
  const [report, setReport] = useState('Trial Balance')
  const [from, setFrom] = useState(`${today().slice(0, 4)}-01-01`)
  const [to, setTo] = useState(today())
  const [reportAccount, setReportAccount] = useState('')
  const [template, setTemplate] = useState('')
  const [templates, setTemplates] = useState<{ name: string; lines: Line[] }[]>([
    { name: 'Monthly depreciation', lines: [emptyLine(), { ...emptyLine(), side: 'Credit' }] },
    { name: 'Payroll processing', lines: [emptyLine(), { ...emptyLine(), side: 'Credit' }] },
  ])
  const record = (action: string) => setAudit((previous) => [{ who: session?.user.email ?? 'Unknown', when: new Date().toLocaleString(), action }, ...previous])
  const isLocked = (date: string) => locked.includes(date.slice(0, 7))
  const updateLine = (index: number, patch: Partial<Line>) => setEntry({ ...entry, lines: entry.lines.map((line, i) => i === index ? { ...line, ...patch } : line) })
  const total = (lines: Line[], side: Line['side']) => lines.filter((line) => line.side === side).reduce((sum, line) => sum + (cents(line.amount) || 0), 0)
  const debit = total(entry.lines, 'Debit')
  const credit = total(entry.lines, 'Credit')
  const accountOptions = accounts.filter((item) => !item.archived)

  function addAccount(event: React.FormEvent) {
    event.preventDefault()
    if (!senior) return setMessage('Only administrators and senior accountants can manage accounts.')
    const code = account.code.trim()
    const name = account.name.trim()
    const currency = account.currency.trim().toUpperCase()
    if (!/^[a-zA-Z0-9]+(?:\.[a-zA-Z0-9]+)*$/.test(code) || !name || !/^[A-Z]{3}$/.test(currency)) return setMessage('Enter a valid code, name and three-letter currency.')
    if (accounts.some((item) => item.code.toLowerCase() === code.toLowerCase())) return setMessage('Account code already exists.')
    if (account.parent && (!accounts.some((item) => item.code === account.parent && !item.archived) || !code.toLowerCase().startsWith(`${account.parent.toLowerCase()}.`))) return setMessage('A sub-account code must start with its active parent code followed by a dot.')
    setAccounts([...accounts, { ...account, code, name, currency }])
    record(`Created account ${code}`)
    setAccount({ code: '', name: '', type: 'A', currency: 'RON', parent: '', archived: false })
    setMessage('Account created.')
  }

  function saveEntry(event: React.FormEvent) {
    event.preventDefault()
    if (!entry.date || isLocked(entry.date)) return setMessage('Choose an unlocked accounting period.')
    if (!entry.description.trim() || entry.lines.length < 2 || entry.lines.some((line) => !accountOptions.some((item) => item.code === line.account) || !Number.isSafeInteger(cents(line.amount)) || cents(line.amount) <= 0)) return setMessage('Enter a description and at least two valid lines with active accounts and positive amounts.')
    if (new Set(entry.lines.map((line) => accountOptions.find((item) => item.code === line.account)?.currency)).size !== 1) return setMessage('All accounts in an entry must use the same currency; conversion is not supported.')
    if (debit !== credit || debit === 0 || !Number.isSafeInteger(debit)) return setMessage('Debit and credit totals must be equal and non-zero.')
    const number = entry.number.trim() || `JE-${String(entries.length + 1).padStart(4, '0')}`
    if (entries.some((item) => item.number.toLowerCase() === number.toLowerCase())) return setMessage('Document number already exists.')
    setEntries([...entries, { ...entry, number, description: entry.description.trim() }])
    record(`Created journal entry ${number}`)
    setEntry({ ...entry, number: '', description: '', lines: [emptyLine(), { ...emptyLine(), side: 'Credit' }] })
    setMessage(`Entry ${number} saved.`)
  }

  function reverse(original: Entry) {
    if (!entry.date || isLocked(entry.date)) return setMessage('Choose an unlocked accounting date in the entry form before reversing.')
    const number = `REV-${original.number}-${entries.length + 1}`
    if (entries.some((item) => item.number.toLowerCase() === number.toLowerCase())) return setMessage('Reversal document number already exists.')
    if (original.lines.some((line) => !accountOptions.some((item) => item.code === line.account))) return setMessage('Reactivate archived accounts before reversing this entry.')
    setEntries([...entries, { ...original, number, date: entry.date, description: `Reversal of ${original.number}: ${original.description}`, lines: original.lines.map((line) => ({ ...line, side: line.side === 'Debit' ? 'Credit' : 'Debit' })) }])
    record(`Reversed journal entry ${original.number} as ${number}`)
    setMessage(`Reversal ${number} saved.`)
  }

  const activity = (code: string, start: string, end: string) => entries.filter((item) => item.date >= start && item.date <= end).flatMap((item) => item.lines.filter((line) => line.account === code))
  const periodEntries = entries.filter((item) => item.date >= from && item.date <= to).sort((a, b) => a.date.localeCompare(b.date))
  const availableReport = ['Trial Balance', 'General Journal', 'Account Ledger', 'General Ledger', 'Cost Center Report'].includes(report)
  let headings: string[] = []
  let rows: string[][] = []
  if (report === 'Trial Balance' || report === 'General Ledger') {
    headings = ['Account', 'Name', 'Currency', 'Opening (D-C)', 'Debit', 'Credit', 'Closing (D-C)']
    rows = accounts.map((item) => {
      const openingLines = entries.filter((entryItem) => entryItem.date < from).flatMap((entryItem) => entryItem.lines.filter((line) => line.account === item.code))
      const opening = total(openingLines, 'Debit') - total(openingLines, 'Credit')
      const lines = activity(item.code, from, to)
      return [item.code, item.name, item.currency, money(opening), money(total(lines, 'Debit')), money(total(lines, 'Credit')), money(opening + total(lines, 'Debit') - total(lines, 'Credit'))]
    })
  } else if (report === 'General Journal' || report === 'Account Ledger' || report === 'Cost Center Report') {
    headings = ['Date', 'Document', 'Description', 'Account', 'Currency', 'Cost center', 'Debit', 'Credit']
    rows = periodEntries.flatMap((item) => item.lines.filter((line) => report !== 'Account Ledger' || line.account === reportAccount).filter((line) => report !== 'Cost Center Report' || line.costCenter.trim()).map((line) => [item.date, item.number, item.description, line.account, accounts.find((accountItem) => accountItem.code === line.account)?.currency ?? '', line.costCenter, line.side === 'Debit' ? line.amount : '', line.side === 'Credit' ? line.amount : '']))
  }
  function exportCsv() {
    const escape = (cell: string) => `"${(/^[\s]*[=+\-@\t\r]/.test(cell) ? `'${cell}` : cell).replaceAll('"', '""')}"`
    const csv = [headings, ...rows].map((row) => row.map(escape).join(',')).join('\r\n')
    const url = URL.createObjectURL(new Blob(['\ufeff', csv], { type: 'text/csv;charset=utf-8' }))
    const link = document.createElement('a')
    link.href = url
    link.download = `${report.toLowerCase().replaceAll(' ', '-')}.csv`
    link.click()
    URL.revokeObjectURL(url)
  }

  return <main className="accounting">
    <header><Link to="/">← Back to dashboard</Link><h1>Accounting workspace</h1><p>Frontend preview · data is held in memory and is lost when you leave or reload. Not a statutory accounting system.</p><p>Authentication, permissions, audit history and period locks require server enforcement before production use.</p></header>
    <nav aria-label="Accounting screens">{['Accounts', 'Journal', 'Settings', 'Reports'].map((name) => <button key={name} type="button" aria-pressed={tab === name} onClick={() => { setTab(name); setMessage('') }}>{name}</button>)}</nav>
    {message && <p role="status" className="accounting__message">{message}</p>}
    {tab === 'Accounts' && <section><h2>Chart of accounts</h2>
      <form onSubmit={addAccount} className="accounting__form">
        <label>Account code<input required value={account.code} onChange={(e) => setAccount({ ...account, code: e.target.value })} placeholder="401.Sub1" /></label>
        <label>Account name<input required value={account.name} onChange={(e) => setAccount({ ...account, name: e.target.value })} /></label>
        <label>Account type<select value={account.type} onChange={(e) => setAccount({ ...account, type: e.target.value })}><option value="A">Asset (A)</option><option value="L">Liability (L)</option><option value="A/L">Dual (A/L)</option></select></label>
        <label>Parent account<select value={account.parent} onChange={(e) => setAccount({ ...account, parent: e.target.value })}><option value="">None (root)</option>{accountOptions.map((item) => <option key={item.code} value={item.code}>{item.code} — {item.name}</option>)}</select></label>
        <label>Currency<input required maxLength={3} value={account.currency} onChange={(e) => setAccount({ ...account, currency: e.target.value })} /></label>
        <button type="submit" disabled={!senior}>Add account</button>
      </form>
      <p>Balances are debit minus credit, calculated from journal entries. Group is the first digit of the code.</p>
      <div className="accounting__table"><table><thead><tr><th>Account hierarchy</th><th>Type</th><th>Group</th><th>Currency</th><th>Opening</th><th>Turnover D / C</th><th>Closing</th><th>Status</th></tr></thead><tbody>{[...accounts].sort((a, b) => a.code.localeCompare(b.code)).map((item) => { const lines = activity(item.code, `${settings.year}-${settings.month}-01`, `${settings.year}-${settings.month}-31`); const opening = entries.filter((e) => e.date < `${settings.year}-${settings.month}-01`).flatMap((e) => e.lines.filter((line) => line.account === item.code)); return <tr key={item.code}><td style={{ paddingLeft: `${1 + item.code.split('.').length - 1}rem` }}>{item.code} — {item.name}</td><td>{item.type}</td><td>{item.code[0]}</td><td>{item.currency}</td><td>{money(total(opening, 'Debit') - total(opening, 'Credit'))}</td><td>{money(total(lines, 'Debit'))} / {money(total(lines, 'Credit'))}</td><td>{money(total(opening, 'Debit') - total(opening, 'Credit') + total(lines, 'Debit') - total(lines, 'Credit'))}</td><td><button type="button" disabled={!senior} onClick={() => { if (!item.archived && accounts.some((child) => child.parent === item.code && !child.archived)) return setMessage('Archive active sub-accounts first.'); if (item.archived && item.parent && !accountOptions.some((parent) => parent.code === item.parent)) return setMessage('Reactivate the parent account first.'); setAccounts(accounts.map((a) => a.code === item.code ? { ...a, archived: !a.archived } : a)); record(`${item.archived ? 'Reactivated' : 'Archived'} account ${item.code}`) }}>{item.archived ? 'Reactivate' : 'Archive'}</button></td></tr> })}</tbody></table></div>
    </section>}
    {tab === 'Journal' && <section><h2>General journal</h2><form onSubmit={saveEntry}>
      <div className="accounting__form"><label>Document number (optional)<input value={entry.number} onChange={(e) => setEntry({ ...entry, number: e.target.value })} /></label><label>Document type<select value={entry.type} onChange={(e) => setEntry({ ...entry, type: e.target.value })}>{['Invoice', 'Bank Statement', 'Receipt', 'Other'].map((type) => <option key={type}>{type}</option>)}</select></label><label>Accounting date<input type="date" required value={entry.date} onChange={(e) => setEntry({ ...entry, date: e.target.value })} /></label><label>Description<input required value={entry.description} onChange={(e) => setEntry({ ...entry, description: e.target.value })} /></label></div>
      <h3>Entry lines</h3><datalist id="account-codes">{accountOptions.map((item) => <option key={item.code} value={item.code}>{item.name}</option>)}</datalist>
      {entry.lines.map((line, index) => <div className="accounting__form accounting__line" key={index}><label>Account<input list="account-codes" value={line.account} onChange={(e) => updateLine(index, { account: e.target.value })} required /></label><label>Side<select value={line.side} onChange={(e) => updateLine(index, { side: e.target.value as Line['side'] })}><option>Debit</option><option>Credit</option></select></label><label>Amount<input inputMode="decimal" placeholder="0.00" value={line.amount} onChange={(e) => updateLine(index, { amount: e.target.value })} required /></label><label>Cost center<input value={line.costCenter} onChange={(e) => updateLine(index, { costCenter: e.target.value })} /></label><button type="button" onClick={() => setEntry({ ...entry, lines: entry.lines.filter((_, i) => i !== index) })}>Remove line</button></div>)}
      <p>Debit: {money(debit)} · Credit: {money(credit)} · Difference: {money(debit - credit)}</p><div className="accounting__actions"><button type="button" onClick={() => setEntry({ ...entry, lines: [...entry.lines, emptyLine()] })}>Add line</button><button type="submit">Save entry</button></div>
    </form><div className="accounting__form"><label>Template name<input value={template} onChange={(e) => setTemplate(e.target.value)} /></label><button type="button" onClick={() => { if (!template.trim()) return setMessage('Enter a template name.'); setTemplates([...templates.filter((item) => item.name !== template.trim()), { name: template.trim(), lines: entry.lines.map((line) => ({ ...line })) }]); record(`Saved template ${template.trim()}`); setMessage('Template saved.') }}>Save current lines as template</button><label>Apply template<select value="" onChange={(e) => { const selected = templates.find((item) => item.name === e.target.value); if (selected) setEntry({ ...entry, lines: selected.lines.map((line) => ({ ...line })) }) }}><option value="">Select template</option>{templates.map((item) => <option key={item.name}>{item.name}</option>)}</select></label></div>
      <h3>Saved entries</h3><p>To reverse an entry, first choose the reversal accounting date above.</p><div className="accounting__table"><table><thead><tr><th>Date</th><th>Document</th><th>Type</th><th>Description</th><th>Debit / Credit</th><th></th></tr></thead><tbody>{entries.map((item) => <tr key={item.number}><td>{item.date}</td><td>{item.number}</td><td>{item.type}</td><td>{item.description}</td><td>{money(total(item.lines, 'Debit'))} / {money(total(item.lines, 'Credit'))}</td><td><button type="button" onClick={() => reverse(item)}>Reverse</button></td></tr>)}</tbody></table></div>
    </section>}
    {tab === 'Settings' && <section><h2>Application settings</h2><p>Role: {admin ? 'Administrator' : senior ? 'Senior accountant' : 'Junior accountant'}. Administrators configure settings; senior accountants can lock periods; junior accountants enter data.</p>
      <form className="accounting__form" onSubmit={(e) => { e.preventDefault(); if (!admin) return; if (settings.rates.trim() && settings.rates.split(',').some((rate) => !/^\d+(\.\d+)?$/.test(rate.trim()) || Number(rate) > 100)) return setMessage('Enter VAT rates between 0 and 100, separated by commas.'); record('Updated accounting settings'); setMessage('Settings saved for this session.') }}>
        {([['registration', 'Company registration number'], ['taxId', 'Tax ID'], ['address', 'Legal address'], ['bank', 'Primary bank accounts'], ['year', 'Fiscal year'], ['month', 'Current month'], ['rates', 'VAT rates (%) separated by commas']] as const).map(([key, label]) => <label key={key}>{label}<input disabled={!admin} value={settings[key]} type={key === 'year' || key === 'month' ? 'number' : 'text'} min={key === 'year' ? '1' : key === 'month' ? '1' : undefined} max={key === 'year' ? '9999' : key === 'month' ? '12' : undefined} required={key === 'year' || key === 'month'} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })} onBlur={() => { if (key === 'month' && settings.month) setSettings({ ...settings, month: settings.month.padStart(2, '0') }) }} /></label>)}
        {([['retained', 'Retained earnings account'], ['profit', 'Profit & loss account'], ['vat', 'VAT control account']] as const).map(([key, label]) => <label key={key}>{label}<select disabled={!admin} value={settings[key]} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}><option value="">Select account</option>{accountOptions.map((item) => <option key={item.code} value={item.code}>{item.code} — {item.name}</option>)}</select></label>)}<button disabled={!admin} type="submit">Save settings</button>
      </form>
      <h3>Period locking</h3><p>Lock a month to prevent new entries and reversals in that period.</p><div className="accounting__form"><label>Period to lock<input type="month" disabled={!senior} value={lockPeriod} onChange={(e) => setLockPeriod(e.target.value)} /></label><button disabled={!senior || !/^\d{4}-(0[1-9]|1[0-2])$/.test(lockPeriod) || locked.includes(lockPeriod)} type="button" onClick={() => { setLocked([...locked, lockPeriod]); record(`Locked period ${lockPeriod}`); setMessage(`Period ${lockPeriod} locked.`) }}>Lock period</button></div><p>Locked periods: {locked.join(', ') || 'None'}</p>
      <h3>Session audit log</h3><p>This preview log is not immutable or persistent.</p><div className="accounting__table"><table><thead><tr><th>When</th><th>Who</th><th>Action</th></tr></thead><tbody>{audit.map((item, index) => <tr key={index}><td>{item.when}</td><td>{item.who}</td><td>{item.action}</td></tr>)}</tbody></table></div>
    </section>}
    {tab === 'Reports' && <section><h2>Reports</h2><div className="accounting__form"><label>Report<select value={report} onChange={(e) => setReport(e.target.value)}>{reportNames.map((name) => <option key={name}>{name}</option>)}</select></label><label>From<input type="date" value={from} onChange={(e) => setFrom(e.target.value)} /></label><label>To<input type="date" value={to} onChange={(e) => setTo(e.target.value)} /></label>{report === 'Account Ledger' && <label>Account<select value={reportAccount} onChange={(e) => setReportAccount(e.target.value)}><option value="">Select account</option>{accounts.map((item) => <option key={item.code} value={item.code}>{item.code} — {item.name}</option>)}</select></label>}</div>
      {!availableReport ? <p>This report requires additional accounting data and a backend integration; it is not available in this preview.</p> : !from || !to || from > to ? <p>Select a valid date range.</p> : report === 'Account Ledger' && !reportAccount ? <p>Select an account.</p> : <><p>Preview only. Amounts are shown in each account's currency; no foreign exchange conversion is performed. Cost center rows are journal activity, not profitability.</p><div className="accounting__actions"><button type="button" onClick={exportCsv}>Export CSV for Excel</button><button type="button" onClick={() => window.print()}>Print / Save as PDF</button></div><div className="accounting__table"><table><thead><tr>{headings.map((heading) => <th key={heading}>{heading}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((cell, cellIndex) => <td key={cellIndex}>{cell}</td>)}</tr>)}</tbody></table></div></>}
    </section>}
  </main>
}
