import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";

interface FamilyAvatarProps {
  name: string;
  className?: string;
}

export default function FamilyAvatar({ name, className }: FamilyAvatarProps) {
  // Get initials from family name
  const initials = name
    .split(" ")
    .map(part => part[0])
    .join("")
    .toUpperCase()
    .substring(0, 2);
  
  return (
    <Avatar className={cn("bg-accent", className)}>
      <AvatarFallback className="text-white font-semibold">{initials}</AvatarFallback>
    </Avatar>
  );
}
