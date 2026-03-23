import { useEffect, useState, useCallback, lazy, Suspense } from 'react';
import { api } from '../lib/api';
import { format, parseISO } from 'date-fns';
import { logger } from '../lib/logger';
import { Button } from '../components/ui/Button';
import { CalendarRange, Users, BarChart3, Shield, LayoutGrid, X, FileText } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { ProviderSchedule } from '../components/provider/ProviderSchedule';
import { ProviderOverview } from '../components/provider/ProviderOverview';
import { ErrorBoundary } from '../components/ui/ErrorBoundary';

import { QuickNoteModal } from '../components/ui/QuickNoteModal';
import { DashboardLayout, type NavItem } from '../components/layout/DashboardLayout';
import { WelcomeModal } from '../components/onboarding/WelcomeModal';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { LoadingState } from '../components/ui/LoadingState';

// Feature Modals
import { SlotGeneratorModal } from '../components/provider/SlotGeneratorModal';
import { ClearScheduleModal } from '../components/provider/ClearScheduleModal';

// --- LAZY-LOADED COMPONENTS ---
const TokenGenerator = lazy(() => import('../components/admin/TokenGenerator'));
const AnalyticsDashboard = lazy(() => import('../components/provider/AnalyticsDashboard').then(m => ({ default: m.AnalyticsDashboard })));
const SecuritySettings = lazy(() => import('../components/SecuritySettings').then(m => ({ default: m.SecuritySettings })));
const ProviderResources = lazy(() => import('../components/provider/ProviderResources').then(m => ({ default: m.ProviderResources })));
const EncounterLogs = lazy(() => import('../components/provider/EncounterLogs').then(m => ({ default: m.EncounterLogs })));

/**
 * Feature-level loading fallback
 */
const FeatureLoading = () => (
    <div className="w-full flex justify-center py-12">
        <LoadingState message="INITIALIZING CLINICAL NODE..." />
    </div>
);

interface Member {
    id: string;
    token_alias: string;
    status: 'active' | 'disabled';
    created_at: string;
    appointments?: { count: number }[];
}

export default function ProviderDashboard() {
    const { user, signOut } = useAuth();
    const [view, setView] = useState<'overview' | 'schedule' | 'tokens' | 'logs' | 'resources' | 'analytics' | 'security'>('overview');
    const [loading, setLoading] = useState(true);
    const [scheduleKey, setScheduleKey] = useState(0);

    // Modal Open States
    const [generatorOpen, setGeneratorOpen] = useState(false);
    const [clearOpen, setClearOpen] = useState(false);

    const [members, setMembers] = useState<Member[]>([]);
    const [memberSearch] = useState('');

    // Quick Note State
    const [quickNoteOpen, setQuickNoteOpen] = useState(false);

    const loadMembers = useCallback(async () => {
        try {
            const data = await api.getMembers(memberSearch);
            setMembers(data as Member[]);
        } catch (error) {
            logger.error('ProviderDashboard', 'Failed to load members', error);
        }
    }, [memberSearch]);

    useEffect(() => {
        setLoading(false);
    }, []);

    useEffect(() => {
        if (view === 'tokens') loadMembers();
    }, [view, memberSearch, loadMembers]);



    const navItems: NavItem[] = [
        { id: 'overview', label: 'Overview', icon: LayoutGrid, onClick: () => setView('overview'), dataTour: 'nav-overview' },
        { id: 'schedule', label: 'Schedule', icon: CalendarRange, onClick: () => setView('schedule'), dataTour: 'nav-schedule' },
        { id: 'tokens', label: 'Patient List', icon: Users, onClick: () => setView('tokens'), dataTour: 'nav-patients' },
        { id: 'logs', label: 'Clinical Logs', icon: FileText, onClick: () => setView('logs'), dataTour: 'nav-logs' },
        { id: 'resources', label: 'Resources', icon: FileText, onClick: () => setView('resources') },
        { id: 'analytics', label: 'Analytics', icon: BarChart3, onClick: () => setView('analytics'), dataTour: 'nav-analytics' },
        { id: 'security', label: 'Security', icon: Shield, onClick: () => setView('security'), dataTour: 'nav-security' }
    ];

    if (loading) {
        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4">
                <div className="flex flex-col items-center gap-4 animate-pulse">
                    <img src="/pwa-192x192.png" alt="Vector" className="w-12 h-12 rounded opacity-50 grayscale" />
                    <p className="text-[10px] font-black tracking-widest text-slate-400 uppercase">Loading Provider Portal...</p>
                </div>
            </div>
        );
    }

    return (
        <DashboardLayout
            navItems={navItems}
            activeTab={view}
            user={{ ...user, user_metadata: { token_alias: 'PROVIDER' } }}
            role="Provider"
            onSignOut={signOut}
            title="Provider Dashboard"
            headerActions={
                <Button
                    onClick={() => setQuickNoteOpen(true)}
                    size="sm"
                    variant="gradient"
                    className="h-9 px-3 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-indigo-500/20"
                    data-tour="quick-note"
                >
                    <FileText className="w-4 h-4 mr-2" />
                    Quick Note
                </Button>
            }
        >
            <WelcomeModal role="provider" userName="Provider Console" />
            <div className="max-w-[1600px] mx-auto px-4 md:px-6 pt-2 pb-4 md:pt-4 md:pb-6 space-y-4 md:space-y-6">
                <ErrorBoundary name="ProviderDashboard">
                    {view === 'overview' && <ProviderOverview onNavigate={(v) => setView(v as typeof view)} />}

                    {view === 'schedule' && (
                        <Card variant="default" className="border-none shadow-md animate-in fade-in duration-500">
                            <CardHeader className="flex flex-row items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-6">
                                <div>
                                    <CardTitle className="text-2xl font-black">Schedule Management</CardTitle>
                                    <CardDescription>Manage your availability and view upcoming appointments.</CardDescription>
                                </div>
                                <div className="flex gap-2">
                                    <Button onClick={() => setGeneratorOpen(true)} size="sm" variant="outline" className="h-9 text-xs font-bold uppercase tracking-wider">
                                        <CalendarRange className="w-4 h-4 mr-2" />
                                        Auto-Generate
                                    </Button>
                                    <Button onClick={() => setClearOpen(true)} size="sm" variant="destructive" className="h-9 text-xs font-bold uppercase tracking-wider">
                                        <X className="w-4 h-4 mr-2" />
                                        Clear
                                    </Button>
                                </div>
                            </CardHeader>
                            <CardContent className="pt-6">
                                <ProviderSchedule key={scheduleKey} />
                            </CardContent>
                        </Card>
                    )}

                    {view === 'tokens' && (
                        <div className="space-y-4 md:space-y-6 animate-in fade-in duration-500">
                            <Card variant="default" className="border-none shadow-md">
                                <CardHeader>
                                    <CardTitle>IDENTITY MANAGEMENT</CardTitle>
                                    <CardDescription>View and manage patient tokens and account statuses.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <ErrorBoundary>
                                        <Suspense fallback={<FeatureLoading />}>
                                            <TokenGenerator isProvider={true} />
                                        </Suspense>
                                    </ErrorBoundary>
                                </CardContent>
                            </Card>

                            <Card variant="default" className="border-none shadow-md overflow-hidden bg-slate-50 dark:bg-slate-950/50 md:bg-white md:dark:bg-slate-900">
                                <CardHeader className="bg-slate-50 dark:bg-slate-950/50 hidden md:block">
                                    <CardTitle className="text-xs">Active Patient Directory</CardTitle>
                                </CardHeader>
                                <CardContent className="p-0">
                                    {/* Mobile Card View */}
                                    <div className="md:hidden divide-y divide-slate-200 dark:divide-slate-800">
                                        {members.slice(0, 10).map(member => (
                                            <div key={member.id} className="p-4 bg-white dark:bg-slate-900 flex items-center justify-between">
                                                <div className="space-y-1">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-sm font-black font-mono text-slate-900 dark:text-white">{member.token_alias}</span>
                                                        <Badge variant={member.status === 'active' ? 'success' : 'secondary'} size="sm" className="h-5 text-[9px] px-1.5">
                                                            {member.status}
                                                        </Badge>
                                                    </div>
                                                    <p className="text-[10px] text-slate-500 uppercase font-bold tracking-wide">
                                                        Joined: {format(parseISO(member.created_at), 'PPP')}
                                                    </p>
                                                </div>
                                                <Button 
                                                    size="sm" 
                                                    variant="ghost" 
                                                    onClick={() => logger.debug('ProviderDashboard', `Edit: ${member.id}`)}
                                                    aria-label={`Edit notes for ${member.token_alias}`}
                                                >
                                                    <span className="sr-only">Edit</span>
                                                    <FileText className="w-4 h-4 text-slate-400" />
                                                </Button>
                                            </div>
                                        ))}
                                        {members.length === 0 && (
                                            <div className="p-8 text-center text-xs text-slate-400 font-black uppercase tracking-widest italic">
                                                No patients found.
                                            </div>
                                        )}
                                    </div>

                                    {/* Desktop Table View */}
                                    <div className="hidden md:block overflow-x-auto">
                                        <table className="w-full text-left">
                                            <thead className="bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800">
                                                <tr>
                                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Alias</th>
                                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest">Joined</th>
                                                    <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                                                {members.slice(0, 10).map(member => (
                                                    <tr key={member.id} className="group hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                                                        <td className="p-4 text-xs font-bold font-mono text-slate-700 dark:text-slate-300 group-hover:text-indigo-600 dark:group-hover:text-indigo-400">
                                                            {member.token_alias}
                                                        </td>
                                                        <td className="p-4">
                                                            <Badge variant={member.status === 'active' ? 'success' : 'secondary'} size="sm">
                                                                {member.status}
                                                            </Badge>
                                                        </td>
                                                        <td className="p-4 text-xs text-slate-500 font-bold uppercase">
                                                            {format(parseISO(member.created_at), 'PPP')}
                                                        </td>
                                                        <td className="p-4 text-right">
                                                            <Button 
                                                                size="sm" 
                                                                variant="ghost" 
                                                                onClick={() => logger.debug('ProviderDashboard', `Edit: ${member.id}`)} 
                                                                className="h-8 text-[10px] font-black uppercase"
                                                                aria-label={`Edit details for ${member.token_alias}`}
                                                            >
                                                                Edit
                                                            </Button>
                                                        </td>
                                                    </tr>
                                                ))}
                                                {members.length === 0 && (
                                                    <tr>
                                                        <td colSpan={4} className="p-12 text-center text-xs text-slate-400 font-black uppercase tracking-widest italic">
                                                            No patients found. Use "Generate Identities" above to add some.
                                                        </td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {view === 'resources' && (
                        <Card variant="default" className="border-none shadow-md animate-in fade-in duration-500">
                            <CardHeader>
                                <CardTitle>Resource Library</CardTitle>
                                <CardDescription>Manage educational content for your patients.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ErrorBoundary>
                                    <Suspense fallback={<FeatureLoading />}>
                                        <ProviderResources />
                                    </Suspense>
                                </ErrorBoundary>
                            </CardContent>
                        </Card>
                    )}

                    {view === 'logs' && (
                        <Card variant="default" className="border-none shadow-md animate-in fade-in duration-500">
                            <CardHeader>
                                <CardTitle>Clinical Encounter Logs</CardTitle>
                                <CardDescription>Historical record of all quick notes and brief interactions.</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <ErrorBoundary>
                                    <Suspense fallback={<FeatureLoading />}>
                                        <EncounterLogs />
                                    </Suspense>
                                </ErrorBoundary>
                            </CardContent>
                        </Card>
                    )}

                    {view === 'analytics' && (
                        <ErrorBoundary>
                            <Suspense fallback={<FeatureLoading />}>
                                <AnalyticsDashboard />
                            </Suspense>
                        </ErrorBoundary>
                    )}
                    {view === 'security' && (
                        <ErrorBoundary>
                            <Suspense fallback={<FeatureLoading />}>
                                <SecuritySettings />
                            </Suspense>
                        </ErrorBoundary>
                    )}
                </ErrorBoundary>
            </div>

            <SlotGeneratorModal
                isOpen={generatorOpen}
                onClose={() => setGeneratorOpen(false)}
                onSuccess={() => {
                    setGeneratorOpen(false);
                    setScheduleKey(prev => prev + 1);
                }}
            />

            <ClearScheduleModal
                isOpen={clearOpen}
                onClose={() => setClearOpen(false)}
                onSuccess={() => {
                    setClearOpen(false);
                    setScheduleKey(prev => prev + 1);
                }}
            />

            <QuickNoteModal isOpen={quickNoteOpen} onClose={() => setQuickNoteOpen(false)} />

        </DashboardLayout>
    );
}
