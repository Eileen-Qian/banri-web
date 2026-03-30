import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useTranslation } from "react-i18next";

function SortableImageItem({ image, index, onSetPrimary, onRemove }) {
  const { t } = useTranslation();
  const id = image.fileId || image.id || image.url;

  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id, disabled: image.isPrimary });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : undefined,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`position-relative border rounded p-1${isDragging ? " shadow" : ""}`}
    >
      {/* Drag handle — only for non-primary */}
      {!image.isPrimary && (
        <span
          className="position-absolute d-flex align-items-center justify-content-center"
          style={{
            top: 4,
            left: 4,
            width: 28,
            height: 28,
            cursor: "grab",
            zIndex: 2,
            borderRadius: 6,
            background: "rgba(0,0,0,.45)",
            color: "#fff",
          }}
          {...attributes}
          {...listeners}
        >
          <i className="bi bi-grip-vertical" />
        </span>
      )}

      <img
        src={image.url}
        alt=""
        className="img-fluid"
        style={{ maxHeight: "120px", objectFit: "cover", width: "100%" }}
      />

      <div className="d-flex gap-1 mt-1">
        <button
          type="button"
          className={`btn btn-sm flex-grow-1 ${image.isPrimary ? "btn-success" : "btn-outline-secondary"}`}
          onClick={() => onSetPrimary(index)}
          disabled={image.isPrimary}
        >
          {image.isPrimary
            ? t("productModal.primary")
            : t("productModal.setPrimary")}
        </button>
        <button
          type="button"
          className="btn btn-sm btn-outline-danger"
          onClick={() => onRemove(index)}
        >
          <i className="bi bi-trash" />
        </button>
      </div>
    </div>
  );
}

export default SortableImageItem;
