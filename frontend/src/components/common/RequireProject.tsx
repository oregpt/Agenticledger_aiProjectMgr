import { FolderOpen } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useProjectStore } from '@/stores/projectStore';

interface RequireProjectProps {
  children: React.ReactNode;
}

export function RequireProject({ children }: RequireProjectProps) {
  const { currentProject } = useProjectStore();

  if (!currentProject) {
    return (
      <div className="flex items-center justify-center h-[400px]">
        <Card className="max-w-md text-center">
          <CardHeader>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
              <FolderOpen className="h-6 w-6 text-muted-foreground" />
            </div>
            <CardTitle>Select a Project</CardTitle>
            <CardDescription>
              Please select a project from the dropdown in the header to continue.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Projects contain your plan items, content, and activity reports.
              Choose an existing project or create a new one from the Admin tab.
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
