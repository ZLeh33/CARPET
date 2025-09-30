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
.container{
  width: 100%;
  height:  100%;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
  background: #f5f7fa;
}
.latex-section{
  width: 90%;
  height: 20%;
  flex-direction: row;
  justify-content: space-around;
}
.latex-section-item{
  width: 50%;
  height: 100%;
  display: flex;
  flex-direction: column;
}
.mathField{
  width: 400px;
  height: 90%;
  word-wrap: break-word;
  overflow: auto;
  border-radius: 10px;
}
.inputField {
  background-color: #eef2f7;
  border: 1px solid #aaccee;
}

.previewField {
  background-color: #d6edf4;
  border: 1px solid #f0e6be;
}
.inputs-section{
  width: 100%;
  height: 50%;
  flex-direction: column;
  justify-content: space-evenly;
  overflow: auto;
}
.inputs-section-item{
  flex-direction: row;
  justify-content: space-evenly;
}
.form-element{
  width: 25%;
  height: 30px;
  border-radius: 8px;
  border: 1px solid #bbb;
  text-align: center;
  font-size: 14px;
}
.form-element:hover {
  border-color: #3498db;
  box-shadow: 0 2px 6px rgba(52,152,219,0.2);
}

.selectField {
  background-color: #f0f8ff;
}

textarea {
  resize: none;
}
</style>
