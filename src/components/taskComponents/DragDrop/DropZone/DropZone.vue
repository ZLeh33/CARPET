<template>
  <div class="dropZone" :id="props.dropZoneName">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
/**
 * DropZone-component that for dropping DragElements.
 * OnDrop-Behaviour is determined through the dropZoneCB-prop.
 * Dropped DragElements are only accepted, if the accept-prop contains a CSSSelector that matches the DragElement.
 * Overlap-Behaviour is determined through the overlap-prop and determins when the DropZone is considered to be hovered and thus accept a drop-action.
 */

import { unref } from "vue";
import interact from "interactjs";
import type { DropZoneProps } from "@/components/taskComponents/DragDrop/DropZone/DropZone";

const props = withDefaults(defineProps<DropZoneProps>(), {
  overlap: "pointer"
});

interact(".dropZone").dropzone({
  overlap: unref(props).overlap,
  ondrop: unref(props).dropZoneCB,
  accept: unref(props)
    .accept.map((cssIdSelector: string) => `#${cssIdSelector}`)
    .join(", ")
});
</script>

<style scoped>
.dropZone {
  width: 100%;
  height: 100%;
}
</style>
