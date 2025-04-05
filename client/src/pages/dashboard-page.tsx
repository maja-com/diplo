import Layout from "@/components/layout/layout";
import FamilyOverview from "@/components/dashboard/family-overview";
import CalendarView from "@/components/calendar/calendar-view";
import FamilyWishlists from "@/components/dashboard/family-wishlists";
import FamilyLists from "@/components/dashboard/family-lists";
import RecentNotes from "@/components/dashboard/recent-notes";

export default function DashboardPage() {
  return (
    <Layout title="Family Dashboard">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Family Overview and Calendar */}
        <div className="lg:col-span-2 space-y-6">
          <FamilyOverview />
          <CalendarView />
        </div>
        
        {/* Right Column: Lists, Wishlists, and Notes */}
        <div className="space-y-6">
          <FamilyWishlists />
          <FamilyLists />
          <RecentNotes />
        </div>
      </div>
    </Layout>
  );
}
