import { useEffect, useState } from "react";
import {
  attachItemImage,
  attachLotImage,
  getItemImages,
  getLotImages,
  requestItemImageUploadUrl,
  requestLotImageUploadUrl,
  uploadFileToPresignedUrl,
  type MediaImage,
} from "../api/media";
import styles from "./ImageUploadPanel.module.css";

type Props =
  | {
      mode: "item";
      entityId: string;
      title?: string;
    }
  | {
      mode: "lot";
      entityId: string;
      title?: string;
    };

export default function ImageUploadPanel(props: Props) {
  const [images, setImages] = useState<MediaImage[]>([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadImages() {
    try {
      setLoading(true);
      setError(null);

      const res =
        props.mode === "item"
          ? await getItemImages(props.entityId)
          : await getLotImages(props.entityId);

      setImages(res.images);
    } catch (err: any) {
      setError(err?.message || "Failed to load images");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadImages();
  }, [props.entityId, props.mode]);

  async function handleFiles(fileList: FileList | null) {
    if (!fileList || fileList.length === 0) return;

    try {
      setUploading(true);
      setError(null);

      const files = Array.from(fileList);
      const hadNoImages = images.length === 0;

      for (let i = 0; i < files.length; i += 1) {
        const file = files[i];

        const uploadInit =
          props.mode === "item"
            ? await requestItemImageUploadUrl(props.entityId, {
                filename: file.name,
                content_type: file.type,
              })
            : await requestLotImageUploadUrl(props.entityId, {
                filename: file.name,
                content_type: file.type,
              });

        await uploadFileToPresignedUrl(file, uploadInit.upload_url);

        if (props.mode === "item") {
          await attachItemImage(props.entityId, {
            s3_key: uploadInit.s3_key,
            caption: file.name,
            is_primary: hadNoImages && i === 0,
          });
        } else {
          await attachLotImage(props.entityId, {
            s3_key: uploadInit.s3_key,
            caption: file.name,
            is_primary: hadNoImages && i === 0,
          });
        }
      }

      await loadImages();
    } catch (err: any) {
      setError(err?.message || "Failed to upload image");
    } finally {
      setUploading(false);
    }
  }

  return (
    <section className={styles.panel}>
      <div className={styles.header}>
        <h3>{props.title || "Images"}</h3>

        <button
          type="button"
          className="secondary-button"
          onClick={loadImages}
          disabled={loading || uploading}
        >
          {loading ? "Refreshing..." : "Refresh"}
        </button>
      </div>

      <div className={styles.body}>
        <div className={styles.controls}>
          <div className={styles.field}>
            <label className={styles.label}>Upload Images</label>

            <div className={styles.inputRow}>
              <input
                className={styles.fileInput}
                type="file"
                accept="image/*"
                capture="environment"
                multiple
                onChange={(e) => handleFiles(e.target.files)}
                disabled={uploading}
              />
            </div>

            <div className={styles.help}>
              On phones, this may open the camera or photo library depending on
              the browser.
            </div>
          </div>
        </div>

        {uploading && (
          <div className={styles.status}>Uploading...</div>
        )}

        {error && <div className="alert-error">Error: {error}</div>}

        <div className={styles.content}>
          {images.length === 0 ? (
            <div className={styles.empty}>No images.</div>
          ) : (
            <div className={styles.grid}>
              {images.map((img) => (
                <article key={img.id} className={styles.card}>
                  {img.url ? (
                    <img src={img.url} alt={img.caption || "image"} />
                  ) : (
                    <div className={styles.placeholder}>No preview</div>
                  )}

                  <div className={styles.cardMeta}>
                    <div className={styles.cardName}>
                      {img.caption || "—"}
                    </div>
                    {img.is_primary && (
                      <div className={styles.badge}>Primary</div>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
