import { useState } from 'react';
import { History, Search, Filter, User, Settings, Shield, Database } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { RBACGuard } from '@/components/common/RBACGuard';

// Sample audit log data
const auditLogs = [
  {
    id: 1,
    action: 'user.login',
    actor: 'john.doe@example.com',
    target: null,
    details: 'Successful login from 192.168.1.100',
    timestamp: '2025-01-11T10:30:00Z',
    category: 'auth',
  },
  {
    id: 2,
    action: 'role.permission_updated',
    actor: 'admin@example.com',
    target: 'Standard User',
    details: 'Updated permissions for Reports page',
    timestamp: '2025-01-11T10:15:00Z',
    category: 'rbac',
  },
  {
    id: 3,
    action: 'user.invited',
    actor: 'admin@example.com',
    target: 'newuser@example.com',
    details: 'Invited as Standard User',
    timestamp: '2025-01-11T09:45:00Z',
    category: 'user',
  },
  {
    id: 4,
    action: 'org.settings_updated',
    actor: 'admin@example.com',
    target: 'My Organization',
    details: 'Updated organization description',
    timestamp: '2025-01-11T09:30:00Z',
    category: 'settings',
  },
  {
    id: 5,
    action: 'feature_flag.toggled',
    actor: 'admin@example.com',
    target: 'advanced_analytics',
    details: 'Enabled feature flag',
    timestamp: '2025-01-11T09:00:00Z',
    category: 'settings',
  },
  {
    id: 6,
    action: 'data.exported',
    actor: 'john.doe@example.com',
    target: 'Users, Transactions',
    details: 'Exported data in CSV format',
    timestamp: '2025-01-10T16:30:00Z',
    category: 'data',
  },
  {
    id: 7,
    action: 'user.logout',
    actor: 'jane.smith@example.com',
    target: null,
    details: 'User logged out',
    timestamp: '2025-01-10T15:45:00Z',
    category: 'auth',
  },
  {
    id: 8,
    action: 'user.password_changed',
    actor: 'john.doe@example.com',
    target: null,
    details: 'Password changed successfully',
    timestamp: '2025-01-10T14:20:00Z',
    category: 'auth',
  },
];

const getCategoryIcon = (category: string) => {
  switch (category) {
    case 'auth':
      return <Shield className="h-4 w-4" />;
    case 'rbac':
      return <Shield className="h-4 w-4" />;
    case 'user':
      return <User className="h-4 w-4" />;
    case 'settings':
      return <Settings className="h-4 w-4" />;
    case 'data':
      return <Database className="h-4 w-4" />;
    default:
      return <History className="h-4 w-4" />;
  }
};

const getCategoryColor = (category: string) => {
  switch (category) {
    case 'auth':
      return 'bg-blue-100 text-blue-700';
    case 'rbac':
      return 'bg-purple-100 text-purple-700';
    case 'user':
      return 'bg-green-100 text-green-700';
    case 'settings':
      return 'bg-yellow-100 text-yellow-700';
    case 'data':
      return 'bg-orange-100 text-orange-700';
    default:
      return 'bg-gray-100 text-gray-700';
  }
};

export function AuditLogPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredLogs = auditLogs.filter((log) => {
    const matchesSearch =
      !searchQuery ||
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.actor.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = !selectedCategory || log.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const categories = Array.from(new Set(auditLogs.map((log) => log.category)));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit Log</h1>
        <p className="text-muted-foreground">View all actions and changes in your organization.</p>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Activity History</CardTitle>
              <CardDescription>A complete record of all actions.</CardDescription>
            </div>
            <RBACGuard menuSlug="audit-log" action="create">
              <Button variant="outline">
                Export Logs
              </Button>
            </RBACGuard>
          </div>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="flex items-center gap-4 mb-6">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <div className="flex gap-2">
                <Button
                  variant={selectedCategory === null ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                </Button>
                {categories.map((category) => (
                  <Button
                    key={category}
                    variant={selectedCategory === category ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSelectedCategory(category)}
                  >
                    {category.charAt(0).toUpperCase() + category.slice(1)}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Log Table */}
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[180px]">Action</TableHead>
                <TableHead>Actor</TableHead>
                <TableHead>Target</TableHead>
                <TableHead>Details</TableHead>
                <TableHead className="w-[180px]">Timestamp</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className={`rounded p-1 ${getCategoryColor(log.category)}`}>
                        {getCategoryIcon(log.category)}
                      </div>
                      <span className="font-mono text-sm">{log.action}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{log.actor}</TableCell>
                  <TableCell>
                    {log.target ? (
                      <Badge variant="outline">{log.target}</Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </TableCell>
                  <TableCell className="text-muted-foreground max-w-[300px] truncate">
                    {log.details}
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {new Date(log.timestamp).toLocaleString()}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredLogs.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No logs found matching your search criteria.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
