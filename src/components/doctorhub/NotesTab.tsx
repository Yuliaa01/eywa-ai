import { useState } from "react";
import { GlassCard } from "@/components/glass/GlassCard";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Calendar } from "lucide-react";

// Mock notes data
const initialNotes = [
  {
    id: "1",
    title: "Cardiology Follow-up",
    content: "Discussed LDL levels and exercise plan. Will recheck in 3 months.",
    specialty: "Cardiology",
    timestamp: "2024-01-15T10:00:00Z",
  },
  {
    id: "2",
    title: "Nutrition Consultation",
    content: "Updated meal plan to reduce saturated fats. Focus on Mediterranean diet.",
    specialty: "Nutrition",
    timestamp: "2024-01-10T14:30:00Z",
  },
];

export default function NotesTab() {
  const [notes, setNotes] = useState(initialNotes);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [newNote, setNewNote] = useState({ title: "", content: "" });

  const handleAddNote = () => {
    if (newNote.title && newNote.content) {
      setNotes([
        {
          id: Date.now().toString(),
          ...newNote,
          specialty: "General",
          timestamp: new Date().toISOString(),
        },
        ...notes,
      ]);
      setNewNote({ title: "", content: "" });
      setIsAddingNote(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Note Button */}
      {!isAddingNote && (
        <Button
          onClick={() => setIsAddingNote(true)}
          className="w-full rounded-xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white shadow-[0_4px_20px_rgba(18,175,203,0.3)]"
        >
          <Plus className="w-4 h-4 mr-2" />
          Add New Note
        </Button>
      )}

      {/* New Note Form */}
      {isAddingNote && (
        <GlassCard className="p-6">
          <h3 className="font-rounded font-semibold text-[#0E1012] mb-4">New Note</h3>
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Note title"
              value={newNote.title}
              onChange={(e) => setNewNote({ ...newNote, title: e.target.value })}
              className="w-full px-4 py-2 rounded-xl bg-white/60 border border-[#12AFCB]/10 focus:border-[#12AFCB]/30 outline-none"
            />
            <Textarea
              placeholder="Note content (supports Markdown)"
              value={newNote.content}
              onChange={(e) => setNewNote({ ...newNote, content: e.target.value })}
              className="min-h-[120px] rounded-xl bg-white/60 border-[#12AFCB]/10 focus:border-[#12AFCB]/30"
            />
            <div className="flex gap-2">
              <Button
                onClick={handleAddNote}
                className="flex-1 rounded-xl bg-gradient-to-r from-[#12AFCB] to-[#12AFCB]/90 text-white"
              >
                Save Note
              </Button>
              <Button
                onClick={() => {
                  setIsAddingNote(false);
                  setNewNote({ title: "", content: "" });
                }}
                variant="outline"
                className="rounded-xl border-[#12AFCB]/20"
              >
                Cancel
              </Button>
            </div>
          </div>
        </GlassCard>
      )}

      {/* Notes List */}
      <div className="space-y-3">
        {notes.map((note) => (
          <GlassCard key={note.id} className="p-4">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-[#12AFCB]/10 flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-[#12AFCB]" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <h4 className="font-rounded font-semibold text-[#0E1012]">
                    {note.title}
                  </h4>
                  <Badge variant="secondary" className="text-xs bg-[#12AFCB]/5 text-[#12AFCB]">
                    {note.specialty}
                  </Badge>
                </div>
                <p className="text-sm text-[#5A6B7F] mb-3 whitespace-pre-wrap">
                  {note.content}
                </p>
                <div className="flex items-center gap-2 text-xs text-[#5A6B7F]">
                  <Calendar className="w-3 h-3" />
                  {new Date(note.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          </GlassCard>
        ))}
      </div>

      {notes.length === 0 && !isAddingNote && (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-[#12AFCB]/20 to-[#12AFCB]/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-[#12AFCB]" />
          </div>
          <h3 className="font-rounded text-lg font-semibold text-[#0E1012] mb-2">
            No Notes Yet
          </h3>
          <p className="text-sm text-[#5A6B7F]">
            Create your first note to track important health information.
          </p>
        </div>
      )}
    </div>
  );
}
