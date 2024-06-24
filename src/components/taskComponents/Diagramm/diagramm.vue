<template>
    
    <!-- Überprüfen, ob Datensätze vorhanden sind -->
    <div v-if="datasets.length > 0">
        <h1>{{ title }}</h1>
        <!-- Canvas-Element, in dem das Diagramm gerendert wird -->
        <canvas :id="chartId" ref="chartRef"></canvas>
    </div>
</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted } from 'vue';
import { Chart, registerables } from 'chart.js';

// Registrierung der Chart.js-Komponenten
Chart.register(...registerables);

export default defineComponent({
    props: {
        componentID: Number,        // ID der Komponente
        storeObject: Object         // Store-Objekt zur Datenhaltung
    },
    setup(props) {
        // Extrahiere store und getProperty Methode aus dem Store-Objekt
        const { store, getProperty } = props.storeObject;

        // den aktuellen Knoten des Zustands
        const currentNode = computed(() => store.state.currentNode);
        // Pfad zur Komponente
        const componentPath = computed(() => `nodes__${currentNode.value}__components__${props.componentID}__component`);

        // Funktion zum Laden von Daten(title,type)
        const loadData = (path: string) => {
            const data = getProperty(path);
            if (data !== null && data !== undefined) {
                return data.toString();
            }
            return null;
        };

        // Funktion zum Laden von datasets für Chart()
        const loadDatasets = (path: string) => {
            const datasets = getProperty(path);
            if (datasets instanceof Array) {
                return datasets.map(item => ({
                    label: item.label,
                    data: item.data,
                    borderColor: item.borderColor,
                    backgroundColor: item.backgroundColor,
                    tension: item.tension
                }));
            }
            return [];
        };

        // Funktion zum Laden der Labels für Chart()
        const loadLabels = (path: string) => {
            const labels = getProperty(path);
            if (Array.isArray(labels) && labels.length > 0) {
                return labels;
            }
            return [""];
        };

        // Computed properties für Titel, Typ, Datensätze und Labels des Diagramms
        const title = computed(() => loadData(`${componentPath.value}__title`));
        const type = computed(() => loadData(`${componentPath.value}__type`));
        const datasets = computed(() => loadDatasets(`${componentPath.value}__datasets`));
        const labels = computed(() => loadLabels(`${componentPath.value}__labels`));

        // ID des Canvas-Elements
        const chartId = `myChart${props.componentID}`;
        // Referenz auf das Canvas-Element
        const chartRef = ref<HTMLCanvasElement | null>(null);
        
        

        // Hook, der ausgeführt wird, wenn die Komponente gemountet wird
        onMounted(() => {
            if (datasets.value.length > 0 && chartRef.value) {
                const ctx = chartRef.value.getContext('2d');
                if (ctx) {
                    // Erstelle das Chart.js Diagramm
                    new Chart(ctx, {
                        type: type.value || 'line',  // Standard-Diagrammtyp ist 'line'
                        data: {
                            labels: labels.value,
                            datasets: datasets.value.map(item => ({
                                label: item.label,
                                data: item.data,
                                borderColor: item.borderColor,
                                backgroundColor: item.backgroundColor,
                                tension: item.tension,
                                fill: false, // Stelle sicher, dass das Liniendiagramm den Bereich darunter nicht füllt
                                borderWidth: 2 // Setze eine Standardbreite für die Linien
                            }))
                        },
                        options: {
                            scales: {
                                y: {
                                    beginAtZero: true // Die Y-Achse beginnt bei 0
                                }
                            },
                        }
                    });
                }
            }
        });

        // Rückgabe der  Variablen und Methoden für das Template
        return {
            title,
            type,
            datasets,
            chartId,
            chartRef
        };
    }
});
</script>

<style>
    h1{
        text-align: center;
    }
</style>