<template>
    <div class="checkbox-group">
    <fieldset>
        <legend>Parameter und Bereiche</legend>
        <div 
            class="checkbox-item" 
            v-for="(option, i) in options" 
            :key="i"
        >
            <label>
                <input 
                    type="checkbox" 
                    :value="option"
                    v-model="selectedOptions"
                    @change="checkboxChange(option)"
                >
                {{ option }}
            </label>
            <div class="range-inputs">
                <input 
                    type="number" 
                    placeholder="min"
                    :disabled="!selectedOptions.includes(option)"
                    v-model="minMaxValues[option].min"
                    @input="updateMinMaxValue(option, 'min' ,minMaxValues[option].min)" 
                >
                <input 
                    type="number" 
                    placeholder="max"
                    :disabled="!selectedOptions.includes(option)"
                    v-model="minMaxValues[option].max"
                    @input="updateMinMaxValue(option, 'max' ,minMaxValues[option].max)" 
                >
            </div>
        </div>
    </fieldset>
</div>
</template>

<script lang="ts">

import { computed, ref, defineComponent, watch, reactive } from "vue";

export default defineComponent({
    props: {
            componentID: Number,        // ID der Komponente
            storeObject: Object         // Store-Objekt zur Datenhaltung
        },
    setup(props, { emit }) {
        // Extrahiere store und getProperty Methode aus dem Store-Objekt
        const { store, getProperty , setProperty} = props.storeObject;
        // Berechnet den aktuellen Knoten des Zustands
        const currentNode = computed(() => store.state.currentNode);
        // Generiert den Pfad zur Komponente basierend auf currentNode und componentID
        const componentPath = computed(() => `nodes__${currentNode.value}__components__${props.componentID}__component`);

        // Funktion zum Laden von Daten
        const loadData = (path: string) => {
            const data = getProperty(path);
            if (data !== null && data !== undefined) {
                return data;
            }
            return null;
        };
        const options : any | null = computed(() => loadData(`${componentPath.value}__options`));

        // Initialisieren von selectedOptions als leeres Array
        const selectedOptions = ref<string[]>([]);
        const minMaxValues = ref<{ [key: string]: { min: number | null, max: number | null } }>({});
        //Initialisieren von minMaxValues mit den Optionen
        options.value.forEach(option => {
            minMaxValues.value[option] = { min: null, max: null }; // Standardwerte für min/max
        });
        
        // Reaktive jsonData-Objekt
        const jsonData = reactive<{ [key: string]: { min: number | null; max: number | null } }>({});
        // Deklariere ein JSON-Objekt
        //const jsonData: { [key: string]: { min: number | null; max: number | null } } = {};

        const checkboxChange = (option : string) => {
            if (selectedOptions.value.includes(option)) {
                /*
                console.log(option + " wurde ausgewählt");
                console.log(minMaxValues.value[option])
                console.log(minMaxValues.value[option]["min"])*/
                
                // Werte aus `minMaxValues` extrahieren
                const min = minMaxValues.value[option]["min"];
                const max = minMaxValues.value[option]["max"];
                if (min != null && max !=  null){
                    // Neue Option zu `jsonData` hinzufügen
                    jsonData[option] = { min, max };
                }
                else{
                    jsonData[option] = { min : null ,max: null };
                }
                console.log(jsonData);
            } else {
                console.log(option + " wurde entfernt");
                minMaxValues.value[option]["min"] = null;
                minMaxValues.value[option]["max"] = null;
                // Löscht das Objekt von `jsonData` für diese Option
                delete jsonData[option];
            }
        }
        const updateMinMaxValue = (option : string, key : 'min' | 'max' , value : number | null) => {
            if (selectedOptions.value.includes(option)) {
                if (!jsonData[option]) {
                    jsonData[option] = { min: null, max: null };
                }
                if(value != null){
                    // Aktualisiere den spezifischen Wert (min oder max)
                    jsonData[option][key] = value;
                    
                }
                console.log(jsonData);
            }
        }
        // Watch: Überwacht nur `jsonData`
        watch(
            jsonData,
            () => {
                console.log('jsonData geändert:', jsonData);
                console.log(typeof(`${componentPath.value}__jsonData`));
                if (typeof componentPath.value === 'string') {
                    setProperty({ path: `${componentPath.value}__jsonData`, value: jsonData });
                } else {
                    console.error("componentPath.value ist ungültig oder leer.");
                }
            },
            { deep: true } // Stellt sicher, dass tiefgehende Änderungen überwacht werden
        );
        return {
            options,
            checkboxChange,
            selectedOptions,
            minMaxValues,
            updateMinMaxValue
        }
    }
    });
</script>

<style>
.checkbox-group fieldset {
    border: 2px solid darkgray;
    border-radius: 5px;
    padding: 10px 20px; /* Padding innen, Abstand gleichmäßig */
    margin: 20px; /* Äußerer Abstand */
}

.checkbox-group legend {
    font-weight: bold;
    color: black;
}

.checkbox-item {
    display: flex;
    align-items: center; /* Sorgt für vertikale Zentrierung */
    margin: 10px 0; /* Abstand zwischen den Checkbox-Elementen */
    gap: 20px; /* Platz zwischen Checkbox, Label und Range-Inputs */
}

.checkbox-item label {
    flex: 2; /* Sorgt für gleiche Breite der Labels */
}

.checkbox-item input[type="checkbox"] {
    cursor: pointer; /* Hand-Cursor für Checkbox */
}

.range-inputs {
    display: flex;
    gap: 10px; /* Platz zwischen min und max Feldern */
}

.range-inputs input[type="number"] {
    width: 100px; /* Breite der Eingabefelder */
    padding: 5px; /* Innenabstand */
    border: 1px solid lightgray;
    border-radius: 4px;
    font-size: 14px;
}

</style>