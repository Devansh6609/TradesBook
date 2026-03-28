export default function AccountsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Trading Accounts</h2>
        <p className="text-foreground-muted mt-1">
          Manage your trading accounts and balances.
        </p>
      </div>
      
      <div className="card">
        <p className="text-foreground-muted text-center py-12">
          No accounts connected. Add your first trading account to get started.
        </p>
      </div>
    </div>
  )
}
