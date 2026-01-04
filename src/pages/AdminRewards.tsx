import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { AdminNav } from "@/components/admin/AdminNav";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { 
  Sprout, 
  Settings, 
  Users, 
  AlertTriangle,
  Search,
  Edit,
  Save,
  Loader2,
  TrendingUp,
  TrendingDown,
  Snowflake,
  Sun,
  Plus,
  Minus,
  ShoppingBag,
  Trash2,
  X,
  UserPlus
} from "lucide-react";
import AdminReferralStats from "@/components/admin/AdminReferralStats";
import { toast } from "sonner";
import { format } from "date-fns";

const AdminRewards = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState("settings");
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [adjustDialogOpen, setAdjustDialogOpen] = useState(false);
  const [adjustDirection, setAdjustDirection] = useState<'credit' | 'debit'>('credit');
  const [adjustAmount, setAdjustAmount] = useState("");
  const [adjustReason, setAdjustReason] = useState("");
  const [editingRule, setEditingRule] = useState<any>(null);
  
  // Store management state
  const [editingStoreItem, setEditingStoreItem] = useState<any>(null);
  const [addItemDialogOpen, setAddItemDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({
    code: "",
    name: "",
    name_ko: "",
    description: "",
    description_ko: "",
    cost: 100,
    stock: null as number | null,
    enabled: true
  });

  // Fetch settings
  const { data: settings, isLoading: settingsLoading } = useQuery({
    queryKey: ['admin-rewards-settings'],
    queryFn: async () => {
      const { data } = await supabase
        .from('rewards_settings')
        .select('*')
        .eq('id', 1)
        .single();
      return data;
    }
  });

  // Fetch rules
  const { data: rules, isLoading: rulesLoading } = useQuery({
    queryKey: ['admin-rewards-rules'],
    queryFn: async () => {
      const { data } = await supabase
        .from('rewards_rules')
        .select('*')
        .order('amount', { ascending: false });
      return data || [];
    }
  });

  // Fetch store items
  const { data: storeItems, isLoading: storeLoading } = useQuery({
    queryKey: ['admin-rewards-store-items'],
    queryFn: async () => {
      const { data } = await supabase
        .from('rewards_store_items')
        .select('*')
        .order('cost', { ascending: true });
      return data || [];
    }
  });

  // Fetch redemptions
  const { data: redemptions, isLoading: redemptionsLoading } = useQuery({
    queryKey: ['admin-rewards-redemptions'],
    queryFn: async () => {
      const { data } = await supabase
        .from('rewards_redemptions')
        .select('*, profiles:user_id(email, full_name)')
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    }
  });

  // Fetch abuse flags
  const { data: abuseFlags } = useQuery({
    queryKey: ['admin-rewards-abuse-flags'],
    queryFn: async () => {
      const { data } = await supabase
        .from('rewards_abuse_flags')
        .select('*, profiles:user_id(email, full_name)')
        .eq('resolved', false)
        .order('created_at', { ascending: false })
        .limit(50);
      return data || [];
    }
  });

  // Fetch top earners today
  const { data: topEarnersToday } = useQuery({
    queryKey: ['admin-rewards-top-earners-today'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const { data } = await supabase
        .from('rewards_daily_user_totals')
        .select('*, profiles:user_id(email, full_name)')
        .eq('date', today)
        .order('total_earned', { ascending: false })
        .limit(10);
      return data || [];
    }
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updates: any) => {
      const { error } = await supabase
        .from('rewards_settings')
        .update(updates)
        .eq('id', 1);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rewards-settings'] });
      toast.success('Settings updated');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  // Update rule mutation
  const updateRuleMutation = useMutation({
    mutationFn: async (rule: any) => {
      const { error } = await supabase
        .from('rewards_rules')
        .update({
          amount: rule.amount,
          enabled: rule.enabled,
          cooldown_seconds: rule.cooldown_seconds,
          daily_cap_amount: rule.daily_cap_amount
        })
        .eq('code', rule.code);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rewards-rules'] });
      setEditingRule(null);
      toast.success('Rule updated');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  // Update store item mutation
  const updateStoreItemMutation = useMutation({
    mutationFn: async (item: any) => {
      const { error } = await supabase
        .from('rewards_store_items')
        .update({
          name: item.name,
          name_ko: item.name_ko,
          description: item.description,
          description_ko: item.description_ko,
          cost: item.cost,
          stock: item.stock,
          enabled: item.enabled
        })
        .eq('code', item.code);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rewards-store-items'] });
      setEditingStoreItem(null);
      toast.success('Store item updated');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  // Add store item mutation
  const addStoreItemMutation = useMutation({
    mutationFn: async (item: any) => {
      const { error } = await supabase
        .from('rewards_store_items')
        .insert({
          code: item.code,
          name: item.name,
          name_ko: item.name_ko,
          description: item.description,
          description_ko: item.description_ko,
          cost: item.cost,
          stock: item.stock,
          enabled: item.enabled
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rewards-store-items'] });
      setAddItemDialogOpen(false);
      setNewItem({
        code: "",
        name: "",
        name_ko: "",
        description: "",
        description_ko: "",
        cost: 100,
        stock: null,
        enabled: true
      });
      toast.success('Store item added');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  // Delete store item mutation
  const deleteStoreItemMutation = useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase
        .from('rewards_store_items')
        .delete()
        .eq('code', code);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rewards-store-items'] });
      toast.success('Store item deleted');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  // Search users
  const searchUsers = async () => {
    if (!searchQuery.trim()) return;
    
    const { data } = await supabase
      .from('profiles')
      .select('id, email, full_name')
      .or(`email.ilike.%${searchQuery}%,full_name.ilike.%${searchQuery}%`)
      .limit(10);
    
    setSearchResults(data || []);
  };

  // Load user wallet and ledger
  const loadUserDetails = async (userId: string) => {
    const [walletRes, ledgerRes] = await Promise.all([
      supabase.from('rewards_wallets').select('*').eq('user_id', userId).single(),
      supabase.from('rewards_ledger').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(20)
    ]);
    
    setSelectedUser({
      ...searchResults.find(u => u.id === userId),
      wallet: walletRes.data,
      ledger: ledgerRes.data || []
    });
  };

  // Admin adjust mutation
  const adjustMutation = useMutation({
    mutationFn: async () => {
      const { data, error } = await supabase.functions.invoke('admin-rewards-adjust', {
        body: {
          user_id: selectedUser.id,
          direction: adjustDirection,
          amount: parseInt(adjustAmount),
          reason: adjustReason,
          override_caps: true
        }
      });
      if (error) throw error;
      if (!data.success) throw new Error(data.error);
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rewards'] });
      loadUserDetails(selectedUser.id);
      setAdjustDialogOpen(false);
      setAdjustAmount("");
      setAdjustReason("");
      toast.success('Adjustment completed');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  // Toggle wallet freeze
  const toggleFreezeMutation = useMutation({
    mutationFn: async ({ userId, frozen }: { userId: string; frozen: boolean }) => {
      const { error } = await supabase
        .from('rewards_wallets')
        .update({ status: frozen ? 'frozen' : 'active' })
        .eq('user_id', userId);
      if (error) throw error;
    },
    onSuccess: () => {
      loadUserDetails(selectedUser.id);
      toast.success('Wallet status updated');
    },
    onError: (error: any) => {
      toast.error(error.message);
    }
  });

  // Resolve abuse flag
  const resolveAbuseFlagMutation = useMutation({
    mutationFn: async (flagId: string) => {
      const { error } = await supabase
        .from('rewards_abuse_flags')
        .update({ resolved: true, resolved_by: user?.id, resolved_at: new Date().toISOString() })
        .eq('id', flagId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-rewards-abuse-flags'] });
      toast.success('Flag resolved');
    }
  });

  return (
    <div className="min-h-screen bg-background">
      <AdminNav />
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Sprout className="w-6 h-6 text-primary" />
            K-Seed Rewards Admin
          </h1>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </TabsTrigger>
            <TabsTrigger value="rules">
              <Edit className="w-4 h-4 mr-2" />
              Rules
            </TabsTrigger>
            <TabsTrigger value="store">
              <ShoppingBag className="w-4 h-4 mr-2" />
              Store
            </TabsTrigger>
            <TabsTrigger value="users">
              <Users className="w-4 h-4 mr-2" />
              Users
            </TabsTrigger>
            <TabsTrigger value="referrals">
              <UserPlus className="w-4 h-4 mr-2" />
              Referrals
            </TabsTrigger>
            <TabsTrigger value="abuse">
              <AlertTriangle className="w-4 h-4 mr-2" />
              Abuse
              {abuseFlags && abuseFlags.length > 0 && (
                <Badge variant="destructive" className="ml-2">{abuseFlags.length}</Badge>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Settings Tab */}
          <TabsContent value="settings" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Global Settings</CardTitle>
                <CardDescription>Configure the rewards system</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {settingsLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : settings && (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Rewards Enabled</Label>
                        <p className="text-sm text-muted-foreground">Enable or disable the entire rewards system</p>
                      </div>
                      <Switch
                        checked={settings.rewards_enabled}
                        onCheckedChange={(checked) => updateSettingsMutation.mutate({ rewards_enabled: checked })}
                      />
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <Label className="text-base">Store Enabled</Label>
                        <p className="text-sm text-muted-foreground">Enable or disable the K-Seed store</p>
                      </div>
                      <Switch
                        checked={settings.store_enabled ?? true}
                        onCheckedChange={(checked) => updateSettingsMutation.mutate({ store_enabled: checked })}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Max Daily Earn Per User</Label>
                        <Input
                          type="number"
                          value={settings.max_daily_earn_per_user}
                          onChange={(e) => updateSettingsMutation.mutate({ max_daily_earn_per_user: parseInt(e.target.value) })}
                        />
                      </div>
                      <div>
                        <Label>Max Single TX Amount</Label>
                        <Input
                          type="number"
                          value={settings.max_single_tx_amount}
                          onChange={(e) => updateSettingsMutation.mutate({ max_single_tx_amount: parseInt(e.target.value) })}
                        />
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Top Earners Today */}
            <Card className="mt-4">
              <CardHeader>
                <CardTitle>Top Earners Today</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead className="text-right">Earned</TableHead>
                      <TableHead className="text-right">Spent</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topEarnersToday?.map((entry: any) => (
                      <TableRow key={entry.user_id}>
                        <TableCell>
                          {entry.profiles?.full_name || entry.profiles?.email || entry.user_id}
                        </TableCell>
                        <TableCell className="text-right text-green-600">+{entry.total_earned}</TableCell>
                        <TableCell className="text-right text-orange-600">-{entry.total_spent}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Rules Tab */}
          <TabsContent value="rules" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Earning Rules</CardTitle>
                <CardDescription>Configure how users earn seeds</CardDescription>
              </CardHeader>
              <CardContent>
                {rulesLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rule</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Daily Cap</TableHead>
                        <TableHead>Cooldown</TableHead>
                        <TableHead>Enabled</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rules?.map((rule: any) => (
                        <TableRow key={rule.code}>
                          <TableCell>
                            <div>
                              <p className="font-medium">{rule.code}</p>
                              <p className="text-xs text-muted-foreground">{rule.description}</p>
                            </div>
                          </TableCell>
                          <TableCell>
                            {editingRule?.code === rule.code ? (
                              <Input
                                type="number"
                                value={editingRule.amount}
                                onChange={(e) => setEditingRule({ ...editingRule, amount: parseInt(e.target.value) })}
                                className="w-20"
                              />
                            ) : (
                              <Badge variant="secondary">+{rule.amount}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRule?.code === rule.code ? (
                              <Input
                                type="number"
                                value={editingRule.daily_cap_amount}
                                onChange={(e) => setEditingRule({ ...editingRule, daily_cap_amount: parseInt(e.target.value) })}
                                className="w-20"
                              />
                            ) : (
                              rule.daily_cap_amount || '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRule?.code === rule.code ? (
                              <Input
                                type="number"
                                value={editingRule.cooldown_seconds}
                                onChange={(e) => setEditingRule({ ...editingRule, cooldown_seconds: parseInt(e.target.value) })}
                                className="w-24"
                              />
                            ) : (
                              rule.cooldown_seconds ? `${rule.cooldown_seconds}s` : '-'
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRule?.code === rule.code ? (
                              <Switch
                                checked={editingRule.enabled}
                                onCheckedChange={(checked) => setEditingRule({ ...editingRule, enabled: checked })}
                              />
                            ) : (
                              <Badge variant={rule.enabled ? "default" : "outline"}>
                                {rule.enabled ? 'On' : 'Off'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingRule?.code === rule.code ? (
                              <Button size="sm" onClick={() => updateRuleMutation.mutate(editingRule)}>
                                <Save className="w-4 h-4" />
                              </Button>
                            ) : (
                              <Button size="sm" variant="ghost" onClick={() => setEditingRule({ ...rule })}>
                                <Edit className="w-4 h-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Store Tab */}
          <TabsContent value="store" className="mt-4 space-y-4">
            {/* Store Items Management */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Store Items</CardTitle>
                    <CardDescription>Manage items available in the K-Seed store</CardDescription>
                  </div>
                  <Button onClick={() => setAddItemDialogOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Item
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {storeLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Code</TableHead>
                        <TableHead>Name</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Stock</TableHead>
                        <TableHead>Enabled</TableHead>
                        <TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {storeItems?.map((item: any) => (
                        <TableRow key={item.code}>
                          <TableCell className="font-mono text-xs">{item.code}</TableCell>
                          <TableCell>
                            {editingStoreItem?.code === item.code ? (
                              <div className="space-y-1">
                                <Input
                                  value={editingStoreItem.name}
                                  onChange={(e) => setEditingStoreItem({ ...editingStoreItem, name: e.target.value })}
                                  placeholder="English name"
                                  className="w-40"
                                />
                                <Input
                                  value={editingStoreItem.name_ko || ''}
                                  onChange={(e) => setEditingStoreItem({ ...editingStoreItem, name_ko: e.target.value })}
                                  placeholder="Korean name"
                                  className="w-40"
                                />
                              </div>
                            ) : (
                              <div>
                                <p className="font-medium">{item.name}</p>
                                {item.name_ko && <p className="text-xs text-muted-foreground">{item.name_ko}</p>}
                              </div>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingStoreItem?.code === item.code ? (
                              <Input
                                type="number"
                                value={editingStoreItem.cost}
                                onChange={(e) => setEditingStoreItem({ ...editingStoreItem, cost: parseInt(e.target.value) })}
                                className="w-20"
                              />
                            ) : (
                              <Badge variant="secondary">🌱 {item.cost}</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {editingStoreItem?.code === item.code ? (
                              <Input
                                type="number"
                                value={editingStoreItem.stock ?? ''}
                                onChange={(e) => setEditingStoreItem({ ...editingStoreItem, stock: e.target.value ? parseInt(e.target.value) : null })}
                                placeholder="∞"
                                className="w-20"
                              />
                            ) : (
                              item.stock !== null ? item.stock : '∞'
                            )}
                          </TableCell>
                          <TableCell>
                            {editingStoreItem?.code === item.code ? (
                              <Switch
                                checked={editingStoreItem.enabled}
                                onCheckedChange={(checked) => setEditingStoreItem({ ...editingStoreItem, enabled: checked })}
                              />
                            ) : (
                              <Badge variant={item.enabled ? "default" : "outline"}>
                                {item.enabled ? 'On' : 'Off'}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-1">
                              {editingStoreItem?.code === item.code ? (
                                <>
                                  <Button size="sm" onClick={() => updateStoreItemMutation.mutate(editingStoreItem)}>
                                    <Save className="w-4 h-4" />
                                  </Button>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingStoreItem(null)}>
                                    <X className="w-4 h-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button size="sm" variant="ghost" onClick={() => setEditingStoreItem({ ...item })}>
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button 
                                    size="sm" 
                                    variant="ghost" 
                                    className="text-destructive hover:text-destructive"
                                    onClick={() => {
                                      if (confirm('Delete this item?')) {
                                        deleteStoreItemMutation.mutate(item.code);
                                      }
                                    }}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>

            {/* Redemption History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Redemptions</CardTitle>
                <CardDescription>View recent K-Seed store redemptions</CardDescription>
              </CardHeader>
              <CardContent>
                {redemptionsLoading ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : redemptions && redemptions.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>User</TableHead>
                        <TableHead>Item</TableHead>
                        <TableHead>Cost</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {redemptions.map((r: any) => (
                        <TableRow key={r.id}>
                          <TableCell className="text-sm">
                            {format(new Date(r.created_at), 'yyyy-MM-dd HH:mm')}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="text-sm font-medium">{r.profiles?.full_name || 'Unknown'}</p>
                              <p className="text-xs text-muted-foreground">{r.profiles?.email}</p>
                            </div>
                          </TableCell>
                          <TableCell className="font-mono text-xs">{r.item_code}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">🌱 {r.cost}</Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant={r.status === 'completed' ? 'default' : 'outline'}>
                              {r.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No redemptions yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
                <CardDescription>Search and manage user wallets</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2 mb-4">
                  <Input
                    placeholder="Search by email or name..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchUsers()}
                  />
                  <Button onClick={searchUsers}>
                    <Search className="w-4 h-4" />
                  </Button>
                </div>

                {searchResults.length > 0 && !selectedUser && (
                  <div className="space-y-2">
                    {searchResults.map((u) => (
                      <div 
                        key={u.id}
                        className="p-3 border rounded-lg hover:bg-muted cursor-pointer"
                        onClick={() => loadUserDetails(u.id)}
                      >
                        <p className="font-medium">{u.full_name || 'No name'}</p>
                        <p className="text-sm text-muted-foreground">{u.email}</p>
                      </div>
                    ))}
                  </div>
                )}

                {selectedUser && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{selectedUser.full_name || selectedUser.email}</h3>
                        <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                      </div>
                      <Button variant="outline" onClick={() => setSelectedUser(null)}>
                        Back to search
                      </Button>
                    </div>

                    {/* Wallet Info */}
                    <Card>
                      <CardContent className="pt-4">
                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-sm text-muted-foreground">Balance</p>
                            <p className="text-2xl font-bold">{selectedUser.wallet?.balance || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Lifetime Earned</p>
                            <p className="text-lg font-medium text-green-600">+{selectedUser.wallet?.lifetime_earned || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Lifetime Spent</p>
                            <p className="text-lg font-medium text-orange-600">-{selectedUser.wallet?.lifetime_spent || 0}</p>
                          </div>
                          <div>
                            <p className="text-sm text-muted-foreground">Status</p>
                            <Badge variant={selectedUser.wallet?.status === 'frozen' ? 'destructive' : 'default'}>
                              {selectedUser.wallet?.status || 'active'}
                            </Badge>
                          </div>
                        </div>

                        <div className="flex gap-2 mt-4">
                          <Button 
                            onClick={() => { setAdjustDirection('credit'); setAdjustDialogOpen(true); }}
                            className="flex-1"
                          >
                            <Plus className="w-4 h-4 mr-2" />
                            Credit
                          </Button>
                          <Button 
                            variant="outline"
                            onClick={() => { setAdjustDirection('debit'); setAdjustDialogOpen(true); }}
                            className="flex-1"
                          >
                            <Minus className="w-4 h-4 mr-2" />
                            Debit
                          </Button>
                          <Button 
                            variant={selectedUser.wallet?.status === 'frozen' ? 'default' : 'destructive'}
                            onClick={() => toggleFreezeMutation.mutate({ 
                              userId: selectedUser.id, 
                              frozen: selectedUser.wallet?.status !== 'frozen' 
                            })}
                          >
                            {selectedUser.wallet?.status === 'frozen' ? (
                              <><Sun className="w-4 h-4 mr-2" />Unfreeze</>
                            ) : (
                              <><Snowflake className="w-4 h-4 mr-2" />Freeze</>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Ledger */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Recent Transactions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-64 overflow-y-auto">
                          {selectedUser.ledger?.map((entry: any) => (
                            <div key={entry.id} className="flex items-center justify-between py-2 border-b">
                              <div>
                                <p className="text-sm font-medium">{entry.reason_code}</p>
                                <p className="text-xs text-muted-foreground">
                                  {format(new Date(entry.created_at), 'MM/dd HH:mm')}
                                </p>
                              </div>
                              <span className={entry.direction === 'credit' ? 'text-green-600' : 'text-orange-600'}>
                                {entry.direction === 'credit' ? '+' : '-'}{entry.amount}
                              </span>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals" className="mt-4">
            <AdminReferralStats />
          </TabsContent>

          {/* Abuse Tab */}
          <TabsContent value="abuse" className="mt-4">
            <Card>
              <CardHeader>
                <CardTitle>Abuse Flags</CardTitle>
                <CardDescription>Suspicious activity detected by the system</CardDescription>
              </CardHeader>
              <CardContent>
                {abuseFlags && abuseFlags.length > 0 ? (
                  <div className="space-y-4">
                    {abuseFlags.map((flag: any) => (
                      <Card key={flag.id} className="border-destructive/50">
                        <CardContent className="pt-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <Badge variant="destructive">{flag.flag_type}</Badge>
                              <p className="font-medium mt-2">
                                {flag.profiles?.full_name || flag.profiles?.email || flag.user_id}
                              </p>
                              <p className="text-sm text-muted-foreground">{flag.description}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {format(new Date(flag.created_at), 'yyyy-MM-dd HH:mm')}
                              </p>
                            </div>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => resolveAbuseFlagMutation.mutate(flag.id)}
                            >
                              Resolve
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-8 text-muted-foreground">No unresolved flags</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Adjust Dialog */}
        <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {adjustDirection === 'credit' ? 'Credit Seeds' : 'Debit Seeds'}
              </DialogTitle>
              <DialogDescription>
                Manually adjust {selectedUser?.full_name || selectedUser?.email}'s balance
              </DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Amount</Label>
                <Input
                  type="number"
                  value={adjustAmount}
                  onChange={(e) => setAdjustAmount(e.target.value)}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <Label>Reason (required)</Label>
                <Textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Why are you making this adjustment?"
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setAdjustDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => adjustMutation.mutate()}
                disabled={!adjustAmount || !adjustReason || adjustMutation.isPending}
              >
                {adjustMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Confirm
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Add Store Item Dialog */}
        <Dialog open={addItemDialogOpen} onOpenChange={setAddItemDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add Store Item</DialogTitle>
              <DialogDescription>Create a new item for the K-Seed store</DialogDescription>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label>Code (unique identifier)</Label>
                <Input
                  value={newItem.code}
                  onChange={(e) => setNewItem({ ...newItem, code: e.target.value })}
                  placeholder="perk_example_item"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Name (English)</Label>
                  <Input
                    value={newItem.name}
                    onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                    placeholder="Example Item"
                  />
                </div>
                <div>
                  <Label>Name (Korean)</Label>
                  <Input
                    value={newItem.name_ko}
                    onChange={(e) => setNewItem({ ...newItem, name_ko: e.target.value })}
                    placeholder="예시 아이템"
                  />
                </div>
              </div>
              <div>
                <Label>Description (English)</Label>
                <Textarea
                  value={newItem.description}
                  onChange={(e) => setNewItem({ ...newItem, description: e.target.value })}
                  placeholder="Describe what this item does..."
                />
              </div>
              <div>
                <Label>Description (Korean)</Label>
                <Textarea
                  value={newItem.description_ko}
                  onChange={(e) => setNewItem({ ...newItem, description_ko: e.target.value })}
                  placeholder="아이템 설명..."
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label>Cost (K-Seeds)</Label>
                  <Input
                    type="number"
                    value={newItem.cost}
                    onChange={(e) => setNewItem({ ...newItem, cost: parseInt(e.target.value) })}
                  />
                </div>
                <div>
                  <Label>Stock (leave empty for unlimited)</Label>
                  <Input
                    type="number"
                    value={newItem.stock ?? ''}
                    onChange={(e) => setNewItem({ ...newItem, stock: e.target.value ? parseInt(e.target.value) : null })}
                    placeholder="∞"
                  />
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Switch
                  checked={newItem.enabled}
                  onCheckedChange={(checked) => setNewItem({ ...newItem, enabled: checked })}
                />
                <Label>Enabled</Label>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setAddItemDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => addStoreItemMutation.mutate(newItem)}
                disabled={!newItem.code || !newItem.name || addStoreItemMutation.isPending}
              >
                {addStoreItemMutation.isPending && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                Add Item
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};

export default AdminRewards;