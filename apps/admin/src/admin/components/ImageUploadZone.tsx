import { useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  useSortable,
  rectSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Star, Trash2, UploadCloud } from "lucide-react";
import type { ProductImageInput } from "../types";
import { uploadProductImage } from "../../storage-api";

type ImageUploadZoneProps = {
  images: ProductImageInput[];
  onChange: (images: ProductImageInput[]) => void;
};

export function ImageUploadZone({ images, onChange }: ImageUploadZoneProps) {
  const sensors = useSensors(useSensor(PointerSensor));
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    accept: { "image/*": [] },
    multiple: true,
    disabled: isUploading,
    onDrop: async (files) => {
      if (!files.length) {
        return;
      }

      setIsUploading(true);
      setError(null);

      try {
        const validFiles: File[] = [];
        let hasInvalidRatio = false;

        for (const file of files) {
          const isValid = await new Promise<boolean>((resolve) => {
            const img = new Image();
            img.onload = () => {
              const ratio = img.width / img.height;
              // 16:9 is roughly 1.77
              const is16by9 = ratio > 1.7 && ratio < 1.8;
              resolve(!is16by9);
              URL.revokeObjectURL(img.src);
            };
            img.onerror = () => {
              resolve(false);
              URL.revokeObjectURL(img.src);
            };
            img.src = URL.createObjectURL(file);
          });

          if (isValid) {
            validFiles.push(file);
          } else {
            hasInvalidRatio = true;
          }
        }

        if (hasInvalidRatio) {
          setError("Некоторые фото имеют формат 16:9 и не были загружены.");
        }

        if (validFiles.length === 0) {
          return;
        }

        const uploadedUrls = await Promise.all(validFiles.map(uploadProductImage));
        onChange(
          normalizeImages([
            ...images,
            ...uploadedUrls.map((url, index) => ({
              url,
              isMain: images.length === 0 && index === 0,
              sortOrder: images.length + index,
            })),
          ]),
        );
      } catch (uploadError) {
        setError(
          uploadError instanceof Error
            ? uploadError.message
            : "Failed to upload image",
        );
      } finally {
        setIsUploading(false);
      }
    },
  });

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || active.id === over.id) {
      return;
    }

    const oldIndex = images.findIndex((image) => image.url === active.id);
    const newIndex = images.findIndex((image) => image.url === over.id);

    if (oldIndex < 0 || newIndex < 0) {
      return;
    }

    onChange(normalizeImages(arrayMove(images, oldIndex, newIndex)));
  }

  function setMainImage(url: string) {
    onChange(
      normalizeImages(
        images.map((image) => ({
          ...image,
          isMain: image.url === url,
        })),
      ),
    );
  }

  function removeImage(url: string) {
    onChange(normalizeImages(images.filter((image) => image.url !== url)));
  }

  return (
    <div className="image-upload-zone">
      <div
        {...getRootProps({
          className: `dropzone ${isDragActive ? "active" : ""}`,
        })}
      >
        <input {...getInputProps()} />
        <UploadCloud aria-hidden="true" />
        <span>{isUploading ? "Загрузка..." : "Перетащите фото или выберите файлы"}</span>
      </div>

      {error && <p className="image-upload-error">{error}</p>}

      {images.length > 0 && (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={images.map((image) => image.url)}
            strategy={rectSortingStrategy}
          >
            <div className="image-preview-grid">
              {images.map((image) => (
                <SortableImage
                  key={image.url}
                  image={image}
                  onSetMain={setMainImage}
                  onRemove={removeImage}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}
    </div>
  );
}

function SortableImage({
  image,
  onSetMain,
  onRemove,
}: {
  image: ProductImageInput;
  onSetMain: (url: string) => void;
  onRemove: (url: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition } =
    useSortable({ id: image.url });

  return (
    <div
      ref={setNodeRef}
      className="image-preview-item"
      style={{
        transform: CSS.Transform.toString(transform),
        transition,
      }}
    >
      <img src={image.url} alt="" />
      <div className="image-preview-overlay">
        <button
          type="button"
          className={`icon-button main-button ${image.isMain ? "active" : ""}`}
          aria-label="Сделать главным фото"
          onClick={() => onSetMain(image.url)}
        >
          <Star aria-hidden="true" />
        </button>
        <button
          type="button"
          className="icon-button remove-button"
          aria-label="Удалить фото"
          onClick={() => onRemove(image.url)}
        >
          <Trash2 aria-hidden="true" />
        </button>
      </div>
      <button
        type="button"
        className="drag-handle"
        aria-label="Изменить порядок фото"
        {...attributes}
        {...listeners}
      >
        <GripVertical aria-hidden="true" />
      </button>
    </div>
  );
}

function normalizeImages(images: ProductImageInput[]) {
  const normalizedImages = images.map((image, index) => ({
    ...image,
    isMain: image.isMain,
    sortOrder: index,
  }));

  if (
    normalizedImages.length > 0 &&
    !normalizedImages.some((image) => image.isMain)
  ) {
    normalizedImages[0].isMain = true;
  }

  return normalizedImages;
}
