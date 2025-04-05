import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PlusIcon, BellIcon } from "lucide-react";
import EventModal from "@/components/calendar/event-modal";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  const [showEventModal, setShowEventModal] = useState(false);
  
  return (
    <>
      <header className="bg-white border-b border-neutral-200 p-4 flex items-center justify-between">
        <div className="flex items-center">
          <h1 className="text-xl font-bold text-neutral-800 font-heading">{title}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="icon" className="relative text-neutral-500 hover:text-neutral-700">
            <BellIcon className="h-5 w-5" />
            <span className="absolute top-2 right-2 bg-accent rounded-full w-2 h-2"></span>
          </Button>
          <Button 
            onClick={() => setShowEventModal(true)}
            className="flex items-center rounded-md bg-primary text-white px-4 py-2 text-sm font-medium shadow-sm hover:bg-primary/90"
          >
            <PlusIcon className="h-4 w-4 mr-2" />
            <span>Add Event</span>
          </Button>
        </div>
      </header>
      
      {showEventModal && (
        <EventModal onClose={() => setShowEventModal(false)} />
      )}
    </>
  );
}
