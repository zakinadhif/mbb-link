import React, { useState } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { DndContext, useDraggable, useSensor, useSensors, MouseSensor, TouchSensor, type DragEndEvent, type Modifier } from "@dnd-kit/core";
import { restrictToParentElement } from "@dnd-kit/modifiers";
import { Paper } from "./paper";
import { Button } from "./ui/button";
import { ScrollArea, ScrollBar } from "./ui/scroll-area";
import { ImagePlus, Loader2 } from "lucide-react";
import { cn } from "~/lib/utils";

interface Sticker {
  id: string;
  type: 'emoji' | 'image';
  content: string;
  x: number;
  y: number;
  rotation: number;
}

interface StickerEditorProps {
  initialContent?: string;
  initialStickers?: Sticker[];
  readOnly?: boolean;
  onChange?: (content: string, stickers: Sticker[]) => void;
}

// Custom modifier to keep the center of the sticker within the parent
const restrictCenterToParent: Modifier = ({
  containerNodeRect,
  draggingNodeRect,
  transform,
}) => {
  if (!containerNodeRect || !draggingNodeRect) {
    return transform;
  }

  const centerX = draggingNodeRect.left + draggingNodeRect.width / 2 + transform.x;
  const centerY = draggingNodeRect.top + draggingNodeRect.height / 2 + transform.y;

  // Calculate bounds for the center point
  // We want the center to be within the container
  // So minX = container.left, maxX = container.right
  // But transform is relative to current position.
  
  // Actually, let's simplify. We want the center of the element to stay within the container.
  // The element's current center is (draggingNodeRect.left + width/2).
  // The new center will be (currentCenter + transform.x).
  // We want container.left <= newCenter <= container.right
  
  const currentCenterX = draggingNodeRect.left + draggingNodeRect.width / 2;
  const currentCenterY = draggingNodeRect.top + draggingNodeRect.height / 2;
  
  const newCenterX = currentCenterX + transform.x;
  const newCenterY = currentCenterY + transform.y;
  
  let x = transform.x;
  let y = transform.y;

  if (newCenterX < containerNodeRect.left) {
    x = containerNodeRect.left - currentCenterX;
  } else if (newCenterX > containerNodeRect.right) {
    x = containerNodeRect.right - currentCenterX;
  }

  if (newCenterY < containerNodeRect.top) {
    y = containerNodeRect.top - currentCenterY;
  } else if (newCenterY > containerNodeRect.bottom) {
    y = containerNodeRect.bottom - currentCenterY;
  }

  return {
    ...transform,
    x,
    y,
  };
};

const DraggableSticker = ({ sticker, readOnly, onRotate }: { sticker: Sticker; readOnly?: boolean; onRotate?: (id: string, angle: number) => void }) => {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: sticker.id,
    data: sticker,
    disabled: readOnly,
  });

  const style = transform
    ? {
        transform: `translate3d(${transform.x}px, ${transform.y}px, 0) rotate(${sticker.rotation}deg)`,
      }
    : {
        transform: `rotate(${sticker.rotation}deg)`,
    };

  // Rotation logic
  const handleRotateStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (readOnly) return;
    e.stopPropagation();
    const startX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const startY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    
    const startAngle = Math.atan2(startY - centerY, startX - centerX) * (180 / Math.PI);
    const initialRotation = sticker.rotation;

    const handleMove = (moveEvent: MouseEvent | TouchEvent) => {
      const moveX = 'touches' in moveEvent ? moveEvent.touches[0].clientX : moveEvent.clientX;
      const moveY = 'touches' in moveEvent ? moveEvent.touches[0].clientY : moveEvent.clientY;
      const angle = Math.atan2(moveY - centerY, moveX - centerX) * (180 / Math.PI);
      const delta = angle - startAngle;
      onRotate?.(sticker.id, initialRotation + delta);
    };

    const handleUp = () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove);
    window.addEventListener('touchend', handleUp);
  };

  if (sticker.type === 'image') {
    return (
      <div
        ref={setNodeRef}
        style={{
          position: "absolute",
          left: sticker.x,
          top: sticker.y,
          ...style,
        }}
        className={cn(
          "absolute z-20 p-3 bg-white shadow-xl transition-shadow hover:shadow-2xl",
          !readOnly && "cursor-grab active:cursor-grabbing"
        )}
        onMouseDown={handleRotateStart}
        onTouchStart={handleRotateStart}
      >
        {/* Image Container */}
        <div className="relative w-48 h-48 bg-gray-100 overflow-hidden select-none">
             <img src={sticker.content} alt="Sticker" className="w-full h-full object-cover pointer-events-none" />
             
             {/* Virtual Drag Handle (Center) */}
             {!readOnly && (
               <div 
                  {...listeners} 
                  {...attributes}
                  onMouseDown={(e) => {
                    listeners?.onMouseDown?.(e);
                    e.stopPropagation();
                  }}
                  onTouchStart={(e) => {
                    listeners?.onTouchStart?.(e);
                    e.stopPropagation();
                  }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full cursor-move hover:bg-black/10 transition-colors z-30"
                  title="Drag to move"
               />
             )}
        </div>
        <div className="h-12 flex items-end justify-center pb-2 select-none">
            <span className="font-handwriting text-gray-400 text-sm opacity-50">mbb.link</span>
        </div>
      </div>
    );
  }

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
  const [isUploading, setIsUploading] = useState(false);

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

  const handleRotate = (id: string, angle: number) => {
      setStickers((prev) => {
          const newStickers = prev.map(s => s.id === id ? { ...s, rotation: angle } : s);
          onChange?.(editor?.getHTML() || "", newStickers);
          return newStickers;
      });
  };

  const addSticker = (emoji: string) => {
    const newSticker: Sticker = {
      id: Math.random().toString(36).substr(2, 9),
      type: 'emoji',
      content: emoji,
      x: Math.random() * 200 + 50, // Random position
      y: Math.random() * 200 + 50,
      rotation: (Math.random() - 0.5) * 30,
    };
    const newStickers = [...stickers, newSticker];
    setStickers(newStickers);
    onChange?.(editor?.getHTML() || "", newStickers);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setIsUploading(true);
      const formData = new FormData();
      formData.append("file", file);

      try {
          const res = await fetch("/api/upload", {
              method: "POST",
              body: formData,
          });
          const data = await res.json() as { url: string };
          if (data.url) {
              const newSticker: Sticker = {
                  id: Math.random().toString(36).substr(2, 9),
                  type: 'image',
                  content: data.url,
                  x: Math.random() * 100 + 50,
                  y: Math.random() * 100 + 50,
                  rotation: (Math.random() - 0.5) * 10,
              };
              const newStickers = [...stickers, newSticker];
              setStickers(newStickers);
              onChange?.(editor?.getHTML() || "", newStickers);
          }
      } catch (error) {
          console.error("Upload failed", error);
      } finally {
          setIsUploading(false);
      }
  };

  const AVAILABLE_STICKERS = ["❤️", "🔥", "✨", "🎉", "🥺", "😂", "👻", "💀", "👀", "💯", "🌈", "🦄"];

  return (
    <div className="space-y-4">
      {!readOnly && (
        <div className="flex items-center gap-2">
            <div className="relative">
                <input 
                    type="file" 
                    accept="image/*" 
                    className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    onChange={handleImageUpload}
                    disabled={isUploading}
                />
                <Button variant="outline" size="icon" className="rounded-full shrink-0" disabled={isUploading}>
                    {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImagePlus className="w-4 h-4" />}
                </Button>
            </div>
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
        </div>
      )}

      <DndContext sensors={sensors} onDragEnd={handleDragEnd} modifiers={[restrictCenterToParent]}>
        <Paper variant="lined" className="min-h-[400px] relative">
          <EditorContent editor={editor} />
          {stickers.map((sticker) => (
            <DraggableSticker key={sticker.id} sticker={sticker} readOnly={readOnly} onRotate={handleRotate} />
          ))}
        </Paper>
      </DndContext>
    </div>
  );
}
