<template>
  <div class="range_slider">
    <input type="range" :min="element.min" :max="element.max" :step="element.step" v-model="sliderValue" @mousedown="onMouseDown" />
    <p id="01">{{ displayedValue }}</p>
    <!--
    <input type="range" min="1" max="50" step="1" v-model="sliderMin" />
    <input type="number" min="0" max="180" step="1" v-model="sliderMin" />
    <input type="range" min="0" max="180" step="1" v-model="sliderMax" />
    <input type="number" min="0" max="180" step="1" v-model="sliderMax" />
    <input type="number" min="0" max="180" step="1" v-model="sliderDiff" />
    -->
  </div>
  <!--
  <input
    :class="`${elementId}__value`"
    :type="element.type"
    :value="element.value"
    :step="element.step"
    oninput="this.reportValidity()"
    @keyup="emitEvent"
  /> -->
</template>

<script lang="ts">
import { onMounted, ref, computed } from "vue";

export default {
  name: "RangeFormField",
  props: {
    element: Object,
    elementId: String,
  },
  setup(props, { emit }) {
    const sliderValue = ref(props.element.min);
    const startX = ref(0);
    const startValue = ref(0);

    // Berechnete Eigenschaft zur Anzeige des aktuellen Werts
    const displayedValue = computed(() => Math.round(sliderValue.value));

    const emitEvent = () => {
      // Emit the slider value as the updated element
      emit("updateElement", Math.round(sliderValue.value));
    };

    const onMouseDown = (event) => {
      startX.value = event.clientX;
      startValue.value = sliderValue.value;

      const onMouseMove = (moveEvent) => {
        const diffX = moveEvent.clientX - startX.value;
        const maxDiff = 50; // Maximale Distanz, die die Maus bewegt werden kann, bevor der Sliderwert geändert wird
        const maxStep = 1; // Maximale Schrittgröße
        const stepSize = Math.min(maxStep, Math.abs(diffX / maxDiff) * maxStep);
        const newValue = startValue.value + diffX * stepSize;
        sliderValue.value = Math.max(props.element.min, Math.min(props.element.max, newValue));
      };

      const onMouseUp = () => {
        document.removeEventListener("mousemove", onMouseMove);
        document.removeEventListener("mouseup", onMouseUp);
        emitEvent();
      };

      document.addEventListener("mousemove", onMouseMove);
      document.addEventListener("mouseup", onMouseUp);
    };

    return { sliderValue, emitEvent, displayedValue, onMouseDown };
  },
};
</script>

<style scoped>
input {
  margin: 5px;
  width: 200px;
  border-radius: 5px;
  text-align: center;
  border: 3px solid black;
}


input:focus {
  outline: none;
}

input.invalid {
  border: 3px solid red;
}

input.valid {
  border: 3px solid green;
}
</style>
