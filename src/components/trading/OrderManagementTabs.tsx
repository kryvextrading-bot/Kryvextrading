import React from 'react';
import { useOrderContext } from '@/contexts/OrderContext';
import { Button } from '@/components/ui/button';

const TABS = [
  { key: 'positions', label: 'Positions' },
  { key: 'open', label: 'Open orders' },
  { key: 'closed', label: 'Closed Orders' },
];

const OrderManagementTabs: React.FC = () => {
  const { openOrders, closedOrders, cancelOrder } = useOrderContext();
  const [activeTab, setActiveTab] = React.useState<'positions' | 'open' | 'closed'>('positions');

  return (
    <div className="bg-[#23262F] rounded-xl shadow p-6 w-full max-w-3xl mx-auto mt-8">
      <div className="flex gap-6 mb-4">
        {TABS.map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`font-semibold px-2 pb-1 border-b-2 transition-colors duration-150 ${
              activeTab === tab.key ? 'border-[#F0B90B] text-[#F0B90B]' : 'border-transparent text-white hover:text-[#F0B90B]'
            }`}
            style={{ background: 'none', outline: 'none' }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      {/* Tab Content */}
      {activeTab === 'positions' && (
        <div className="text-center text-muted-foreground py-8">No open positions yet.</div>
      )}
      {activeTab === 'open' && (
        <div>
          {openOrders.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No open orders.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th>Type</th>
                  <th>Side</th>
                  <th>Asset</th>
                  <th>Price</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {openOrders.map(order => (
                  <tr key={order.id} className="border-b">
                    <td>{order.type}</td>
                    <td>{order.side}</td>
                    <td>{order.asset}</td>
                    <td>{order.price !== null ? `$${order.price}` : 'Market'}</td>
                    <td>{order.amount}</td>
                    <td>{order.status}</td>
                    <td>{new Date(order.createdAt).toLocaleString()}</td>
                    <td>
                      <Button size="sm" variant="destructive" onClick={() => cancelOrder(order.id)} disabled={order.status !== 'Open'}>
                        Cancel
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      {activeTab === 'closed' && (
        <div>
          {closedOrders.length === 0 ? (
            <div className="text-gray-500 text-center py-8">No order history.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th>Type</th>
                  <th>Side</th>
                  <th>Asset</th>
                  <th>Price</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Created</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {closedOrders.map(order => (
                  <tr key={order.id} className="border-b">
                    <td>{order.type}</td>
                    <td>{order.side}</td>
                    <td>{order.asset}</td>
                    <td>{order.price !== null ? `$${order.price}` : 'Market'}</td>
                    <td>{order.amount}</td>
                    <td>{order.status}</td>
                    <td>{new Date(order.createdAt).toLocaleString()}</td>
                    <td>{new Date(order.updatedAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
    </div>
  );
};

export default OrderManagementTabs; 