import type { InteractEvent } from "@interactjs/types";

export type CSSSIDelector = string;

export type CSSIDSelectors = Array<CSSSIDelector>;

export interface DropZoneCallBackHandler<E extends InteractEvent = InteractEvent> {
  (event: E): void;
}

export interface DropZoneProps {
  dropZoneCB: DropZoneCallBackHandler;
  accept: CSSIDSelectors;
  dropZoneName: string;
  overlap?: number | "pointer" | "center" | undefined;
}
