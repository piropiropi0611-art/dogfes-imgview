"use client";

import { useEffect, useMemo, useRef, useState, type CSSProperties } from "react";
import Image from "next/image";

import type { ImageRecord } from "@/lib/storage/types";

type FloatingStageProps = {
  images: ImageRecord[];
};

type SceneSize = {
  width: number;
  height: number;
};

type MotionItem = {
  id: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  angle: number;
  rotationSpeed: number;
  size: number;
  zIndex: number;
};

function hashValue(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return hash;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function createMotionItems(images: ImageRecord[], sceneSize: SceneSize, sessionSeed: string) {
  const width = sceneSize.width || 960;
  const height = sceneSize.height || 720;
  const count = images.length;
  const columns = count <= 1 ? 1 : count <= 4 ? 2 : 3;
  const rows = Math.max(1, Math.ceil(count / columns));
  const slotWidth = width / columns;
  const slotHeight = height / rows;
  const baseSize =
    count <= 2 ? Math.min(width, height) * 0.16 : count <= 4 ? Math.min(width, height) * 0.14 : Math.min(width, height) * 0.12;
  const minimumSize = Math.round(clamp(baseSize - 2, 104, 128));

  return [...images]
    .sort(
      (left, right) =>
        hashValue(`${sessionSeed}-${left.id}`) - hashValue(`${sessionSeed}-${right.id}`),
    )
    .map((image, index) => {
      const base = hashValue(`${sessionSeed}-${image.id}-${index}`);
      const column = index % columns;
      const row = Math.floor(index / columns);
      const size = Math.round(clamp(baseSize + ((base >> 9) % 18) - 8, minimumSize, 150));
      const margin = size / 2 + 14;
      const slotLeft = column * slotWidth;
      const slotTop = row * slotHeight;
      const slotCenterX = slotLeft + slotWidth / 2;
      const slotCenterY = slotTop + slotHeight / 2;
      const jitterX = (((base >> 4) % 11) - 5) * Math.min(slotWidth * 0.06, 26);
      const jitterY = (((base >> 8) % 11) - 5) * Math.min(slotHeight * 0.06, 24);
      const x = clamp(slotCenterX + jitterX, margin, width - margin);
      const y = clamp(slotCenterY + jitterY, margin, height - margin);
      const direction = ((base >> 13) % 360) * (Math.PI / 180);
      const speed = 24 + ((base >> 18) % 14);
      const vx = Math.cos(direction) * speed;
      const vy = Math.sin(direction) * speed;
      const rotationSpeed = (((base >> 23) % 36) - 18) || 10;

      return {
        id: image.id,
        x,
        y,
        vx,
        vy,
        angle: (base >> 27) % 360,
        rotationSpeed,
        size,
        zIndex: 2 + (base % 4),
      };
    });
}

function stepMotionItem(item: MotionItem, sceneSize: SceneSize, deltaSeconds: number): MotionItem {
  const width = sceneSize.width || 960;
  const height = sceneSize.height || 720;
  const margin = item.size / 2 + 14;
  let nextX = item.x + item.vx * deltaSeconds;
  let nextY = item.y + item.vy * deltaSeconds;
  let nextVx = item.vx;
  let nextVy = item.vy;

  if (nextX <= margin || nextX >= width - margin) {
    nextVx *= -1;
    nextX = clamp(nextX, margin, width - margin);
  }

  if (nextY <= margin || nextY >= height - margin) {
    nextVy *= -1;
    nextY = clamp(nextY, margin, height - margin);
  }

  return {
    ...item,
    x: nextX,
    y: nextY,
    vx: nextVx,
    vy: nextVy,
    angle: item.angle + item.rotationSpeed * deltaSeconds,
  };
}

function itemStyle(item: MotionItem): CSSProperties {
  return {
    left: `${item.x}px`,
    top: `${item.y}px`,
    width: `${item.size}px`,
    height: `${item.size}px`,
    zIndex: item.zIndex,
    transform: `translate(-50%, -50%) rotate(${item.angle}deg)`,
  };
}

export function FloatingStage({ images }: FloatingStageProps) {
  const sceneRef = useRef<HTMLDivElement | null>(null);
  const frameRef = useRef<number | null>(null);
  const previousTimeRef = useRef<number | null>(null);
  const [sessionSeed] = useState(
    () => `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
  );
  const [sceneSize, setSceneSize] = useState<SceneSize>({ width: 0, height: 0 });
  const [motionItems, setMotionItems] = useState<MotionItem[]>([]);

  useEffect(() => {
    const element = sceneRef.current;

    if (!element) {
      return;
    }

    const updateSceneSize = () => {
      setSceneSize({
        width: element.clientWidth,
        height: element.clientHeight,
      });
    };

    updateSceneSize();

    const observer = new ResizeObserver(() => {
      updateSceneSize();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, []);

  useEffect(() => {
    setMotionItems(createMotionItems(images, sceneSize, sessionSeed));
  }, [images, sceneSize, sessionSeed]);

  useEffect(() => {
    if (motionItems.length === 0 || sceneSize.width === 0 || sceneSize.height === 0) {
      return;
    }

    const tick = (time: number) => {
      if (previousTimeRef.current === null) {
        previousTimeRef.current = time;
        frameRef.current = requestAnimationFrame(tick);
        return;
      }

      const deltaSeconds = Math.min((time - previousTimeRef.current) / 1000, 0.05);
      previousTimeRef.current = time;

      setMotionItems((current) =>
        current.map((item) => stepMotionItem(item, sceneSize, deltaSeconds)),
      );

      frameRef.current = requestAnimationFrame(tick);
    };

    frameRef.current = requestAnimationFrame(tick);

    return () => {
      if (frameRef.current !== null) {
        cancelAnimationFrame(frameRef.current);
      }
      frameRef.current = null;
      previousTimeRef.current = null;
    };
  }, [motionItems.length, sceneSize]);

  const motionById = useMemo(
    () => new Map(motionItems.map((item) => [item.id, item])),
    [motionItems],
  );

  return (
    <section className="panel scenePanel">
      <div className="panelHeader">
        <p className="eyebrow">Viewer</p>
        <h2>ふわふわ飛び回る抽出画像</h2>
      </div>

      <div className="sceneMeta">
        <span>表示中の抽出画像</span>
        <strong>{images.length} 件</strong>
      </div>

      <div className="floatingScene" ref={sceneRef}>
        <Image
          src="/backgrounds/fuchu-dog-festival.png"
          alt="ふちゅう犬まつりの背景"
          fill
          priority
          className="sceneBackground"
        />

        {images.length === 0 ? (
          <div className="sceneEmpty">
            <p>まだ抽出画像がありません。</p>
            <p className="mutedText">
              画像をアップロードすると、背景除去した犬画像がここをふわふわ飛び回ります。
            </p>
          </div>
        ) : null}

        {images.map((image) => {
          const motion = motionById.get(image.id);

          if (!motion) {
            return null;
          }

          return (
            <div className="floatingItem" key={image.id} style={itemStyle(motion)}>
              <div className="floatingItemInner">
                <Image
                  src={image.url}
                  alt={image.storedName}
                  width={160}
                  height={160}
                  className="floatingImage"
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
