import { Switch, Route, Router } from 'wouter';
import { useHashLocation } from 'wouter/use-hash-location';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { Toaster } from '@/components/ui/toaster';
import { ThemeProvider } from '@/components/ThemeProvider';
import Sidebar from '@/components/Sidebar';
import Overview from '@/pages/Overview';
import MTA from '@/pages/MTA';
import CAC from '@/pages/CAC';
import MMM from '@/pages/MMM';
import DataSources from '@/pages/DataSources';
import AIAnalyst from '@/pages/AIAnalyst';
import Portfolio from '@/pages/Portfolio';
import Scorecard from '@/pages/Scorecard';
import ABTesting from '@/pages/ABTesting';
import DataProductSpec from '@/pages/DataProductSpec';
import MetricGovernance from '@/pages/MetricGovernance';
import CaseStudy from '@/pages/CaseStudy';
import NotFound from '@/pages/not-found';

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider>
        <Router hook={useHashLocation}>
          <div className="flex h-screen overflow-hidden bg-background">
            <Sidebar />
            <main className="flex-1 overflow-y-auto overscroll-contain">
              <Switch>
                <Route path="/" component={Overview} />
                <Route path="/mta" component={MTA} />
                <Route path="/cac" component={CAC} />
                <Route path="/mmm" component={MMM} />
                <Route path="/scorecard" component={Scorecard} />
                <Route path="/data" component={DataSources} />
                <Route path="/ai-analyst" component={AIAnalyst} />
                <Route path="/about" component={Portfolio} />
                <Route path="/ab-testing" component={ABTesting} />
                <Route path="/data-product-spec" component={DataProductSpec} />
                <Route path="/metric-governance" component={MetricGovernance} />
                <Route path="/case-study" component={CaseStudy} />
                <Route component={NotFound} />
              </Switch>
            </main>
          </div>
        </Router>
        <Toaster />
      </ThemeProvider>
    </QueryClientProvider>
  );
}
