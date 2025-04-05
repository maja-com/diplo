import { useState } from "react";
import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useMobile } from "@/hooks/use-mobile";
import UserAvatar from "@/components/ui/user-avatar";
import FamilyAvatar from "@/components/ui/family-avatar";
import { useQuery } from "@tanstack/react-query";
import { Family } from "@shared/schema";

interface NavItemProps {
  href: string;
  icon: string;
  label: string;
  active?: boolean;
}

function NavItem({ href, icon, label, active }: NavItemProps) {
  const isMobile = useMobile();
  
  return (
    <Link href={href}>
      <a className={cn(
        "flex items-center space-x-3 p-2 md:px-4 md:py-2 rounded-lg transition-colors",
        active 
          ? "text-primary bg-blue-50" 
          : "text-neutral-600 hover:bg-neutral-100"
      )}>
        <i className={`bx ${icon} text-xl`}></i>
        {!isMobile && <span className="font-medium">{label}</span>}
      </a>
    </Link>
  );
}

export default function Sidebar() {
  const [location] = useLocation();
  const { user } = useAuth();
  const isMobile = useMobile();
  const [showFamilyMenu, setShowFamilyMenu] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const { data: families = [] } = useQuery<Family[]>({
    queryKey: ["/api/families"],
    enabled: !!user,
  });
  
  // Default to first family if available
  const [currentFamily, setCurrentFamily] = useState<Family | null>(null);
  
  // Set current family when data is loaded
  if (families.length > 0 && !currentFamily) {
    setCurrentFamily(families[0]);
  }
  
  const toggleFamilyMenu = () => {
    setShowFamilyMenu(!showFamilyMenu);
    if (showUserMenu) setShowUserMenu(false);
  };
  
  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    if (showFamilyMenu) setShowFamilyMenu(false);
  };
  
  const selectFamily = (family: Family) => {
    setCurrentFamily(family);
    setShowFamilyMenu(false);
  };

  return (
    <div className="bg-white w-20 md:w-64 border-r border-neutral-200 flex flex-col h-full shadow-sm z-10">
      {/* Logo */}
      <div className="p-4 border-b border-neutral-200 flex items-center justify-center md:justify-start">
        <div className="flex items-center space-x-2">
          <div className="h-10 w-10 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white text-xl font-bold">FS</span>
          </div>
          {!isMobile && <h1 className="text-xl font-bold text-primary font-heading">FamilySync</h1>}
        </div>
      </div>
      
      {/* Family Account Section */}
      <div className="p-4 border-b border-neutral-200">
        {!isMobile && <h2 className="text-sm font-semibold text-neutral-500 mb-3">FAMILY ACCOUNT</h2>}
        <div className="relative">
          <div 
            className="flex items-center space-x-2 p-2 rounded-lg cursor-pointer hover:bg-neutral-100"
            onClick={toggleFamilyMenu}
          >
            {currentFamily ? (
              <FamilyAvatar 
                name={currentFamily.name} 
                className="h-10 w-10 rounded-full bg-accent flex-shrink-0 flex items-center justify-center"
              />
            ) : (
              <div className="h-10 w-10 rounded-full bg-neutral-300 flex-shrink-0 flex items-center justify-center">
                <span className="text-white font-semibold">?</span>
              </div>
            )}
            
            {!isMobile && (
              <>
                <div>
                  <div className="font-semibold text-neutral-800">
                    {currentFamily?.name || "No Family Selected"}
                  </div>
                  <div className="text-xs text-neutral-500">
                    {families.length} {families.length === 1 ? "family" : "families"}
                  </div>
                </div>
                <i className="bx bx-chevron-down ml-auto text-neutral-400"></i>
              </>
            )}
          </div>
          
          {/* Family Dropdown Menu */}
          {showFamilyMenu && (
            <div className="absolute left-0 md:left-3 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
              <div className="py-1">
                {families.map((family) => (
                  <a 
                    key={family.id}
                    href="#" 
                    className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100"
                    onClick={(e) => {
                      e.preventDefault();
                      selectFamily(family);
                    }}
                  >
                    {family.name}
                  </a>
                ))}
                <div className="border-t border-neutral-200 my-1"></div>
                <a 
                  href="#" 
                  className="block px-4 py-2 text-sm text-primary hover:bg-neutral-100"
                  onClick={(e) => {
                    e.preventDefault();
                    // TODO: Open create family modal
                  }}
                >
                  + Create New Family
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
      
      {/* Navigation Menu */}
      <nav className="flex-1 overflow-y-auto py-4 px-2 space-y-1">
        <NavItem 
          href="/" 
          icon="bxs-dashboard" 
          label="Dashboard" 
          active={location === "/"} 
        />
        <NavItem 
          href="/calendar" 
          icon="bx-calendar" 
          label="Calendar" 
          active={location === "/calendar"} 
        />
        <NavItem 
          href="/lists" 
          icon="bx-list-ul" 
          label="Lists" 
          active={location === "/lists"} 
        />
        <NavItem 
          href="/wishlists" 
          icon="bx-gift" 
          label="Wishlists" 
          active={location === "/wishlists"} 
        />
        <NavItem 
          href="/notes" 
          icon="bx-note" 
          label="Notes" 
          active={location === "/notes"} 
        />
      </nav>
      
      {/* Personal Account Section */}
      <div className="p-4 border-t border-neutral-200">
        <div className="relative">
          <div 
            className="flex items-center space-x-2 p-2 rounded-lg cursor-pointer hover:bg-neutral-100"
            onClick={toggleUserMenu}
          >
            <UserAvatar 
              user={user}
              className="h-10 w-10 rounded-full bg-primary flex-shrink-0 flex items-center justify-center"
            />
            
            {!isMobile && (
              <>
                <div>
                  <div className="font-semibold text-neutral-800">{user?.name}</div>
                  <div className="text-xs text-neutral-500">Personal Account</div>
                </div>
                <i className="bx bx-cog ml-auto text-neutral-400"></i>
              </>
            )}
          </div>
          
          {/* User Dropdown Menu */}
          {showUserMenu && (
            <div className="absolute left-0 md:left-3 bottom-16 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-20">
              <div className="py-1">
                <Link href="/settings">
                  <a className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100">
                    Profile Settings
                  </a>
                </Link>
                <a href="#" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100">
                  Privacy Settings
                </a>
                <a href="#" className="block px-4 py-2 text-sm text-neutral-700 hover:bg-neutral-100">
                  Notifications
                </a>
                <div className="border-t border-neutral-200 my-1"></div>
                <a 
                  href="#" 
                  className="block px-4 py-2 text-sm text-red-600 hover:bg-neutral-100"
                  onClick={(e) => {
                    e.preventDefault();
                    useAuth().logoutMutation.mutate();
                  }}
                >
                  Sign Out
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
