import { Transaction, Account, Budget, Goal, UserProfile } from '../types';

export function exportTransactionsToCSV(transactions: Transaction[], accounts: Account[], currencySymbol: string) {
  const headers = ['ID', 'Date', 'Type', 'Title', 'Amount', 'Category', 'Subcategory', 'Account', 'Notes', 'Tags', 'Recurring'];
  
  const getAccountName = (accId: string) => accounts.find(a => a.id === accId)?.name || accId;

  const rows = transactions.map(t => [
    t.id,
    t.date,
    t.type.toUpperCase(),
    `"${(t.title || '').replace(/"/g, '""')}"`,
    `${t.type === 'expense' ? '-' : '+'}${t.amount.toFixed(2)}`,
    `"${(t.category || '').replace(/"/g, '""')}"`,
    `"${(t.subcategory || '').replace(/"/g, '""')}"`,
    `"${getAccountName(t.accountId).replace(/"/g, '""')}"`,
    `"${(t.notes || '').replace(/"/g, '""')}"`,
    `"${(t.tags || []).join('; ')}"`,
    t.isRecurring ? 'Yes' : 'No'
  ]);

  const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
  
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `financial_report_${new Date().toISOString().split('T')[0]}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function printFinancialReportPDF(
  profile: UserProfile, 
  accounts: Account[], 
  transactions: Transaction[], 
  budgets: Budget[],
  goals: Goal[],
  totalIncome: number,
  totalExpense: number
) {
  const printWindow = window.open('', '_blank');
  if (!printWindow) return;

  const dateStr = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
  const netSavings = totalIncome - totalExpense;

  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <title>Financial Report - ${profile.fullName}</title>
        <style>
          body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #18181b; background: #fff; padding: 30px; margin: 0; }
          .header { border-bottom: 3px solid #000; padding-bottom: 15px; margin-bottom: 25px; display: flex; justify-content: space-between; align-items: center; }
          .title { font-size: 26px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; }
          .subtitle { color: #52525b; font-size: 14px; margin-top: 4px; }
          .badge { background: #eab308; color: #000; font-weight: bold; padding: 4px 10px; border: 2px solid #000; display: inline-block; }
          .summary-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-bottom: 30px; }
          .card { border: 2px solid #000; padding: 15px; background: #f4f4f5; }
          .card-title { font-size: 12px; text-transform: uppercase; color: #71717a; font-weight: bold; }
          .card-value { font-size: 22px; font-weight: 800; margin-top: 5px; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 30px; font-size: 13px; }
          th { background: #18181b; color: #fff; text-align: left; padding: 8px 10px; text-transform: uppercase; font-size: 11px; }
          td { border-bottom: 1px solid #e4e4e7; padding: 8px 10px; }
          tr:nth-child(even) { background: #fafafa; }
          .section-title { font-size: 16px; font-weight: bold; text-transform: uppercase; margin-bottom: 12px; border-left: 4px solid #000; padding-left: 8px; }
          .footer { margin-top: 40px; font-size: 11px; color: #71717a; text-align: center; border-top: 1px solid #e4e4e7; padding-top: 15px; }
        </style>
      </head>
      <body>
        <div class="header">
          <div>
            <div class="title">RETRO ARCADE FINANCIAL REPORT</div>
            <div class="subtitle">Prepared for ${profile.fullName} (${profile.email})</div>
          </div>
          <div>
            <span class="badge">DATE: ${dateStr}</span>
          </div>
        </div>

        <div class="summary-grid">
          <div class="card">
            <div class="card-title">TOTAL MONTHLY INCOME</div>
            <div class="card-value" style="color: #16a34a;">${profile.currencySymbol}${totalIncome.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          </div>
          <div class="card">
            <div class="card-title">TOTAL MONTHLY EXPENSES</div>
            <div class="card-value" style="color: #dc2626;">${profile.currencySymbol}${totalExpense.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          </div>
          <div class="card">
            <div class="card-title">NET SAVINGS BOOST</div>
            <div class="card-value" style="color: ${netSavings >= 0 ? '#0284c7' : '#dc2626'};">${profile.currencySymbol}${netSavings.toLocaleString(undefined, {minimumFractionDigits: 2})}</div>
          </div>
        </div>

        <div class="section-title">ACCOUNT BALANCES</div>
        <table>
          <thead>
            <tr>
              <th>Account Name</th>
              <th>Type</th>
              <th>Status</th>
              <th>Current Balance</th>
            </tr>
          </thead>
          <tbody>
            ${accounts.map(acc => `
              <tr>
                <td><strong>${acc.name}</strong> ${acc.accountNumber || ''}</td>
                <td style="text-transform: uppercase;">${acc.type}</td>
                <td style="text-transform: uppercase;">${acc.status}</td>
                <td><strong>${profile.currencySymbol}${acc.currentBalance.toLocaleString(undefined, {minimumFractionDigits: 2})}</strong></td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="section-title">RECENT TRANSACTIONS</div>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Title / Merchant</th>
              <th>Category</th>
              <th>Type</th>
              <th>Amount</th>
            </tr>
          </thead>
          <tbody>
            ${transactions.slice(0, 15).map(tx => `
              <tr>
                <td>${tx.date}</td>
                <td><strong>${tx.title}</strong></td>
                <td>${tx.category}</td>
                <td style="text-transform: uppercase; font-size: 10px; font-weight: bold;">${tx.type}</td>
                <td style="color: ${tx.type === 'expense' ? '#dc2626' : tx.type === 'income' ? '#16a34a' : '#2563eb'}; font-weight: bold;">
                  ${tx.type === 'expense' ? '-' : '+'}${profile.currencySymbol}${tx.amount.toFixed(2)}
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="footer">
          Generated via Retro Arcade Personal Finance Tracker • Confidential Personal Record
        </div>

        <script>
          window.onload = function() { window.print(); };
        </script>
      </body>
    </html>
  `;

  printWindow.document.write(html);
  printWindow.document.close();
}
