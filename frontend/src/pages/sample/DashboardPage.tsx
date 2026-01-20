import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import {
  FileText,
  FolderTree,
  Inbox,
  Activity,
  ArrowRight,
  Calendar,
  Loader2,
  BarChart3,
  TrendingUp,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAuthStore } from '@/stores/authStore';
import { useProjectStore } from '@/stores/projectStore';
import { projectsApi, type ProjectDashboard } from '@/api/projects.api';

const statusColors: Record<string, string> = {
  not_started: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  on_track: 'bg-green-100 text-green-800',
  at_risk: 'bg-yellow-100 text-yellow-800',
  blocked: 'bg-red-100 text-red-800',
  completed: 'bg-green-100 text-green-800',
  done: 'bg-green-100 text-green-800',
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { user, currentOrg } = useAuthStore();
  const { currentProject } = useProjectStore();
  const [dashboard, setDashboard] = useState<ProjectDashboard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (currentProject) {
      loadDashboard();
    } else {
      setDashboard(null);
    }
  }, [currentProject?.id]);

  const loadDashboard = async () => {
    if (!currentProject) return;

    setLoading(true);
    setError(null);

    try {
      const response = await projectsApi.getDashboard(currentProject.id);
      if (response.success && response.data) {
        setDashboard(response.data);
      } else {
        setError(response.error?.message || 'Failed to load dashboard');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard');
    } finally {
      setLoading(false);
    }
  };

  // If no project selected, show organization overview
  if (!currentProject) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back, {user?.firstName}!</p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Organization</CardDescription>
              <CardTitle className="text-2xl">{currentOrg?.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Slug: {currentOrg?.slug}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Your Organizations</CardDescription>
              <CardTitle className="text-2xl">{user?.organizations.length}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-xs text-muted-foreground">Memberships</p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Select a Project</CardTitle>
            <CardDescription>
              Use the Project Switcher in the header to select a project and view its dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Once a project is selected, you'll see statistics, recent activity, and quick actions for that project.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">{currentProject.name}</p>
        </div>
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-4">
            <p className="text-red-700">{error}</p>
            <Button variant="outline" size="sm" onClick={loadDashboard} className="mt-2">
              Retry
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Calculate progress percentages
  const completedItems = dashboard?.planItems.byStatus.find(s =>
    s.status === 'completed' || s.status === 'done'
  )?.count || 0;
  const totalPlanItems = dashboard?.planItems.total || 0;
  const planProgress = totalPlanItems > 0 ? Math.round((completedItems / totalPlanItems) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold">{dashboard?.project.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            {dashboard?.project.client && (
              <span className="text-muted-foreground">Client: {dashboard.project.client}</span>
            )}
            <Badge className={statusColors[dashboard?.project.status || ''] || 'bg-gray-100'}>
              {dashboard?.project.status?.replace(/_/g, ' ')}
            </Badge>
          </div>
        </div>
        <div className="text-right text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Calendar className="h-4 w-4" />
            Started: {dashboard?.project.startDate ? format(new Date(dashboard.project.startDate), 'MMM d, yyyy') : 'N/A'}
          </div>
          {dashboard?.project.targetEndDate && (
            <div>Target: {format(new Date(dashboard.project.targetEndDate), 'MMM d, yyyy')}</div>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Plan Items</CardTitle>
            <FolderTree className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.planItems.total || 0}</div>
            <div className="flex items-center gap-2 mt-1">
              <Progress value={planProgress} className="h-2 flex-1" />
              <span className="text-xs text-muted-foreground">{planProgress}%</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {completedItems} completed
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Content Items</CardTitle>
            <Inbox className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.contentItems.total || 0}</div>
            <p className="text-xs text-muted-foreground">
              {dashboard?.contentItems.bySourceType.length || 0} source types
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activity Reports</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.activityReports.recent.length || 0}</div>
            <p className="text-xs text-muted-foreground">
              Recent reports
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Weekly Activity</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.contentItems.weeklyActivity.reduce((sum, w) => sum + w.count, 0) || 0}
            </div>
            <p className="text-xs text-muted-foreground">
              Content items (last 4 weeks)
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions & Stats */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
            <CardDescription>Common tasks for this project</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate('/plan')}
            >
              <div className="flex items-center gap-2">
                <FolderTree className="h-4 w-4" />
                View Project Plan
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate('/intake')}
            >
              <div className="flex items-center gap-2">
                <Inbox className="h-4 w-4" />
                Add Content (Intake Agent)
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              className="w-full justify-between"
              onClick={() => navigate('/reporter')}
            >
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4" />
                Generate Activity Report
              </div>
              <ArrowRight className="h-4 w-4" />
            </Button>
          </CardContent>
        </Card>

        {/* Plan Items by Status */}
        <Card>
          <CardHeader>
            <CardTitle>Plan Items by Status</CardTitle>
            <CardDescription>Distribution of work items</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard?.planItems.byStatus.length === 0 ? (
              <p className="text-sm text-muted-foreground">No plan items yet</p>
            ) : (
              <div className="space-y-3">
                {dashboard?.planItems.byStatus.map((item) => (
                  <div key={item.status} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Badge className={statusColors[item.status] || 'bg-gray-100'}>
                        {item.status?.replace(/_/g, ' ')}
                      </Badge>
                    </div>
                    <span className="font-medium">{item.count}</span>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Content & Reports */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Content Items */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Content</CardTitle>
            <CardDescription>Latest ingested content</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard?.contentItems.recent.length === 0 ? (
              <p className="text-sm text-muted-foreground">No content items yet</p>
            ) : (
              <div className="space-y-3">
                {dashboard?.contentItems.recent.map((item) => (
                  <div key={item.id} className="flex items-start justify-between border-b pb-2 last:border-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium truncate max-w-[200px]">{item.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(item.dateOccurred), 'MMM d, yyyy')} · {item.sourceType}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity Reports */}
        <Card>
          <CardHeader>
            <CardTitle>Recent Reports</CardTitle>
            <CardDescription>Generated activity reports</CardDescription>
          </CardHeader>
          <CardContent>
            {dashboard?.activityReports.recent.length === 0 ? (
              <div>
                <p className="text-sm text-muted-foreground mb-3">No reports generated yet</p>
                <Button variant="outline" size="sm" onClick={() => navigate('/reporter')}>
                  Generate First Report
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {dashboard?.activityReports.recent.map((report) => (
                  <div key={report.id} className="flex items-start justify-between border-b pb-2 last:border-0">
                    <div>
                      <div className="flex items-center gap-2">
                        <BarChart3 className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-medium truncate max-w-[200px]">{report.title}</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(report.periodStart), 'MMM d')} - {format(new Date(report.periodEnd), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Content by Source Type */}
      {dashboard && dashboard.contentItems.bySourceType.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Content by Source Type</CardTitle>
            <CardDescription>Breakdown of content item sources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-3">
              {dashboard.contentItems.bySourceType.map((item) => (
                <div key={item.sourceType} className="flex items-center gap-2 px-3 py-2 bg-muted rounded-lg">
                  <span className="text-sm">{item.sourceType}</span>
                  <Badge variant="secondary">{item.count}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

export default DashboardPage;
