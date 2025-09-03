<template>
  <h2>MathLive with Vue</h2>

  <!-- Eingabefeld -->
  <math-field 
    ref="mathfieldRef"
    :options="{ smartFence: false, virtualKeyboardMode: 'onfocus' }"
    style="width: 90%; height: 100px;"
  >
  </math-field>

  <div class="output">LaTeX: {{ formula }}</div>

  <!-- Vorschau -->
  <div>Gerenderte Formel:</div>
  <math-field 
    ref="previewRef"
    :options="{ readOnly: true }"
    style="width: 90%; height: 80px;"
  >
  </math-field>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import 'mathlive';

export default defineComponent({
  setup() {
    const mathfieldRef = ref<HTMLElement | null>(null);
    const previewRef = ref<HTMLElement | null>(null);
    const formula = ref("");

    const updateFormula = () => {
      if (mathfieldRef.value && previewRef.value) {
        // @ts-ignore
        formula.value = (mathfieldRef.value as any).getValue('latex');
        // @ts-ignore
        (previewRef.value as any).setValue(formula.value, { format: 'latex' });
      }
    };

    onMounted(() => {
      if (mathfieldRef.value) {
        mathfieldRef.value.addEventListener('input', updateFormula);
      }
    });

    return {
      mathfieldRef,
      previewRef,
      formula
    };
  }
});
</script>

<style scoped>
.output {
  margin-top: 8px;
}
</style>
