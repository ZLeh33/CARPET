<template>
  <div class="dragElement" :class="CONSTANTS.DRAGELEMENTCLASS" :id="props.elementSelector">
    <slot></slot>
  </div>
</template>

<script lang="ts" setup>
/**
 * DragElement-component that wraps any draggable element.
 */

import interact from "interactjs";
import { CONSTANTS } from "@/CARPET_config";
import {
  dragSetupCallBackHandler,
  dragMoveCallBackHandler,
  dragEndCallBackHandler
} from "@/components/taskComponents/DragDrop/DragElement/DragElement";
import type { DragElementProps } from "@/components/taskComponents/DragDrop/DragElement/DragElement";

const props = defineProps<DragElementProps>();

interact(".dragElement")
  .draggable({ manualStart: true })
  .on("move", dragSetupCallBackHandler)
  .on("dragmove", dragMoveCallBackHandler)
  .on("dragend", dragEndCallBackHandler);
</script>

<style scoped>
.dragElement {
  border: 1px dashed gray;
  background-color: white;
  min-width: 100px;
  min-height: 50px;
  margin: 5px;
  cursor: move;
}

.dragging {
  opacity: 0.4;
}
</style>
