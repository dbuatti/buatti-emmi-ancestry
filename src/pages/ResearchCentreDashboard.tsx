"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { 
  TrendingUp, Search, FileText, Building2, Calendar, AlertTriangle, 
  MessageSquare, Archive, Users as PeopleIcon, Clock, CheckCircle,
  ChevronRight, BarChart3, Filter
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';

export interface CorrespondenceMessage {
  id: number;
  account_email: string;
  gmail_message_id: string;
  gmail_thread_id: string;
  direction: 'in' | 'out';
  from_name?: string;
  from_email?: string;
  subject?: string;
  snippet?: string;
  received_at?: string;
  sent_at?: string;
  message_type?: string;
  action_status?: string;
  genealogy_relevance?: string;
  body_text?: string;
  attachment_count?: number;
  attachments?: CorrespondenceAttachment[];
}

export interface CorrespondenceAttachment {
  id?: number;
  filename?: string;
  mime_type?: string;
  size_bytes?: number;
  downloaded?: boolean;
  unavailable?: boolean;
  unavailable_reason?: string;
  gmail_attachment_id?: string;
}

export interface CorrespondenceStats {
  definite: number;
  possible: number;
  unreviewed: number;
  total: number;
  by_account: { [key: string]: number };
  by_type: { [key: string]: number };
}

export interface Enquiry {
  id: number;
  title: string;
  institution?: string;
  office?: string;
  request_date?: string;
  last_correspondence_date?: string;
  thread_count?: number;
  attachment_count?: number;
  status: 'pending' | 'answered' | 'needs_followup' | 'closed';
  relevance: 'definite' | 'possible';
  description?: string;
}

export interface ResearchObjective {
  id: number;
  title: string;
  question?: string;
  status: 'open' | 'answered' | 'investigating' | 'closed';
  message_id?: number;
  attachment_id?: number;
  enquiry_id?: number;
}

export function ResearchCentreDashboard() {
  const { toast } = useToast();
  const [stats, setStats] = useState<CorrespondenceStats | null>(null);
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [objectives, setObjectives] = useState<ResearchObjective[]>([]);
  const [attachments, setAttachments] = useState<CorrespondenceAttachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all dashboard data
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch stats
        const statsResponse = await fetch('/api/correspondence/genealogy/summary');
        if (!statsResponse.ok) throw new Error('Failed to fetch stats');
        const statsData = await statsResponse.json();
        setStats(statsData);

        // Fetch definite messages
        const messagesResponse = await fetch('/api/correspondence/genealogy/messages?relevance=definite');
        if (!messagesResponse.ok) throw new Error('Failed to fetch messages');
        const messagesData = await messagesResponse.json();
        
        // Process messages into enquiries
        const processedEnquiries = processMessagesToEnquiries(messagesData.messages || []);
        setEnquiries(processedEnquiries);

        // Extract research objectives
        const processedObjectives = extractResearchObjectives(messagesData.messages || []);
        setObjectives(processedObjectives);

        // Collect attachments
        const allAttachments = messagesData.messages?.flatMap(m => m.attachments || []) || [];
        setAttachments(allAttachments);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        toast({
          title: 'Error',
          description: 'Failed to load dashboard data',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [toast]);

  const processMessagesToEnquiries = (messages: CorrespondenceMessage[]): Enquiry[] => {
    const enquiriesMap = new Map<number, Enquiry>();

    messages.forEach(message => {
      if (message.direction !== 'in') return;

      if (message.genealogy_relevance !== 'definite') return;

      const enquiryId = generateEnquiryId(message);
      
      if (!enquiriesMap.has(enquiryId)) {
        enquiriesMap.set(enquiryId, {
          id: enquiryId,
          title: extractEnquiryTitle(message),
          institution: extractInstitution(message),
          office: extractOffice(message),
          request_date: message.sent_at,
          last_correspondence_date: message.received_at,
          thread_count: 1,
          attachment_count: message.attachments?.length || 0,
          status: 'pending',
          relevance: 'definite',
          description: message.snippet,
        });
      } else {
        const enquiry = enquiriesMap.get(enquiryId)!;
        if (message.received_at && (!enquiry.last_correspondence_date || message.received_at > enquiry.last_correspondence_date)) {
          enquiry.last_correspondence_date = message.received_at;
        }
        enquiry.thread_count = (enquiry.thread_count || 0) + 1;
        enquiry.attachment_count = (enquiry.attachment_count || 0) + (message.attachments?.length || 0);
      }
    });

    // Update status based on message analysis
    enquiriesMap.forEach(enquiry => {
      const relatedMessages = messages.filter(m => generateEnquiryId(m) === enquiry.id);
      const hasOutgoingResponses = relatedMessages.some(m => m.direction === 'out');
      const hasAttachments = relatedMessages.some(m => m.attachments && m.attachments.length > 0);
      
      if (hasOutgoingResponses && hasAttachments) {
        enquiry.status = 'answered';
      } else if (hasOutgoingResponses) {
        enquiry.status = 'needs_followup';
      } else if (hasAttachments) {
        enquiry.status = 'pending';
      }
    });

    return Array.from(enquiriesMap.values());
  };

  const extractResearchObjectives = (messages: CorrespondenceMessage[]): ResearchObjective[] => {
    const objectives: ResearchObjective[] = [];
    const seenIds = new Set<number>();

    messages.forEach(message => {
      if (message.direction !== 'in' || message.genealogy_relevance !== 'definite') return;

      const content = `${message.subject || ''} ${message.body_text || ''}`.toLowerCase();
      const hasResearchIndicators = content.includes('request') || 
                                     content.includes('search') || 
                                     content.includes('investigation') ||
                                     content.includes('question') ||
                                     content.includes('inquiry');

      if (hasResearchIndicators && !seenIds.has(message.id)) {
        seenIds.add(message.id);
        objectives.push({
          id: message.id,
          title: message.subject || '(no subject)',
          question: extractResearchQuestion(message),
          status: 'open',
          message_id: message.id,
          attachment_id: message.attachments?.[0]?.id,
        });
      }
    });

    return objectives;
  };

  const generateEnquiryId = (message: CorrespondenceMessage): number => {
    const subject = message.subject?.toLowerCase() || '';
    const from = message.from_email?.toLowerCase() || '';
    const hash = subject + from;
    return hash.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % 10000;
  };

  const extractEnquiryTitle = (message: CorrespondenceMessage): string => {
    return message.subject || '(no subject)';
  };

  const extractInstitution = (message: CorrespondenceMessage): string | undefined => {
    const fromEmail = message.from_email || '';
    if (fromEmail.includes('comune.') || fromEmail.includes('protocollo@')) {
      return 'Comune di Ascoli Piceno';
    } else if (fromEmail.includes('sanbenedettodeltronto') || fromEmail.includes('sbt')) {
      return 'SBT (San Benedetto del Tronto)';
    } else if (fromEmail.includes('perugia') || fromEmail.includes('unipg.it')) {
      return 'Università di Perugia';
    } else if (fromEmail.includes('catania') || fromEmail.includes('archivio')) {
      return 'Archivio di Stato Catania';
    } else if (fromEmail.includes('milano') || fromEmail.includes('milano.it')) {
      return 'Consolato Generale d\'Italia Milano';
    }
    return undefined;
  };

  const extractOffice = (message: CorrespondenceMessage): string | undefined => {
    const subject = message.subject?.toLowerCase() || '';
    if (subject.includes('stato civile') || subject.includes('archivio')) {
      return 'Stato Civile';
    } else if (subject.includes('anagrafe')) {
      return 'Anagrafe';
    } else if (subject.includes('protocollo') || subject.includes('uffizio')) {
      return 'Protocollo';
    }
    return undefined;
  };

  const extractResearchQuestion = (message: CorrespondenceMessage): string | undefined => {
    const content = message.body_text || '';
    const lines = content.split('\n').filter(line => line.trim().length > 0);
    if (lines.length > 0) {
      const firstLine = lines[0];
      if (firstLine.length > 50) {
        return firstLine.substring(0, 100) + '...';
      }
      return firstLine;
    }
    return undefined;
  };

  const filteredEnquiries = useMemo(() => {
    return enquiries.filter(enquiry => {
      const matchesSearch = !searchQuery || 
        enquiry.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (enquiry.institution?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
        (enquiry.description?.toLowerCase().includes(searchQuery.toLowerCase()) || false);

      return matchesSearch;
    });
  }, [enquiries, searchQuery]);

  const StatCard = ({ title, value, subtitle, icon, color }: {
    title: string;
    value: number;
    subtitle?: string;
    icon: React.ReactNode;
    color: string;
  }) => (
    <Card className="border-2 border-stone-200 bg-white">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-stone-600 flex items-center gap-2">
          {icon}
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold text-stone-900">{value.toLocaleString()}</div>
        {subtitle && <div className="text-xs text-stone-500 mt-1">{subtitle}</div>}
      </CardContent>
    </Card>
  );

  const EnquiryCard = ({ enquiry }: { enquiry: Enquiry }) => {
    const getStatusColor = (status: string) => {
      switch (status) {
        case 'answered': return 'bg-green-100 text-green-800 border-green-300';
        case 'needs_followup': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
        case 'pending': return 'bg-amber-100 text-amber-800 border-amber-300';
        case 'closed': return 'bg-stone-100 text-stone-800 border-stone-300';
        default: return 'bg-stone-100 text-stone-800 border-stone-300';
      }
    };

    const getStatusLabel = (status: string) => {
      switch (status) {
        case 'answered': return 'Answered';
        case 'needs_followup': return 'Needs Followup';
        case 'pending': return 'Pending';
        case 'closed': return 'Closed';
        default: return 'Unknown';
      }
    };

    const formatDate = (iso?: string) => {
      if (!iso) return '—';
      return new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    };

    return (
      <Card className="border-stone-200 hover:border-[#800020] transition-colors cursor-pointer">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-stone-900 truncate" title={enquiry.title}>
                {enquiry.title}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-stone-600">
                {enquiry.institution && (
                  <span className="flex items-center gap-1">
                    <Building2 className="w-3 h-3" />
                    {enquiry.institution}
                  </span>
                )}
                {enquiry.office && (
                  <span className="flex items-center gap-1">
                    <FileText className="w-3 h-3" />
                    {enquiry.office}
                  </span>
                )}
              </div>
            </div>
            <Badge className={`${getStatusColor(enquiry.status)} text-xs font-medium`}>
              {getStatusLabel(enquiry.status)}
            </Badge>
          </div>

          <div className="grid grid-cols-2 gap-3 mt-3 text-xs">
            <div className="flex items-center gap-1 text-stone-600">
              <MessageSquare className="w-3 h-3" />
              <span>{enquiry.thread_count || 1} thread(s)</span>
            </div>
            <div className="flex items-center gap-1 text-stone-600">
              <Archive className="w-3 h-3" />
              <span>{enquiry.attachment_count || 0} attachment(ies)</span>
            </div>
            {enquiry.request_date && (
              <div className="flex items-center gap-1 text-stone-600">
                <Calendar className="w-3 h-3" />
                <span>Requested: {formatDate(enquiry.request_date)}</span>
              </div>
            )}
            {enquiry.last_correspondence_date && (
              <div className="flex items-center gap-1 text-stone-600">
                <Clock className="w-3 h-3" />
                <span>Last: {formatDate(enquiry.last_correspondence_date)}</span>
              </div>
            )}
          </div>

          {enquiry.description && (
            <div className="mt-3 p-2 bg-stone-50 rounded text-xs text-stone-700 line-clamp-2">
              {enquiry.description}
            </div>
          )}

          <div className="mt-3 pt-3 border-t border-stone-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {enquiry.relevance === 'definite' && (
                <Badge variant="secondary" className="text-xs flex items-center gap-1">
                  <TrendingUp className="w-3 h-3" />
                  Definitive
                </Badge>
              )}
              <Badge variant="outline" className="text-xs">
                {enquiry.status} (open)
              </Badge>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#800020] hover:bg-[#800020]/10"
              onClick={() => {
                toast({ title: 'Navigate to enquiry', description: `Opening enquiry: ${enquiry.title}` });
              }}
            >
              View Details
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const ObjectiveCard = ({ objective }: { objective: ResearchObjective }) => {
    const formatDate = (iso?: string) => {
      if (!iso) return '—';
      return new Date(iso).toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    };

    return (
      <Card className="border-stone-200 hover:border-[#800020] transition-colors cursor-pointer">
        <CardContent className="p-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h3 className="font-medium text-stone-900 truncate" title={objective.title}>
                {objective.title}
              </h3>
              <div className="flex items-center gap-2 mt-1 text-xs text-stone-600">
                <PeopleIcon className="w-3 h-3" />
                <span>Research Objective</span>
                {objective.message_id && (
                  <span className="flex items-center gap-1 ml-2">
                    <MessageSquare className="w-3 h-3" />
                    Message #{objective.message_id}
                  </span>
                )}
              </div>
            </div>
            <Badge className="bg-blue-100 text-blue-800 border-blue-300 text-xs font-medium">
              {objective.status}
            </Badge>
          </div>

          {objective.question && (
            <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-stone-700 line-clamp-2">
              {objective.question}
            </div>
          )}

          <div className="mt-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs flex items-center gap-1">
                <TrendingUp className="w-3 h-3" />
                Definitive
              </Badge>
              {objective.enquiry_id && (
                <Badge variant="secondary" className="text-xs">
                  Enquiry #{objective.enquiry_id}
                </Badge>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#800020] hover:bg-[#800020]/10 h-7 px-2"
              onClick={() => {
                toast({ title: 'Navigate to objective', description: `Opening objective: ${objective.title}` });
              }}
            >
              Details
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  const AttachmentOverviewCard = ({ attachment }: { attachment: CorrespondenceAttachment }) => {
    const getStatusColor = (att: CorrespondenceAttachment) => {
      if (att.unavailable) return 'bg-red-100 text-red-800 border-red-300';
      if (att.downloaded) return 'bg-green-100 text-green-800 border-green-300';
      if (att.gmail_attachment_id) return 'bg-amber-100 text-amber-800 border-amber-300';
      return 'bg-stone-100 text-stone-800 border-stone-300';
    };

    const getStatusLabel = (att: CorrespondenceAttachment) => {
      if (att.unavailable) return 'Unavailable';
      if (att.downloaded) return 'Downloaded';
      if (att.gmail_attachment_id) return 'Not downloaded';
      return 'Unknown';
    };

    const formatFileSize = (bytes?: number) => {
      if (!bytes) return '—';
      if (bytes < 1024) return bytes + ' B';
      if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
      return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    return (
      <Card className="border-stone-200 hover:border-[#800020] transition-colors">
        <CardContent className="p-3">
          <div className="flex items-start justify-between mb-2">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-stone-900 truncate text-sm" title={attachment.filename || 'unknown'}>
                {attachment.filename || 'unknown'}
              </h4>
              <div className="flex items-center gap-2 mt-1 text-xs text-stone-600">
                <FileText className="w-3 h-3" />
                <span>{attachment.mime_type || 'unknown/mimetype'}</span>
                <span>•</span>
                <span>{formatFileSize(attachment.size_bytes)}</span>
              </div>
            </div>
            <Badge className={`${getStatusColor(attachment)} text-xs font-medium`}>
              {getStatusLabel(attachment)}
            </Badge>
          </div>

          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-stone-600">
              {attachment.id && (
                <span className="font-mono">#{attachment.id}</span>
              )}
              {attachment.gmail_attachment_id && (
                <span className="font-mono text-[10px]">{attachment.gmail_attachment_id.slice(0, 8)}...</span>
              )}
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="text-[#800020] hover:bg-[#800020]/10 h-6 px-2 text-xs"
              onClick={() => {
                toast({ title: 'Opening attachment', description: `Reviewing: ${attachment.filename}` });
              }}
            >
              Review
              <ChevronRight className="w-3 h-3" />
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-[#FAF6F0] text-stone-900 font-serif selection:bg-[#800020]/20 selection:text-[#800020]">
      <main className="max-w-7xl mx-auto px-4 md:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-stone-900 mb-2 flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-[#800020]" />
            Research Operations Centre
          </h1>
          <p className="text-stone-600 font-sans">
            Central dashboard for genealogical research enquiries and evidence
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#800020]"></div>
          </div>
        ) : error ? (
          <Card className="border-red-200 bg-red-50">
            <CardContent className="pt-6">
              <p className="text-red-600">Error loading data: {error}</p>
            </CardContent>
          </Card>
        ) : (
          <React.Fragment>
            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Definite"
                value={stats?.definite || 0}
                subtitle="Verified genealogy correspondence"
                icon={<FileText className="w-4 h-4 text-green-600" />}
                color="green"
              />
              <StatCard
                title="Possible"
                value={stats?.possible || 0}
                subtitle="Potentially genealogy-related"
                icon={<Search className="w-4 h-4 text-yellow-600" />}
                color="yellow"
              />
              <StatCard
                title="Unreviewed"
                value={stats?.unreviewed || 0}
                subtitle="Awaiting classification"
                icon={<MessageSquare className="w-4 h-4 text-gray-600" />}
                color="gray"
              />
              <StatCard
                title="Total Messages"
                value={stats?.total || 0}
                subtitle="All correspondence"
                icon={<TrendingUp className="w-4 h-4 text-blue-600" />}
                color="blue"
              />
            </div>

            {/* Quick Search */}
            <Card className="mb-6 border-stone-200">
              <CardContent className="p-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-stone-400" />
                  <Input
                    placeholder="Search enquiries, institutions, objectives..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-white border-stone-300"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Enquiries Overview */}
            <Card className="mb-8 border-stone-200">
              <CardHeader>
                <CardTitle className="text-xl font-serif flex items-center gap-2">
                  <AlertTriangle className="w-6 h-6" />
                  Active Research Enquiries ({filteredEnquiries.length})
                </CardTitle>
                <CardDescription>
                  Research enquiries based on genealogical correspondence
                </CardDescription>
              </CardHeader>
              <CardContent>
                {filteredEnquiries.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-stone-500 font-sans">
                    <AlertTriangle className="w-12 h-12 opacity-30 mb-3" />
                    <p>No enquiries found matching your criteria.</p>
                    <p className="text-xs mt-2 opacity-50">Try adjusting your search or filters.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredEnquiries.map(enquiry => (
                      <EnquiryCard key={enquiry.id} enquiry={enquiry} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Research Objectives Overview */}
            <Card className="mb-8 border-stone-200">
              <CardHeader>
                <CardTitle className="text-xl font-serif flex items-center gap-2">
                  <PeopleIcon className="w-6 h-6" />
                  Research Objectives ({objectives.length})
                </CardTitle>
                <CardDescription>
                  Open research questions derived from correspondence
                </CardDescription>
              </CardHeader>
              <CardContent>
                {objectives.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-stone-500 font-sans">
                    <PeopleIcon className="w-10 h-10 opacity-30 mb-2" />
                    <p>No research objectives found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {objectives.map(objective => (
                      <ObjectiveCard key={objective.id} objective={objective} />
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Attachment Overview */}
            <Card className="mb-8 border-stone-200">
              <CardHeader>
                <CardTitle className="text-xl font-serif flex items-center gap-2">
                  <Archive className="w-6 h-6" />
                  Attachment Overview ({attachments.length})
                </CardTitle>
                <CardDescription>
                  Documents requiring review and association
                </CardDescription>
              </CardHeader>
              <CardContent>
                {attachments.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-stone-500 font-sans">
                    <Archive className="w-10 h-10 opacity-30 mb-2" />
                    <p>No attachments found.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                    {attachments.slice(0, 12).map((attachment, index) => (
                      <AttachmentOverviewCard key={index} attachment={attachment} />
                    ))}
                    {attachments.length > 12 && (
                      <Card className="border-dashed border-2 border-stone-300 bg-stone-50">
                        <CardContent className="p-4 flex flex-col items-center justify-center h-full">
                          <Archive className="w-8 h-8 text-stone-400 mb-2" />
                          <p className="text-sm text-stone-600">+{attachments.length - 12} more</p>
                        </CardContent>
                      </Card>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Additional Stats and Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-stone-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-stone-600">Institution Breakdown</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {Array.from(new Set(enquiries.map(e => e.institution).filter(Boolean))).slice(0, 5).map((institution) => {
                      const count = enquiries.filter(e => e.institution === institution).length;
                      return (
                        <div key={institution} className="flex items-center justify-between text-sm">
                          <span className="text-stone-700 truncate max-w-[200px]">{institution}</span>
                          <Badge variant="outline" className="text-xs ml-2">{count}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-stone-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-stone-600">Status Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {['answered', 'needs_followup', 'pending', 'closed'].map(status => {
                      const count = enquiries.filter(e => e.status === status).length;
                      const colorMap = {
                        answered: 'bg-green-100 text-green-800',
                        needs_followup: 'bg-yellow-100 text-yellow-800',
                        pending: 'bg-amber-100 text-amber-800',
                        closed: 'bg-stone-100 text-stone-800',
                      };
                      return (
                        <div key={status} className="flex items-center justify-between text-sm">
                          <span className="text-stone-700 capitalize">{status.replace('_', ' ')}</span>
                          <Badge className={`${colorMap[status as keyof typeof colorMap]} text-xs ml-2`}>{(count || 0)}</Badge>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-stone-200">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-stone-600">Relevance Distribution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-stone-700 flex items-center gap-1">
                        <TrendingUp className="w-3 h-3" />
                        Definitive
                      </span>
                      <Badge className="bg-green-100 text-green-800 text-xs ml-2">{(enquiries.filter(e => e.relevance === 'definite').length || 0)}</Badge>
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-stone-700 flex items-center gap-1">
                        <Search className="w-3 h-3" />
                        Possible
                      </span>
                      <Badge className="bg-yellow-100 text-yellow-800 text-xs ml-2">{(enquiries.filter(e => e.relevance === 'possible').length || 0)}</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Navigation to Detailed Views */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                className="h-16 bg-white border-stone-300 hover:bg-stone-50 font-sans"
                onClick={() => {
                  toast({ title: 'Navigating to Enquiries', description: 'Opening full enquiries view...' });
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <AlertTriangle className="w-6 h-6 text-[#800020]" />
                  <span>Full Enquiries View</span>
                </div>
              </Button>

              <Button
                className="h-16 bg-white border-stone-300 hover:bg-stone-50 font-sans"
                onClick={() => {
                  toast({ title: 'Navigating to Definite Messages', description: 'Opening definite messages view...' });
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <FileText className="w-6 h-6 text-[#800020]" />
                  <span>Definite Messages</span>
                </div>
              </Button>

              <Button
                className="h-16 bg-white border-stone-300 hover:bg-stone-50 font-sans"
                onClick={() => {
                  toast({ title: 'Navigating to Possible Messages', description: 'Opening possible messages view...' });
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <Search className="w-3 h-3 text-[#800020]" />
                  <span>Possible Messages</span>
                </div>
              </Button>

              <Button
                className="h-16 bg-white border-stone-300 hover:bg-stone-50 font-sans"
                onClick={() => {
                  toast({ title: 'Navigating to Attachments', description: 'Opening attachment review...' });
                }}
              >
                <div className="flex flex-col items-center gap-2">
                  <Archive className="w-6 h-6 text-[#800020]" />
                  <span>Attachment Review</span>
                </div>
              </Button>
            </div>
          </React.Fragment>
        )}
      </main>
    </div>
  );
}