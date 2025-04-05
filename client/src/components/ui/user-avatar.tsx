import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { User } from "@shared/schema";
import { cn } from "@/lib/utils";

interface UserAvatarProps {
  user: User | null;
  className?: string;
}

export default function UserAvatar({ user, className }: UserAvatarProps) {
  if (!user) {
    return (
      <Avatar className={cn("bg-neutral-300", className)}>
        <AvatarFallback className="text-white font-semibold">?</AvatarFallback>
      </Avatar>
    );
  }
  
  // Get initials from name
  const initials = user.name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
  
  return (
    <Avatar className={cn("bg-primary", className)}>
      <AvatarFallback className="text-white font-semibold">{initials}</AvatarFallback>
    </Avatar>
  );
}
