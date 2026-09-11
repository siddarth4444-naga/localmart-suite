import '@expo/metro-runtime';
import React from 'react';
import { renderRootComponent } from 'expo-router/build/renderRootComponent';
import { ExpoRoot } from 'expo-router';
import { Head } from 'expo-router/build/head';

export const ctx = require.context(
  './app',
  true,
  /^(?:\.\/)(?!(?:(?:(?:.*\+api)|(?:\+html)))\.[tj]sx?$).*\.[tj]sx?$/
);

export function App() {
  return (
    <Head.Provider>
      <ExpoRoot context={ctx} />
    </Head.Provider>
  );
}

renderRootComponent(App);
