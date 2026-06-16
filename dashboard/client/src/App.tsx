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
                <Route path="/data" component={DataSources} />
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
