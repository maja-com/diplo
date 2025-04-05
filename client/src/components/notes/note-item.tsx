import { Note } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";

interface NoteItemProps {
  note: Note;
}

export default function NoteItem({ note }: NoteItemProps) {
  const timeAgo = formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true });
  
  // Truncate content to 2 lines
  const truncateContent = (content: string, maxLength: number = 120) => {
    if (!content || content.length <= maxLength) return content;
    return content.substring(0, maxLength) + "...";
  };

  return (
    <div className="p-3 rounded-lg bg-neutral-50 border border-neutral-200">
      <div className="flex justify-between items-start mb-2">
        <div className="font-medium">{note.title}</div>
        <span className="text-xs text-neutral-500">{timeAgo}</span>
      </div>
      <p className="text-sm text-neutral-600 line-clamp-2">
        {truncateContent(note.content || "")}
      </p>
    </div>
  );
}
