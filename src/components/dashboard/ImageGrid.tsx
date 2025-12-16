import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, X } from "lucide-react";

interface ImageGridProps {
  images: string[];
}

export function ImageGrid({ images }: ImageGridProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);

  if (!images || images.length === 0) return null;

  const openLightbox = (index: number) => setSelectedIndex(index);
  const closeLightbox = () => setSelectedIndex(null);
  
  const goToPrevious = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1);
    }
  };
  
  const goToNext = () => {
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowLeft") goToPrevious();
    if (e.key === "ArrowRight") goToNext();
    if (e.key === "Escape") closeLightbox();
  };

  const imageClassName = "w-full object-cover cursor-pointer transition-all hover:opacity-90 hover:brightness-95";

  const renderGrid = () => {
    if (images.length === 1) {
      return (
        <div className="rounded-lg overflow-hidden">
          <img
            src={images[0]}
            alt="Post image"
            className={`${imageClassName} max-h-[500px]`}
            onClick={() => openLightbox(0)}
          />
        </div>
      );
    }

    if (images.length === 2) {
      return (
        <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
          {images.map((img, idx) => (
            <img
              key={idx}
              src={img}
              alt={`Post image ${idx + 1}`}
              className={`${imageClassName} h-64`}
              onClick={() => openLightbox(idx)}
            />
          ))}
        </div>
      );
    }

    if (images.length === 3) {
      return (
        <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
          <img
            src={images[0]}
            alt="Post image 1"
            className={`${imageClassName} h-full row-span-2`}
            onClick={() => openLightbox(0)}
          />
          <img
            src={images[1]}
            alt="Post image 2"
            className={`${imageClassName} h-32`}
            onClick={() => openLightbox(1)}
          />
          <img
            src={images[2]}
            alt="Post image 3"
            className={`${imageClassName} h-32`}
            onClick={() => openLightbox(2)}
          />
        </div>
      );
    }

    // 4 or more images
    return (
      <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
        {images.slice(0, 4).map((img, idx) => (
          <div key={idx} className="relative cursor-pointer" onClick={() => openLightbox(idx)}>
            <img
              src={img}
              alt={`Post image ${idx + 1}`}
              className={`${imageClassName} h-48`}
            />
            {idx === 3 && images.length > 4 && (
              <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <span className="text-white text-2xl font-bold">
                  +{images.length - 4}
                </span>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      {renderGrid()}

      {/* Lightbox Dialog */}
      <Dialog open={selectedIndex !== null} onOpenChange={(open) => !open && closeLightbox()}>
        <DialogContent 
          className="max-w-[95vw] max-h-[95vh] w-auto h-auto p-0 bg-black/95 border-none"
          hideCloseButton
          onKeyDown={handleKeyDown}
        >
          <div className="relative flex items-center justify-center min-h-[50vh]">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-50 text-white hover:bg-white/20 rounded-full"
              onClick={closeLightbox}
            >
              <X className="h-6 w-6" />
            </Button>

            {/* Previous button */}
            {selectedIndex !== null && selectedIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full h-12 w-12"
                onClick={goToPrevious}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}

            {/* Image */}
            {selectedIndex !== null && (
              <img
                src={images[selectedIndex]}
                alt={`Image ${selectedIndex + 1}`}
                className="max-w-full max-h-[85vh] object-contain"
              />
            )}

            {/* Next button */}
            {selectedIndex !== null && selectedIndex < images.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-50 text-white hover:bg-white/20 rounded-full h-12 w-12"
                onClick={goToNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}

            {/* Image counter */}
            {images.length > 1 && selectedIndex !== null && (
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm bg-black/50 px-3 py-1 rounded-full">
                {selectedIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
