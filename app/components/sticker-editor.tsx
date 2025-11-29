import React, { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { DndContext, useDraggable, useSensor, useSensors, MouseSensor, TouchSensor, type DragEndEvent } from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { Paper } from "./paper";
import { Button } from "./ui/button";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { cn } from "~/lib/utils";

interface Sticker {
  id: string;
  content: string;
  x: number;
  y: number;
}

interface StickerEditorProps {
  initialContent?: string;
  initialStickers?: Sticker[];
  readOnly?: boolean;
  onChange?: (content: string, stickers: Sticker[]) => void;
}

const DraggableSticker = ({ sticker, readOnly }: { sticker: Sticker; readOnly?: boolean }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: sticker.id,
    data: sticker,
    disabled: readOnly,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
      }
    : undefined;

  return (
    <div
      ref={setNodeRef}
      style={{
        position: "absolute",
        left: sticker.x,
        top: sticker.y,
        ...style,
      }}
      {...listeners}
      {...attributes}
      className={cn(
        "text-4xl cursor-move select-none transition-transform hover:scale-110 active:scale-125 z-20",
        readOnly && "cursor-default hover:scale-100 active:scale-100"
      )}
    >
      {sticker.content}
    </div>
  );
};

export function StickerEditor({ initialContent = "", initialStickers = [], readOnly = false, onChange }: StickerEditorProps) {
  const [stickers, setStickers] = useState<Sticker[]>(initialStickers);

  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "Write something nice...",
      }),
    ],
    content: initialContent,
    editable: !readOnly,
    editorProps: {
      attributes: {
        class: "prose prose-lg focus:outline-none min-h-[300px] p-8 bg-transparent relative z-10",
      },
    },
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange?.(editor.getHTML(), stickers);
    },
  });

  const sensors = useSensors(
    useSensor(MouseSensor),
    useSensor(TouchSensor)
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, delta } = event;
    setStickers((prev) => {
      const newStickers = prev.map((sticker) => {
        if (sticker.id === active.id) {
          return {
            ...sticker,
            x: sticker.x + delta.x,
            y: sticker.y + delta.y,
          };
        }
        return sticker;
      });
      onChange?.(editor?.getHTML() || "", newStickers);
      return newStickers;
    });
  };

  const addSticker = (emoji: string) => {
    const newSticker: Sticker = {
      id: Math.random().toString(36).substr(2, 9),
      content: emoji,
      x: Math.random() * 200 + 50, // Random position
      y: Math.random() * 200 + 50,
    };
    const newStickers = [...stickers, newSticker];
    setStickers(newStickers);
    onChange?.(editor?.getHTML() || "", newStickers);
  };

  const AVAILABLE_STICKERS = ["❤️", "🔥", "✨", "🎉", "🥺", "😂", "👻", "💀", "👀", "💯", "🌈", "🦄"];

  return (
    <div className="space-y-4">
      {!readOnly && (
        <ScrollArea className="w-full whitespace-nowrap rounded-md border">
          <div className="flex w-max space-x-4 p-4">
            {AVAILABLE_STICKERS.map((emoji) => (
              <button
                key={emoji}
                type="button"
                onClick={() => addSticker(emoji)}
                className="text-2xl hover:scale-125 transition-transform p-2 bg-white rounded-full shadow-sm border border-gray-100"
              >
                {emoji}
              </button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd} modifiers={[restrictToParentElement]}>
        <Paper variant="lined" className="min-h-[400px] relative">
          <EditorContent editor={editor} />
          {stickers.map((sticker) => (
            <DraggableSticker key={sticker.id} sticker={sticker} readOnly={readOnly} />
          ))}
        </Paper>
      </DndContext>
    </div>
  );
}
