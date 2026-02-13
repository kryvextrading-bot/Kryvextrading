import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  CreditCard, 
  Plus, 
  Trash2, 
  Edit, 
  CheckCircle, 
  AlertCircle, 
  Banknote, 
  Smartphone,
  Globe,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'crypto' | 'paypal';
  name: string;
  last4?: string;
  expiry?: string;
  isDefault: boolean;
  status: 'active' | 'inactive' | 'pending';
}

export default function PaymentMethods() {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingMethod, setEditingMethod] = useState<PaymentMethod | null>(null);
  
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([
    {
      id: '1',
      type: 'card',
      name: 'Visa ending in 4242',
      last4: '4242',
      expiry: '12/25',
      isDefault: true,
      status: 'active'
    },
    {
      id: '2',
      type: 'bank',
      name: 'Chase Checking',
      last4: '6789',
      isDefault: false,
      status: 'active'
    },
    {
      id: '3',
      type: 'crypto',
      name: 'Bitcoin Wallet',
      last4: 'bc1q...xyz',
      isDefault: false,
      status: 'active'
    }
  ]);

  const [newMethod, setNewMethod] = useState({
    type: 'card' as const,
    name: '',
    number: '',
    expiry: '',
    cvv: '',
    routingNumber: '',
    accountNumber: ''
  });

  const handleAddMethod = () => {
    if (!newMethod.name || (newMethod.type === 'card' && (!newMethod.number || !newMethod.expiry))) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields.",
        variant: "destructive",
      });
      return;
    }

    const method: PaymentMethod = {
      id: Date.now().toString(),
      type: newMethod.type,
      name: newMethod.name,
      last4: newMethod.type === 'card' ? newMethod.number.slice(-4) : newMethod.accountNumber.slice(-4),
      expiry: newMethod.type === 'card' ? newMethod.expiry : undefined,
      isDefault: paymentMethods.length === 0,
      status: 'active'
    };

    setPaymentMethods([...paymentMethods, method]);
    setNewMethod({
      type: 'card',
      name: '',
      number: '',
      expiry: '',
      cvv: '',
      routingNumber: '',
      accountNumber: ''
    });
    setShowAddForm(false);
    
    toast({
      title: "Payment Method Added",
      description: "Your payment method has been successfully added.",
    });
  };

  const handleDeleteMethod = (id: string) => {
    setPaymentMethods(paymentMethods.filter(method => method.id !== id));
    toast({
      title: "Payment Method Removed",
      description: "The payment method has been removed from your account.",
    });
  };

  const handleSetDefault = (id: string) => {
    setPaymentMethods(paymentMethods.map(method => ({
      ...method,
      isDefault: method.id === id
    })));
    toast({
      title: "Default Updated",
      description: "Your default payment method has been updated.",
    });
  };

  const getMethodIcon = (type: string) => {
    switch (type) {
      case 'card':
        return <CreditCard className="w-5 h-5" />;
      case 'bank':
        return <Banknote className="w-5 h-5" />;
      case 'crypto':
        return <Globe className="w-5 h-5" />;
      default:
        return <Smartphone className="w-5 h-5" />;
    }
  };

  const getMethodColor = (type: string) => {
    switch (type) {
      case 'card':
        return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'bank':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'crypto':
        return 'bg-purple-500/20 text-purple-400 border-purple-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0E11] p-4 md:p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <Button 
            variant="ghost" 
            className="text-[#848E9C] hover:text-[#EAECEF] mb-4"
            onClick={() => navigate('/wallet')}
          >
            ← Back to Wallet
          </Button>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-[#F0B90B] rounded-full flex items-center justify-center">
                <CreditCard className="w-6 h-6 text-[#181A20]" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[#EAECEF]">Payment Methods</h1>
                <p className="text-[#848E9C]">Manage your payment options and funding sources</p>
              </div>
            </div>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Method
            </Button>
          </div>
        </div>

        {/* Add Payment Method Form */}
        {showAddForm && (
          <Card className="bg-[#181A20] border-[#2B3139] p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-[#EAECEF]">Add Payment Method</h2>
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowAddForm(false)}
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-4">
              <div>
                <Label className="text-[#EAECEF]">Payment Type</Label>
                <Select value={newMethod.type} onValueChange={(value: any) => setNewMethod({...newMethod, type: value})}>
                  <SelectTrigger className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="card">Credit/Debit Card</SelectItem>
                    <SelectItem value="bank">Bank Account</SelectItem>
                    <SelectItem value="crypto">Cryptocurrency Wallet</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-[#EAECEF]">Name</Label>
                <Input
                  value={newMethod.name}
                  onChange={(e) => setNewMethod({...newMethod, name: e.target.value})}
                  placeholder="e.g., Personal Visa Card"
                  className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF]"
                />
              </div>

              {newMethod.type === 'card' && (
                <>
                  <div>
                    <Label className="text-[#EAECEF]">Card Number</Label>
                    <Input
                      value={newMethod.number}
                      onChange={(e) => setNewMethod({...newMethod, number: e.target.value})}
                      placeholder="1234 5678 9012 3456"
                      className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="text-[#EAECEF]">Expiry</Label>
                      <Input
                        value={newMethod.expiry}
                        onChange={(e) => setNewMethod({...newMethod, expiry: e.target.value})}
                        placeholder="MM/YY"
                        className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF]"
                      />
                    </div>
                    <div>
                      <Label className="text-[#EAECEF]">CVV</Label>
                      <Input
                        value={newMethod.cvv}
                        onChange={(e) => setNewMethod({...newMethod, cvv: e.target.value})}
                        placeholder="123"
                        className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF]"
                      />
                    </div>
                  </div>
                </>
              )}

              {newMethod.type === 'bank' && (
                <>
                  <div>
                    <Label className="text-[#EAECEF]">Routing Number</Label>
                    <Input
                      value={newMethod.routingNumber}
                      onChange={(e) => setNewMethod({...newMethod, routingNumber: e.target.value})}
                      placeholder="123456789"
                      className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF]"
                    />
                  </div>
                  <div>
                    <Label className="text-[#EAECEF]">Account Number</Label>
                    <Input
                      value={newMethod.accountNumber}
                      onChange={(e) => setNewMethod({...newMethod, accountNumber: e.target.value})}
                      placeholder="1234567890"
                      className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF]"
                    />
                  </div>
                </>
              )}

              {newMethod.type === 'crypto' && (
                <div>
                  <Label className="text-[#EAECEF]">Wallet Address</Label>
                  <Input
                    value={newMethod.accountNumber}
                    onChange={(e) => setNewMethod({...newMethod, accountNumber: e.target.value})}
                    placeholder="bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh"
                    className="bg-[#1E2329] border-[#2B3139] text-[#EAECEF]"
                  />
                </div>
              )}

              <div className="flex gap-3">
                <Button onClick={handleAddMethod} className="bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20]">
                  Add Payment Method
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowAddForm(false)}
                  className="border-[#2B3139] text-[#EAECEF]"
                >
                  Cancel
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Payment Methods List */}
        <div className="grid gap-4">
          {paymentMethods.map((method) => (
            <Card key={method.id} className="bg-[#181A20] border-[#2B3139] p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-lg border ${getMethodColor(method.type)}`}>
                    {getMethodIcon(method.type)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-[#EAECEF]">{method.name}</h3>
                      {method.isDefault && (
                        <Badge className="bg-[#F0B90B] text-[#181A20]">Default</Badge>
                      )}
                      {method.status === 'active' ? (
                        <CheckCircle className="w-4 h-4 text-green-400" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-yellow-400" />
                      )}
                    </div>
                    <p className="text-sm text-[#848E9C]">
                      {method.last4 && `Ending in ${method.last4}`}
                      {method.expiry && ` • Expires ${method.expiry}`}
                    </p>
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  {!method.isDefault && (
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => handleSetDefault(method.id)}
                      className="text-[#848E9C] hover:text-[#EAECEF]"
                    >
                      Set Default
                    </Button>
                  )}
                  <Button 
                    variant="ghost" 
                    size="sm"
                    className="text-[#848E9C] hover:text-[#EAECEF]"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleDeleteMethod(method.id)}
                    className="text-red-400 hover:text-red-300"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {paymentMethods.length === 0 && (
          <Card className="bg-[#181A20] border-[#2B3139] p-12 text-center">
            <CreditCard className="w-12 h-12 text-[#848E9C] mx-auto mb-4" />
            <h3 className="text-lg font-medium text-[#EAECEF] mb-2">No Payment Methods</h3>
            <p className="text-[#848E9C] mb-6">Add a payment method to fund your account and make withdrawals.</p>
            <Button 
              onClick={() => setShowAddForm(true)}
              className="bg-[#F0B90B] hover:bg-yellow-400 text-[#181A20]"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Your First Payment Method
            </Button>
          </Card>
        )}
      </div>
    </div>
  );
}
