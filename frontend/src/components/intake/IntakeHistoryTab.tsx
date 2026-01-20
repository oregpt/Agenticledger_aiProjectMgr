import { useState, useEffect, useCallback } from 'react';
import { format } from 'date-fns';
import {
  Search,
  ChevronDown,
  ChevronRight,
  Eye,
  FileText,
  Calendar,
  File,
  Mail,
  MessageSquare,
  Mic,
  Loader2,
  RefreshCw,
  Filter,
  X,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { useProjectStore } from '@/stores/projectStore';
import contentItemsApi, {
  type ContentItem,
  type ContentType,
  type ActivityItemType,
  type ListContentItemsParams,
} from '@/api/content-items.api';
import { ContentItemDetailDialog } from './ContentItemDetailDialog';

interface IntakeHistoryTabProps {
  onLoadItem?: (item: ContentItem) => void;
}

export function IntakeHistoryTab({ onLoadItem: _onLoadItem }: IntakeHistoryTabProps) {
  const { currentProject } = useProjectStore();

  // Data state
  const [items, setItems] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [contentTypes, setContentTypes] = useState<ContentType[]>([]);
  const [activityTypes, setActivityTypes] = useState<ActivityItemType[]>([]);

  // Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(20);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [search, setSearch] = useState('');
  const [searchDebounced, setSearchDebounced] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [contentTypeFilter, setContentTypeFilter] = useState<string>('all');
  const [activityTypeFilter, setActivityTypeFilter] = useState<string>('all');
  const [sourceTypeFilter, setSourceTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // UI state
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [selectedItem, setSelectedItem] = useState<ContentItem | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounced(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Load types on mount
  useEffect(() => {
    const loadTypes = async () => {
      try {
        const [ctRes, atRes] = await Promise.all([
          contentItemsApi.getContentTypes(),
          contentItemsApi.getActivityItemTypes(),
        ]);
        if (ctRes.success && ctRes.data) setContentTypes(ctRes.data);
        if (atRes.success && atRes.data) setActivityTypes(atRes.data);
      } catch (err) {
        console.error('Failed to load types:', err);
      }
    };
    loadTypes();
  }, []);

  // Fetch items when filters change
  const fetchItems = useCallback(async () => {
    if (!currentProject) return;

    setLoading(true);
    try {
      const params: ListContentItemsParams = {
        page,
        limit,
        projectId: currentProject.id,
      };

      if (searchDebounced) params.search = searchDebounced;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      if (contentTypeFilter !== 'all') params.contentTypeId = parseInt(contentTypeFilter);
      if (activityTypeFilter !== 'all') params.activityTypeId = parseInt(activityTypeFilter);
      if (sourceTypeFilter !== 'all') params.sourceType = sourceTypeFilter;
      if (statusFilter !== 'all') params.processingStatus = statusFilter;

      const response = await contentItemsApi.getProjectContent(currentProject.id, params);
      if (response.success && response.data) {
        // API returns data as array directly with meta for pagination
        const itemsArray = Array.isArray(response.data) ? response.data : (response.data as any).items || [];
        const meta = (response as any).meta || (response.data as any).pagination || { total: 0, totalPages: 0 };
        setItems(itemsArray);
        setTotal(meta.total || 0);
        setTotalPages(meta.totalPages || 0);
      }
    } catch (err) {
      console.error('Failed to fetch content items:', err);
    } finally {
      setLoading(false);
    }
  }, [currentProject, page, limit, searchDebounced, startDate, endDate, contentTypeFilter, activityTypeFilter, sourceTypeFilter, statusFilter]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Reset page when filters change
  useEffect(() => {
    setPage(1);
  }, [searchDebounced, startDate, endDate, contentTypeFilter, activityTypeFilter, sourceTypeFilter, statusFilter]);

  const toggleRowExpand = (id: string) => {
    setExpandedRows(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleViewDetail = (item: ContentItem) => {
    setSelectedItem(item);
    setDetailDialogOpen(true);
  };

  const clearFilters = () => {
    setSearch('');
    setStartDate('');
    setEndDate('');
    setContentTypeFilter('all');
    setActivityTypeFilter('all');
    setSourceTypeFilter('all');
    setStatusFilter('all');
  };

  const hasActiveFilters = search || startDate || endDate ||
    contentTypeFilter !== 'all' || activityTypeFilter !== 'all' ||
    sourceTypeFilter !== 'all' || statusFilter !== 'all';

  const getSourceTypeIcon = (sourceType: string) => {
    switch (sourceType) {
      case 'file':
        return <File className="h-4 w-4" />;
      case 'text':
        return <FileText className="h-4 w-4" />;
      case 'email':
        return <Mail className="h-4 w-4" />;
      case 'calendar':
        return <Calendar className="h-4 w-4" />;
      case 'transcript':
        return <Mic className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { className: string; label: string }> = {
      pending: { className: 'bg-gray-100 text-gray-700', label: 'Pending' },
      processing: { className: 'bg-blue-100 text-blue-700', label: 'Processing' },
      completed: { className: 'bg-green-100 text-green-700', label: 'Completed' },
      failed: { className: 'bg-red-100 text-red-700', label: 'Failed' },
    };
    const variant = variants[status] || variants.pending;
    return <Badge className={variant.className}>{variant.label}</Badge>;
  };

  if (!currentProject) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center">
        <FileText className="h-12 w-12 text-muted-foreground mb-4" />
        <h2 className="text-xl font-semibold mb-2">No Project Selected</h2>
        <p className="text-muted-foreground">
          Please select a project to view intake history.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-4 w-4" />
              Filters
            </CardTitle>
            {hasActiveFilters && (
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="h-4 w-4 mr-1" />
                Clear
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-6">
            {/* Search */}
            <div className="space-y-2 md:col-span-2">
              <Label>Search</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search titles..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
            </div>

            {/* Date Range */}
            <div className="space-y-2">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label>End Date</Label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>

            {/* Content Type */}
            <div className="space-y-2">
              <Label>Content Type</Label>
              <Select value={contentTypeFilter} onValueChange={setContentTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {contentTypes.map((ct) => (
                    <SelectItem key={ct.id} value={ct.id.toString()}>
                      {ct.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Activity Type */}
            <div className="space-y-2">
              <Label>Activity Type</Label>
              <Select value={activityTypeFilter} onValueChange={setActivityTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  {activityTypes.map((at) => (
                    <SelectItem key={at.id} value={at.id.toString()}>
                      {at.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Source Type */}
            <div className="space-y-2">
              <Label>Source</Label>
              <Select value={sourceTypeFilter} onValueChange={setSourceTypeFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  <SelectItem value="file">File</SelectItem>
                  <SelectItem value="text">Text</SelectItem>
                  <SelectItem value="email">Email</SelectItem>
                  <SelectItem value="calendar">Calendar</SelectItem>
                  <SelectItem value="transcript">Transcript</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Status */}
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Content Items</CardTitle>
              <CardDescription>
                {loading ? 'Loading...' : `${total} items found`}
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchItems} disabled={loading}>
              <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loading && items.length === 0 ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : items.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-1">No content items found</h3>
              <p className="text-muted-foreground">
                {hasActiveFilters
                  ? 'Try adjusting your filters'
                  : 'Start by submitting content in the New Intake tab'}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-8"></TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tags</TableHead>
                    <TableHead className="w-16">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item) => (
                    <Collapsible key={item.id} asChild open={expandedRows.has(item.id)}>
                      <>
                        <TableRow className="hover:bg-muted/50">
                          <TableCell>
                            <CollapsibleTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0"
                                onClick={() => toggleRowExpand(item.id)}
                              >
                                {expandedRows.has(item.id) ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            </CollapsibleTrigger>
                          </TableCell>
                          <TableCell className="font-medium max-w-[300px] truncate">
                            {item.title}
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {format(new Date(item.dateOccurred), 'MMM d, yyyy')}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="gap-1">
                              {getSourceTypeIcon(item.sourceType)}
                              {item.sourceType}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {getStatusBadge(item.processingStatus)}
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1 max-w-[200px]">
                              {item.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {item.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{item.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleViewDetail(item)}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                        <CollapsibleContent asChild>
                          <TableRow className="bg-muted/30 hover:bg-muted/30">
                            <TableCell colSpan={7} className="p-4">
                              <div className="space-y-3">
                                {/* AI Summary */}
                                {item.aiSummary && (
                                  <div>
                                    <Label className="text-xs text-muted-foreground uppercase">
                                      AI Summary
                                    </Label>
                                    <p className="text-sm mt-1">{item.aiSummary}</p>
                                  </div>
                                )}

                                {/* Linked Plan Items */}
                                {item.planItemIds.length > 0 && (
                                  <div>
                                    <Label className="text-xs text-muted-foreground uppercase">
                                      Linked Plan Items
                                    </Label>
                                    <p className="text-sm mt-1">
                                      {item.planItemIds.length} plan item(s) linked
                                    </p>
                                  </div>
                                )}

                                {/* Content & Activity Types */}
                                <div className="flex gap-6">
                                  {item.contentTypeIds.length > 0 && (
                                    <div>
                                      <Label className="text-xs text-muted-foreground uppercase">
                                        Content Types
                                      </Label>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {item.contentTypeIds.map((id) => {
                                          const ct = contentTypes.find((c) => c.id === id);
                                          return ct ? (
                                            <Badge key={id} variant="outline" className="text-xs">
                                              {ct.name}
                                            </Badge>
                                          ) : null;
                                        })}
                                      </div>
                                    </div>
                                  )}
                                  {item.activityTypeIds.length > 0 && (
                                    <div>
                                      <Label className="text-xs text-muted-foreground uppercase">
                                        Activity Types
                                      </Label>
                                      <div className="flex flex-wrap gap-1 mt-1">
                                        {item.activityTypeIds.map((id) => {
                                          const at = activityTypes.find((a) => a.id === id);
                                          return at ? (
                                            <Badge key={id} variant="outline" className="text-xs">
                                              {at.name}
                                            </Badge>
                                          ) : null;
                                        })}
                                      </div>
                                    </div>
                                  )}
                                </div>

                                {/* Extracted Entities */}
                                {item.aiExtractedEntities && Object.keys(item.aiExtractedEntities).length > 0 && (
                                  <div>
                                    <Label className="text-xs text-muted-foreground uppercase">
                                      Extracted Items
                                    </Label>
                                    <p className="text-sm mt-1 text-muted-foreground">
                                      Click "View" to see extracted action items, risks, and decisions
                                    </p>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        </CollapsibleContent>
                      </>
                    </Collapsible>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4 pt-4 border-t">
                  <p className="text-sm text-muted-foreground">
                    Showing {(page - 1) * limit + 1} to {Math.min(page * limit, total)} of {total}
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === 1}
                      onClick={() => setPage(page - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={page === totalPages}
                      onClick={() => setPage(page + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Detail Dialog */}
      <ContentItemDetailDialog
        item={selectedItem}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        contentTypes={contentTypes}
        activityTypes={activityTypes}
      />
    </div>
  );
}
