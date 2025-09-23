<template>
  <div class="container">
    <div class="latex-section">
      <div class="latex-section-item">
        <h4>Formel-Eingabe:</h4>
        <math-field
          class="mathField inputField"
          ref="formelInput"
          :options="{ smartFence: false, virtualKeyboardMode: 'onfocus' }"
        >
        </math-field>
      </div>
      <div class="latex-section-item">
        <h4>LaTex-Vorschau:</h4>
        <textarea type="text" class="mathField previewField" readonly v-model="formelInputPreview"></textarea>
      </div>
    </div>

    <div class="latex-section">
      <div class="latex-section-item">
        <h4>LaTex-Eingabe:</h4>
        <textarea class="mathField inputField" v-model="laTexInput" @input="updateLatexPreview"></textarea>
      </div>
      <div class="latex-section-item">
        <h4>Formel-Vorschau:</h4>
          <math-field
            class="mathField previewField"
            ref="laTexInputPreview"
            smart-fence="false"
            virtual-keyboard-policy="off"
          ></math-field>
      </div>
    </div>
    <div class="inputs-section">
      <div class="inputs-section-item" v-for="(para,index) in dataTmp" :key="index">
        <input 
              class="form-element" 
              type="text" readonly 
              :value="para"
              style="text-align: center;"
        >
        <select class="form-element" :id="`inputTypeSelect${index}`" @change="handleSelectedValue($event,index)">
          <option v-for="(value,idx) in selectDataTmp" :key="idx" :value="value">{{ value }}</option>
        </select>
      </div>
    </div>
  </div>
  
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import 'mathlive';
import $, { event } from 'jquery';

export default defineComponent({
  setup() {
    const formelInput = ref<HTMLElement | null>(null);
    const formelInputPreview = ref<String | null>(null);
    const formula = ref("");
    const laTexInput = ref<String | null>("");
    const laTexInputPreview = ref<HTMLElement | null>(null);

    /**Daten zum Testen, später sollen geparste Daten benutzt Werden */
    const dataTmp = ref(['a','x','i','d','m','n']);
    const selectDataTmp = ref(['Bitte auswaehlen','Variable', 'Constant', 'Vom Pfad initialisieren', 'Funktion Aufruf']);

    const updateFormula = () => {
      if (formelInput.value) {
        formelInputPreview.value = (formelInput.value as any).getValue('latex');
      }
    };

    const updateLatexPreview = () =>{
        console.log(laTexInput.value);
        if(laTexInputPreview.value){
          (laTexInputPreview.value as any).value = laTexInput.value;
        }
    }

    const createInput = (inputTyp : string, selectId: String) =>{
      const inputId = 'input'+ selectId;
      if($('#'+inputId).length == 0){
          const $input  = $('<input>')
                          .attr('type',inputTyp)
                          .attr('id',inputId);
          $input.addClass('form-element');
          $('#'+selectId).parent().append($input);
      }else{
        $('#'+inputId).attr('type',inputTyp);
      }
    }

    const handleSelectedValue = (event : Event, index: Number) =>{
      const target = event.target as HTMLSelectElement;
      const selectId : String  = target.id;
      const value = target.value;
      console.log(value);
      switch(value.toLowerCase()){
        case 'variable' : createInput('number',selectId);
                          break;
        case 'constant' : createInput('number',selectId);
                          break;
        case 'vom pfad initialisieren' : createInput('text',selectId);
                          break;
        case 'funktion aufruf'  : createInput('text',selectId);
                          break;
        case 'bitte auswaehlen' : 
                                  const inputId = 'input'+ selectId;
                                  if($('#'+inputId).length > 0){
                                    $('#'+inputId).remove();
                                  }
                                break;
        default: break;
      }
    }
    onMounted(() => {
      if (formelInput.value) {
        formelInput.value.addEventListener('input', updateFormula);
      }
      if(formelInputPreview.value){
          (formelInputPreview.value as any).virtualKeyboardPolicy = "off";
      }
    });

    return {
      handleSelectedValue,
      formelInput,
      formelInputPreview,
      formula,
      laTexInput,
      laTexInputPreview,
      updateLatexPreview,
      dataTmp,
      selectDataTmp
    };
  }
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
.inputs-section, .inputs-section-item, .container, .latex-section{
  display: flex;
  flex-wrap: wrap;
}
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
