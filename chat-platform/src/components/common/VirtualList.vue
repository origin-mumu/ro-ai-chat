<script setup lang="ts">
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from "vue";

const props = defineProps<{
  items: any[];
  keyField: string;
  estimatedItemSize?: number;
  buffer?: number;
}>();

const emit = defineEmits<{
  (e: "scroll", event: Event): void;
}>();

const estimatedSize = props.estimatedItemSize || 80;
const bufferCount = props.buffer || 10;

const containerRef = ref<HTMLElement | null>(null);

const positions = ref<
  { index: number; top: number; bottom: number; height: number }[]
>([]);
const measuredHeights = ref<Record<string, number>>({});

const scrollTop = ref(0);
const clientHeight = ref(0);

// 初始化和更新位置数据
const updatePositions = () => {
  let currentTop = 0;
  const newPositions = [];
  for (let i = 0; i < props.items.length; i++) {
    const item = props.items[i];
    const key = String(item[props.keyField]);
    const h = measuredHeights.value[key] || estimatedSize;
    newPositions.push({
      index: i,
      top: currentTop,
      bottom: currentTop + h,
      height: h,
    });
    currentTop += h;
  }
  positions.value = newPositions;
};

// 监听 items 变化
watch(
  () => props.items,
  () => {
    updatePositions();
  },
  { deep: true, immediate: true },
);

const totalHeight = computed(() => {
  if (positions.value.length === 0) return 0;
  return positions.value[positions.value.length - 1]?.bottom || 0;
});

const handleScroll = (e: Event) => {
  if (containerRef.value) {
    scrollTop.value = containerRef.value.scrollTop;
    clientHeight.value = containerRef.value.clientHeight;
    emit("scroll", e);
  }
};

const getStartIndex = (scrollT: number) => {
  let low = 0;
  let high = positions.value.length - 1;
  while (low <= high) {
    const mid = Math.floor((low + high) / 2);
    const pos = positions.value[mid];
    if (!pos) break;
    if (pos.bottom === scrollT) return mid + 1;
    if (pos.bottom < scrollT) {
      low = mid + 1;
    } else {
      if (pos.top <= scrollT) return mid;
      high = mid - 1;
    }
  }
  return 0;
};

const startIndex = computed(() => {
  const idx = getStartIndex(scrollTop.value);
  return Math.max(0, idx - bufferCount);
});

const endIndex = computed(() => {
  const start = getStartIndex(scrollTop.value);
  let end = start;
  const maxVisible = scrollTop.value + clientHeight.value;
  while (
    end < positions.value.length &&
    (positions.value[end]?.top ?? 0) < maxVisible
  ) {
    end++;
  }
  return Math.min(positions.value.length - 1, end + bufferCount);
});

const visibleData = computed(() => {
  return props.items.slice(startIndex.value, endIndex.value + 1);
});

const startOffset = computed(() => {
  if (startIndex.value === 0 || positions.value.length === 0) return 0;
  return positions.value[startIndex.value]?.top || 0;
});

let resizeObserver: ResizeObserver | null = null;

// The items that are currently rendered might change height
const setItemRef = (el: any, key: string) => {
  if (el) {
    // Store the key on the dataset so the observer callback can read it
    el.dataset.key = key;
    if (resizeObserver) {
      resizeObserver.observe(el);
    }
  }
};

onMounted(() => {
  if (containerRef.value) {
    clientHeight.value = containerRef.value.clientHeight;
  }

  // Use ResizeObserver to detect real heights of rendered chat bubbles
  resizeObserver = new ResizeObserver((entries) => {
    let changed = false;
    window.requestAnimationFrame(() => {
      for (const entry of entries) {
        const target = entry.target as HTMLElement;
        const key = target.dataset.key;
        if (key) {
          const boxHeight = target.offsetHeight;
          if (measuredHeights.value[key] !== boxHeight && boxHeight > 0) {
            measuredHeights.value[key] = boxHeight;
            changed = true;
          }
        }
      }
      if (changed) {
        updatePositions();
      }
    });
  });
});

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect();
  }
});

const scrollToBottom = () => {
  nextTick(() => {
    if (containerRef.value) {
      // 虚拟列表高度更新可能稍微滞后，给一点点 buffer 时间确保到底
      setTimeout(() => {
        if (containerRef.value) {
          containerRef.value.scrollTop = containerRef.value.scrollHeight;
        }
      }, 50);
    }
  });
};

defineExpose({
  scrollToBottom,
  containerRef,
  totalHeight,
  scrollTop,
  clientHeight,
});
</script>

<template>
  <div class="virtual-list-container" ref="containerRef" @scroll="handleScroll">
    <div
      class="virtual-list-phantom"
      :style="{ height: totalHeight + 'px' }"
    ></div>
    <div
      class="virtual-list-content"
      :style="{ transform: `translateY(${startOffset}px)` }"
    >
      <div
        v-for="(item, index) in visibleData"
        :key="String(item[keyField])"
        :ref="(el) => setItemRef(el, String(item[keyField]))"
        class="virtual-list-item"
      >
        <slot :item="item" :index="startIndex + index"></slot>
      </div>
    </div>
  </div>
</template>

<style scoped>
.virtual-list-container {
  height: 100%;
  width: 100%;
  overflow-y: auto;
  position: relative;
  -webkit-overflow-scrolling: touch;
  /* 确保滚动平滑 */
  scroll-behavior: smooth;
}

.virtual-list-phantom {
  position: absolute;
  left: 0;
  top: 0;
  right: 0;
  z-index: -1;
}

.virtual-list-content {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  width: 100%;
  padding: 0 100px;
}

.virtual-list-item {
  width: 100%;

  overflow: hidden;
}
</style>
