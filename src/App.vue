<template>
  <router-view />
</template>

<script>

export default {
  name: 'App',
  // components: {}
}
</script>
<style>
/* 7개 파일에서 공통으로 사용하던 CSS 변수를 여기에 선언합니다 */
:root {
  --primary: #ea580c;
  --primary-dark: #c2410c;
  --primary-light: #fb923c;
  --accent-gold: #d4a574;
  --bg-dark: #0a0a0a;
  --bg-secondary: #18181b;
  --card: #27272a;
  --card-hover: #3f3f46;
  --text: #fafafa;
  --text-secondary: #a1a1aa;
  --border: #3f3f46;
  --shadow: rgba(0, 0, 0, 0.5);
  --success: #22c55e;
  --danger: #ef4444;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  font-family: 'Noto Sans KR', sans-serif;
  background: var(--bg-dark);
  color: var(--text);
  line-height: 1.5;
}
</style>