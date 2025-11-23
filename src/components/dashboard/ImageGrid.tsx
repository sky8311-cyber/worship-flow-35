interface ImageGridProps {
  images: string[];
}

export function ImageGrid({ images }: ImageGridProps) {
  if (!images || images.length === 0) return null;

  if (images.length === 1) {
    return (
      <div className="rounded-lg overflow-hidden">
        <img
          src={images[0]}
          alt="Post image"
          className="w-full max-h-[500px] object-cover"
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
            className="w-full h-64 object-cover"
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
          className="w-full h-full object-cover row-span-2"
        />
        <img
          src={images[1]}
          alt="Post image 2"
          className="w-full h-32 object-cover"
        />
        <img
          src={images[2]}
          alt="Post image 3"
          className="w-full h-32 object-cover"
        />
      </div>
    );
  }

  // 4 or more images
  return (
    <div className="grid grid-cols-2 gap-2 rounded-lg overflow-hidden">
      {images.slice(0, 4).map((img, idx) => (
        <div key={idx} className="relative">
          <img
            src={img}
            alt={`Post image ${idx + 1}`}
            className="w-full h-48 object-cover"
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
}
