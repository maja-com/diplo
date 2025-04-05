import { useState } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, addMonths, subMonths } from "date-fns";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { Event } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";

export default function CalendarView() {
  const { user } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<"month" | "week" | "day">("month");
  
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Add days from previous and next months to fill the calendar grid
  const startDay = monthStart.getDay(); // 0-6, 0 is Sunday
  const endDay = monthEnd.getDay();
  
  // Previous month days to display
  const prevMonthDays = startDay > 0 ? Array.from({ length: startDay }, (_, i) => {
    const d = new Date(monthStart);
    d.setDate(d.getDate() - (startDay - i));
    return d;
  }) : [];
  
  // Next month days to display
  const nextMonthDays = endDay < 6 ? Array.from({ length: 6 - endDay }, (_, i) => {
    const d = new Date(monthEnd);
    d.setDate(d.getDate() + i + 1);
    return d;
  }) : [];
  
  // All days to display in the calendar
  const allDays = [...prevMonthDays, ...daysInMonth, ...nextMonthDays];
  
  // Get events for current month
  const { data: events = [] } = useQuery<Event[]>({
    queryKey: ["/api/events/range", { 
      start: format(monthStart, "yyyy-MM-dd"), 
      end: format(monthEnd, "yyyy-MM-dd") 
    }],
    enabled: !!user,
  });
  
  // Get events for a specific day
  const getEventsForDay = (day: Date) => {
    return events.filter(event => {
      const eventDate = new Date(event.startDate);
      return eventDate.getDate() === day.getDate() &&
             eventDate.getMonth() === day.getMonth() &&
             eventDate.getFullYear() === day.getFullYear();
    });
  };
  
  // Navigate to previous month
  const prevMonth = () => {
    setCurrentDate(subMonths(currentDate, 1));
  };
  
  // Navigate to next month
  const nextMonth = () => {
    setCurrentDate(addMonths(currentDate, 1));
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-lg font-bold text-neutral-800 font-heading">Calendar</h2>
        <div className="flex space-x-2">
          <Button 
            variant="ghost" 
            size="icon" 
            className="flex items-center justify-center h-8 w-8 rounded-full text-neutral-500 hover:bg-neutral-100"
            onClick={prevMonth}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <div className="text-sm font-medium">
            {format(currentDate, "MMMM yyyy")}
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            className="flex items-center justify-center h-8 w-8 rounded-full text-neutral-500 hover:bg-neutral-100"
            onClick={nextMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
      
      <div className="mb-4 flex space-x-2">
        <Button 
          variant={view === "month" ? "default" : "ghost"} 
          size="sm"
          onClick={() => setView("month")}
        >
          Month
        </Button>
        <Button 
          variant={view === "week" ? "default" : "ghost"} 
          size="sm"
          onClick={() => setView("week")}
        >
          Week
        </Button>
        <Button 
          variant={view === "day" ? "default" : "ghost"} 
          size="sm"
          onClick={() => setView("day")}
        >
          Day
        </Button>
      </div>
      
      <div className="calendar-view overflow-x-auto">
        <div className="calendar-header grid grid-cols-7 gap-1 mb-2 text-center text-sm font-medium text-neutral-600">
          <div>Sun</div>
          <div>Mon</div>
          <div>Tue</div>
          <div>Wed</div>
          <div>Thu</div>
          <div>Fri</div>
          <div>Sat</div>
        </div>
        
        <div className="calendar-grid grid grid-cols-7 gap-1 text-sm">
          {allDays.map((day, index) => {
            const isCurrentMonth = isSameMonth(day, currentDate);
            const isTodayDate = isToday(day);
            const dayEvents = getEventsForDay(day);
            
            return (
              <div 
                key={index}
                className={cn(
                  "calendar-day aspect-square p-1 rounded-md border border-neutral-200 bg-white",
                  isTodayDate && "today",
                  !isCurrentMonth && "opacity-50"
                )}
              >
                <div className="h-full flex flex-col">
                  <div className={cn(
                    "text-right text-xs p-1",
                    isTodayDate ? "text-primary font-medium" : "text-neutral-400"
                  )}>
                    {format(day, "d")}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    {dayEvents.slice(0, 2).map((event, idx) => (
                      <div 
                        key={idx}
                        className="text-xs mb-1 px-1 py-0.5 bg-primary/10 text-primary rounded truncate"
                      >
                        {format(new Date(event.startDate), "h:mm a")} {event.title}
                      </div>
                    ))}
                    {dayEvents.length > 2 && (
                      <div className="text-xs text-neutral-500 px-1">
                        + {dayEvents.length - 2} more
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      
      <div className="mt-4 flex justify-between items-center">
        <Button 
          variant="link" 
          className="text-primary text-sm font-medium flex items-center p-0"
        >
          <i className="bx bx-plus mr-1"></i>
          <span>Add Event</span>
        </Button>
        <Button 
          variant="link" 
          className="text-sm text-neutral-600 flex items-center p-0"
        >
          <i className="bx bx-sync mr-1"></i>
          <span>Sync with Google</span>
        </Button>
      </div>
    </div>
  );
}
