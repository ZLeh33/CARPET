<template>
    <div class="image-container">
        <img :src="bildPath" alt="Bild konnte nicht hochgeladen werden!!!" class="background-image">
        <template v-if="inputFelder">
            <div class="form-container">
                <div class="input-container" v-for="(input, index) in inputFelder" :key="index" @mouseover="handleMouseOver(index,input.placeholder)" @mouseleave="handleMouseLeave(index)">
                    <span v-if="tooltipVisible[index]" id="tooltiptext" v-html="tooltipMessage[index]"></span>
                    <input   
                        class="input-field"
                        :type="input.type"
                        :id="'input' + (index + 1)"
                        :placeholder="handlePlaceholder(input)"
                        @input="handleInput(input.placeholder, $event)"
                    >
                </div>
                
            </div>
        </template>
        
    </div>
</template>


<script lang="ts">
    import { isNumber } from 'lodash';
    import { defineComponent, computed, ref, watch, onMounted, reactive } from 'vue';

    export default defineComponent({
        props: {
            componentID: Number,        // ID der Komponente
            storeObject: Object         // Store-Objekt zur Datenhaltung
        },
        setup(props) {
            // Extrahiere store und getProperty Methode aus dem Store-Objekt
            const { store, getProperty , setProperty} = props.storeObject;
            // Berechnet den aktuellen Knoten des Zustands
            const currentNode = computed(() => store.state.currentNode);
            // Generiert den Pfad zur Komponente basierend auf currentNode und componentID
            const componentPath = computed(() => `nodes__${currentNode.value}__components__${props.componentID}__component`);
            const ValueFromJson = ref<Object | null>(null);
            // Tooltip-Status und -Nachricht verwalten
            const tooltipVisible = ref<boolean[]>([]);
            const tooltipMessage = ref<string[]>([]);
            const bildPath = computed(() => loadData(`${componentPath.value}__pfad`));
            const input = computed(() => `${componentPath.value}__inputFelder`);
            let inputFelder = undefined;
            const inputFelderValues = ref<{ [key: string]: string | number }>({});


            // Funktion zum Laden von Daten
            const loadData = (path: string) => {
                const data = getProperty(path);
                if (data !== null && data !== undefined) {
                    return data.toString();
                }
                return null;
            };

            // Überprüft, ob input nicht null ist und lädt dann die Input-Daten
            if (input != null) {
                inputFelder = computed(() => loadInputData(`${componentPath.value}__inputFelder`));
                // Funktion zum Laden der Input-Daten aus dem Store
                const loadInputData = (path) => {
                    const data = getProperty(path);
                    if (data) {
                        return data.map(item => ({
                            type: item.type,
                            placeholder: item.placeholder,
                            ValueFromJson_Key: item.ValueFromJson_Key,
                            readOnly: item.readOnly,
                            align:item.align,
                            width: item.width
                        }));
                    }
                    return [];
                };

                // Watcher to update inputFelderValues whenever inputFelder changes
                watch(inputFelder, (newInputFelder) => {
                    const values = {};
                    newInputFelder.forEach(input => {
                        values[input.placeholder] = '';  // Or use a different default value if necessary
                    });
                    inputFelderValues.value = values;
                }, { immediate: true }); // immediate: true to initsialize on setup

            }
            
            // Function to handle input events
            const handleInput = (placeholder: string, event: Event) => {
                const target = event.target as HTMLInputElement;
                const value = target.value;
                // Prüfe, ob der Wert eine gültige Zahl ist
                let parsedValue = parseFloat(value.replace(",", "."));
                // Wenn die Eingabe ungültig ist (z. B. Buchstaben), setze den Wert auf '0'
                if (isNaN(parsedValue)) {
                    target.value = '';
                    parsedValue = 0;
                }

                //Zum Test
                //console.log("Test Eingabefeld  "+placeholder+" : ",parsedValue);
                if (placeholder in inputFelderValues.value) {
                    inputFelderValues.value[placeholder] = parsedValue;
                }
                setProperty({ path: `${componentPath.value}__inputFelderValues`, value: inputFelderValues });
                
                
            };

            
            // Funktion zum Handhaben des Mouseover-Ereignisses
            const handleMouseOver = (index:number ,placeholder:String) => {
                const parts = placeholder.split(' ');
                tooltipMessage.value[index] = parts.length === 2 
                    ? `${parts[0]}<sub>${parts[1]}</sub>` 
                    : parts.join(' ');
                tooltipVisible.value[index] = true;
            };

            // Funktion zum Handhaben des Mouseleave-Ereignisses
            const handleMouseLeave = (index:number) => {
                tooltipVisible.value[index] = false; // Tooltip unsichtbar machen
            };

            const findKey = (obj: Record<string, any>, key: string): any | undefined => {
                // Überprüfen, ob der Schlüssel im aktuellen Objekt vorhanden ist
                if (key in obj) {
                    return obj[key]; // Wert zurückgeben, wenn Schlüssel gefunden
                }
                // Rekursiv durch die Werte gehen, wenn sie Objekte oder Arrays sind
                for (let k in obj) {
                    const value = obj[k];
                    
                    // Falls der Wert ein Objekt oder Array ist, rekursiv weiter suchen
                    if (value && typeof value === 'object') {
                    const result = findKey(value, key);
                    if (result !== undefined) {
                        return result; // Wert zurückgeben, wenn gefunden
                    }
                    }
                }
                // Falls der Schlüssel nicht gefunden wurde
                return undefined;
            };

            // Funktion zum Handhaben des Mouseover-Ereignisses
            const handlePlaceholder = (input : any) => {
                if(ValueFromJson.value){
                    let data : any = findKey(ValueFromJson.value,input.ValueFromJson_Key);
                    if(data){
                        //inputFelderValues.value[input.placeholder] = Number(data);
                        //setProperty({ path: `${componentPath.value}__inputFelderValues`, value: inputFelderValues });
                        return data;
                    }
                    else {
                        let parts = input.placeholder.split(' ');
                        if (parts.length === 2) {
                            return `${parts[0]}`; // str1 + tiefgestelltes str2
                        }
                        return parts;
                    }
                }
                else{
                    let parts = input.placeholder.split(' ');
                    if (parts.length === 2) {
                        return `${parts[0]}`; // str1 + tiefgestelltes str2
                    }
                    return parts; // Wenn nicht zwei Teile, einfach den ursprünglichen Wert zurückgeben
                }
                
            };

            onMounted(() => {
                // Annahme: getProperty gibt einen string oder null zurück
                const computedPath = computed(() => getProperty(`nodes__${currentNode.value}__components__${props.componentID}__component__ValuesFromJson`));
                if (computedPath.value) {
                    ValueFromJson.value = getProperty(computedPath.value); 
                }
            });

            // Rückgabe der berechneten Werte zur Nutzung in der Template
            return {
                bildPath,
                inputFelder,
                inputFelderValues,
                handlePlaceholder,
                handleInput,
                handleMouseOver,
                handleMouseLeave,
                /*handleValue,*/
                tooltipMessage,
                tooltipVisible
            };
        }
    });
</script>


<style>
.image-container {
    position: relative;
    width: 100%;
    height: 100%;
    margin: 0 auto;
}

.background-image {
    position: absolute;
    width: 100%;
    height: 100%;
    object-fit: cover; /* Skaliert das Bild, um den gesamten Container auszufüllen */
}
/*
.flex-container {
    display: flex;
    flex-direction: row; /* Oder row, je nach Layout-Anforderung */
    /*flex-wrap: wrap;
    top: 2em;
    justify-content: space-between; /* Beispiel-Ausrichtung**/ 
    /*align-items: center;  Beispiel-Ausrichtung */
    /*gap: 100px; /* Abstand zwischen den Input-Feldern */
    /*position: absolute;
    
    
}*/
.input-container {
    position: relative; /* Positioning context for tooltip */
}


.form-container {
    position: absolute; /* Positioniert die Input-Felder relativ zum Container */
    top: 55%; /* Zentriert vertikal */
    left: 50%; /* Zentriert horizontal */
    transform: translate(-50%, -50%); /* Verschiebt um die Hälfte der Größe */
    display: grid;
    grid-template-columns: repeat(2, 1fr); /* 2 Spalten mit gleicher Breite */
    grid-template-rows: repeat(3, 1fr); /* 3 Zeilen, die sich automatisch anpassen */
    column-gap: calc(50% + 10px); /* Abstand zwischen den Spalten */
    row-gap: calc(1% + 1vh); /* Abstand zwischen den Zeilen */
    width: 90%; /* Breite der Input-Felder relativ zum Container */
    height: 90%;
    align-items: stretch;
}

#tooltiptext {
    top: 28%;
    position: absolute;
    background-color: white;
    color: black;
    border: 1px solid #ccc;
    width: 100%; /* Vollständige Breite des Grid-Items */
    height: 30%; /* Automatische Höhe */
    font-size: 1vw; /* Schriftgröße in Viewport-Breite */
    text-align: center;
    box-sizing: border-box; /* Berücksichtigt Padding und Rand in der Breite */
    border-radius: 30px;
    font-family: cursive;
    z-index: 1000;
}

.input-field {
    background: gray;
    color: black;
    border: 1px solid #ccc;
    width: 100%; /* Vollständige Breite des Grid-Items */
    height: 30%; /* Automatische Höhe */
    font-size: 1vw; /* Schriftgröße in Viewport-Breite */
    text-align: center;
    box-sizing: border-box; /* Berücksichtigt Padding und Rand in der Breite */
    border-radius: 30px;
    font-family: cursive;
}

/* Stil für den Placeholder-Text */
.input-field::placeholder {
    color: black;
}
.input-field:focus {
    outline: none; /* Entfernt den Standardrahmen */
    border: 2px solid black; /* Blauer Rahmen bei Fokus */
    box-shadow: 0 0 5px black; /* Sanfte Schattierung */
}
.input-container {
    position: relative; /* Positioning context for tooltip */
}


</style>