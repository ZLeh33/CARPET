<template>
  <canvas :id="chartId" class="chartContainer" ref="chartRef"></canvas>
  <button @click="saveAsImage">Herunterladen</button>

</template>

<script lang="ts">
import { defineComponent, computed, ref, onMounted, watch } from "vue";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

export default defineComponent({
  props: {
    componentID: Number,
    storeObject: Object
  },
  setup(props) {
    const { store, getProperty } = props.storeObject;

    const currentNode = computed(() => store.state.currentNode);
    const componentPath = computed(() => `nodes__${currentNode.value}__components__${props.componentID}__component`);

    const loadData = (path: string) => {
      const data = getProperty(path);
      if (data !== null && data !== undefined) {
        return data.toString();
      }
      return null;
    };

    const loadDatasets = (path: string) => {
      const datasetsPath = getProperty(path);
      if (datasetsPath) {
        const datasets = getProperty(datasetsPath);
        if (Array.isArray(datasets)) {
          return datasets;
        }
      }
      return [];
    };

    const loadLabels = (path: string) => {
      const labelsPath = getProperty(path);
      if (labelsPath) {
        const labels = getProperty(labelsPath);
        if (Array.isArray(labels) && labels.length > 0) {
          //return labels.map(item => item.toString());
          // Konvertiere die Labels in Ganzzahlen
          return labels.map((item) => parseInt(item, 10));
        }
      }
      return [""];
    };

    const datasets = computed(() => loadDatasets(`${componentPath.value}__datasets`));
    const labels = computed(() => loadLabels(`${componentPath.value}__labels`));
    const options = computed(() => getProperty(`${componentPath.value}__options`));
    
    const excelData = computed(() => getProperty(getProperty(`${componentPath.value}__excelData`)));
    //console.log("Excel Data:", excelData.value);

    const chartId = `myChart${props.componentID}`;
    const chartRef = ref<HTMLCanvasElement | null>(null);

    let chartInstance: Chart | null = null;

    const createChart = () => {
      if (datasets.value.length > 0 && chartRef.value) {
        const ctx = chartRef.value.getContext("2d");
        if (ctx) {
          if (chartInstance) {
            chartInstance.destroy();
          }

          chartInstance = new Chart(ctx, {
            type: "line",
            data: {
              labels: labels.value,
              datasets: datasets.value.map((item) => ({
                label: item.label,
                data: item.data,
                borderColor: item.borderColor,
                backgroundColor: item.backgroundColor,
                tension: item.tension, 
                cubicInterpolationMode: item.cubicInterpolationMode, 
              }))
            },
            options: {
              responsive: true,
              plugins: {
                legend: {
                  display: true
            }
          },
          elements: {
            line: {
              tension: 0.4 // Apply smooth curve to all lines
            },
            point: {
              radius: 0 // Hide data points for a cleaner look
            }
          },
          scales: {
            x: {
              ticks: {
                font: {
                  size: 14
                }},
              
              title: {
                display: true,
                text: "Zeit",
                font: {
                        size: 20
                      }
            }
          },
            y: {
              display: true
            }
          },
          plugins: {
                legend: {
                  labels: {
                    font: {
                      size: 20
                    }
                  }
                }
              }
        }
          });
        } else {
          console.error("Unable to get context from canvas.");
        }
      } else {
        console.error("No datasets available to display chart.");
      }
    };

    const saveAsImage = () => {
      const canvas = chartRef.value;
      if (!canvas) return;

      //  Create a new canvas with white background
      const whiteBgCanvas = document.createElement("canvas");
      whiteBgCanvas.width = canvas.width;
      whiteBgCanvas.height = canvas.height;
      const ctx = whiteBgCanvas.getContext("2d");

      if (ctx) {
        // white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Original-Canvas override
        ctx.drawImage(canvas, 0, 0);

        // save picture
        const link = document.createElement("a");
        link.href = whiteBgCanvas.toDataURL("image/png");
        link.download = "chart.png";
        link.click();
      }

      // Save excel-file
      if (excelData.value) {
        const excelLink = document.createElement("a");
        excelLink.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${excelData.value}`;
        excelLink.download = "fermentation_data.xlsx";
        excelLink.click();
      }
    };

    watch(
      [datasets, labels, chartRef],
      () => {
        createChart();
      },
      { immediate: true }
    );

    return {
      datasets,
      chartId,
      chartRef,
      saveAsImage
    };
  }
});
</script>

<style>
h1 {
  text-align: center;
}

.chartContainer {
  position: relative;
  display: flex;
  justify-items: center;
  align-items: center;
  width: 100%;
  height: 100%;
}

button {
  margin-top: 10px;
  color: orange; /* Text color */
  background-color: rgba(0, 0, 0, 0.646); /* Background color */
  border: none; /* Remove border */
  padding: 10px 20px; /* Add some padding */
  font-size: 16px; /* Adjust font size */
  cursor: pointer; /* Change cursor on hover */
}

button:hover {
  background-color: darkorange; /* Optional hover effect */
  color: black;
}

</style>
