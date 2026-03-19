import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';

export function useAnalytics() {
  const location = useLocation();

  useEffect(() => {
    // Only track page views when location changes
    const trackPageView = async () => {
      try {
        await supabase.from('analytics_events').insert([{
          event_type: 'page_view',
          path: location.pathname
        }]);
      } catch (e) {
        console.error('Failed to track page view:', e);
      }
    };
    trackPageView();
  }, [location.pathname]);

  const trackEvent = async (eventType: string, metadata: any = {}, resourceId?: string) => {
    try {
      await supabase.from('analytics_events').insert([{
        event_type: eventType,
        path: window.location.pathname,
        metadata,
        resource_id: resourceId
      }]);
    } catch (e) {
      console.error(`Failed to track ${eventType}:`, e);
    }
  };

  return { trackEvent };
}

export async function fetchAnalyticsStats() {
  try {
    const { data: pageViews, error: pvError } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'page_view');

    const { data: bookClicks, error: bcError } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'book_click');

    const { data: signups, error: sError } = await supabase
      .from('analytics_events')
      .select('*', { count: 'exact', head: true })
      .eq('event_type', 'newsletter_signup');

    if (pvError || bcError || sError) throw new Error("Error fetching stats");

    return {
      pageViews: pageViews || 0,
      bookClicks: bookClicks || 0,
      newsletterSignups: signups || 0
    };
  } catch (error) {
    console.error("fetchAnalyticsStats error", error);
    return { pageViews: 0, bookClicks: 0, newsletterSignups: 0 };
  }
}
