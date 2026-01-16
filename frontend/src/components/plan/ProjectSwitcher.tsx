import { useEffect } from 'react';
import { ChevronDown, FolderOpen, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useProjectStore } from '@/stores/projectStore';
import { cn } from '@/lib/utils';

interface ProjectSwitcherProps {
  onCreateProject?: () => void;
  className?: string;
}

export function ProjectSwitcher({ onCreateProject, className }: ProjectSwitcherProps) {
  const {
    projects,
    projectsLoading,
    currentProject,
    fetchProjects,
    setCurrentProject,
  } = useProjectStore();

  useEffect(() => {
    fetchProjects();
  }, [fetchProjects]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500';
      case 'completed':
        return 'bg-blue-500';
      case 'on_hold':
        return 'bg-yellow-500';
      case 'cancelled':
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          className={cn('justify-between min-w-[200px]', className)}
          disabled={projectsLoading}
        >
          <div className="flex items-center gap-2 truncate">
            <FolderOpen className="h-4 w-4 shrink-0" />
            <span className="truncate">
              {currentProject ? currentProject.name : 'Select Project'}
            </span>
            {currentProject && (
              <span
                className={cn('h-2 w-2 rounded-full shrink-0', getStatusColor(currentProject.status))}
              />
            )}
          </div>
          <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start" className="w-[240px]">
        {projects.length === 0 ? (
          <div className="px-2 py-4 text-center text-sm text-muted-foreground">
            No projects found
          </div>
        ) : (
          projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              onClick={() => setCurrentProject(project)}
              className={cn(
                'cursor-pointer',
                currentProject?.id === project.id && 'bg-accent'
              )}
            >
              <div className="flex items-center gap-2 w-full">
                <span
                  className={cn('h-2 w-2 rounded-full shrink-0', getStatusColor(project.status))}
                />
                <span className="truncate flex-1">{project.name}</span>
                {project.client && (
                  <span className="text-xs text-muted-foreground truncate">
                    {project.client}
                  </span>
                )}
              </div>
            </DropdownMenuItem>
          ))
        )}
        {onCreateProject && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onCreateProject} className="cursor-pointer">
              <Plus className="h-4 w-4 mr-2" />
              Create Project
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
