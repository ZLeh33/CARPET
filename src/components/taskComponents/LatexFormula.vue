<template>
    <div class="container">
        <div v-if="showLatexModal" class="custom-modal-overlay">
  <div class="modal-latex-editor">
    <div class="latex-section">
      <fieldset class="latex-section-item">
        <legend><h3>Bitte wählen Sie die gewünschte Eingabe :</h3></legend>
        <select name="inputEditor" id="selectedEditor" v-model="selectedEditor" style="font-size: larger;">
          <option value="">Bitte auswählen</option>
          <option value="latex">Latex Eingabe</option>
          <option value="formel">Formel Eingabe</option>
        </select>
      </fieldset>

      <!-- Formel input -->
      <div class="latex-section" v-if="formelInputVisible">
        <div class="latex-section-item">
          <h4>Formel-Eingabe:</h4>
          <math-field
            class="mathField inputField"
            ref="formelInput"
            :options="{ smartFence: false, virtualKeyboardMode: 'onfocus' }"
          ></math-field>
        </div>
        <div class="latex-section-item">
          <h4>LaTex-Vorschau:</h4>
          <textarea class="mathField previewField" readonly v-model="formelInputPreview"></textarea>
        </div>
      </div>

      <!-- LaTeX input -->
      <div class="latex-section" v-if="latexInputVisible">
        <div class="latex-section-item">
          <h4>LaTex-Eingabe:</h4>
          <textarea
            class="mathField inputField"
            placeholder="\frac{\left(\sum_0^{n}\frac{v_{i}}{...}"
            v-model="laTexInput"
            @input="updateLatexPreview"
          ></textarea>
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

        <!-- BEN-->
        <div class="latex-section-item" v-if="output">
          <h4>Parsed AST:</h4>
          <pre>{{ output }}</pre>
        </div>
      </div>

      <button @click="resetLatexModal" style="width: 30%;">fertig!</button>
    
       </div>
        </div>
        </div>
        <div class="inputs-section">
            <div class="inputs-section-item" v-for="(para,index) in parameterListe" :key="index">
                <input 
                    :id="`parameter${index}`"
                    class="form-element" 
                    type="text" readonly 
                    :value="para"
                    v-model="parameterListe[index]"
                    style="text-align: center;"
                >
                <select class="form-element" 
                    :id="`inputTypeSelect${index}`" 
                    @change="onInputTypeSelected($event,index)"
                    >
                    <option v-for="(value,idx) in selectOptions" :key="idx" :value="value">{{ value }}</option>
                </select>
                <button class="edit-button" @click="toggleReadOnly(index , $event)"><i class="fa-solid fa-pencil"></i></button>
                <button class="delete-button" @click="handleDeleteParameter($event, index)" :id="`deleteParameter${index}`"><i class="fa-solid fa-trash"></i></button>
            </div>
            <button style="width: 20%; align-self: center;" @click="addParameter = true">Neue Parameter anlegen</button>
        </div>

        <div v-if="addParameter" class="custom-modal-overlay">
            <div class="modal-params">
                <label for="newParameter" style="font-size: larger;">Geben Sie das neue Parameter  ein : </label>
                <input type="text" id="newParameter" placeholder="Eingabe hier" style="width: 50%; font-size: larger; text-align: center;">
                <button @click="handleAddParameter">Fertig!</button>
            </div>
        </div>
    </div>
</template>


<script lang="ts">
    import { defineComponent, ref, onMounted, watch, computed } from 'vue';
    import 'mathlive';
    import $, { event } from 'jquery';
    import { notify } from "@kyvg/vue3-notification";
    import { isNumber } from 'lodash';

    // BEN
    import { ComputeEngine } from '@cortex-js/compute-engine';



    export default defineComponent({
        props: {
            componentID: Number,        // ID der Komponente
            storeObject: Object 
        },
        setup(props) {
            const { store, getProperty , setProperty} = props.storeObject;
            const currentNode = computed(() => store.state.currentNode);
            const componentPath = computed(() => `nodes__${currentNode.value}__components__${props.componentID}__component`);

            const formelInput               = ref<any>(null);
            const formelInputPreview        = ref<string>("");
            const formula                   = ref("");
            const laTexInput                = ref<String | null>("");
            const laTexInputPreview         = ref<HTMLElement | null>(null);
            const selectOptions             = ref(['Bitte auswaehlen','Constant', 'Vom Pfad initialisieren', 'Funktion Aufruf', 'LaTex-Formel']);
            
            let parameterListe              = ref<string[]>([]);
            let addParameter                = ref<boolean>(false);
            let showLatexModal              = ref<boolean>(false);
            let selectedEditor              = ref<string>("");
            let latexInputVisible           = ref<boolean>(false);
            let formelInputVisible          = ref<boolean>(false);

            // BEN
            const ce = new ComputeEngine();
            const output = ref<string>("");

            watch(selectedEditor, () => {
                switch(selectedEditor.value.toLowerCase()){
                    case "latex" : latexInputVisible.value = true;
                                    formelInputVisible.value = false;
                                    break;
                    case "formel" : latexInputVisible.value = false;
                                    formelInputVisible.value = true;
                                    break;
                    default : latexInputVisible.value = false;
                            formelInputVisible.value = false;
                            break;
                }
            });
            
            const showNotify = (title: string, text: string, type : string) => {
                notify({
                    title: title,
                    text: text,
                    type: type,
                    data: { style: "height: 10%; font-size:20px;" }
                });
            }
            const resetLatexModal = () => {
                showLatexModal.value    =   false; 
                latexInputVisible.value =   false;
                formelInputVisible.value =  false; 
                selectedEditor.value    =   ""; 
            }
            const updateFormula = () => {
                if (formelInput.value) {
                    formelInputPreview.value = (formelInput.value as any).getValue('latex');
                }
            };

            const updateLatexPreview = () =>{
                if(laTexInputPreview.value){
                    (laTexInputPreview.value as any).value = laTexInput.value;
                }
            }
            const toggleReadOnly = (index: number, event: Event) => {
                const target = event.currentTarget as HTMLButtonElement;
                const $icon = $(target).children('i');
                const $firstInput = $('#parameter' + index);

                const isReadonly = $firstInput.prop('readonly'); // aktueller Zustand

                if (isReadonly) {
                    $firstInput.prop('readonly', false);
                    $icon.removeClass('fa-pencil').addClass('fa-check');
                } else {
                    $firstInput.prop('readonly', true);
                    $icon.removeClass('fa-check').addClass('fa-pencil');
                }
            };
            const createInput = (inputTyp : string, inputIndex: number, readOnly : boolean) =>{
                const inputId = 'inputForParameter'+ inputIndex;
                const selectId = 'inputTypeSelect'+ inputIndex;
                if($('#'+inputId).length == 0){
                    const $input  = $('<input>')
                                    .attr('type',inputTyp)
                                    .attr('id',inputId);
                    if(readOnly)$input.prop('readonly', readOnly);
                    $input.addClass('form-element');
                    $input.insertAfter($('#'+selectId));
                }else{
                    $('#'+inputId).attr('type',inputTyp);
                }
            }
            const deleteInputByIndex = (inputIndex : number) => {
                const inputId = 'inputForParameter'+ inputIndex;
                if($('#'+inputId).length > 0){
                    $('#'+inputId).remove();
                }
            }
            const setValueForInputByIndex = (inputIndex : number, value : any) => {
                const inputId = 'inputForParameter'+ inputIndex;
                $('#'+inputId).val(value);
            }
            const onLatexFormulaOptionSelected = (index : number) => {
                showLatexModal.value = true;
                watch(laTexInput, (newVal) => {
                    if (newVal && newVal.length > 0) {
                        createInput('text', index, false);
                        setValueForInputByIndex(index, newVal);
                    }
                });

                watch(formelInputPreview, (newVal) => {
                    if (newVal && newVal.length > 0) {
                        createInput('text', index, false);
                        setValueForInputByIndex(index, newVal);
                    }
                });
            }
            const onInputTypeSelected = (event : Event, index: number) =>{
                const target = event.target as HTMLSelectElement;
                const selectId : string  = target.id;
                const value = target.value;
                
                
                deleteInputByIndex(index);

                switch(value.toLowerCase()){
                    case 'constant' : createInput('number',index , false);
                                    break;
                    case 'vom pfad initialisieren' : createInput('text',index, false);
                                    break;
                    case 'funktion aufruf'  : createInput('text',index, false);
                                    break;
                    case 'latex-formel' : onLatexFormulaOptionSelected(index);
                                        break;
                    case 'bitte auswaehlen' : 
                                            deleteInputByIndex(index);
                                            break;
                    default: break;
                }
            }

            const handleDeleteParameter = (event : Event, index : number) =>{
                const target = event.currentTarget as HTMLButtonElement;
                const buttonID : string = target.id;
                const parameter : string = String($('#parameter'+index).val());
                if(parameter && parameter.length > 0){
                    if(parameterListe.value.includes(parameter)){
                        parameterListe.value.splice(parameterListe.value.indexOf(parameter),1);
                        showNotify("Parameter löschen",`Das Parameter ${parameter} wurde gelöscht` , "success");
                        console.log(`The Parameter: ${parameter} has been deleted`);
                    }
                }
            }
            
            const handleAddParameter = () =>{
                addParameter.value = false;
                const inputValue : string = String($('#newParameter').val());
                let check = false;
                if(inputValue.length > 0){
                    if(!parameterListe.value.includes(inputValue)){
                        parameterListe.value.push(inputValue);
                        check = true;
                    }
                }
                if(check){
                    showNotify("Parmeter anlegen", `Das Parameter ${inputValue} wurde erfolgreich angelegt.`,"success");
                }
                else showNotify("Parmeter anlegen", `Das Parameter ${inputValue} wurde nicht erfolgreich angelegt.`,"error");
            }

            //BEN
            const parseFormula = (latex: string) => {
                if (!latex || latex.length === 0) return;

                const expr = ce.parse(latex);

                console.log("LaTeX input:", latex);
                console.log("Parsed AST:", expr.json);

                output.value = JSON.stringify(expr.json, null, 2);
            };

            //BEN
            watch(laTexInput, (newVal) => {
                if (newVal && newVal.length > 0) {
                    parseFormula(newVal.toString());
                }
            });

            watch(formelInputPreview, (newVal) => {
                if (newVal && newVal.length > 0) {
                    parseFormula(newVal.toString());
                }
            });
            onMounted(() => {
                watch(formelInput, (el) => {
                    if (el) {
                        el.addEventListener('input', updateFormula);
                        (formelInput.value as any).setOptions({
                            placeholder: 'sum(v_i/w_i^2,i,0,n)/sum(1/w_i^2,i,0,n)'
                        });    
                    }
                }, { immediate: true });
                if(formelInputPreview.value){
                    (formelInputPreview.value as any).virtualKeyboardPolicy = "off";
                    (formelInputPreview.value as any).setOptions({
                        "virtualKeyboardToggle": "off"
                    });
                }
            });

            return {
                onInputTypeSelected,
                formelInput,
                formelInputPreview,
                formula,
                laTexInput,
                laTexInputPreview,
                updateLatexPreview,
                parameterListe,
                selectOptions,
                handleDeleteParameter,
                handleAddParameter,
                addParameter,
                showLatexModal,
                selectedEditor,
                formelInputVisible,
                latexInputVisible,
                resetLatexModal,
                toggleReadOnly,
                // BEN
                output
            };
        }
    });
</script>

<style>
.container{
    width: 100%;
    height: 100%;
    gap: 2rem;
    flex-direction: column;
    align-items: center;
    justify-content: space-around;
    background: #f5f7fa;
    overflow: auto;
}
.custom-modal{
    width: 80% !important;
    height: 80% !important;
    overflow: auto;
}
.inputs-section, .inputs-section-item, .container, .latex-section{
    display: flex;
    flex-wrap: wrap;
}
.output {
    margin-top: 8px;
}
.latex-section{
    width: 90%;
    flex-direction: row;
    justify-content: space-around;
}
.latex-section-item{
    width: 50%;
    display: flex;
    flex-direction: column;
}
.mathField{
    width: 80%;
    height: 90%;
    word-wrap: break-word;
    overflow: auto;
    border-radius: 10px;
}
.inputField {
    background-color: #eef2f7;
    border: 1px solid #aaccee;
    font-size: larger;
}

.previewField {
    background-color: #d6edf4;
    border: 1px solid #f0e6be;
}
.inputs-section{
    width: 100%;
    gap: 1rem;
    flex-direction: column;
    flex-wrap: nowrap;
    justify-content: space-evenly;
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
.delete-button, .edit-button{
    height: 30px !important;
    margin-top: 0% !important;
}
</style>
<style>
.custom-modal-overlay {
    position: fixed; top:0; left:0; right:0; bottom:0;
    background: rgba(0,0,0,0.5);
    display: flex; justify-content: center; align-items: center;
}
.custom-modal, .modal-params{
    background: white; padding: 20px; border-radius: 8px; min-width: 300px;
}
.modal-params{
    width: 50% !important; 
    height: 30% !important;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: space-between;
}
.modal-latex-editor{
    width: 80% !important;
    height: 80% !important;
    background-color: white;
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    gap: 3rem;
}
math-field::part(placeholder) {
    color: rgba(0, 0, 0, 0.5);
    font-style: italic;
}
button{
    border-radius: 8px !important;
}
</style>