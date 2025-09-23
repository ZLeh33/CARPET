<template>
  <div class="p-4">
    <h2>Input</h2>
    
    <!-- Mathfield -->
    <math-field ref="mathfield" style="font-size: 1.5em;">x^2+2x+1</math-field>
    
    <button @click="parseFormula" style="margin-top: 1em;">Parse Formula</button>
    
    <h3>Output:</h3>
    <pre>{{ output }}</pre>
  </div>
</template>

<script setup>
import { onMounted, ref } from "vue";
import { MathfieldElement } from "mathlive";
import { ComputeEngine } from "@cortex-js/compute-engine";

const mathfield = ref(null);
const output = ref("");

let ce;

onMounted(() => {
  ce = new ComputeEngine();
});

function parseFormula() {
  if (!mathfield.value) return;

  // Get LaTeX from mathfield
  const latexInput = mathfield.value.getValue("latex");

  // Parse LaTeX → AST
  const expr = ce.parse(latexInput);

  console.log("LaTeX input:", latexInput);
  console.log("Parsed AST:", expr.json);

  output.value = JSON.stringify(expr.json, null, 2);
}
</script>

<style>
button {
  padding: 0.5em 1em;
  border: none;
  background: #4caf50;
  color: white;
  border-radius: 6px;
  cursor: pointer;
}
button:hover {
  background: #45a049;
}
</style>
